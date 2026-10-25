// Import engine for figure.fig.pipe (writing/2025-04-13-vibe-coding-star-story-generator) -> explainer (request-pipe).
// One row per step: title | what happens | where it runs; a last row with the caption.
export function match($, el) {
  return el.name === 'figure' && $(el).hasClass('fig') && $(el).hasClass('pipe');
}

export function convert($, el, h) {
  const $el = $(el);
  const rows = $el.find('ol > li').map((_, li) => {
    const $d = $(li).children('div').first();
    const fn = $d.children('.pipe__fn');
    const text = $d.children('span').not('.pipe__fn').first();
    return [[`<p><strong>${h.inline($d.children('b').first())}</strong></p>`, `<p>${h.inline(text)}</p>`, `<p>${h.inline(fn)}</p>`]];
  }).get();
  const cap = $el.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer request-pipe', rows);
}
