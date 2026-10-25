// Import engine for figure.eds-map (writing/2025-07-13-three-eds-offerings): an offering's path on the
// diagram -> explainer (offering-path). Row shape: blocks/explainer/engines/offering-path.js.
// PATHS and SAY are the source explainer.js's, so each offering's boxes and note become rows.
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-eds-map], .eds-map');

const PATHS = {
  docs: ['docs-editor', 'docs-store', 'listener', 'compile', 'edge', 'browser'],
  ue: ['ue-editor', 'ue-store', 'listener', 'compile', 'edge', 'browser'],
  da: ['da-editor', 'da-store', 'listener', 'compile', 'edge', 'browser'],
  shared: ['listener', 'compile', 'edge', 'browser'],
};
const SAY = {
  docs: 'Documents: the content starts as a document in Google Docs or Word.',
  ue: 'Universal Editor: the content starts as AEM nodes, edited in AEM.',
  da: 'da.live: the content starts in Adobe’s cloud, edited in the browser.',
  shared: 'Shared by all three: preview or publish, compile content with code, deliver from the edge.',
};
const DEFAULT = 'docs'; // explainer.js: show('docs')

export function convert($, el, h) {
  const $f = $(el);
  const name = $f.find('.eds-map__chips').attr('aria-label');
  const rows = [[`<p>${h.img($f.find('.eds-map__img img'))}</p>${name ? `<p><em>${h.esc(name)}</em></p>` : ''}`]];
  const regions = $f.find('.eds-map__hl').map((_, s) => {
    const st = $(s).attr('style') || '';
    const v = (k) => (new RegExp(`--${k}:([^;]+)`).exec(st) || [])[1].trim();
    return `<li>${$(s).attr('data-box')}: ${v('x')} ${v('y')} ${v('w')} ${v('h')}</li>`;
  }).get().join('');
  rows.push([`<ul>${regions}</ul>`]);
  const offers = $f.find('.eds-map__chips [data-o]').map((_, b) => $(b).attr('data-o')).get();
  const steps = $f.find('.eds-map__steps > li').map((_, li) => {
    const $li = $(li);
    const lead = $li.children('b').first();
    const variants = $li.children('[data-o]');
    if (!variants.length) {
      return `<li>${h.inline(li)}</li>`;
    }
    const items = offers.map((o) => variants.filter(`[data-o="${o}"]`)).filter((v) => v.length)
      .map((v) => `<li>${h.inline(v)}</li>`);
    return `<li><strong>${h.inline(lead)}</strong><ul>${items.join('')}</ul></li>`;
  }).get().join('');
  rows.push([`<ol>${steps}</ol>`]);
  $f.find('.eds-map__chips [data-o]').each((_, b) => {
    const o = $(b).attr('data-o');
    const label = h.inline(b);
    rows.push([`<p>${o === DEFAULT ? `<strong>${label}</strong>` : label}</p>`, `<p><code>${PATHS[o].join(' ')}</code></p>`, `<p>${h.esc(SAY[o])}</p>`]);
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer offering-path', rows);
}
