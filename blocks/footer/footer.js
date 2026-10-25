import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const PROFILE_HOSTS = ['www.linkedin.com', 'github.com'];

/**
 * The v3 full footer, used when the footer document has headed columns (the design system
 * page): each h2 and the list after it become a column, the paragraphs become the meta row.
 * @param {Element} block The footer block element
 * @param {Element} fragment The loaded footer document
 */
function decorateColumns(block, fragment) {
  const grid = document.createElement('div');
  grid.className = 'footer-grid';
  fragment.querySelectorAll('h2').forEach((h) => {
    const col = document.createElement('div');
    col.className = 'footer-col';
    const list = h.nextElementSibling;
    col.append(h);
    if (list && list.matches('ul')) {
      // A bracketed item without a link is a placeholder (v3 span.placeholder).
      list.querySelectorAll('li').forEach((li) => {
        if (li.querySelector('a') || !li.textContent.trim()) return;
        const span = document.createElement('span');
        span.className = 'placeholder';
        span.append(...li.childNodes);
        li.append(span);
      });
      col.append(list);
    }
    grid.append(col);
  });
  const meta = document.createElement('div');
  meta.className = 'footer-meta-row';
  fragment.querySelectorAll('p').forEach((p) => meta.append(p));
  block.classList.add('footer-full');
  block.replaceChildren(grid, meta);
}

/**
 * Loads and decorates the footer: the v3 compact footer. Content comes from the footer
 * document: its paragraph is the copyright line (the place follows a line break and shows
 * muted beside it), its first list is the profile links.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;
  if (fragment.querySelector('h2')) {
    decorateColumns(block, fragment);
    return;
  }

  // The copyright line: after its line break comes the place, muted beside it.
  const meta = document.createElement('div');
  meta.className = 'footer-meta';
  fragment.querySelectorAll('p').forEach((p) => {
    const br = p.querySelector('br');
    if (br && br.nextSibling) {
      const place = document.createElement('span');
      place.className = 'footer-place';
      let node = br.nextSibling;
      while (node) {
        const next = node.nextSibling;
        place.append(node);
        node = next;
      }
      br.after(place);
    }
    meta.append(p);
  });

  const nav = document.createElement('nav');
  nav.className = 'footer-links';
  nav.setAttribute('aria-label', 'Profile links');
  const list = fragment.querySelector('ul');
  if (list) {
    list.querySelectorAll('a[href]').forEach((a) => {
      if (PROFILE_HOSTS.includes(new URL(a.href).hostname)) a.rel = 'me';
    });
    nav.append(list);
  }

  const row = document.createElement('div');
  row.className = 'footer-row';
  row.append(meta, nav);
  block.replaceChildren(row);
}
