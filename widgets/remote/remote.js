/**
 * Remote widget (since v1.8.0): runs a registered app inside the page. The app is built and
 * deployed from its own repo and served from its own host; this file only loads it.
 *
 * An author places it like any widget, a link alone in a paragraph:
 *   /widgets/remote/remote.html?app=same-page-play
 * Adobe's widget block (blocks/widget/) loads remote.html, remote.css and this module, and turns
 * the link's query string into data- attributes. This module looks the app up in remote.json
 * beside it, imports the app's entry module from the address registered there, and calls its
 * mount(element, host). It never changes Adobe's widget files.
 *
 * - Only apps in the registry run, and only from https (on this machine, the app's local build).
 *   An unknown name gets the failed state, never a script. The registry changes only by commit.
 * - The app gets only the parameters its registry entry lists.
 * - The page never waits for the app: the placeholder shows at once, says so after 8 seconds,
 *   and if the app fails it says that and links to the app on its own host. The rest of the page
 *   keeps working.
 * - Monitoring: a "remote" checkpoint when an app is mounted and an "error" one when it fails,
 *   both with the app's name, through the site's own real-user monitoring (sampleRUM).
 *
 * The contract with the app, version 1, is in jackzhaojin/eds-multiplayer-authoring,
 * packages/remote-app: mount(element, { version, name, entry, params, rum }) resolves to an
 * unmount function, and the app draws inside a shadow root of its own on that element.
 */
import { sampleRUM } from '../../scripts/aem.js';

const SLOW_MS = 8000;
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
const NAME = /^[a-z0-9][a-z0-9-]*$/;

let registry;

/** The registry, remote.json beside this file, fetched once per page. */
function loadRegistry() {
  registry = registry || fetch(`${window.hlx.codeBasePath}/widgets/remote/remote.json`).then((resp) => {
    if (!resp.ok) throw new Error(`the registry answered ${resp.status}`);
    return resp.json();
  });
  return registry;
}

/**
 * The address of the app's entry module: its local build when this page is itself on this
 * machine and the entry names one, otherwise its https address.
 * @param {object} app The app's registry entry
 * @returns {URL}
 */
function entryOf(app) {
  const onThisMachine = LOCAL_HOSTS.includes(window.location.hostname);
  const local = onThisMachine && app.local ? new URL(app.local) : null;
  if (local && LOCAL_HOSTS.includes(local.hostname)) return local;
  const url = new URL(app.entry);
  if (url.protocol !== 'https:') throw new Error(`its entry ${url.href} is not https`);
  return url;
}

/** Opens the connection to the app's host while the entry is on its way. */
function preconnect(origin) {
  if (origin === window.location.origin) return;
  const known = [...document.head.querySelectorAll('link[rel="preconnect"]')].some((link) => link.href.startsWith(origin));
  if (known) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.append(link);
}

/**
 * Resolves once the widget's section is shown. Edge Delivery keeps a section hidden until its
 * blocks have loaded, and an app mounted in a hidden section can neither take focus nor measure
 * itself. Its code still downloads meanwhile: only the mount waits.
 * @param {Element} widget The widget block element
 */
function whenShown(widget) {
  const section = widget.closest('.section');
  const shown = () => !section || section.dataset.sectionStatus === 'loaded';
  if (shown()) return Promise.resolve();
  return new Promise((resolve) => {
    const watch = new MutationObserver(() => {
      if (!shown()) return;
      watch.disconnect();
      resolve();
    });
    watch.observe(section, { attributes: true, attributeFilter: ['data-section-status'] });
  });
}

function report(checkpoint, name, target) {
  try {
    sampleRUM(checkpoint, { source: `remote:${name}`, target });
  } catch {
    // monitoring never breaks the page
  }
}

/**
 * Loads the app named by the widget's data-app and mounts it. Resolves at once: the page shows
 * the placeholder while the app loads.
 * @param {Element} widget The widget block element
 */
export default async function decorate(widget) {
  const name = widget.dataset.app || '';
  const started = performance.now();
  widget.dataset.remoteState = 'loading';
  const slow = window.setTimeout(() => {
    if (widget.dataset.remoteState === 'loading') widget.dataset.remoteState = 'slow';
  }, SLOW_MS);

  const fail = (reason, fallback) => {
    window.clearTimeout(slow);
    widget.dataset.remoteState = 'failed';
    const link = widget.querySelector('[data-remote-fallback]');
    if (link && fallback) {
      link.href = fallback;
      link.hidden = false;
    }
    report('error', name, reason);
    // eslint-disable-next-line no-console
    console.error(`remote widget ${name || '(no app)'}: ${reason}`);
  };

  const load = async () => {
    let app = null;
    try {
      const { apps = {} } = await loadRegistry();
      if (NAME.test(name) && Object.prototype.hasOwnProperty.call(apps, name)) app = apps[name];
    } catch (error) {
      fail(`no registry: ${error.message}`);
      return;
    }
    if (!app) {
      fail(`no app named "${name}" in the registry`);
      return;
    }
    widget.dataset.remoteLayout = app.layout === 'screen' ? 'screen' : 'block';

    let url;
    try {
      url = entryOf(app);
    } catch (error) {
      fail(error.message, app.fallback);
      return;
    }
    preconnect(url.origin);

    const params = {};
    (app.params || []).forEach((key) => {
      if (typeof key === 'string' && key in widget.dataset) params[key] = widget.dataset[key];
    });

    // The app's own element, added only when it mounts: until then the placeholder is all there is.
    const mountPoint = document.createElement('div');
    mountPoint.className = 'remote-app';
    try {
      const mod = await import(url.href);
      if (typeof mod.mount !== 'function') throw new Error('its entry has no mount function');
      await whenShown(widget);
      widget.append(mountPoint);
      await mod.mount(mountPoint, Object.freeze({
        version: 1,
        name,
        entry: url.href,
        params: Object.freeze(params),
        rum: (checkpoint, data) => sampleRUM(checkpoint, data),
      }));
      window.clearTimeout(slow);
      widget.dataset.remoteState = 'ready';
      report('remote', name, `${Math.round(performance.now() - started)}ms`);
    } catch (error) {
      mountPoint.remove();
      fail(`it did not load: ${error.message}`, app.fallback);
    }
  };

  load();
}
