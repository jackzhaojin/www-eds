/**
 * Facts: key and value rows under a page head or a project (design-system/v3 facts table).
 * One row per fact: the key cell (a short label), then the value cell. A first row with a
 * single cell is the caption, read by assistive tech only (v3 caption.sr-only).
 *
 * A real table, so parsers lift it verbatim: keys become row headers, and each authored
 * paragraph is moved into its cell, so it stays editable.
 *
 * @variants caption
 *   caption - the caption shows above the rows (the inverse panel's "Key facts")
 */

/** Value links read as inline links, never as text-link or button boxes. */
function plainLinks(cell) {
  cell.querySelectorAll('p').forEach((p) => p.classList.remove('text-link-wrapper', 'button-wrapper'));
  cell.querySelectorAll('a').forEach((a) => a.classList.remove('text-link', 'button', 'primary', 'secondary', 'accent'));
}

export default function decorate(block) {
  plainLinks(block);
  const rows = [...block.querySelectorAll(':scope > div')];
  const table = document.createElement('table');
  table.className = 'facts-table';
  const body = document.createElement('tbody');
  rows.forEach((row, i) => {
    const cells = [...row.children];
    if (i === 0 && cells.length === 1 && rows.length > 1) {
      const caption = document.createElement('caption');
      caption.className = 'facts-caption';
      caption.append(...cells[0].childNodes);
      table.append(caption);
      return;
    }
    const tr = document.createElement('tr');
    const [key, ...values] = cells;
    const th = document.createElement('th');
    th.scope = 'row';
    if (key) th.append(...key.childNodes);
    tr.append(th);
    const td = document.createElement('td');
    values.forEach((value) => td.append(...value.childNodes));
    tr.append(td);
    body.append(tr);
  });
  table.append(body);
  block.replaceChildren(table);
}
