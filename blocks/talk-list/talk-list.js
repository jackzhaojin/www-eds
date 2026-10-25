/**
 * Talk list: a talk-by-talk conference recap (the source's talk recap: a numbered heading per
 * talk, a meta line, then the slide beside the talk's notes). One row per talk, in order.
 *
 * Cells are read by content, in any order:
 * - anchor: one paragraph holding the talk's anchor id (the rail and other pages link to it),
 *   for example talk-01-agents-dont-browse; never displayed;
 * - head: the heading (the talk number as inline code, then the linked title), then the meta
 *   paragraph: speakers, slot and links, separated by " · ", the video moment as inline code;
 * - slide: an image paragraph (a link around the image opens it full size), then the caption;
 * - notes: label paragraphs (all bold), each followed by its text: paragraphs and lists; a
 *   paragraph all in italics is the context line under the text. The last label is the take,
 *   in the accent color.
 * Missing cells are skipped; a talk without a slide keeps its notes full width.
 *
 * @ew-exempt anchor paragraph - the heading's id, never displayed
 * @variants (none)
 */

const ANCHOR = /^[a-z0-9][a-z0-9-]*$/;

function slot(name, nodes = []) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

const filled = (cell) => cell.children.length || cell.textContent.trim();

function role(cell) {
  if (cell.querySelector('h1, h2, h3, h4, h5, h6')) return 'head';
  if (cell.querySelector('picture, img')) return 'slide';
  const els = [...cell.children];
  const text = cell.textContent.trim();
  if (!cell.querySelector('a, strong') && ANCHOR.test(text) && els.length <= 1) return 'anchor';
  return 'notes';
}

/** Hides the meta line's separators from assistive tech, as on the source (text unchanged). */
function hideDots(p) {
  [...p.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.data.includes('·')).forEach((n) => {
    const nodes = [];
    const runs = n.data.split('·');
    runs.forEach((run, i) => {
      if (run) nodes.push(document.createTextNode(run));
      if (i < runs.length - 1) {
        const dot = document.createElement('span');
        dot.setAttribute('aria-hidden', 'true');
        dot.textContent = '·';
        nodes.push(dot);
      }
    });
    n.replaceWith(...nodes);
  });
}

function head(cell, id) {
  const wrap = slot('talk-head');
  [...cell.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      if (id) el.id = id;
      wrap.append(slot('talk-title', [el]));
    } else {
      if (el.tagName === 'P') hideDots(el);
      wrap.append(slot('talk-meta', [el]));
    }
  });
  return wrap;
}

/** The delivered image at full size: the link's href is derived, the authored one is DA media. */
function zoom(media) {
  const img = media.querySelector('img');
  const a = img && img.closest('a');
  if (!a) return;
  const full = new URL(img.getAttribute('src'), window.location);
  full.searchParams.delete('width');
  a.href = full.href;
}

function slide(cell) {
  const wrap = slot('talk-slide');
  [...cell.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE && !n.data.trim()) return;
    const media = n.nodeType === Node.ELEMENT_NODE && (n.matches('picture, img') || n.querySelector('picture, img'));
    if (media) {
      const m = slot('talk-media', [n]);
      zoom(m);
      wrap.append(m);
    } else wrap.append(slot('talk-caption', [n]));
  });
  return wrap;
}

const only = (el, tag) => {
  const mark = el.querySelector(tag);
  return el.tagName === 'P' && mark && el.textContent.trim() === mark.textContent.trim();
};

function notes(cell) {
  const wrap = slot('talk-parts');
  let text = null;
  const part = (label) => {
    text = slot('talk-text');
    wrap.append(slot('talk-part', label ? [slot('talk-label', [label]), text] : [text]));
  };
  [...cell.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE && !n.data.trim()) return;
    if (n.nodeType === Node.ELEMENT_NODE && only(n, 'strong')) {
      part(n);
      return;
    }
    if (!text) part(null);
    text.append(n.nodeType === Node.ELEMENT_NODE && only(n, 'em') ? slot('talk-ctx', [n]) : n);
  });
  const labels = wrap.querySelectorAll('.talk-label');
  if (labels.length) labels[labels.length - 1].classList.add('talk-mine');
  return wrap;
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cells = {};
    [...row.children].filter(filled).forEach((cell) => {
      const r = role(cell);
      if (cells[r]) cells[r].append(...cell.childNodes);
      else cells[r] = cell;
    });
    const id = cells.anchor ? cells.anchor.textContent.trim() : '';
    const parts = [];
    if (cells.anchor) parts.push(slot('talk-anchor', [...cells.anchor.childNodes]));
    if (cells.head) parts.push(head(cells.head, id));
    const body = slot('talk-body');
    if (cells.slide) body.append(slide(cells.slide));
    if (cells.notes) body.append(notes(cells.notes));
    if (body.children.length) parts.push(body);
    row.className = 'talk';
    row.replaceChildren(...parts);
  });
}
