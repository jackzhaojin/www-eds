// Import engine for figure.fig.cc [data-chain-lab] (writing/2025-06-12-azure-rbac-cicd-for-ai-agents) -> explainer (credential-chain).
// Row shape: blocks/explainer/engines/credential-chain.js (bar, left | right, the no-JavaScript
// table, the caption).
export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-chain-lab]');
}

export function convert($, el, h) {
  const $el = $(el);
  const p = (html) => `<p>${html}</p>`;
  const bar = $el.find('.cc__bar').first();
  const link = bar.find('a').first();
  const cols = $el.find('.cc__grid').first().children('div');
  const $l = cols.eq(0);
  const $r = cols.eq(1);
  const switches = $l.find('.cc__controls > label').not('.cc__mode')
    .map((_, lab) => `<li>${h.inline($(lab).children('span').first())}</li>`).get().join('');
  const mode = $l.find('.cc__mode');
  const left = [
    p(h.inline($l.children('.cc__label').first())),
    `<ul>${$l.find('.chips button').map((_, b) => `<li>${h.inline(b)}</li>`).get().join('')}</ul>`,
    p(h.inline($l.find('.cc__more > summary'))),
    p(h.inline($l.find('.cc__controls legend'))),
    `<ul>${switches}</ul>`,
    p(h.inline(mode.children('span').first())),
    `<ul>${mode.find('option').map((_, o) => `<li>${h.esc($(o).text().trim())}</li>`).get().join('')}</ul>`,
  ].join('');
  const right = [
    p(h.inline($r.children('.cc__label').first())),
    `<ol>${$r.find('.cc__chain li .cc__name').map((_, n) => `<li>${h.inline(n)}</li>`).get().join('')}</ol>`,
  ].join('');
  const rows = [
    [p(h.inline(bar.children('span').first())), p(`<a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a>`)],
    [left, right],
  ];
  $el.find('.cc__static tr').each((_, tr) => rows.push($(tr).children('th, td').map((__, c) => p(h.inline(c))).get()));
  const cap = $el.children('figcaption');
  if (cap.length) rows.push([p(h.inline(cap))]);
  return h.block('explainer credential-chain', rows);
}
