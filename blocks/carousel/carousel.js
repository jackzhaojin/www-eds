/**
 * Carousel: a row of captioned slides that scrolls sideways (source div.carousel), with
 * previous and next controls and a count.
 *
 * Content: one row per slide: image | caption (a bold label, then the line). Optional config
 * rows (two cells, the key first): `label | <text>` names the carousel, `previous | <text>`
 * and `next | <text>` name the controls for assistive tech.
 *
 * A proof-links block right after the carousel joins it, under the controls (EDS blocks do
 * not nest).
 *
 * @ew-exempt config rows (label, previous, next) are aria-labels; arrows and count are drawn
 */

const CONFIG = ['label', 'previous', 'next'];

/** Config rows stay in the block, hidden through a wrapper, so they stay editable. */
function hiddenBox(className, nodes) {
  const box = document.createElement('div');
  box.className = className;
  box.hidden = true;
  box.append(...nodes);
  return box;
}

function slot(className, nodes, tag = 'div') {
  const el = document.createElement(tag);
  el.className = className;
  el.append(...nodes);
  return el;
}

export default function decorate(block) {
  const config = {};
  const meta = [];
  const track = slot('carousel-track', []);
  track.tabIndex = 0;
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    const key = cells.length === 2 ? cells[0].textContent.trim().toLowerCase() : '';
    if (CONFIG.includes(key) && !cells[0].querySelector('img')) {
      config[key] = cells[1].textContent.trim();
      cells.forEach((c) => meta.push(...c.children));
      return;
    }
    const slide = document.createElement('figure');
    slide.className = 'carousel-slide';
    const caption = document.createElement('figcaption');
    cells.forEach((cell) => [...cell.children].forEach((el) => {
      if (el.querySelector('picture, img') || el.matches('picture, img')) slide.append(slot('carousel-media', [el]));
      else caption.append(el);
    }));
    if (caption.children.length) slide.append(caption);
    if (slide.children.length) track.append(slide);
  });
  if (config.label) track.setAttribute('aria-label', config.label);
  const total = track.children.length;
  const controls = slot('carousel-controls', []);
  const count = document.createElement('span');
  count.className = 'carousel-count';
  count.textContent = `1 / ${total}`;
  const button = (dir, glyph, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = glyph;
    if (label) b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      const slide = track.querySelector('.carousel-slide');
      if (!slide) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.scrollBy({ left: (slide.getBoundingClientRect().width + 18) * dir, behavior: reduce ? 'auto' : 'smooth' });
    });
    return b;
  };
  controls.append(button(-1, '←', config.previous), count, button(1, '→', config.next));
  track.addEventListener('scroll', () => {
    const slide = track.querySelector('.carousel-slide');
    if (!slide) return;
    const w = slide.getBoundingClientRect().width + 18;
    count.textContent = `${Math.min(total, Math.round(track.scrollLeft / w) + 1)} / ${total}`;
  }, { passive: true });
  const next = block.parentElement?.nextElementSibling;
  const links = next?.firstElementChild?.dataset.blockName === 'proof-links' ? next : null;
  if (meta.length) controls.append(hiddenBox('carousel-meta', meta));
  block.replaceChildren(track, controls, ...(links ? [links] : []));
}
