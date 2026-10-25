import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import buildThemeControl from '../../scripts/theme-control.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DESKTOP = window.matchMedia('(width >= 1024px)');

function menuIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M4 7h16M4 12h16M4 17h16');
  svg.append(path);
  return svg;
}

function markCurrent(list) {
  const norm = (p) => p.replace(/\/(index)?$/, '') || '/';
  const here = norm(window.location.pathname);
  list.querySelectorAll('a[href]').forEach((a) => {
    const { pathname } = new URL(a.href, window.location);
    if (norm(pathname) === here) a.setAttribute('aria-current', 'page');
  });
}

/**
 * Loads and decorates the header: the v3 one-row site header. Content comes from the nav
 * document: the first link paragraph is the wordmark, the first list is the navigation.
 * Below 1024px the navigation and the theme control fold behind the Menu toggle.
 * @ew-exempt button Menu / Close and the theme labels - interface chrome, not authored
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  const brandLink = [...fragment.querySelectorAll('p a[href]')][0];
  const brand = document.createElement('div');
  brand.className = 'site-header-brand';
  if (brandLink) {
    brandLink.classList.remove('text-link');
    brandLink.closest('p').classList.remove('text-link-wrapper');
    brand.append(brandLink.closest('p'));
  }

  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  // A second instance (a design-system story) gets its own id, so the toggle controls its nav.
  let id = 'site-nav';
  for (let n = 2; document.getElementById(id); n += 1) id = `site-nav-${n}`;
  nav.id = id;
  nav.setAttribute('aria-label', 'Primary');
  const links = document.createElement('div');
  links.className = 'site-nav-links';
  const list = fragment.querySelector('ul');
  if (list) {
    markCurrent(list);
    links.append(list);
  }
  const tools = document.createElement('div');
  tools.className = 'site-nav-tools';
  tools.append(buildThemeControl());
  nav.append(links, tools);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-controls', id);
  toggle.setAttribute('aria-expanded', 'false');
  const open = document.createElement('span');
  open.className = 'nav-toggle-open';
  open.textContent = 'Menu';
  const close = document.createElement('span');
  close.className = 'nav-toggle-close';
  close.textContent = 'Close';
  toggle.append(menuIcon(), open, close);

  const closeMenu = (returnFocus) => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    const expand = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expand));
    nav.classList.toggle('is-open', expand);
  });
  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open') || event.target.closest('.nav-toggle')) return;
    if (!event.target.closest('.header') || event.target.closest('.site-nav a')) closeMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
  });
  DESKTOP.addEventListener('change', () => closeMenu(false));

  const inner = document.createElement('div');
  inner.className = 'site-header';
  inner.append(brand, toggle, nav);
  block.replaceChildren(inner);

  if (!document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#main';
    skip.textContent = 'Skip to content';
    document.body.prepend(skip);
  }
}
