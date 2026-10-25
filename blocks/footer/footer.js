import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const PROFILE_HOSTS = ['www.linkedin.com', 'github.com'];

/**
 * Loads and decorates the footer: the v3 compact footer. Content comes from the footer
 * document: its paragraphs are the copyright line (the second one is the muted place), its
 * first list is the profile links.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  const meta = document.createElement('div');
  meta.className = 'footer-meta';
  [...fragment.querySelectorAll('p')].forEach((p, i) => {
    const slot = document.createElement('div');
    slot.className = i === 0 ? 'footer-copy' : 'footer-place';
    slot.append(p);
    meta.append(slot);
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
