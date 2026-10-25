// Import engine for figure.loop (writing/2026-01-05-from-prompts-to-harness): the loop model ->
// explainer (task-loop). Row shape: blocks/explainer/engines/task-loop.js.
// The log lines and run order sentences are the source explainer.js's run() strings, written as
// the engine's templates; the finding switch name is its "Defects on task N" aria-label.
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-loop], .loop');

const LINES = [
  'loop: run planning agents in order: {plan}',
  'loop: next available task is {task}',
  '  validate: {count} logged, created {subtasks}',
  'loop: {first} exists, so it runs before {next}',
  '  validate: passed',
  'loop: no tasks left, run complete',
];
const RUN_ENDS = 'the run ends';
const RESULT = [
  'Run order {order}: each defect became a subtask ({subtasks}), and the loop ran each one right after its parent task.',
  'Run order {order}: no defects, so the loop ran the plan as written.',
];

export function convert($, el, h) {
  const $f = $(el);
  const esc = h.esc;
  const rows = [[`<p>${h.inline($f.find('.lab__bar span').first())}</p>`]];
  const labels = $f.find('.lab__left > .lab__label');
  const plan = $f.find('.loop__plan li').map((_, li) => `<li>${h.inline(li)}</li>`).get().join('');
  const tasks = $f.find('.loop__tasks > li').map((_, li) => `<li><strong>${h.inline($(li).children('b'))}</strong> ${h.inline($(li).children('.loop__setting'))}</li>`).get().join('');
  const findings = $f.find('.loop__seg').first().find('button').map((_, b) => `<li>${h.inline(b)}</li>`).get().join('');
  const name = ($f.find('.loop__seg').first().attr('aria-label') || '').replace(/\d+$/, '{n}');
  const left = `<p>${h.inline(labels.eq(0))}</p><ol>${plan}</ol><p>${h.inline(labels.eq(1))}</p><ul>${tasks}</ul><ul>${findings}</ul>${name ? `<p><em>${esc(name)}</em></p>` : ''}`;
  const queue = $f.find('.loop__queue li').map((_, li) => `<li>${h.inline(li)}</li>`).get().join('');
  const right = `<p>${h.inline($f.find('.lab__right > .lab__label').first())}</p><p>${h.inline($f.find('[data-loop-result]'))}</p><ol>${queue}</ol><pre><code>${esc($f.find('.loop__log').text())}</code></pre>`;
  rows.push([left, right]);
  rows.push([`<pre><code>${esc(LINES.join('\n'))}</code></pre><p>${esc(RUN_ENDS)}</p>`, RESULT.map((t) => `<p>${esc(t)}</p>`).join('')]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer task-loop', rows);
}
