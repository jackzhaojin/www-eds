/**
 * Explainer (retry-ladder): the failure ladder of the v2.1 continuous executive agent article.
 * Four outcomes for one goal on the failure path of src/core/executive-loop.ts at v2.1.4:
 * count the attempt, run the agentic diagnosis from the third failure, return early when the
 * diagnosis escalates or suggests a fix, and block at the retry limit otherwise. The log uses
 * the code's own messages.
 *
 * Rows, read by content:
 * - bar: the first row, one cell: the label paragraph, then the source link paragraph;
 * - outcomes: one row per outcome, five cells: the chip label | failed attempts (a number) |
 *   the diagnosis decision line (empty when no diagnosis runs) | how it ends (pass, blocked,
 *   escalated or running) | the verdict paragraph; the second outcome is shown on load;
 * - labels: two cells, the count label | the log label;
 * - legend: a one-cell row with the list of pip kinds (failed and retried, diagnosis ran,
 *   diagnosis suggested a fix, passed);
 * - settings: a one-cell row with a list of "name: number" items: limit, diagnosis (the
 *   failure from which the diagnosis runs);
 * - log: a one-cell row with the log as a code block, shown without JavaScript;
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants retry-ladder
 * @ew-exempt outcome numbers, decisions, endings and verdicts, settings - data, drawn as the
 *   count, pips, log and verdict; the static log - the no-JavaScript fallback
 */

const NUM = /^\d+$/;
const txt = (el) => (el ? el.textContent.trim() : '');

function classify(rows) {
  const parts = { outcomes: [] };
  const single = [];
  rows.forEach((cells, i) => {
    const [a, b] = cells;
    if (cells.length === 5 && NUM.test(txt(b))) parts.outcomes.push(cells);
    else if (cells.length === 2) parts.labels = cells;
    else if (i === 0) parts.bar = a;
    else if (a.querySelector('pre')) parts.log = a;
    else if (a.querySelector('ul') && [...a.querySelectorAll('li')].every((li) => /:\s*\d/.test(li.textContent))) parts.settings = a;
    else if (a.querySelector('ul')) parts.legend = a;
    else single.push(a);
  });
  parts.caption = single.pop();
  return parts;
}

