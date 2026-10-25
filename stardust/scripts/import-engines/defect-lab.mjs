// Import engine: the defect gate lab one-off (figure.fig.lab.dl[data-defectlab], in a div.wide
// with its p.lab-note caption) -> block `explainer (defect-lab)`. Row shape: see the JSDoc of
// blocks/explainer/engines/defect-lab.js. Labels, the identity, the open issues and the caption
// come from the source HTML; the four sample reports, the agents' gate levels and the
// reader-facing verdicts come from the source's explainer.js
// (writing/2026-08-15-anima-mesh-company-of-zero/explainer.js), carried verbatim, since that
// script is not loadable here.

const FENCE = '```';
const CLEAN = `${FENCE}defect-report
title: External web-fetch tool returns no usable content across consecutive agent runs
---
Repro: an agent whose job budgets web searches runs on a harness that sends no tools.
Expected: the prompt says plainly that no web search is available.
Actual: two runs in a row report a failed search tool that never existed.
${FENCE}`;
// explainer.js SCENARIOS, keyed by the chips' data-scenario.
const SCENARIOS = {
  clean: CLEAN,
  leak: CLEAN.replace('Actual:', "Actual: Mira's brief to Casey went out with no research, and"),
  dup: `${FENCE}defect-report
title: claude-code harness: opaque failure when local login expires; instance env not passed to CLI providers
---
Repro: run a laptop-tier agent after the local CLI login has expired.
Expected: a clear auth error. Actual: an opaque failure.
${FENCE}`,
  three: [1, 2, 3].map((n) => `${FENCE}defect-report
title: Demo defect ${n}: schedule note repeated in the brief
---
Repro ${n}: the same scheduler note appears twice in one brief.
${FENCE}`).join('\n\n'),
};
// explainer.js AGENT_GATES: level, then the reversible-action whitelist.
const GATES = [
  ['chief-of-staff', 'L3', 'schedule-update, draft-write, defect-report'],
  ['research-watch', 'L1', ''],
];
// explainer.js verdict() and applyDefects(), in that order.
// {placeholders} are filled in by the engine.
const STRINGS = [
  ['no report', 'No report block, so nothing leaves the private brain.'],
  ['not allowed', 'Stopped at check 1: this agent is not allowed to file engine issues. Nothing leaves the brain.'],
  ['leak', "Stopped at check 2: the report names one of the brain's people, so it is never filed. It becomes a private draft in the brain instead."],
  ['duplicate', 'Stopped at check 3: the same bug is already an open issue, so no second issue is filed.'],
  ['capped', 'Check 4: {filed} filed, and the rest refused by the cap of two per run.'],
  ['refused', 'Refused before filing. Nothing leaves the brain.'],
  ['passes', 'Passes all four checks: this would become a public issue on the engine.'],
  ['count', '{n} defect-report block{s} parsed'],
  ['no block', 'No defect-report block found. Nothing leaves the run.'],
  ['would file', 'Would file a new public issue on the engine, labeled defect. No draft kept.'],
  ['already open', 'Already open upstream as issue #{number}. No second issue.'],
];

export function match($, el) {
  const $el = $(el);
  if ($el.is('[data-defectlab]')) return true;
  return $el.is('div.wide') && $el.children('[data-defectlab]').length > 0;
}

export function convert($, el, h) {
  const $el = $(el);
  const $f = $el.is('[data-defectlab]') ? $el : $el.children('[data-defectlab]');
  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [[`<p>${h.inline(bar.find('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]];

  // One row per sample report: the chip label | the report text.
  $f.find('[data-scenario]').each((_, b) => {
    const text = SCENARIOS[$(b).attr('data-scenario')];
    rows.push([`<p>${h.inline(b)}</p>`, `<pre><code>${h.esc(text)}</code></pre>`]);
  });

  rows.push(['<p>reports label</p>', `<p>${h.esc($f.find('[data-scenario]').first().parent().attr('aria-label') || '')}</p>`]);
  rows.push(['<p>report</p>', `<p>${h.esc($f.find('label[for]').first().text())}</p>`]);
  const opts = $f.find('.dl__opts');
  const agents = opts.find('[data-agent]').map((_, b) => `<li>${h.inline(b)}</li>`).get().join('');
  rows.push(['<p>agent</p>', `<p>${h.esc(opts.children('span').first().text())}</p><ul>${agents}</ul>`]);
  rows.push(['<p>agents label</p>', `<p>${h.esc(opts.find('[role=radiogroup]').attr('aria-label') || '')}</p>`]);
  rows.push(['<p>gates</p>', `<ul>${GATES.map(([a, l, w]) => `<li>${a}: ${l}${w ? `, ${w}` : ''}</li>`).join('')}</ul>`]);
  const right = $f.find('.dl__grid > div').eq(1);
  const labels = right.children('.lab__label');
  rows.push(['<p>identity</p>', `<p>${h.inline(labels.eq(0))}</p><p>${h.inline(right.children('.dl__who'))}</p>`]);
  rows.push(['<p>issues</p>', `<p>${h.inline(labels.eq(1))}</p><ul>${right.find('.dl__issues li').map((_, li) => `<li>${h.inline(li)}</li>`).get().join('')}</ul>`]);
  STRINGS.forEach(([k, v]) => rows.push([`<p>${k}</p>`, `<p>${h.esc(v)}</p>`]));

  const cap = $el.children('p.lab-note');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer defect-lab', rows);
}
