// Import engine for div.table-wrap.mx-wrap (writing/2025-06-04-seven-aem-capabilities-tradeoffs) -> explainer (option-matrix).
// Rows: the caption, the column labels, one row per feature.
export function match($, el) {
  return el.name === 'div' && $(el).hasClass('mx-wrap') && $(el).find('table').length > 0;
}

export function convert($, el, h) {
  const $t = $(el).find('table').first();
  const rows = [];
  const cap = $t.children('caption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  $t.find('tr').each((_, tr) => rows.push($(tr).children('th, td').map((__, c) => `<p>${h.inline(c)}</p>`).get()));
  return h.block('explainer option-matrix', rows);
}
