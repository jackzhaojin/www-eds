/**
 * Explainer engine "option-matrix": one wide comparison table, options in columns and features
 * in rows, scrolling sideways in its frame on narrow screens (the seven AEM capabilities
 * article's matrix). An explainer (option-pair) on the same page reads these tables.
 *
 * Rows:
 * - a single-cell row: the table caption, ending in its group after a colon
 *   ("Traditional options: functional"), which option-pair uses to group the rows;
 * - the column labels: the feature column, then one cell per option;
 * - one row per feature: the feature, then one value per option ("Same" means the same as the
 *   first option of the first table).
 *
 * Behaviour: none.
 *
 * @variants option-matrix
 */
export default async function engine(block, { slot, rows, plainLinks }) {
  plainLinks(block);
  const table = document.createElement('table');
  table.className = 'data mx-table';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  rows(block).forEach((cells) => {
    if (cells.length === 1) {
      const caption = document.createElement('caption');
      caption.append(...cells[0].childNodes);
      table.prepend(caption);
      return;
    }
    const head = !thead.children.length;
    const tr = document.createElement('tr');
    cells.forEach((c, i) => {
      const cell = document.createElement(head || i === 0 ? 'th' : 'td');
      if (head) cell.scope = 'col';
      else if (i === 0) cell.scope = 'row';
      cell.append(...c.childNodes);
      tr.append(cell);
    });
    (head ? thead : tbody).append(tr);
  });
  table.append(thead, tbody);
  block.replaceChildren(slot('table-wrap mx-wrap', [table]));
}
