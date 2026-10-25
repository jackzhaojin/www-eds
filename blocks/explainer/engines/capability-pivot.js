/**
 * Explainer engine "capability-pivot": a comparison table with one chip per column; a chip shows
 * every row's value for that column as a list, and a last chip shows the full table (the edge
 * CMS article's six platforms on five capabilities).
 *
 * Rows:
 * - a single-cell row: the name of the chip group, for assistive tech (not shown);
 * - a single-cell row: the table caption;
 * - the column labels: the row label's column, then one cell per capability;
 * - the chip labels: the first cell names the full-table chip, then one short label per
 *   capability, in the same order (a chip whose label differs from its column label is
 *   announced by the column label);
 * - one row per table row: the row label, then one value per capability. A row label in bold
 *   marks the highlighted row;
 * - a last single-cell row is the caption of the figure.
 *
 * Behaviour: opens on the first capability. The list view and the chips are derived from the
 * table at decoration time; without JavaScript the rows read as the table.
 *
 * @variants capability-pivot
 */
function radio(host, label) {
  host.setAttribute('role', 'radio');
  host.setAttribute('aria-checked', 'false');
  host.tabIndex = -1;
  if (label) host.setAttribute('aria-label', label);
  return host;
}

export default async function engine(block, { slot, rows }) {
  const all = rows(block);
  const singles = [];
  const multi = [];
  let caption = null;
  all.forEach((cells) => {
    if (cells.length > 1) multi.push(cells);
    else if (multi.length) [caption] = cells;
    else singles.push(cells[0]);
  });
  const [nameCell, tableCaptionCell] = singles.length > 1 ? singles : [null, singles[0]];
  const [headCells, chipCells, ...bodyRows] = multi;
  if (!headCells || !chipCells) return;
  // the list view reads the authored text before the cells move into the table
  const caps = headCells.slice(1).map((c) => c.textContent.trim());
  const data = bodyRows.map((cells) => ({
    highlight: !!cells[0].querySelector('strong, b'),
    name: cells[0].textContent.trim(),
    values: cells.slice(1).map((c) => c.textContent.trim()),
  }));

  const figure = document.createElement('figure');
  figure.className = 'pv';

  // the table, from the authored cells (moved)
  const table = document.createElement('table');
  table.className = 'data pv__table';
  if (tableCaptionCell) {
    const cap = document.createElement('caption');
    cap.append(...tableCaptionCell.childNodes);
    table.append(cap);
  }
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  headCells.forEach((c) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.append(...c.childNodes);
    htr.append(th);
  });
  thead.append(htr);
  const tbody = document.createElement('tbody');
  bodyRows.forEach((cells, r) => {
    const tr = document.createElement('tr');
    if (data[r].highlight) tr.className = 'pv__eds';
    cells.forEach((c, i) => {
      const cell = document.createElement(i ? 'td' : 'th');
      if (!i) cell.scope = 'row';
      cell.append(...c.childNodes);
      tr.append(cell);
    });
    tbody.append(tr);
  });
  table.append(thead, tbody);
  const wrap = slot('table-wrap pv__wrap', [table]);

  // chips: one per capability, then the full table
  const chips = slot('pv__chips chips');
  chips.setAttribute('role', 'radiogroup');
  if (nameCell) {
    const name = nameCell.textContent.trim();
    if (name) chips.setAttribute('aria-label', name);
  }
  const hosts = [];
  chipCells.slice(1).forEach((c, i) => {
    const text = c.textContent.trim();
    const host = radio(slot('pv__chip', [...c.children]), text !== caps[i] ? caps[i] : null);
    host.dataset.i = String(i);
    hosts.push(host);
  });
  const allHost = radio(slot('pv__chip', [...chipCells[0].children]));
  allHost.dataset.i = '-1';
  hosts.push(allHost);
  chips.append(...hosts);

  const out = slot('pv__out');
  out.setAttribute('aria-live', 'polite');

  function show(index) {
    hosts.forEach((h) => {
      const on = Number(h.dataset.i) === index;
      h.setAttribute('aria-checked', String(on));
      h.tabIndex = on ? 0 : -1;
    });
    const full = index === -1;
    wrap.hidden = !full;
    out.hidden = full;
    if (full) return;
    const head = document.createElement('p');
    head.className = 'pv__head';
    head.textContent = caps[index];
    const list = document.createElement('ol');
    list.className = 'pv__list';
    data.forEach((r) => {
      const li = document.createElement('li');
      if (r.highlight) li.className = 'is-eds';
      const name = document.createElement('span');
      name.className = 'pv__name';
      name.textContent = r.name;
      const val = document.createElement('span');
      val.className = 'pv__val';
      val.textContent = r.values[index] || '';
      li.append(name, val);
      list.append(li);
    });
    out.replaceChildren(head, list);
  }

  hosts.forEach((h, i) => {
    h.addEventListener('click', () => show(Number(h.dataset.i)));
    h.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const next = hosts[(i + (e.key === 'ArrowRight' ? 1 : hosts.length - 1)) % hosts.length];
        next.focus();
        show(Number(next.dataset.i));
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(Number(h.dataset.i));
      }
    });
  });

  figure.append(chips, out, wrap);
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.append(...caption.children);
    figure.append(figcaption);
  }
  if (nameCell) figure.append(slot('pv__name-row', [...nameCell.children]));
  block.replaceChildren(figure);
  show(0);
}
