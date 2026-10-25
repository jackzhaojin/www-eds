/**
 * Data table: a table of text (the source's .data tables in a scrolling wrapper). One block
 * row per table row; the first row is the header. Cell content is moved into the cells, so
 * every authored paragraph stays editable.
 *
 * @variants nowrap
 *   nowrap - the last column stays on one line (a short value such as "16 min")
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const table = document.createElement('table');
  table.className = 'data-table-table';
  const head = document.createElement('thead');
  const body = document.createElement('tbody');
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) td.scope = 'col';
      td.append(...cell.childNodes);
      tr.append(td);
    });
    (i === 0 ? head : body).append(tr);
  });
  table.append(head, body);
  const wrap = document.createElement('div');
  wrap.className = 'data-table-scroll';
  wrap.append(table);
  block.replaceChildren(wrap);
}
