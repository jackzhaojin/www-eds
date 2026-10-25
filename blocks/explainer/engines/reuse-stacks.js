/**
 * Explainer (reuse-stacks): "Rebuild or reuse", the four patterns of "Reusable AI Development
 * Modules" as stacks. Each pattern sits on the ones before it; "rebuild" counts every box as
 * its own build, "reuse" builds each piece once and has every pattern above use it.
 *
 * Rows, read by content:
 * - bar: the first one-cell row, the label paragraph;
 * - picks: a label paragraph, then a list of the two modes in this order: rebuild, reuse;
 * - pieces: two cells: an ordered list of the patterns, the bottom one first | a list of the
 *   two box notes in this order: built, reused;
 * - static: a one-cell row with one paragraph, the result shown without JavaScript;
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants reuse-stacks
 * @ew-exempt <ol> pieces and <ul> box notes - data, drawn as the stacks; the static result -
 *   the no-JavaScript fallback, hidden once the engine draws the live count
 */

const txt = (el) => (el ? el.textContent.trim() : '');

function classify(rows) {
  const parts = {};
  const rest = [];
  rows.forEach((cells, i) => {
    const [a] = cells;
    if (cells.length === 2 && a.querySelector('ol')) parts.pieces = cells;
    else if (a.querySelector('ul, ol') && a.querySelector('p')) parts.picks = a;
    else if (i === 0) parts.bar = a;
    else rest.push(a);
  });
  parts.caption = rest.pop();
  [parts.staticRow] = rest;
  return parts;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const parts = classify(rows(block));
  const frame = slot('lab ru');
  if (parts.bar) {
    const bar = slot('lab__bar', [...parts.bar.children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const body = slot('ru-body');
  frame.append(body);

  let options = [];
  if (parts.picks) {
    const list = parts.picks.querySelector('ul, ol');
    const label = [...parts.picks.children].filter((el) => el !== list);
    const group = slot('ru-picks', [list]);
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', txt(label[0]));
    list.setAttribute('role', 'none');
    options = [...list.children];
    options.forEach((li) => li.setAttribute('role', 'radio'));
    body.append(slot('ru-live', [slot('ru-label', label), group]));
  }

  const stage = slot('ru-stage');
  const out = slot('ru-out', [document.createElement('p')]);
  out.setAttribute('aria-live', 'polite');
  body.append(stage, out);
  if (parts.staticRow) body.append(slot('ru-static', [...parts.staticRow.children]));

  let names = [];
  let notes = ['built here', 'reused'];
  const data = slot('ru-data');
  if (parts.pieces) {
    const [pieces, tags] = parts.pieces;
    names = [...pieces.querySelectorAll('li')].map(txt);
    const tagItems = [...tags.querySelectorAll('li')].map(txt);
    if (tagItems.length >= 2) notes = tagItems;
    data.append(...pieces.children, ...tags.children);
  }
  frame.append(data);
  if (parts.caption) frame.append(slot('x-caption ru-caption', [...parts.caption.children]));
  block.replaceChildren(frame);
  if (!names.length || options.length < 2) return;

  let mode = 0; // 0 rebuild, 1 reuse
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function render() {
    let built = 0;
    const firstBuilt = new Set();
    const cols = names.map((top, i) => {
      const stack = el('ol', 'ru-stack');
      // A pattern is its own piece plus every piece below it, top first.
      for (let k = i; k >= 0; k--) {
        let kind;
        if (mode === 0) {
          kind = 'built';
          built += 1;
        } else if (!firstBuilt.has(k)) {
          kind = 'built';
          firstBuilt.add(k);
          built += 1;
        } else kind = 'used';
        const box = el('li', `ru-box ru-box-${kind}`);
        box.dataset.piece = String(k + 1);
        box.append(el('span', '', names[k]), el('small', '', kind === 'built' ? notes[0] : notes[1]));
        stack.append(box);
      }
      const col = el('div', 'ru-col');
      col.append(el('p', 'ru-head', top), stack);
      return col;
    });
    stage.replaceChildren(...cols);
    const n = names.length;
    out.firstChild.textContent = mode === 0
      ? `${built} pieces built across the ${n === 4 ? 'four' : n} patterns. ${names[0]} alone is built ${n} times, once inside every pattern.`
      : `${built} pieces built, each one once. Every pattern above the first reuses the one below it, so ${names[0].charAt(0).toLowerCase()}${names[0].slice(1)} is built once and used ${n} times.`;
    options.forEach((o, i) => {
      o.setAttribute('aria-checked', String(i === mode));
      o.tabIndex = i === mode ? 0 : -1;
    });
  }

  options.forEach((o, i) => {
    o.addEventListener('click', () => {
      mode = i;
      render();
    });
    o.addEventListener('keydown', (e) => {
      const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        o.click();
        return;
      }
      if (!d) return;
      e.preventDefault();
      const next = options[(i + d + options.length) % options.length];
      next.click();
      next.focus();
    });
  });
  block.classList.add('is-live');
  render();
}
