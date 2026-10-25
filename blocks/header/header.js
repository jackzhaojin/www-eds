import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const THEME_KEY = 'jj-theme';
const THEMES = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']];
const SVG_NS = 'http://www.w3.org/2000/svg';
const DESKTOP = window.matchMedia('(width >= 1024px)');
const DARK_OS = window.matchMedia('(prefers-color-scheme: dark)');

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

function syncTheme(control) {
  const root = document.documentElement;
  const choice = root.dataset.themeChoice || 'light';
  const dark = choice === 'dark' || (choice === 'system' && DARK_OS.matches);
  root.dataset.themeEffective = dark ? 'dark' : 'light';
  control.querySelectorAll('[data-set-theme]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.setTheme === choice));
  });
}

function applyTheme(choice, control) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = choice;
  root.dataset.themeChoice = choice;
  syncTheme(control);
}

/**
 * The v3 theme control: Light, Dark, System. The choice persists under jj-theme; scripts.js
 * applies it before the body appears on the next page.
 */
function buildThemeControl() {
  const control = document.createElement('div');
  control.className = 'theme-control';
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', 'Color theme');
  THEMES.forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-control-button';
    button.dataset.setTheme = value;
    button.textContent = label;
    control.append(button);
  });
  control.addEventListener('click', (event) => {
    const button = event.target.closest('[data-set-theme]');
    if (!button) return;
    applyTheme(button.dataset.setTheme, control);
    try {
      localStorage.setItem(THEME_KEY, button.dataset.setTheme);
    } catch {
      // optional persistence
    }
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_KEY) return;
    const valid = THEMES.some(([value]) => value === event.newValue);
    applyTheme(valid ? event.newValue : 'light', control);
  });
  DARK_OS.addEventListener('change', () => syncTheme(control));
  syncTheme(control);
  return control;
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
  nav.id = 'site-nav';
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
  toggle.setAttribute('aria-controls', 'site-nav');
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
