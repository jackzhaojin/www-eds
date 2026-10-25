/**
 * Data table: a table of text (the source's .data tables in a scrolling wrapper). One block
 * row per table row; the first row is the header. Cell content is moved into the cells, so
 * every authored paragraph stays editable.
 *
 * A row with fewer cells than the table (a merged cell in Experience Workspace): its last cell
 * spans the remaining columns.
 *
 * @ew-exempt sr-caption: the caption is read by screen readers only (.sr-only)
 * @variants nowrap | cheat | rank | stack | caption | sr-caption | row-heads | fill-in | span-first
 *   | mono-head | compact
 *   nowrap - the last column stays on one line (a short value such as "16 min")
 *   cheat - a cheat sheet: smaller type, the first column in strong ink (one article)
 *   rank - a ranked list: the first column a faint mono rank, bold words in strong ink (one
 *   article)
 *   stack - on phones the header hides and each row stacks its cells
 *   caption - the last row is the table's caption, shown under it in small muted type
 *   sr-caption - the last row is the table's caption, read by screen readers only
 *   row-heads - the first cell of each row heads that row (th scope="row")
 *   fill-in - a template to fill in: fixed layout, the first two columns 26% and 22%, empty
 *   rows keep their height (one article)
 *   span-first - a row one cell short continues the first-column cell above it (a merged
 *   cell spanning rows), instead of spanning its last cell
 *   mono-head - the design system's own table (v3 .table): mono uppercase headers, the first
 *   column in ink, at least 36rem wide so phones scroll it
 *   compact - with mono-head: no minimum width
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const srCaption = block.classList.contains('sr-caption');
  const captionRow = (srCaption || block.classList.contains('caption')) && rows.length > 1 ? rows.pop() : null;
  const rowHeads = block.classList.contains('row-heads');
  const spanFirst = block.classList.contains('span-first');
  let spanning = null;
  const cols = Math.max(...rows.map((row) => row.children.length));
  const table = document.createElement('table');
  table.className = 'data-table-table';
  const head = document.createElement('thead');
  const body = document.createElement('tbody');
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    const cells = [...row.children];
    const continues = spanFirst && i > 0 && spanning && cells.length === cols - 1;
    if (continues) spanning.rowSpan += 1;
    cells.forEach((cell, j) => {
      const heads = i === 0 || (rowHeads && j === 0 && !continues);
      const td = document.createElement(heads ? 'th' : 'td');
      if (heads) td.scope = i === 0 ? 'col' : 'row';
      const short = !continues && j === cells.length - 1 && cells.length < cols;
      if (short) td.colSpan = cols - cells.length + 1;
      if (spanFirst && i > 0 && j === 0 && !continues) spanning = td;
      td.append(...cell.childNodes);
      tr.append(td);
    });
    (i === 0 ? head : body).append(tr);
  });
  if (captionRow) {
    const caption = document.createElement('caption');
    if (srCaption) caption.className = 'sr-only';
    caption.append(...[...captionRow.children].flatMap((cell) => [...cell.childNodes]));
    table.append(caption);
  }
  table.append(head, body);
  const wrap = document.createElement('div');
  wrap.className = 'data-table-scroll';
  wrap.append(table);
  block.replaceChildren(wrap);
}
