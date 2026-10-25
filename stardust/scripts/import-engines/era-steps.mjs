// Import engine for figure.fig.eras (writing/2025-06-08-edge-cms-shift-adobe-eds) -> explainer (era-steps).
// One row per step: when paragraph, what paragraph, the points list; a last row with the caption.
export function match($, el) {
  return el.name === 'figure' && $(el).hasClass('fig') && $(el).hasClass('eras');
}

export function convert($, el, h) {
  const $el = $(el);
  const rows = $el.find('.eras__step').map((_, li) => {
    const $li = $(li);
    const points = $li.children('ul, ol').first();
    const tag = points.length ? points[0].name : 'ul';
    const items = points.children('li').map((__, p) => `<li>${h.inline(p)}</li>`).get().join('');
    return [[`<p>${h.inline($li.find('.eras__when'))}</p><p>${h.inline($li.find('.eras__what'))}</p><${tag}>${items}</${tag}>`]];
  }).get();
  const cap = $el.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer era-steps', rows);
}
