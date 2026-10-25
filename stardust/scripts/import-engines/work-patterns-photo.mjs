// Importer engine for the Patterns of Work notebook photo (figure.board.pow-photo): a board the
// article's CSS keeps at most 520px wide, centered -> figure (board, narrow).
export function match($, el) {
  return $(el).is('figure.board.pow-photo');
}

export function convert($, el, h) {
  const $el = $(el);
  const cap = $el.find('figcaption');
  return h.block('figure board narrow', [[`<p>${h.img($el.find('img'))}</p>${cap.length ? `<p>${h.inline(cap)}</p>` : ''}`]]);
}
