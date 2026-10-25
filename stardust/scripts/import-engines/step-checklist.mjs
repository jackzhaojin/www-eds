// Import engine: a plain figure.fig holding ol.step-list of static steps (writing/2026-05-17
// create-site checklist) to explainer (step-checklist): each step's bold title, its text and
// its source lines in italics; the human steps (li.is-human) as a "human: N" setting.
export function match($, el) {
  const $el = $(el);
  return el.name === 'figure' && $el.children('ol.step-list').length === 1 && $el.find('ol.step-list .static').length > 0;
}

export function convert($, el, h) {
  const $f = $(el);
  const human = [];
  const items = $f.find('ol.step-list > li').map((i, li) => {
    const $s = $(li).children('.static');
    if ($(li).hasClass('is-human')) human.push(i + 1);
    const $lines = $s.children('.lines');
    const lines = $lines.text();
    $lines.remove();
    const $title = $s.children('b').first();
    const title = h.inline($title);
    $title.remove();
    return `<li><strong>${title}</strong>${h.inline($s)}${lines ? `<em>${h.esc(lines)}</em>` : ''}</li>`;
  }).get().join('');
  const rows = [[`<ol>${items}</ol>`]];
  if (human.length) rows.push([`<ul><li>human: ${human.join(', ')}</li></ul>`]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer step-checklist', rows);
}
