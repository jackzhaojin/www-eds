/**
 * Presentation template (since v1.4.0, the Sites and AI webinar): a page read as slides, one
 * section each. Layout in presentation.css: a slide fills the screen on a laptop or a
 * shared screen, its kicker, heading and lead read from across a call, and it prints one slide
 * a page. No custom keys: the browser's own scrolling, find and anchors move between slides.
 * Since v1.7.3 a line under the header shows how far through the deck the page is scrolled,
 * the same line the portfolio pages have.
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

export default function decorate() {
  scrollProgress();
}
