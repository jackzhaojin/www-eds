// Import engine for ol.trail (writing/2025-07-11-scaling-ai-coding-delivery-methodology): the commit
// trail -> explainer (trail). Row shape: blocks/explainer/engines/trail.js.
export const match = ($, el) => el.name === 'ol' && $(el).hasClass('trail');

export function convert($, el, h) {
  const rows = $(el).children('li').map((_, li) => {
    const $li = $(li).clone();
    const when = $li.children('time').first();
    const date = h.inline(when);
    when.remove();
    return [[`<p>${date}</p>`, `<p>${h.inline($li).trim()}</p>`]];
  }).get();
  return h.block('explainer trail', rows);
}
