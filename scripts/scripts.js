import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  getMetadata,
  toClassName,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

const THEME_KEY = 'jj-theme';
const THEMES = ['light', 'dark', 'system'];

/**
 * Applies the stored Light, Dark or System choice before the body appears, so content never
 * paints in the wrong theme. No stored choice means System (Jack, 2026-10-28: "system should
 * almost always be the default of any visitor"; it was Light, as on the source site). System is
 * pure CSS: no data-theme attribute lets the OS preference decide (design-system/v3/tokens.css).
 * The jj-theme key and the data-theme / data-theme-choice attributes carry stored choices over.
 */
function applyStoredTheme() {
  const root = document.documentElement;
  root.classList.add('js');
  root.dataset.themeDefault = 'system';
  let choice = 'system';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (THEMES.includes(stored)) choice = stored;
  } catch {
    // storage blocked: keep the default
  }
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = choice;
  root.dataset.themeChoice = choice;
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * A YouTube link alone in a default-content paragraph becomes a figure block (the video), so
 * authors never build an embed table.
 * @param {Element} main The container element
 */
function buildVideoAutoBlocks(main) {
  main.querySelectorAll(':scope > div > p').forEach((p) => {
    const links = p.querySelectorAll('a[href]');
    if (links.length !== 1 || p.textContent.trim() !== links[0].textContent.trim()) return;
    if (!/(youtube(-nocookie)?\.com\/(embed\/|watch\?v=)|youtu\.be\/)[\w-]{11}/.test(links[0].href)) return;
    const spot = document.createComment('video');
    p.before(spot);
    spot.replaceWith(buildBlock('figure', [[{ elems: [p] }]]));
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
    buildVideoAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    // an icon (span.icon > img) still lets a link be a button; any other image does not
    if (a.querySelector('img:not(span.icon > img)') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) {
      // a plain link alone in its paragraph is a v3 text link
      p.classList.add('text-link-wrapper');
      a.classList.add('text-link');
      return;
    }

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Moves link paragraphs in default content (buttons and text links) into a .cta-slot wrapper,
 * consecutive ones sharing one, so their look keys off the wrapper and holds in quick edit
 * (the same slot the blocks use).
 * @param {Element} main The container element
 */
function decorateDefaultCtas(main) {
  main.querySelectorAll('.default-content-wrapper p:is(.button-wrapper, .text-link-wrapper)').forEach((p) => {
    const prev = p.previousElementSibling;
    if (prev && prev.classList.contains('cta-slot')) {
      prev.append(p);
      return;
    }
    const slot = document.createElement('div');
    slot.className = 'cta-slot';
    p.before(slot);
    slot.append(p);
  });
}

/**
 * Marks a default-content wrapper that holds only a heading and one text link, ahead of a
 * block, as a v3 section head (heading left, link right).
 * @param {Element} main The container element
 */
function decorateSectionHeads(main) {
  main.querySelectorAll('.section > .default-content-wrapper').forEach((wrapper) => {
    if (!wrapper.nextElementSibling) return;
    const [heading, slot, ...rest] = [...wrapper.children];
    if (rest.length || !heading || !slot || !/^H[2-4]$/.test(heading.tagName)) return;
    if (!slot.classList.contains('cta-slot') || !slot.querySelector('.text-link-wrapper')) return;
    wrapper.classList.add('section-head');
  });
}

/**
 * Folds a link the editor split back into one. Experience Workspace cannot hold a link whose
 * text is partly bold or italic, so it saves
 * <strong><a href=x>Part 1</a></strong><a href=x>Title</a>; this moves the bold part back inside
 * the link (<a href=x><strong>Part 1</strong>Title</a>), the form every block was built for. The
 * authored nodes move; only the inner link element goes.
 * @param {Element} main The main element
 */
function foldSplitLinks(main) {
  main.querySelectorAll('strong > a:only-child, em > a:only-child').forEach((inner) => {
    const mark = inner.parentElement;
    const next = mark.nextSibling;
    if (mark.textContent !== inner.textContent || next?.nodeName !== 'A') return;
    if (next.getAttribute('href') !== inner.getAttribute('href')) return;
    mark.replaceChildren(...inner.childNodes);
    next.prepend(mark);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  foldSplitLinks(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateDefaultCtas(main);
  decorateSectionHeads(main);
}

/**
 * Applies the page template (metadata "template"): templates/<name>/<name>.js and .css, the
 * module's default export decorates main before the first section shows, so the layout never
 * shifts. A template without code leaves the page as it is.
 * @param {Element} main The main element
 */
async function decorateTemplate(main) {
  const template = toClassName(getMetadata('template'));
  if (!template || !/^[a-z][a-z0-9-]*$/.test(template)) return;
  const base = `${window.hlx.codeBasePath}/templates/${template}/${template}`;
  try {
    const [mod] = await Promise.all([import(`${base}.js`), loadCSS(`${base}.css`)]);
    if (mod.default) await mod.default(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`template ${template} failed to load`, error);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  applyStoredTheme();
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    main.id = 'main';
    decorateMain(main);
    await decorateTemplate(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  // A talk or project page's JSON-LD is generated: the edge Worker serves it on www, and here
  // the browser adds it where there is no Worker (preview hosts).
  if (doc.querySelector('meta[name="talk-id"], meta[name="project-order"]')) {
    import('./page-schema.js').then(({ syncPageSchema }) => syncPageSchema());
  }

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // consented scripts (GA4) start 3 seconds after the page has loaded (decision 9)
  window.setTimeout(() => import('./consent-check.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
