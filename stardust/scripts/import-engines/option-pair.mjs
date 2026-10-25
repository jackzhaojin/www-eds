// Import engines for the seven AEM capabilities article (writing/2025-06-04-seven-aem-capabilities-tradeoffs):
// figure.fig.mx [data-mx-compare] -> explainer (option-pair), and each div.table-wrap.mx-wrap
// matrix table -> explainer (option-matrix) (see option-matrix.mjs). Row shape:
// blocks/explainer/engines/option-pair.js. The picker names, short names, group captions and
// the summary, tag and note text lived in the source's explainer.js; they are carried here as content.
const PICK = {
  aem65: 'Classic AEM 6.5', aemaacs: 'AEM as a Cloud Service', spa: 'AEM with SPA SDKs', cfue: 'Headless Content Fragments + UE', uesites: 'UE with AEM Sites', ueeds: 'AEM UE + EDS', docs: 'Docs with EDS',
};
const SHORT = {
  aem65: 'Classic AEM 6.5', aemaacs: 'AEM as a Cloud Service', spa: 'SPA SDKs', cfue: 'Headless CF + UE', uesites: 'UE with Sites', ueeds: 'UE + EDS', docs: 'Docs + EDS',
};
const OPENING = ['aemaacs', 'docs'];
const GROUPS = [['functional', 'Functional and authoring'], ['technical', 'Technical and infrastructure']];
const SUMMARY = '{differ} of {total} rows differ between {a} and {b}.';
const SAME = 'Same option on both sides. Pick a different one to compare.';
const TAG = 'differs';
const NOTE = 'as Classic AEM 6.5: {value}';

export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-mx-compare]');
}

export function convert($, el, h) {
  const $el = $(el);
  const p = (html) => `<p>${html}</p>`;
  const rows = [[
    p(h.inline($el.find('.mx__pick span').eq(0))),
    p(h.inline($el.find('.mx__pick span').eq(1))),
    p(h.esc($el.find('.mx__only').text().trim())),
  ]];
  // options in table order, from the matrix tables on the page
  const seen = new Set();
  $('table[data-mx] thead th[data-opt]').each((_, th) => {
    const key = $(th).attr('data-opt');
    if (seen.has(key)) return;
    seen.add(key);
    const pick = h.esc(PICK[key] || $(th).text().trim());
    rows.push([p(h.inline(th)), p(OPENING.includes(key) ? `<strong>${pick}</strong>` : pick), p(h.esc(SHORT[key] || $(th).text().trim()))]);
  });
  GROUPS.forEach(([word, caption]) => rows.push([p(word), p(h.esc(caption))]));
  [SUMMARY, SAME, TAG, NOTE].forEach((t) => rows.push([p(h.esc(t))]));
  const cap = $el.children('figcaption');
  if (cap.length) rows.push([p(h.inline(cap))]);
  return h.block('explainer option-pair', rows);
}
