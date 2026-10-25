/**
 * Explainer engine "task-loop": the order a build loop runs its tasks when a validator logs
 * defects as subtasks (the loop model of "From Prompts to Harness"). Set what the validator finds
 * on each task; the run order, the queue and the loop's log update at once.
 *
 * Rows, in this order:
 * 1. one cell: the bar (a label paragraph);
 * 2. two cells:
 *    left: the plan label, the planning agents list (in order), the tasks label, the tasks list
 *    (each item: the bold task, ending in its number, then what the validator finds on it
 *    first, one of the findings below), the findings list (no defects, one, two: the position
 *    is the number of defects), and an italic paragraph naming each task's finding switch for
 *    assistive tech ({n} is the task's number; not shown);
 *    right: the order label, then the run order, the queue and the log shown without
 *    JavaScript (a paragraph, a list, a code block);
 * 3. two cells: the log's line templates, a code block with one line each for: the plan
 *    ({plan}), the next task ({task}), defects found ({count}, {subtasks}), a subtask running
 *    first ({first}, {next}), a pass, the end of the run; then a paragraph for {next} when no
 *    task is left | the run order sentences ({order}, {subtasks}): with defects, without;
 * 4. one cell: the caption.
 *
 * @variants (none)
 * @ew-exempt the run order, the queue and the log are rewritten from the model; the finding
 *   switches repeat the findings list
 */

const isName = (el) => el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
  && el.textContent.trim() === el.firstElementChild.textContent.trim();
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
const KINDS = ['det', 'det', 'no', 'det', 'ok', 'det'];

