// Import engine for figure.fig.pv [data-pv] (writing/2025-06-08-edge-cms-shift-adobe-eds) -> explainer (capability-pivot).
// Rows: chip group name, table caption, column labels, chip labels (full-table chip first), the
// table rows (the highlighted row's label in bold), the figure caption. The chip labels lived in
// the source's explainer.js (SHORT and "Full table"); they are carried here as content.
const SHORT = {
  'Authoring surface': 'Authoring', 'Preview support': 'Preview', 'Enterprise workflows': 'Workflows', 'Edge support': 'Edge',
};
const ALL = 'Full table';

export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-pv]');
}

export function convert($, el, h) {
  const $el = $(el);
  const table = $el.find('table').first();
  const rows = [];
  rows.push([`<p>${h.esc($el.find('.pv__chips').attr('aria-label') || 'Pick a capability')}</p>`]);
  rows.push([`<p>${h.inline(table.children('caption'))}</p>`]);
  const heads = table.find('thead th').map((_, th) => $(th).text().trim()).get();
  rows.push(table.find('thead th').map((_, th) => `<p>${h.inline(th)}</p>`).get());
  rows.push([`<p>${ALL}</p>`, ...heads.slice(1).map((c) => `<p>${h.esc(SHORT[c] || c)}</p>`)]);
  table.find('tbody tr').each((_, tr) => {
    const $tr = $(tr);
    const bold = $tr.hasClass('pv__eds');
    rows.push($tr.children('th, td').map((i, c) => (i === 0 && bold ? `<p><strong>${h.inline(c)}</strong></p>` : `<p>${h.inline(c)}</p>`)).get());
  });
  const cap = $el.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer capability-pivot', rows);
}
