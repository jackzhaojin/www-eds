/**
 * Explainer engine "consideration-lens": one consideration across three solution diagrams (the
 * lens of "AEM headless omnichannel architecture"). Pick a consideration; each diagram lights the
 * boxes and arrows it involves and shows its note. The table of all considerations is the source.
 *
 * Rows:
 * - first row, one cell: the bar (two label paragraphs) and an italic paragraph that names the
 *   consideration picker for assistive tech (not shown);
 * - the solutions row, one cell per solution: the name paragraph ("Solution 1 · ..."; the text
 *   before the dot names the diagram for assistive tech), then the wide and the tall diagram
 *   (SVG images: drawn inline so the boxes can light up; data-n boxes and data-e arrows);
 * - a row with one cell: the summary of the side-by-side table;
 * - the table head row: a cell per column (the first heads the considerations);
 * - one row per consideration: its label (bold = picked first), then one cell per solution: the
 *   note paragraph, and a paragraph of inline code listing the boxes and arrows it involves
 *   (ids with a hyphen are arrows; not shown);
 * - last row, one cell: the caption.
 * The picker's chips and the note under each diagram repeat the table's text.
 *
 * @variants (none)
 * @ew-exempt <p> picker name, <p> box and arrow ids - text-as-metadata, never displayed
 */

const isName = (el) => el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
  && el.textContent.trim() === el.firstElementChild.textContent.trim();
const isIds = (el) => el.tagName === 'P' && el.querySelector('code') && !el.textContent.replace(el.querySelector('code').textContent, '').trim();

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
  frame.className = 'lens';
  const meta = slot('lens-meta');
  const singles = all.filter((r) => r.length === 1);
  const barCell = all[0]?.length === 1 ? all[0][0] : null;
  const last = all[all.length - 1];
  const capCell = all.length > 1 && last.length === 1 ? last[0] : null;
  const summaryCell = singles.map((r) => r[0]).find((c) => c !== barCell && c !== capCell);
  const multi = all.filter((r) => r.length > 1);
  const [solRow, headRow, ...considerations] = multi;

  const chips = slot('chips lens__chips');
  chips.setAttribute('role', 'radiogroup');
  if (barCell) {
    const bar = slot('lens__bar');
    [...barCell.children].forEach((el) => {
      if (isName(el)) {
        chips.setAttribute('aria-label', el.textContent.trim());
        meta.append(el);
      } else bar.append(el);
    });
    frame.append(bar);
  }
  frame.append(chips);

  // solutions
  const grid = slot('lens__grid');
  const sols = [];
  const swaps = [];
  (solRow || []).forEach((cell, i) => {
    const sol = document.createElement('section');
    sol.className = 'lens__sol';
    const kids = [...cell.children];
    const name = kids.find((el) => el.tagName === 'P' && !el.querySelector('img'));
    if (name) {
      sol.setAttribute('aria-label', name.textContent.split('·')[0].trim());
      sol.append(slot('lens-name', [name]));
    }
    const art = slot('lens-art');
    const imgs = kids.filter((el) => el.querySelector('img'));
    imgs.forEach((p, k) => {
      const img = p.querySelector('img');
      const keep = slot('lens-img', [p]);
      art.append(keep);
      const cls = `lens__svg lens__svg--${k === 0 ? 'wide' : 'tall'}`;
      swaps.push(inlineSvg(img, cls).then((svg) => {
        if (!svg) return;
        keep.before(svg);
        keep.classList.add('is-drawn');
      }));
    });
    sol.append(art);
    const say = document.createElement('p');
    say.className = 'lens__say';
    say.setAttribute('aria-live', 'polite');
    sol.append(say);
    grid.append(sol);
    sols.push({ el: sol, say, index: i });
  });
  frame.append(grid);

  // table
  const details = document.createElement('details');
  details.className = 'lens__all';
  const summary = document.createElement('summary');
  if (summaryCell) summary.append(...summaryCell.children);
  details.append(summary);
  const table = document.createElement('table');
  table.className = 'data lens__table';
  if (headRow) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    headRow.forEach((cell) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.append(...cell.children);
      tr.append(th);
    });
    thead.append(tr);
    table.append(thead);
  }
  const tbody = document.createElement('tbody');
  const items = [];
  let first = 0;
  considerations.forEach(([label, ...cells], i) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.append(...label.children);
    tr.append(th);
    if (th.querySelector('strong')) first = i;
    const per = cells.map((cell) => {
      const td = document.createElement('td');
      const ids = [];
      const notes = [];
      [...cell.children].forEach((el) => {
        if (isIds(el)) {
          ids.push(...el.textContent.trim().split(/\s+/));
          td.append(slot('lens-ids', [el]));
        } else {
          notes.push(el);
          td.append(el);
        }
      });
      tr.append(td);
      return {
        nodes: ids.filter((x) => !x.includes('-')),
        edges: ids.filter((x) => x.includes('-')),
        say: notes.map((n) => n.textContent.trim()).join(' '),
      };
    });
    tbody.append(tr);
    const chip = document.createElement('div');
    chip.textContent = th.textContent.trim();
    chips.append(chip);
    items.push({ tr, per, chip });
  });
  table.append(tbody);
  details.append(slot('table-wrap', [table]));
  frame.append(details);

  const show = (c) => {
    items.forEach((it, j) => {
      it.chip.setAttribute('aria-checked', String(j === c));
      it.chip.tabIndex = j === c ? 0 : -1;
      it.tr.classList.toggle('on', j === c);
    });
    sols.forEach((sol) => {
      const cell = items[c].per[sol.index] || { nodes: [], edges: [], say: '' };
      sol.el.classList.add('has-focus');
      sol.el.querySelectorAll('.lens__node').forEach((g) => g.classList.toggle('on', cell.nodes.includes(g.dataset.n)));
      sol.el.querySelectorAll('.lens__edge, .lens__elabel').forEach((p) => p.classList.toggle('on', cell.edges.includes(p.dataset.e)));
      sol.say.textContent = cell.say;
    });
  };
  items.forEach((it, i) => {
    it.chip.setAttribute('role', 'radio');
    it.chip.addEventListener('click', () => show(i));
    it.chip.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const n = (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
        items[n].chip.focus();
        show(n);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(i);
      }
    });
  });

  if (capCell) {
    const cap = document.createElement('figcaption');
    cap.append(...capCell.children);
    frame.append(cap);
  }
  frame.append(meta);
  block.replaceChildren(frame);
  await Promise.all(swaps);
  if (items.length) show(first);
}
