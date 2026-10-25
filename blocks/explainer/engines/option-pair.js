/**
 * Explainer engine "option-pair": compare any two options of the option-matrix tables on the
 * same page, row by row, with the rows that differ marked (the seven AEM capabilities
 * article). The data is read from those tables, so the comparison never drifts from them.
 *
 * Rows:
 * - the controls: the first picker's label | the second picker's label | the "only rows that
 *   differ" label;
 * - one three-cell row per option: its column label in the matrix | its name in the pickers |
 *   its short name (column heads and the summary). The two options whose picker names are bold
 *   are the ones the comparison opens on;
 * - one two-cell row per group, in display order: the group word that ends a matrix caption |
 *   the compared table's caption;
 * - single-cell rows, in order: the summary ({differ}, {total}, {a}, {b}), the summary when
 *   both sides are the same option, the tag on a differing row, the note after a "Same" cell
 *   ({value} is the first option's value), the caption.
 *
 * Behaviour: the compared tables and the summary are derived from the matrix tables.
 *
 * @variants option-pair
 * @ew-exempt the option rows' matrix labels and short names, the group words and captions, the
 *   summary, tag and note templates - read by the engine
 */
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));
const norm = (s) => s.replace(/\s+/g, ' ').trim();

/** The inline content of a cell (a decorated table cell or an undecorated block cell), with
 * the classes decoration may have added (text links) left out. */
function cellHtml(cell) {
  const p = cell.querySelector('p');
  const copy = (p || cell).cloneNode(true);
  copy.querySelectorAll('[class], [data-prose-index]').forEach((n) => {
    n.removeAttribute('class');
    n.removeAttribute('data-prose-index');
  });
  return norm(copy.innerHTML);
}

/** The matrix tables' data, whether their blocks are decorated yet or not. */
function readMatrices() {
  return [...document.querySelectorAll('.explainer.option-matrix')].map((block) => {
    const table = block.querySelector('table');
    let caption = '';
    let head = [];
    let body = [];
    if (table) {
      caption = table.caption ? table.caption.textContent : '';
      head = table.tHead ? [...table.tHead.rows[0].cells] : [];
      body = table.tBodies[0] ? [...table.tBodies[0].rows].map((r) => [...r.cells]) : [];
    } else {
      const rs = [...block.querySelectorAll(':scope > div')].map((r) => [...r.children]);
      const cap = rs.find((r) => r.length === 1);
      caption = cap ? cap[0].textContent : '';
      const multi = rs.filter((r) => r.length > 1);
      [head = [], ...body] = multi;
    }
    const group = norm(caption).split(':').pop().trim()
      .toLowerCase();
    return {
      group,
      head: head.map((c) => norm(c.textContent)),
      body: body.map((cells) => ({ feature: norm(cells[0].textContent), cells: cells.slice(1).map(cellHtml) })),
    };
  });
}

function labelled(cls, nodes, control) {
  const label = document.createElement('label');
  label.className = cls;
  label.append(...nodes, control);
  return label;
}

