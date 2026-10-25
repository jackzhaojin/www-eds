// Import engine for figure.fig.pq [data-pq] (writing/2025-05-28-aem-headless-when-frontend-teams-lead) -> explainer (persisted-query).
// Row shape: blocks/explainer/engines/persisted-query.js. The request formats, outcomes, the
// opening and start-over verdicts and the counter lived in the source's explainer.js; they are
// carried here as content ({locale}, {sent}, {reached}, {cached} are filled by the engine).
const FORMATS = [
  '/graphql/execute.json/my-site/articles-by-locale;locale={locale}',
  '<GraphQL endpoint>, with the query and locale "{locale}" in the request body',
];
const OUTCOMES = [
  ['<strong>Not cacheable.</strong> A POST goes past the cache to AEM every time, even when it asks for exactly the same thing.', 'not cacheable', 'yes'],
  ['<strong>Cache hit.</strong> This exact URL was stored by an earlier request, so AEM never sees this one.', 'hit', 'no'],
  ['<strong>Cache miss.</strong> First time this URL is asked for, so AEM answers and the response is stored under <code>;locale={locale}</code>. Send it again.', 'miss, stored', 'yes'],
];
const SEEDED = '<strong>Five requests so far:</strong> both POSTs reached AEM, the first GET for each locale reached AEM once, and the repeat GET came from the cache. Send <code>;locale=en</code> again and AEM never sees it.';
const RESET = 'Started over with an empty cache. Pick a query and a locale, then send a request, and send the same persisted query twice.';
const COUNT = '{sent} sent · {reached} reached AEM · {cached} served from cache';

export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-pq]');
}

export function convert($, el, h) {
  const $el = $(el);
  const p = (html) => `<p>${html}</p>`;
  const cells = ($nodes) => $nodes.map((_, n) => p(h.inline(n))).get();
  const bar = $el.find('.pq__bar').first();
  const groups = $el.find('.pq__group');
  const rows = [
    cells(bar.children('span')),
    [p(h.inline(groups.eq(0).find('.pq__label'))), ...cells(groups.eq(0).find('button'))],
    [p(h.inline(groups.eq(1).find('.pq__label'))), ...cells(groups.eq(1).find('button'))],
    cells($el.find('.pq__actions button')),
    FORMATS.map((f) => p(`<code>${h.esc(f)}</code>`)),
    cells($el.find('.pq__path li')),
    cells($el.find('.pq__log thead th')),
  ];
  $el.find('.pq__log tbody tr').each((_, tr) => rows.push(cells($(tr).children('td'))));
  OUTCOMES.forEach(([verdict, cache, reached]) => rows.push([p(verdict), p(cache), p(reached)]));
  rows.push([p(h.inline($el.find('.pq__verdict')))]);
  rows.push([p(SEEDED)], [p(RESET)], [p(COUNT)]);
  const cap = $el.children('figcaption');
  if (cap.length) rows.push([p(h.inline(cap))]);
  return h.block('explainer persisted-query', rows);
}
