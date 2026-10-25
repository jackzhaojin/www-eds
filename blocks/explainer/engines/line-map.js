/**
 * Explainer (line-map): where a long file first names each of its references, as a bar of its
 * lines with a mark per reference (the CDD SKILL.md line map in "Adobe's EDS skills,
 * hands-on"). The bar is drawn from the list, so editing a line number moves its mark.
 *
 * Rows, read by content:
 * - description: the first one-cell row, one paragraph: what the bar shows, for assistive tech;
 * - legend: a list of two items, the shaded opening lines | a reference mark;
 * - references: an ordered list, each item the line number in bold, then what it names;
 * - settings: a list of "name: number" items: lines (the file's length), first (the end of
 *   the shaded opening);
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants line-map
 * @ew-exempt the description - the bar's accessible name; the settings - data
 */

const txt = (el) => (el ? el.textContent.trim() : '');
const isSettings = (cell) => {
  const items = [...cell.querySelectorAll('li')];
  return items.length && items.every((li) => /^\s*[a-z ]+:\s*\d+\s*$/i.test(li.textContent));
};

export default async function engine(block, { slot, rows }) {
  const frame = slot('lm-frame');
  const data = slot('lm-data');
  const bar = slot('lm-bar');
  bar.setAttribute('role', 'img');
  frame.append(bar);
  let list = null;
  let description = null;
  let caption = null;
  rows(block).forEach(([a], i) => {
    if (!a) return;
    if (a.querySelector('ol')) {
      list = a.querySelector('ol');
      frame.append(slot('lm-list', [...a.children]));
    } else if (a.querySelector('ul') && isSettings(a)) data.append(...a.children);
    else if (a.querySelector('ul')) frame.append(slot('lm-legend', [...a.children]));
    else if (i === 0) description = a;
    else caption = a;
  });
  if (description) {
    bar.setAttribute('aria-label', txt(description));
    data.append(...description.children);
  }
  frame.append(data);
  if (caption) frame.append(slot('x-caption lm-caption', [...caption.children]));
  block.replaceChildren(frame);
  if (!list) return;

  const set = {};
  data.querySelectorAll('li').forEach((li) => {
    const m = /^\s*([a-z ]+?)\s*:\s*(\d+)/i.exec(li.textContent);
    if (m) set[m[1].toLowerCase()] = +m[2];
  });
  const lines = set.lines || 0;
  if (!lines) return;
  const pct = (n) => `${Math.round((n / lines) * 1000) / 10}%`;
  const first = document.createElement('span');
  first.className = 'lm-first';
  first.style.setProperty('--w', pct(set.first || 0));
  bar.append(first);
  [...list.children].forEach((li) => {
    const n = parseInt(txt(li.querySelector('strong')) || txt(li), 10);
    if (!n) return;
    const mark = document.createElement('i');
    mark.style.setProperty('--x', pct(n));
    bar.append(mark);
  });
}
