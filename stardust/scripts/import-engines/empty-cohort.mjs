// Import engine: figure[data-emptybug] (2026-05-31-continuous-agent-second-brain, the empty
// cohort lab) -> explainer (empty-cohort). Bar, labels, chips, trace and caption come from the
// figure; the env lines, both versions of defaults.ts, the alternate trace values and the
// verdict lines were held by the source explainer.js (ENV, run()), so they are carried here
// verbatim from that script and become the block's rows.
const ENV = {
  empty: 'V3_MEM0_COHORT=',
  set: 'V3_MEM0_COHORT=smoke-2026-05-16',
  unset: '# no V3_MEM0_COHORT line',
};
const CODE = {
  before: '// defaults.ts before b4f4554\nconst cohortFromEnv = process.env.V3_MEM0_COHORT;\nconst cohort = m.cohort ?? cohortFromEnv ?? undefined;\nif (cohort !== undefined) metadata.cohort = cohort;',
  after: '// defaults.ts after b4f4554\nconst cohortFromEnv = process.env.V3_MEM0_COHORT || undefined;\nconst cohort = m.cohort ?? cohortFromEnv ?? undefined;\nif (cohort !== undefined) metadata.cohort = cohort;',
};
const LOG_BEFORE = '[MEMORY] hook post-run-harvest ran: N tool calls, …ms, ok';
const LOG_AFTER = '[MEMORY] hook post-run-harvest ran: N tool calls [Read×…, Bash×…], …ms, ok [MEMORY] hook post-run-harvest result tail: …';
const NOTE_AFTER = 'After the fix the log also carries the tool histogram and the tail of the hook\'s answer, so a failed harvest shows up.';
// Per version: [log, note] when the write is rejected, then when it passes.
const SAY = {
  before: [[LOG_BEFORE, 'The hook log still says ok: the agent turn succeeded, even though every write failed.'],
    [LOG_BEFORE, 'Same log line as a failed run would print.']],
  after: [[`${LOG_AFTER}validation error`, NOTE_AFTER], [`${LOG_AFTER}memories written`, NOTE_AFTER]],
};
// Alternate trace values: metadata.cohort when nothing is stamped, classify.ts when it passes.
const ALT = { 'metadata.cohort': '(left out)', 'classify.ts': 'valid' };

const fig = ($, el) => ($(el).is('figure[data-emptybug]') ? $(el) : $(el).children('figure[data-emptybug]'));

export function match($, el) {
  if ($(el).is('figure[data-emptybug]')) return true;
  return $(el).is('div.wide') && $(el).children().length === 1 && fig($, el).length === 1;
}

export function convert($, el, h) {
  const $f = fig($, el);
  const bar = $f.find('.lab__bar');
  const left = $f.find('.lab__left');
  const right = $f.find('.lab__right');
  const labels = left.find('.lab__label').map((_, l) => `<p>${h.inline(l)}</p>`).get().join('');
  const trace = right.find('.eb__trace li').map((_, li) => {
    const name = $(li).find('b').text();
    const alt = ALT[name] ? `<br><code>${h.esc(ALT[name])}</code>` : '';
    return `<li><strong>${h.esc(name)}</strong> <code>${h.esc($(li).find('code').text())}</code>${alt}</li>`;
  }).get().join('');
  const verdict = right.find('[data-verdict]');
  const rejected = verdict.find('p').first().text();
  const rows = [
    [`<p>${h.inline(bar.find('span').first())}</p><p><a href="${h.esc(h.absHref(bar.find('a').attr('href')))}">${h.inline(bar.find('a'))}</a></p>`],
    [labels, `<p>${h.inline(right.find('.lab__label').first())}</p><ol>${trace}</ol><p>${h.esc(rejected)}</p><p>${h.esc('The write passes validation and goes to mem0.')}</p>`],
  ];
  left.find('[data-env]').each((_, b) => {
    const line = ENV[$(b).attr('data-env')];
    if (line) rows.push([`<p>${h.inline(b)}</p>`, `<p><code>${h.esc(line)}</code></p>`]);
  });
  left.find('[data-fix]').each((_, b) => {
    const v = $(b).attr('data-fix');
    if (!CODE[v]) return;
    const say = SAY[v].map(([log, note]) => `<p>${h.esc(log)}</p><p>${h.esc(note)}</p>`);
    rows.push([`<p>${h.inline(b)}</p>`, `<pre><code>${h.esc(CODE[v])}</code></pre>`, ...say]);
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer empty-cohort', rows);
}
