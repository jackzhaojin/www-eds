/**
 * Presentation template (since v1.4.0, the Sites and AI webinar): a page read as slides, one
 * section each. Layout in presentation.css: a slide fills the screen on a laptop or a
 * shared screen, its kicker, heading and lead read from across a call, and it prints one slide
 * a page. No custom keys: the browser's own scrolling, find and anchors move between slides.
 * Since v1.7.3 a line under the header shows how far through the deck the page is scrolled,
 * the same line the portfolio pages have, and since v1.7.4 a link to a slide always reaches it.
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

export default function decorate() {
  scrollProgress();
  slideLinks();
}
