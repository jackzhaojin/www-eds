// Import engine for figure.fig.lab.sf [data-sf] (writing/2025-07-06-ai-coded-nextjs-agent-release-1) -> explainer (spec-filter).
// Rows: the bar (label | source link), then left | right. The outcome sentences lived in the
// source's explainer.js; they are carried here as content ({evaluated} and {total} are the counts).
const OUTCOMES = [
  'All {total} specs go on to the model for evaluation.',
  '{evaluated} of {total} specs go on. The flow keeps going and the response says what was dropped.',
  'The first bad spec ends the request. The whole step fails and the flow stops, whatever the other specs looked like.',
  'Nothing valid is left, so this still fails.',
];

export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-sf]');
}

export function convert($, el, h) {
  const $el = $(el);
  const bar = $el.find('.lab__bar').first();
  const link = bar.find('a').first();
  const sw = $el.find('.pvl__switch').first();
  const modes = sw.find('button').map((_, b) => `<li>${h.inline(b)}</li>`).get().join('');
  const left = $el.find('.lab__left').first();
  const specs = left.find('.sf__spec').map((_, s) => {
    const $s = $(s);
    const chosen = $s.find('option[selected]').first();
    return `<li>${h.esc($s.find('label').text().trim())}: ${h.esc((chosen.length ? chosen : $s.find('option').first()).text().trim())}</li>`;
  }).get().join('');
  const choices = left.find('.sf__spec').first().find('option').map((_, o) => `<li>${h.esc($(o).text().trim())}</li>`).get().join('');
  const leftHtml = `<p>${h.esc(sw.attr('aria-label') || '')}</p><ul>${modes}</ul><p>${h.inline(left.children('.lab__label').first())}</p><ol>${specs}</ol><ul>${choices}</ul><p>${h.inline(left.children('.sf__note').first())}</p>`;
  const right = $el.find('.lab__right').first();
  let statics = '';
  right.find('.sf__static').children().each((_, c) => {
    if (c.name === 'h3') statics += `<h3>${h.inline(c)}</h3>`;
    else if (c.name === 'pre') statics += `<pre><code>${h.esc($(c).text())}</code></pre>`;
  });
  const rightHtml = `<p>${h.inline(right.children('.lab__label').first())}</p><ul>${OUTCOMES.map((o) => `<li>${h.esc(o)}</li>`).join('')}</ul>${statics}`;
  return h.block('explainer spec-filter', [
    [`<p>${h.inline(bar.find('span').first())}</p>`, `<p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`],
    [leftHtml, rightHtml],
  ]);
}