export default async function engine(block, { slot, rows }) {
  const all = rows(block);
  const [controlRow] = all;
  if (!controlRow) return;
  const optionRows = all.filter((r) => r.length === 3).slice(1);
  const groupRows = all.filter((r) => r.length === 2);
  const singles = all.filter((r) => r.length === 1).map((r) => r[0]);
  const text = (cell) => (cell ? norm(cell.textContent) : '');
  const [summaryT, sameT, tagT, noteT] = singles.slice(0, 4).map(text);
  const captionCell = singles[4];

  const options = optionRows.map((cells) => ({
    label: text(cells[0]), pick: text(cells[1]), short: text(cells[2]), opening: !!cells[1].querySelector('strong, b'),
  }));
  const groups = groupRows.map((cells) => ({ word: text(cells[0]).toLowerCase(), caption: text(cells[1]) }));

  // the matrix data, keyed by option label
  const matrices = readMatrices();
  const rowsByGroup = {};
  let featureHead = '';
  matrices.forEach((m) => {
    if (!featureHead) [featureHead] = m.head;
    const list = rowsByGroup[m.group] || [];
    rowsByGroup[m.group] = list;
    m.body.forEach((r) => {
      let row = list.find((x) => x.feature === r.feature);
      if (!row) {
        row = { feature: r.feature, cells: {} };
        list.push(row);
      }
      r.cells.forEach((html, i) => { row.cells[m.head[i + 1]] = html; });
    });
  });
  const first = options[0] ? options[0].label : '';

  // controls
  const selA = document.createElement('select');
  const selB = document.createElement('select');
  options.forEach((o) => {
    selA.add(new Option(o.pick, o.label));
    selB.add(new Option(o.pick, o.label));
  });
  const opening = options.filter((o) => o.opening);
  if (opening[0]) selA.value = opening[0].label;
  if (opening[1]) selB.value = opening[1].label;
  const only = document.createElement('input');
  only.type = 'checkbox';
  const [aCell, bCell, onlyCell] = controlRow;
  const controls = slot('mx__controls', [
    labelled('mx__pick', [slot('mx__pick-label', [...aCell.children])], selA),
    labelled('mx__pick', [slot('mx__pick-label', [...bCell.children])], selB),
    labelled('mx__only', [], only),
  ]);
  controls.lastElementChild.append(slot('mx__only-label', [...(onlyCell?.children || [])]));

  const summary = document.createElement('p');
  summary.className = 'mx__summary';
  summary.setAttribute('aria-live', 'polite');
  const out = slot('mx__out');

  const figure = document.createElement('figure');
  figure.className = 'mx';

  const short = (label) => (options.find((o) => o.label === label) || {}).short || label;
  const plainText = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent.trim();
  };
  const resolve = (row, key) => {
    const v = row.cells[key];
    return plainText(v || '') === 'Same' ? row.cells[first] : v;
  };

  function render() {
    const a = selA.value;
    const b = selB.value;
    let differ = 0;
    let total = 0;
    const tables = [];
    groups.forEach((g) => {
      const groupRows2 = rowsByGroup[g.word] || [];
      const table = document.createElement('table');
      table.className = 'mx__table';
      const cap = document.createElement('caption');
      cap.textContent = g.caption;
      const head = document.createElement('thead');
      const htr = document.createElement('tr');
      [featureHead, short(a), short(b)].forEach((t) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = t;
        htr.append(th);
      });
      head.append(htr);
      const body = document.createElement('tbody');
      groupRows2.forEach((r) => {
        const va = resolve(r, a) || '';
        const vb = resolve(r, b) || '';
        const same = plainText(va).toLowerCase() === plainText(vb).toLowerCase();
        total += 1;
        if (!same) differ += 1;
        if (only.checked && same) return;
        const tr = document.createElement('tr');
        if (!same) tr.className = 'is-diff';
        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = r.feature;
        if (!same) {
          const tag = document.createElement('span');
          tag.className = 'mx__tag';
          tag.textContent = tagT;
          th.append(tag);
        }
        tr.append(th);
        [r.cells[a] || '', r.cells[b] || ''].forEach((html) => {
          const td = document.createElement('td');
          td.innerHTML = html;
          if (plainText(html) === 'Same') {
            const note = document.createElement('span');
            note.className = 'mx__same';
            note.textContent = ` ${fill(noteT, { value: plainText(r.cells[first] || '') })}`;
            td.append(note);
          }
          tr.append(td);
        });
        body.append(tr);
      });
      table.append(cap, head, body);
      if (body.children.length) tables.push(table);
    });
    out.replaceChildren(...tables);
    summary.textContent = a === b ? sameT : fill(summaryT, {
      differ, total, a: short(a), b: short(b),
    });
    figure.dataset.differ = String(differ);
  }

  figure.append(controls, summary, out);
  if (captionCell) {
    const cap = document.createElement('figcaption');
    cap.append(...captionCell.children);
    figure.append(cap);
  }
  const sources = slot('mx__source', [
    ...optionRows.flatMap((cells) => [cells[0], cells[2]].flatMap((c) => [...c.children])),
    ...optionRows.flatMap((cells) => [...cells[1].children]),
    ...groupRows.flatMap((cells) => cells.flatMap((c) => [...c.children])),
    ...singles.slice(0, 4).flatMap((c) => [...c.children]),
  ]);
  figure.append(sources);
  block.replaceChildren(figure);

  [selA, selB, only].forEach((c) => c.addEventListener('change', render));
  render();
}
