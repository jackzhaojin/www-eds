/**
 * Presentation template (since v1.4.0, the Sites and AI webinar): a page read as slides, one
 * section each. Layout in presentation.css: a slide fills the screen on a laptop or a
 * shared screen, its kicker, heading and lead read from across a call, and it prints one slide
 * a page. No custom keys: the browser's own scrolling, find and anchors move between slides.
 * Since v1.7.3 a line under the header shows how far through the deck the page is scrolled,
 * the same line the portfolio pages have, and since v1.7.4 a link to a slide always reaches it.
 * Since v1.7.8 a Rail block on the page becomes the deck's outline, placed by placeRail.
 */

/** The scroll progress line under the header (as templates/portfolio does it). */
function scrollProgress() {
  const header = document.querySelector('body > header');
  if (!header || header.querySelector('.scroll-progress')) return;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  header.append(bar);
  const update = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0}%`;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/**
 * A link to a slide goes to the slide. A heading can carry the same id as a slide (the agenda
 * card "Authoring" and the slide #authoring), and the browser would stop at the first one.
 */
function slideLinks() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    const id = link?.getAttribute('href').slice(1);
    if (!id || event.defaultPrevented) return;
    const slide = [...document.querySelectorAll('main > .section[id]')].find((s) => s.id === id);
    if (!slide) return;
    event.preventDefault();
    slide.scrollIntoView();
    window.history.pushState(null, '', `#${id}`);
  });
}

/** A slide owns its id: a heading that got the same id from its text gives it up. */
function slideIds(main) {
  const ids = new Set([...main.querySelectorAll(':scope > .section[id]')].map((s) => s.id));
  main.querySelectorAll(':is(h1, h2, h3, h4, h5, h6)[id]').forEach((h) => {
    if (ids.has(h.id)) h.removeAttribute('id');
  });
}

const ROOMY = window.matchMedia('(width >= 1800px)');
const RAIL_NARROW = window.matchMedia('(width <= 1080px)');

/**
 * The deck's outline: a Rail block authored in a section of its own (the block the article
 * template puts in its right rail). Slides fill the window, so there is no column for it. It
 * floats under the header as a small "On this page" control that opens the outline, and it
 * stays open in the margin once the window is wide enough to have one (1800px).
 */
function placeRail(main) {
  const section = [...main.querySelectorAll(':scope > .section')].find((s) => s.querySelector('.rail-wrapper'));
  if (!section) return;
  const aside = document.createElement('aside');
  aside.className = 'presentation-rail';
  // the section moves whole, so loadSections still finds and loads it (as templates/article does)
  aside.append(section);
  main.append(aside);
  const outline = () => aside.querySelector('details.rail-outline');
  const sync = () => {
    const details = outline();
    if (details) details.open = ROOMY.matches;
  };
  const close = () => {
    const details = outline();
    if (details && !ROOMY.matches) details.open = false;
  };
  // the rail block opens itself on any window over 1080px; a deck keeps it shut until there is room
  const seen = new MutationObserver(() => {
    if (!outline()) return;
    seen.disconnect();
    sync();
  });
  seen.observe(aside, { childList: true, subtree: true });
  ROOMY.addEventListener('change', sync);
  RAIL_NARROW.addEventListener('change', () => setTimeout(sync, 0));
  aside.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) close();
  });
  document.addEventListener('click', (event) => {
    if (!aside.contains(event.target)) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

export default function decorate(main) {
  scrollProgress();
  slideLinks();
  slideIds(main);
  placeRail(main);
}
