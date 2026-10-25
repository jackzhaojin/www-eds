// Import engine: figure.linemap (writing/2026-05-17 CDD line map) to explainer (line-map): the
// bar's accessible name, the legend's two items, the references (line number in bold, then the
// rest) and the caption. The file length and the shaded opening come from the bar's own
// percentages and the legend ("Lines 1 to N"), checked against the list.
export function match($, el) {
  return el.name === 'figure' && $(el).hasClass('linemap');
}

export function convert($, el, h) {
  const $f = $(el);
  const $bar = $f.find('.linemap__bar');
  const legendText = $f.find('.linemap__legend').text();
  const first = +(/Lines 1 to (\d+)/.exec(legendText) || [])[1];
  const total = +(/line (\d+) on the right/.exec(legendText) || [])[1];
  if (!first || !total) throw new Error('line-map: legend does not name the opening and the length');
  const legend = [];
  $f.find('.linemap__legend').contents().each((_, n) => {
    if (n.type === 'text' && n.data.trim()) legend.push(`<li>${h.esc(n.data.trim())}</li>`);
  });
  const refs = $f.find('.linemap__list li').map((_, li) => {
    const $li = $(li);
    const num = $li.children('span').first().text();
    $li.children('span').first().remove();
    return `<li><strong>${h.esc(num)}</strong>${h.inline(li)}</li>`;
  }).get().join('');
  const rows = [
    [`<p>${h.esc($bar.attr('aria-label') || '')}</p>`],
    [`<ul>${legend.join('')}</ul>`],
    [`<ol>${refs}</ol>`],
    [`<ul><li>lines: ${total}</li><li>first: ${first}</li></ul>`],
  ];
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer line-map', rows);
}
