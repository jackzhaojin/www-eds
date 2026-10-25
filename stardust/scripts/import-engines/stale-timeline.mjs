// Import engine for figure.swr (writing/2025-09-01-aem-caching-production-architectures): the
// stale-while-revalidate timeline -> explainer (stale-timeline). Row shape:
// blocks/explainer/engines/stale-timeline.js. The verdicts are the source explainer.js's render()
// strings ({age} where it reads the copy's age).
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-swr], .swr');

const VERDICTS = [
  'Fresh: the copy is {age} old, inside max-age. The CDN answers from cache and the dispatcher never hears about it.',
  'Stale but allowed: the CDN answers from cache right away, then spends a second fetching a fresh copy from the dispatcher in the background. The browser never waits for it.',
  'Too old: past max-age plus stale-while-revalidate. The request waits the full second while the CDN fetches from the dispatcher.',
  'Without stale-while-revalidate, anything past max-age means a wait: the browser sits through the full second while the CDN fetches from the dispatcher.',
];

export function convert($, el, h) {
  const $f = $(el);
  const p = (node) => `<p>${h.inline(node)}</p>`;
  const toggle = $f.find('.swr__toggle').contents().filter((_, n) => n.type === 'text').text().trim();
  const rows = [
    [`${p($f.find('.swr__hdr'))}${p($f.find('.swr__demo'))}`],
    [p($f.find('.swr__slider > span')), `<p>${h.esc(toggle)}</p>`],
    $f.find('.swr__zone b').map((_, b) => p(b)).get(),
    $f.find('.swr__ticks span').map((_, s) => p(s)).get(),
    [`<ol>${$f.find('.swr__cases li').map((_, li) => `<li>${h.inline(li)}</li>`).get().join('')}</ol>`],
    $f.find('.swr__who').map((_, s) => p(s)).get(),
    VERDICTS.map((t) => `<p>${h.esc(t)}</p>`),
  ];
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([p(cap)]);
  return h.block('explainer stale-timeline', rows);
}