export default async function engine(block, { slot, rows, reduceMotion }) {
  const [barRow, gridRow, tplRow, capRow] = rows(block);
  const frame = document.createElement('figure');
  frame.className = 'lab loop';
  const meta = slot('loop-meta');
  if (barRow) frame.append(slot('lab__bar', [...barRow[0].children]));

  const [l, r] = gridRow || [];
  const leftEls = [...(l ? l.children : [])];
  const lists = leftEls.filter((el) => el.matches('ol, ul'));
  const [plan, tasks, findings] = lists;
  const nameP = leftEls.find(isName);
  const nameTpl = nameP ? nameP.textContent.trim() : '';
  if (nameP) meta.append(nameP);
  if (findings) meta.append(findings);
  const findingLabels = findings ? [...findings.children].map((li) => li.textContent.trim()) : [];

  const left = slot('lab__left');
  leftEls.forEach((el) => {
    if (el === plan) left.append(slot('loop__plan', [el]));
    else if (el === tasks) left.append(slot('loop__tasks', [el]));
    else if (el.tagName === 'P' && !isName(el)) left.append(slot('lab__label', [el]));
  });

  const rightEls = [...(r ? r.children : [])];
  const right = slot('lab__right');
  const resultP = rightEls.find((el, i) => i > 0 && el.tagName === 'P');
  const queueList = rightEls.find((el) => el.matches('ol, ul'));
  const logPre = rightEls.find((el) => el.matches('pre'));
  if (rightEls[0] && rightEls[0] !== resultP) right.append(slot('lab__label', [rightEls[0]]));
  const resultBox = slot('loop__result', resultP ? [resultP] : []);
  resultBox.setAttribute('aria-live', 'polite');
  const queueBox = slot('loop__queue', queueList ? [queueList] : []);
  const logBox = slot('loop__log', logPre ? [logPre] : []);
  right.append(resultBox, queueBox, logBox);

  const [logCell, resultCell] = tplRow || [];
  const tplPre = logCell ? logCell.querySelector('pre') : null;
  const lineTpl = tplPre ? tplPre.textContent.replace(/\n$/, '').split('\n') : [];
  const endsP = logCell ? [...logCell.children].find((el) => el.tagName === 'P') : null;
  const runEnds = endsP ? endsP.textContent.trim() : '';
  const resultTpl = resultCell ? [...resultCell.children].map((p) => p.textContent.trim()) : [];
  [logCell, resultCell].forEach((c) => c && meta.append(...c.children));

  frame.append(slot('lab__grid', [left, right]));
  if (capRow) {
    const cap = document.createElement('figcaption');
    cap.append(...capRow[0].children);
    frame.append(cap);
  }
  frame.append(meta);

  // the model
  const planNames = plan ? [...plan.children].map((li) => li.textContent.trim()) : [];
  const defects = {};
  const ids = [];
  const reduce = reduceMotion();
  const queueHost = queueList || document.createElement('ol');
  const host = logPre ? (logPre.querySelector('code') || logPre) : null;

  const run = (changed) => {
    const queue = [...ids];
    const lines = [[fill(lineTpl[0] || '', { plan: planNames.join(', ') }), KINDS[0]]];
    const subs = [];
    for (let pos = 0; pos < queue.length; pos++) {
      const t = queue[pos];
      lines.push([fill(lineTpl[1] || '', { task: t }), KINDS[1]]);
      const n = t.includes('.') ? 0 : (defects[t] || 0);
      if (n > 0) {
        const fresh = Array.from({ length: n }, (_, i) => `${t}.${i + 1}`);
        queue.splice(pos + 1, 0, ...fresh);
        subs.push(...fresh);
        lines.push([fill(lineTpl[2] || '', { count: findingLabels[n] || n, subtasks: fresh.join(' and ') }), KINDS[2]]);
        const nextPlanned = queue.slice(pos + 1).find((q) => !q.includes('.'));
        lines.push([fill(lineTpl[3] || '', { first: fresh[0], next: nextPlanned || runEnds }), KINDS[3]]);
      } else {
        lines.push([lineTpl[4] || '', KINDS[4]]);
      }
    }
    lines.push([lineTpl[5] || '', KINDS[5]]);
    queueHost.replaceChildren(...queue.map((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      li.classList.add('done');
      if (t.includes('.')) li.classList.add('sub');
      if (changed && subs.includes(t) && !reduce) li.classList.add('new');
      return li;
    }));
    if (host) {
      host.replaceChildren(...lines.map(([text, cls]) => {
        const span = document.createElement('span');
        span.className = cls;
        span.textContent = text;
        return span;
      }));
    }
    if (resultP) {
      resultP.textContent = fill(subs.length ? resultTpl[0] || '' : resultTpl[1] || '', { order: queue.join(', '), subtasks: subs.join(', ') });
    }
  };

  // one finding switch per task
  (tasks ? [...tasks.children] : []).forEach((li) => {
    const label = li.querySelector('strong, b');
    const id = label ? (/(\d+(?:\.\d+)*)\s*$/.exec(label.textContent.trim()) || [])[1] : null;
    if (!id) return;
    ids.push(id);
    // the starting finding is the text after the label
    const setting = document.createElement('span');
    setting.className = 'loop__setting';
    [...li.childNodes].filter((n) => n !== label).forEach((n) => setting.append(n));
    li.append(setting);
    const start = Math.max(0, findingLabels.indexOf(setting.textContent.trim()));
    defects[id] = start;
    const seg = document.createElement('span');
    seg.className = 'loop__seg';
    seg.setAttribute('role', 'radiogroup');
    if (nameTpl) seg.setAttribute('aria-label', fill(nameTpl, { n: id }));
    const buttons = findingLabels.map((text, k) => {
      const b = document.createElement('span');
      b.setAttribute('role', 'radio');
      b.textContent = text;
      b.setAttribute('aria-checked', String(k === start));
      b.tabIndex = k === start ? 0 : -1;
      seg.append(b);
      return b;
    });
    const choose = (k) => {
      buttons.forEach((x, j) => {
        x.setAttribute('aria-checked', String(j === k));
        x.tabIndex = j === k ? 0 : -1;
      });
      defects[id] = k;
      run(true);
    };
    buttons.forEach((b, k) => {
      b.addEventListener('click', () => choose(k));
      b.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          const n = (k + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
          buttons[n].focus();
          choose(n);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choose(k);
        }
      });
    });
    li.append(seg);
  });

  frame.classList.add('is-live');
  run(false);
  block.replaceChildren(frame);
}