function settingsOf(cell) {
  const out = {};
  cell?.querySelectorAll('li').forEach((li) => {
    const m = /^\s*([\w -]+?)\s*:\s*(\d+)/.exec(li.textContent);
    if (m) out[m[1].toLowerCase()] = +m[2];
  });
  return out;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const parts = classify(rows(block));
  const frame = slot('lab ladder');
  if (parts.bar) {
    const bar = slot('lab__bar', [...parts.bar.children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const data = slot('ladder-data');

  // outcomes: the chips, and the data behind each one
  const picks = slot('ladder-picks');
  picks.setAttribute('role', 'radiogroup');
  const outcomes = parts.outcomes.map(([label, fails, decision, end, verdict]) => {
    const chip = slot('ladder-chip', [...label.children]);
    chip.setAttribute('role', 'radio');
    picks.append(chip);
    const o = {
      chip, fails: +txt(fails), decision: txt(decision), end: txt(end).toLowerCase(), verdict: txt(verdict),
    };
    data.append(...fails.children, ...decision.children, ...end.children, ...verdict.children);
    return o;
  });
  if (outcomes.length) frame.append(picks);

  const left = slot('lab__left');
  const right = slot('lab__right');
  frame.append(slot('lab__grid', [left, right]));
  const [countLabel, logLabel] = parts.labels || [];
  if (countLabel) left.append(slot('lab__label', [...countLabel.children]));
  const countEl = document.createElement('b');
  const noteEl = document.createElement('span');
  left.append(slot('ladder-count', [countEl, noteEl]));
  const pipsEl = slot('ladder-pips');
  pipsEl.setAttribute('role', 'img');
  left.append(pipsEl);
  if (parts.legend) left.append(slot('ladder-legend', [...parts.legend.children]));
  const verdictEl = slot('verdict');
  verdictEl.setAttribute('aria-live', 'polite');
  left.append(verdictEl);

  if (logLabel) right.append(slot('lab__label', [...logLabel.children]));
  const logEl = document.createElement('pre');
  logEl.className = 'ladder-log';
  right.append(logEl);
  if (parts.log) right.append(slot('ladder-static', [...parts.log.children]));
  if (parts.settings) data.append(...parts.settings.children);
  frame.append(data);
  if (parts.caption) frame.append(slot('x-caption ladder-caption', [...parts.caption.children]));
  block.replaceChildren(frame);
  if (outcomes.length < 2) return;

  const set = settingsOf(data);
  const MAX_RETRIES = set.limit || 10; // executive-loop.ts line 95
  const DIAGNOSIS_AT = set.diagnosis || 3; // executive-loop.ts line 646
  picks.setAttribute('aria-label', 'What happens to the goal');
  for (let i = 0; i < MAX_RETRIES; i++) pipsEl.append(document.createElement('i'));

  function add(cls, text) {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = `${text}\n`;
    logEl.append(s);
  }

  function attempt(n, o) {
    add('d', 'PHASE 6: Update State (Failure)');
    add('x', `  Attempt ${n}/${MAX_RETRIES} failed`);
    if (n < DIAGNOSIS_AT) return;
    add('a', 'PHASE 7: Agentic Diagnosis (Investigate Failure)');
    add('a', `  ${o.decision}`);
  }

  function show(o) {
    outcomes.forEach((x) => {
      x.chip.setAttribute('aria-checked', String(x === o));
      x.chip.tabIndex = x === o ? 0 : -1;
    });
    logEl.textContent = '';
    for (let n = 1; n <= o.fails; n++) {
      // keep long runs readable: show the first three and the last one
      if (o.fails > 4 && n > DIAGNOSIS_AT && n < o.fails) {
        if (n === DIAGNOSIS_AT + 1) add('n', `  # attempts ${n} to ${o.fails - 1} repeat the same pattern`);
      } else attempt(n, o);
    }
    if (o.end === 'pass') {
      add('d', 'PHASE 6: Update State (Success)');
      add('ok', '  # step complete, Notion and Discord updated, next goal');
    } else if (o.end === 'blocked') {
      add('d', 'PHASE 8: Max Retries Reached (Constitution Limit)');
      add('x', `  Marking as blocked after ${MAX_RETRIES} attempts`);
    } else if (o.end === 'escalated') {
      add('n', '  # blocked with the diagnosis, Discord notified, next goal');
    } else {
      add('n', `  # returns early: the ${MAX_RETRIES}-attempt check below never runs`);
    }
    logEl.scrollTop = logEl.scrollHeight; // the ending is the point

    countEl.textContent = String(o.fails);
    const over = o.fails - MAX_RETRIES;
    noteEl.textContent = over > 0 ? `of ${MAX_RETRIES}, and ${over} past the limit` : `of ${MAX_RETRIES}, the limit in the constitution`;
    const fix = /fix/i.test(o.decision);
    [...pipsEl.children].forEach((pip, i) => {
      let k = '';
      if (i < o.fails) k = i < DIAGNOSIS_AT - 1 ? 'fail' : (fix ? 'fix' : 'diag');
      else if (i === o.fails && o.end === 'pass') k = 'pass';
      if (k) pip.dataset.k = k;
      else delete pip.dataset.k;
    });
    pipsEl.setAttribute('aria-label', `${o.fails} failed attempts${over > 0 ? `, ${over} past the limit` : ''}${o.end === 'pass' ? ', then a pass' : ''}`);
    const p = document.createElement('p');
    p.className = o.end === 'pass' ? 'ok' : 'no';
    p.textContent = o.verdict;
    verdictEl.replaceChildren(p);
  }

  outcomes.forEach((o, i) => {
    o.chip.addEventListener('click', () => show(o));
    o.chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(o);
        return;
      }
      const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = outcomes[(i + d + outcomes.length) % outcomes.length];
      show(next);
      next.chip.focus();
    });
  });
  block.classList.add('is-live');
  show(outcomes[1]);
}
