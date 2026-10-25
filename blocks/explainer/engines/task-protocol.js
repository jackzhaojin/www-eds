/**
 * Explainer engine "task-protocol": the Task Assignment Protocol applied to a request (the task
 * lab of "Scaling AI coding delivery"). Pick a request; each rule shows whether it passes, fails
 * or does not apply, and the outcome shows what the agent does and the commits the repo has.
 *
 * Rows:
 * - first row, one cell: the bar (a label paragraph, the source link paragraph);
 * - the grid row, two cells:
 *   left: the picker label paragraph, an italic paragraph that names the picker for assistive
 *   tech (not shown), then the rules list (each item: the bold line reference, then the rule);
 *   right: the outcome label paragraph, then the outcome shown without JavaScript;
 * - one row per request, three cells: the request label (bold = picked first), a list with one
 *   item per rule in the rules' order reading pass, fail or skip, then the outcome (a paragraph,
 *   then log paragraphs, then the commits list);
 * - last row, one cell: the caption.
 *
 * @variants (none)
 * @ew-exempt <p> picker name, <ul> rule states - text-as-metadata, never displayed
 */

const isName = (el) => el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
  && el.textContent.trim() === el.firstElementChild.textContent.trim();

function radioGroup(group, options, onPick) {
  group.setAttribute('role', 'radiogroup');
  options.forEach((o, i) => {
    o.setAttribute('role', 'radio');
    o.addEventListener('click', () => onPick(i));
    o.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const n = (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
        options[n].focus();
        onPick(n);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPick(i);
      }
    });
  });
  return (i) => options.forEach((o, j) => {
    o.setAttribute('aria-checked', String(i === j));
    o.tabIndex = i === j ? 0 : -1;
  });
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const all = rows(block);
  const frame = document.createElement('figure');
  frame.className = 'lab tl';
  const meta = slot('tl-meta');
  const barCell = all[0]?.length === 1 ? all[0][0] : null;
  const last = all[all.length - 1];
  const capCell = all.length > 1 && last.length === 1 ? last[0] : null;
  const gridRow = all.find((r) => r.length === 2);
  const requests = all.filter((r) => r.length > 2);

  if (barCell) {
    const bar = slot('lab__bar', [...barCell.children]);
    plainLinks(bar);
    frame.append(bar);
  }

  const left = slot('lab__left');
  const right = slot('lab__right');
  const chips = slot('chips');
  const rules = slot('tl__rules');
  const out = slot('verdict');
  out.setAttribute('aria-live', 'polite');
  if (gridRow) {
    const [l, r] = gridRow;
    [...l.children].forEach((el) => {
      if (isName(el)) {
        chips.setAttribute('aria-label', el.textContent.trim());
        meta.append(el);
      } else if (el.matches('ol, ul')) rules.append(el);
      else left.append(slot('lab__label', [el]));
    });
    left.append(chips, rules);
    const [label, ...statics] = [...r.children];
    if (label) right.append(slot('lab__label', [label]));
    out.append(slot('tl-static', statics));
    right.append(out);
  }

  const options = [];
  const states = [];
  const outs = [];
  let first = 0;
  requests.forEach(([label, stateCell, result], i) => {
    const option = slot('tl-option', [...label.children]);
    if (option.querySelector('strong')) first = i;
    chips.append(option);
    options.push(option);
    const list = stateCell.querySelector('ul, ol');
    states.push(list ? [...list.children].map((li) => li.textContent.trim().toLowerCase()) : []);
    meta.append(...stateCell.children);
    // the first paragraph leads; later paragraphs are log lines, lists are the commits
    const o = slot('tl-out', (result ? [...result.children] : []).map((el, k) => {
      if (el.matches('ul, ol')) return slot('tl-commits', [el]);
      return k > 0 && el.tagName === 'P' ? slot('tl-log', [el]) : el;
    }));
    outs.push(o);
    out.append(o);
  });

  let check = () => {};
  const pick = (i) => {
    check(i);
    [...rules.attributes].filter((a) => a.name.startsWith('data-r')).forEach((a) => rules.removeAttribute(a.name));
    states[i].forEach((s, k) => { rules.dataset[`r${k + 1}`] = s; });
    outs.forEach((o, j) => o.classList.toggle('is-on', i === j));
  };
  check = radioGroup(chips, options, pick);

  frame.append(slot('lab__grid', [left, right]));
  if (capCell) {
    const cap = document.createElement('figcaption');
    cap.append(...capCell.children);
    frame.append(cap);
  }
  frame.append(meta);
  plainLinks(frame);
  if (options.length) {
    frame.classList.add('is-live');
    pick(first);
  }
  block.replaceChildren(frame);
}
