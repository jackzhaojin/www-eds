/**
 * Explainer (theme-swap): the token swap lab of "Theming EDS with Google Stitch". Each switch
 * swaps one group of values (colors, fonts, buttons) between the boilerplate (before commit
 * d6355ee) and the Stitch theme (after it) on a half-size teaser page, and marks the active
 * value in the token table. The preview's values are the real ones from styles.css; they live
 * in theme-swap.css, as in the source.
 *
 * Rows, read by content:
 * - bar: the first row, one cell: the label paragraph, then the source link paragraph;
 * - switches: a one-cell row with the list of the three switch labels, in this order: colors,
 *   fonts, buttons;
 * - preview: two cells: the page (title paragraph, intro paragraph, closing paragraph; inline
 *   code reads as code, underline as a link) | the teaser (eyebrow, heading, body paragraphs,
 *   then a list of the two button labels, primary first);
 * - table head: three cells, the column names (token, boilerplate, theme);
 * - tokens: one row per token, four cells: the token | the boilerplate value | the theme value
 *   | its group (colors, fonts or buttons); a hex value gets a swatch, "none" reads as absent;
 * - note: the last one-cell row, the note for the finished theme (all switches on).
 *
 * @variants theme-swap
 * @ew-exempt the token groups - data; the note - derived for the other switch states
 */
import { loadCSS } from '../../../scripts/aem.js';

// the extra faces the source page loads for this lab (boilerplate and Stitch fonts)
const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@700&family=Roboto:wght@400;500&family=Roboto+Condensed:wght@700&family=Source+Sans+3:wght@400;600&display=swap';
const GROUPS = ['colors', 'fonts', 'buttons'];
const CLASS = { colors: 'c-after', fonts: 'f-after', buttons: 'b-after' };
const txt = (el) => (el ? el.textContent.trim() : '');

function classify(rows) {
  const parts = { tokens: [] };
  const single = [];
  rows.forEach((cells, i) => {
    const [a] = cells;
    if (cells.length === 4) parts.tokens.push(cells);
    else if (cells.length === 3) parts.head = cells;
    else if (cells.length === 2) parts.preview = cells;
    else if (i === 0) parts.bar = a;
    else if (a.querySelector('ul') && !parts.switches) parts.switches = a;
    else single.push(a);
  });
  parts.note = single.pop();
  return parts;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  loadCSS(FONTS);
  const parts = classify(rows(block));
  const frame = slot('lab tkl');
  if (parts.bar) {
    const bar = slot('lab__bar', [...parts.bar.children]);
    plainLinks(bar);
    frame.append(bar);
  }

  let toggles = [];
  if (parts.switches) {
    const list = parts.switches.querySelector('ul');
    const group = slot('tkl-toggles', [...parts.switches.children]);
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Stitch theme groups');
    list.setAttribute('role', 'none');
    toggles = [...list.children].slice(0, 3).map((li, i) => {
      li.setAttribute('role', 'switch');
      li.tabIndex = 0;
      li.dataset.group = GROUPS[i];
      return li;
    });
    frame.append(slot('tkl-controls', [group]));
  }

  const left = slot('lab__left');
  const right = slot('lab__right');
  frame.append(slot('lab__grid', [left, right]));

  // the preview page: title, intro, the teaser, closing line
  const page = slot('tkl-page c-after f-after b-after');
  if (parts.preview) {
    const [pageCell, teaserCell] = parts.preview;
    const ps = [...pageCell.children];
    const [title, intro] = ps;
    const rest = ps.slice(2);
    const tps = [...teaserCell.children];
    const ctas = tps.find((el) => el.matches('ul, ol'));
    const [eyebrow, heading, ...body] = tps.filter((el) => el !== ctas);
    const text = slot('tkl-text', [
      slot('tkl-eyebrow', eyebrow ? [eyebrow] : []),
      slot('tkl-h2', heading ? [heading] : []),
      slot('tkl-p', body),
      slot('tkl-ctas', ctas ? [ctas] : []),
    ]);
    page.append(
      slot('tkl-h1', title ? [title] : []),
      slot('tkl-p', intro ? [intro] : []),
      slot('tkl-teaser', [slot('tkl-visual'), text]),
      slot('tkl-p', rest),
    );
  }
  left.append(page);

  // the token table: the authored cells move into a table
  const table = document.createElement('table');
  if (parts.head) {
    const tr = document.createElement('tr');
    parts.head.forEach((cell) => {
      const th = document.createElement('th');
      th.append(...cell.children);
      tr.append(th);
    });
    const thead = document.createElement('thead');
    thead.append(tr);
    table.append(thead);
  }
  const tbody = document.createElement('tbody');
  const data = slot('tkl-data');
  parts.tokens.forEach(([token, before, after, group]) => {
    const tr = document.createElement('tr');
    tr.dataset.g = txt(group).toLowerCase();
    [token, before, after].forEach((cell, i) => {
      const td = document.createElement('td');
      const value = txt(cell);
      if (i && /^#[0-9a-f]{3,8}$/i.test(value)) {
        const swatch = document.createElement('i');
        swatch.style.setProperty('--c', value);
        td.append(swatch);
      }
      if (i && /^none$/i.test(value)) td.className = 'tkl-none';
      td.append(...cell.children);
      tr.append(td);
    });
    data.append(...group.children);
    tbody.append(tr);
  });
  table.append(tbody);
  right.append(slot('tkl-table', [table]));
  let note = null;
  if (parts.note) {
    note = parts.note.querySelector('p');
    const box = slot('tkl-note', [...parts.note.children]);
    box.setAttribute('aria-live', 'polite');
    right.append(box);
  }
  frame.append(data);
  block.replaceChildren(frame);
  if (toggles.length < 3) return;

  const finished = txt(note);
  const state = { colors: true, fonts: true, buttons: true };
  function render() {
    GROUPS.forEach((g) => page.classList.toggle(CLASS[g], state[g]));
    toggles.forEach((t) => t.setAttribute('aria-checked', String(state[t.dataset.group])));
    tbody.querySelectorAll('tr').forEach((tr) => { tr.dataset.on = state[tr.dataset.g] ? 'after' : 'before'; });
    const on = GROUPS.filter((g) => state[g]);
    const off = GROUPS.filter((g) => !state[g]);
    if (!note) return;
    if (on.length === 3) note.textContent = finished;
    else if (!on.length) note.textContent = 'All boilerplate: the site as it looked before the commit.';
    else note.textContent = `Stitch ${on.join(' and ')}, boilerplate ${off.join(' and ')}.`;
  }
  toggles.forEach((t) => {
    const flip = () => {
      state[t.dataset.group] = !state[t.dataset.group];
      render();
    };
    t.addEventListener('click', flip);
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      flip();
    });
  });
  table.classList.add('is-live');
  block.classList.add('is-live');
  render();
}
