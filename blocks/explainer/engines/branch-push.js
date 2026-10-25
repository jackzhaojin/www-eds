/**
 * Explainer engine "branch-push": which GitHub Actions workflow a push to a branch runs, and
 * where the build lands (the branch lab of "AI-coded Next.js agent: CI/CD and infrastructure").
 * Pick a branch; each workflow lane shows whether it runs and its steps.
 *
 * Rows:
 * - first row, one cell: the bar (a label paragraph, the source link paragraph);
 * - the grid row, two cells:
 *   left: the branch picker label paragraph, an italic paragraph that names the picker for
 *   assistive tech (not shown), the verdict label paragraph, then the verdict shown without
 *   JavaScript;
 *   right: one lane per workflow: an h3 (the workflow name, then its file in italics), the
 *   trigger paragraph and the steps list shown without JavaScript;
 * - one row per branch, a cell per lane plus two: the branch label (bold = picked first), one
 *   cell per lane in the lanes' order (the trigger paragraph, then the steps that run; no list =
 *   the lane does not run; a step with an italic run is the step that fails, the italics are its
 *   log, and the steps after it are skipped), then the where-it-lands paragraph;
 * - last row, one cell: the caption.
 *
 * @variants (none)
 * @ew-exempt <p> picker name - text-as-metadata, never displayed
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
  frame.className = 'lab br';
  const meta = slot('br-meta');
  const barCell = all[0]?.length === 1 ? all[0][0] : null;
  const last = all[all.length - 1];
  const capCell = all.length > 1 && last.length === 1 ? last[0] : null;
  const gridRow = all.find((r) => r.length === 2);
  const scenarios = all.filter((r) => r.length > 2);

  if (barCell) {
    const bar = slot('lab__bar', [...barCell.children]);
    plainLinks(bar);
    frame.append(bar);
  }

  const left = slot('lab__left');
  const right = slot('lab__right');
  const chips = slot('chips');
  const verdict = slot('verdict');
  verdict.setAttribute('aria-live', 'polite');
  const lanes = [];
  if (gridRow) {
    const [l, r] = gridRow;
    const labels = [];
    const statics = [];
    [...l.children].forEach((el) => {
      if (isName(el)) {
        chips.setAttribute('aria-label', el.textContent.trim());
        meta.append(el);
      } else if (labels.length < 2) labels.push(el);
      else statics.push(el);
    });
    if (labels[0]) left.append(slot('lab__label', [labels[0]]));
    left.append(chips);
    if (labels[1]) left.append(slot('lab__label', [labels[1]]));
    verdict.append(slot('br-static', statics));
    left.append(verdict);

    const laneBox = slot('br__lanes');
    let lane = null;
    [...r.children].forEach((el) => {
      if (/^H[2-6]$/.test(el.tagName)) {
        lane = { el: slot('br__lane', [slot('br-head', [el])]), stat: slot('br-static'), runs: [] };
        lane.el.append(lane.stat);
        lanes.push(lane);
        laneBox.append(lane.el);
      } else if (lane) lane.stat.append(el);
    });
    right.append(laneBox);
  }

  const options = [];
  const lands = [];
  let first = 0;
  scenarios.forEach((cells, s) => {
    const [label, ...rest] = cells;
    const land = rest.pop();
    const option = slot('br-option', [...label.children]);
    if (option.querySelector('strong')) first = s;
    chips.append(option);
    options.push(option);
    lanes.forEach((ln, i) => {
      const run = slot('br-run', rest[i] ? [...rest[i].children] : []);
      const steps = run.querySelector('ol, ul');
      let state = 'idle';
      if (steps) {
        const items = [...steps.children];
        const fail = items.findIndex((li) => li.querySelector('em'));
        state = fail > -1 ? 'failed' : 'ran';
        if (fail > -1) run.dataset.fail = String(fail + 1);
      }
      run.dataset.state = state;
      ln.runs.push(run);
      ln.el.append(run);
    });
    const landSlot = slot('br-land', land ? [...land.children] : []);
    lands.push(landSlot);
    verdict.append(landSlot);
  });

  let check = () => {};
  const pick = (i) => {
    check(i);
    lanes.forEach((ln) => {
      ln.runs.forEach((run, j) => { run.classList.toggle('is-on', i === j); });
      ln.el.dataset.state = ln.runs[i] ? ln.runs[i].dataset.state : 'idle';
    });
    lands.forEach((d, j) => d.classList.toggle('is-on', i === j));
  };
  check = radioGroup(chips, options, pick);

  const grid = slot('lab__grid', [left, right]);
  frame.append(grid);
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
