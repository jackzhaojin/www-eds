/**
 * Switch: two (or more) modes of one explainer behind a radio switch (the explainer kit's
 * two-way switch, as in the bar placement). One row per mode: the first cell is the switch
 * label, the next cells are the mode's columns. A single-cell row before the modes names the
 * switch for assistive tech (not shown); a single-cell row after them is the caption.
 *
 * In a column: a short paragraph before a code block or an image is its label; the last
 * paragraph after an image is the console line, with one line per error when it has line
 * breaks, or a passing note when it has none. Labels host their authored paragraph, so a
 * switch option is a focusable element with role="radio", not a <button> (EW7).
 *
 * Code marks: a list right after a code block whose items read "mark: text", "add: text" or
 * "note: text" colors those runs of the code, in order, each at its first match after the
 * previous one (mark = the thing discussed, add = what was added, note = an annotation).
 *
 * @variants (none)
 * @ew-exempt <ul> code marks, <p> switch name - text-as-metadata, never displayed
 */

const MARK = /^(mark|add|note):\s?(.+)$/;

/** Wraps the listed runs of the code in mark spans; the code's text is unchanged. */
function applyMarks(pre, list) {
  const marks = [...list.children].map((li) => MARK.exec(li.textContent.replace(/\u00a0/g, ' ')));
  if (!marks.length || marks.some((m) => !m)) return false;
  const host = pre.querySelector('code') || pre;
  const text = host.textContent;
  const runs = [];
  let from = 0;
  marks.forEach(([, kind, run]) => {
    const at = text.indexOf(run, from);
    if (at < 0) return;
    runs.push([at, at + run.length, kind]);
    from = at + run.length;
  });
  const nodes = [];
  let last = 0;
  runs.forEach(([start, end, kind]) => {
    nodes.push(text.slice(last, start));
    const span = document.createElement('span');
    span.className = `code-${kind}`;
    span.textContent = text.slice(start, end);
    nodes.push(span);
    last = end;
  });
  nodes.push(text.slice(last));
  host.replaceChildren(...nodes);
  return true;
}

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

/** Wraps each line of a paragraph in a block span, breaks kept between (presentation only). */
function splitLines(p) {
  const out = [];
  let span = document.createElement('span');
  [...p.childNodes].forEach((n) => {
    if (n.nodeName === 'BR') {
      out.push(span, n);
      span = document.createElement('span');
    } else span.append(n);
  });
  out.push(span);
  p.replaceChildren(...out);
}

function decorateColumn(cell) {
  const col = document.createElement('div');
  col.className = 'switch-col';
  const nodes = [...cell.children];
  nodes.forEach((el, i) => {
    const next = nodes[i + 1];
    const prev = nodes[i - 1];
    const media = el.querySelector('picture, img');
    if (el.matches('ul, ol') && prev && prev.matches('pre') && applyMarks(prev, el)) {
      [...col.querySelectorAll('.switch-code')].pop()?.append(slot('switch-marks', [el]));
    } else if (el.matches('pre')) col.append(slot('switch-code', [el]));
    else if (media) col.append(slot('switch-shot', [el]));
    else if (el.tagName === 'P' && next && (next.matches('pre') || next.querySelector('picture, img'))) {
      col.append(slot('switch-label', [el]));
    } else if (el.tagName === 'P' && col.querySelector('.switch-shot')) {
      const errors = el.querySelector('br');
      if (errors) splitLines(el);
      col.append(slot(errors ? 'switch-console' : 'switch-ok', [el]));
    } else col.append(el);
  });
  return col;
}

export default function decorate(block) {
  const group = document.createElement('div');
  group.className = 'switch-options';
  group.setAttribute('role', 'radiogroup');
  const modes = [];
  let caption = null;
  let name = null;

  [...block.querySelectorAll(':scope > div')].forEach((row, i) => {
    const cells = [...row.children];
    if (cells.length === 1 && !modes.length && !name) {
      name = document.createElement('div');
      name.className = 'switch-name';
      name.hidden = true;
      name.append(...cells[0].children);
      group.setAttribute('aria-label', name.textContent.trim());
      return;
    }
    if (cells.length === 1) {
      caption = document.createElement('figcaption');
      caption.append(...cells[0].children);
      return;
    }
    const option = document.createElement('div');
    option.className = 'switch-option';
    option.setAttribute('role', 'radio');
    option.dataset.mode = i;
    option.append(...cells[0].children);
    group.append(option);
    const mode = document.createElement('div');
    mode.className = 'switch-mode';
    mode.dataset.mode = i;
    const grid = document.createElement('div');
    grid.className = 'switch-grid';
    cells.slice(1).forEach((c) => grid.append(decorateColumn(c)));
    mode.append(grid);
    modes.push(mode);
  });

  const options = [...group.children];
  const set = (mode) => {
    options.forEach((o) => {
      const on = o.dataset.mode === mode;
      o.setAttribute('aria-checked', String(on));
      o.tabIndex = on ? 0 : -1;
    });
    modes.forEach((m) => { m.hidden = m.dataset.mode !== mode; });
    block.classList.remove('is-live');
    // restart the stamp animation on the marks that mode adds
    block.getBoundingClientRect();
    block.classList.add('is-live');
  };
  options.forEach((o, i) => {
    o.addEventListener('click', () => set(o.dataset.mode));
    o.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = options[(i + 1) % options.length];
        set(n.dataset.mode);
        n.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        set(o.dataset.mode);
      }
    });
  });

  const figure = document.createElement('figure');
  figure.className = 'switch-frame';
  if (name) figure.append(name);
  figure.append(group, ...modes);
  if (caption) figure.append(caption);
  block.replaceChildren(figure);
  if (options.length) set(options[0].dataset.mode);
}
