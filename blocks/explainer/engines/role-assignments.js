/**
 * Explainer engine "role-assignments": a small table transcribed from a portal screenshot, under
 * a heading line, inside a framed card (the Azure RBAC article's storage role assignments).
 *
 * Rows, by position of the single-cell rows around the table:
 * - a single-cell row before the table: the heading line ("Storage Blob Data Contributor (2)");
 * - the first row with two or more cells: the column labels;
 * - each later row with two or more cells: one table row;
 * - a single-cell row after the table: the caption.
 *
 * Behaviour: none. Below 560px of viewport each row stacks, and the third and fourth columns are
 * prefixed "Role: " and "Scope: " by CSS, as on the source.
 *
 * @variants role-assignments
 */
export default async function engine(block, { slot, rows }) {
  const figure = document.createElement('figure');
  figure.className = 'roles';
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const caption = document.createElement('figcaption');
  let head = null;

  rows(block).forEach((cells) => {
    if (cells.length === 1) {
      if (!thead.children.length && !head) head = slot('roles__head', [...cells[0].children]);
      else caption.append(...cells[0].children);
      return;
    }
    const tr = document.createElement('tr');
    const isHead = !thead.children.length;
    cells.forEach((c) => {
      const cell = document.createElement(isHead ? 'th' : 'td');
      if (isHead) cell.scope = 'col';
      cell.append(...c.childNodes);
      tr.append(cell);
    });
    (isHead ? thead : tbody).append(tr);
  });

  table.append(thead, tbody);
  if (head) figure.append(head);
  figure.append(table);
  if (caption.children.length) figure.append(caption);
  block.replaceChildren(figure);
}
