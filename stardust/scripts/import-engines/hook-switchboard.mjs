// Import engine: figure[data-switchboard] (2026-05-31-continuous-agent-second-brain, the hook
// switchboard) -> explainer (hook-switchboard). The bar, labels, flags and caption come from the
// figure; the steps of each situation were built by the source explainer.js (build()), so their
// text is carried here verbatim from that script and becomes the block's rows.
const SKIP = '<em>skipped</em> Its flag is off, so it returns without touching mem0.';
const HOOKS = {
  A: 'before picking work',
  B: 'before a worker starts',
  C: 'after a run passes',
  D: 'before diagnosing a failure',
  E: 'after a retrospective',
};

const phase = (h, title, note, alt) => `<li><strong>${h.esc(title)}</strong> ${h.esc(note)}${alt ? `<br>${h.esc(alt)}` : ''}</li>`;
const hook = (h, letter, tag, note) => `<li><strong>Hook ${letter}, ${HOOKS[letter]}</strong> <em>${h.esc(tag)}</em> ${h.esc(note)}<br>${SKIP}</li>`;
const notCalled = (h) => `<li><strong>Hook A, ${HOOKS.A}</strong> <em>not called</em> ${h.esc('Nothing is queued, so the loop doesn\'t spend searches on nothing. This guard was one of the go-live fixes.')}</li>`;

function start(h) {
  return [
    phase(h, 'Pick the next goal', 'A goal is queued, so the loop may check memory first.'),
    hook(h, 'A', 'reads mem0', '3 to 8 plain-English searches. For now the answer is only logged, not used to pick the goal.'),
    hook(h, 'B', 'reads mem0', 'Searches mem0 and builds a memory pack of 2K tokens or less.'),
    phase(h, 'The worker builds', 'The pack is added to the worker\'s CLAUDE.md. The worker reads plain markdown and never calls mem0.', 'No pack this time. The worker starts with nothing from earlier runs.'),
  ];
}

const STEPS = {
  pass: (h) => [...start(h),
    phase(h, 'Checks pass', 'State, ledgers, Notion and Discord are updated.'),
    hook(h, 'C', 'writes mem0', 'The harvester picks 0 to 3 memories from this run (a record of what happened, maybe a lesson) and writes them.')],
  fail: (h) => [...start(h),
    phase(h, 'Checks fail, for the third time', 'So the loop moves on to diagnosing the failure.'),
    hook(h, 'D', 'reads, may write', 'Finds earlier failures with similar signals before the diagnosis. It writes only when it spots a repeated-failure pattern.'),
    phase(h, 'Diagnose the failure', 'The executive decides: retry with a fix, escalate, or keep retrying.')],
  retro: (h) => [notCalled(h),
    phase(h, 'The weekly retrospective runs', 'With no work queued, the loop writes a retro document.'),
    hook(h, 'E', 'writes mem0', 'Turns the new retro into lessons and writes them to mem0.')],
  idle: (h) => [notCalled(h),
    phase(h, 'Nothing to do', 'The loop sleeps 30 seconds and checks again.')],
};

const fig = ($, el) => ($(el).is('figure[data-switchboard]') ? $(el) : $(el).children('figure[data-switchboard]'));

export function match($, el) {
  if ($(el).is('figure[data-switchboard]')) return true;
  return $(el).is('div.wide') && $(el).children().length === 1 && fig($, el).length === 1;
}

export function convert($, el, h) {
  const $f = fig($, el);
  const bar = $f.find('.lab__bar');
  const left = $f.find('.lab__left');
  const right = $f.find('.lab__right');
  const labels = left.find('.lab__label');
  const flags = left.find('.sb__flags li').map((_, li) => {
    const $li = $(li);
    const off = !$li.find('input').is('[checked]');
    return `<li><strong>${h.inline($li.find('b'))}</strong> <code>${h.esc($li.find('code').text())}</code>${off ? ' off' : ''}</li>`;
  }).get().join('');
  // The summary as the source script writes it for the starting pass.
  const summary = 'This pass: one hook reads memory, one hook writes it. The worker never calls mem0.';
  const rows = [
    [`<p>${h.inline(bar.find('span').first())}</p><p><a href="${h.esc(h.absHref(bar.find('a').attr('href')))}">${h.inline(bar.find('a'))}</a></p>`],
    [`<p>${h.inline(labels.eq(0))}</p><p>${h.inline(labels.eq(1))}</p><ul>${flags}</ul>`,
      `<p>${h.inline(right.find('.lab__label').first())}</p><p>${h.esc(summary)}</p>`],
  ];
  left.find('[data-scenario]').each((_, b) => {
    const steps = STEPS[$(b).attr('data-scenario')];
    if (steps) rows.push([`<p>${h.inline(b)}</p>`, `<ol>${steps(h).join('')}</ol>`]);
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer hook-switchboard', rows);
}
