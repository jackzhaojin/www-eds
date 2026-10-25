/**
 * Explainer engine "scripted-flow": a redrawn call-flow board with a color key (the scripted flow
 * of "Building an MCP Server for EDS da.live"). The diagram is drawn inline from its SVG images so
 * it takes the page's colors in both themes; the wide drawing shows in a wide column, the tall one
 * in a narrow one.
 *
 * Rows:
 * - the diagram row, one cell: the wide and then the tall diagram (SVG images; boxes are
 *   g.n.n--fn, g.n.n--api or g.n.n--llm, arrows .e, arrow heads .head);
 * - the key row, one cell: a list, one item per box kind in the order function, Adobe API, LLM;
 * - last row, one cell: the caption.
 *
 * @variants (none)
 */

/** Draws an SVG image inline (its own classes and ids), keeping the authored image as fallback. */
async function inlineSvg(img, cls) {
  try {
    const res = await fetch(img.src);
    if (!res.ok) return null;
    const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
    const svg = doc.documentElement;
    if (svg.nodeName !== 'svg') return null;
    svg.querySelectorAll('style, script').forEach((s) => s.remove());
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('class', cls);
    return document.importNode(svg, true);
  } catch {
    return null;
  }
}

export default async function engine(block, { slot, rows }) {
  const all = rows(block);
  const frame = document.createElement('figure');
  frame.className = 'dg';
  const last = all[all.length - 1];
  const capCell = all.length > 1 && last.length === 1 && !last[0].querySelector('img, ul, ol') ? last[0] : null;
  const swaps = [];
  all.forEach(([cell]) => {
    if (cell === capCell) return;
    [...cell.children].forEach((el) => {
      const img = el.querySelector('img');
      if (img) {
        const k = frame.querySelectorAll('.dg-img').length;
        const keep = slot('dg-img', [el]);
        frame.append(keep);
        swaps.push(inlineSvg(img, k === 0 ? 'svg-wide' : 'svg-tall').then((svg) => {
          if (!svg) return;
          keep.before(svg);
          keep.classList.add('is-drawn');
        }));
      } else if (el.matches('ul, ol')) frame.append(slot('dg__legend', [el]));
      else frame.append(el);
    });
  });
  if (capCell) {
    const cap = document.createElement('figcaption');
    cap.append(...capCell.children);
    frame.append(cap);
  }
  block.replaceChildren(frame);
  await Promise.all(swaps);
}
