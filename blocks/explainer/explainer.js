/**
 * Explainer: one interactive explainer from an article (the source's per-article
 * explainer.js one-offs). The variant word names its engine: blocks/explainer/engines/<word>.js
 * and <word>.css, loaded on demand. The block's rows hold the explainer's text, data and media;
 * the engine moves those authored elements into its layout (never rebuilds them) and adds the
 * behaviour. Each engine documents its own row shape in its JSDoc.
 *
 * Shared chrome for every engine (the explainer kit's bar, lab frame, chips, controls, verdict,
 * night code) is in explainer.css, scoped to .explainer.
 *
 * @variants one engine per word in blocks/explainer/engines/ (each engine's JSDoc lists its word)
 */
import { loadCSS } from '../../scripts/aem.js';

const ENGINE = /^[a-z][a-z0-9-]*$/;

export const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Runs fn once the element is at least `threshold` visible (the kit's onceVisible). */
export function onceVisible(el, fn, threshold = 0.45) {
  if (!('IntersectionObserver' in window)) {
    fn();
    return;
  }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      fn();
    }
  }, { threshold });
  io.observe(el);
}

/** A wrapper div with a layout class around existing (moved) nodes. */
export function slot(name, nodes = []) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

/** The block's rows as arrays of cells. */
export const rows = (block) => [...block.querySelectorAll(':scope > div')].map((r) => [...r.children]);

/** Undoes scripts.js text-link and button classes on links an engine restyles. */
export function plainLinks(root) {
  root.querySelectorAll('p.text-link-wrapper, p.button-wrapper').forEach((p) => p.classList.remove('text-link-wrapper', 'button-wrapper'));
  root.querySelectorAll('a.text-link, a.button').forEach((a) => a.classList.remove('text-link', 'button', 'primary', 'secondary', 'accent'));
}

export default async function decorate(block) {
  const engine = block.classList[1];
  if (!engine || !ENGINE.test(engine) || engine === 'block') return;
  const base = `${window.hlx.codeBasePath}/blocks/explainer/engines/${engine}`;
  const [mod] = await Promise.all([import(`${base}.js`), loadCSS(`${base}.css`)]);
  await mod.default(block, {
    slot, rows, onceVisible, wait, reduceMotion, plainLinks,
  });
}
