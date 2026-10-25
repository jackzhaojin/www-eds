// Import engine for figure.fig.roles (writing/2025-06-12-azure-rbac-cicd-for-ai-agents) -> explainer (role-assignments).
// Rows: the heading line, the column labels, one row per table row, the caption.
// A caption link to the page's own images/ folder points at the DA media copy of that image.
export function match($, el) {
  return el.name === 'figure' && $(el).hasClass('fig') && $(el).hasClass('roles');
}

export function convert($, el, h) {
  const $el = $(el);
  const rows = [];
  const head = $el.children('.roles__head');
  if (head.length) rows.push([`<p>${h.inline(head)}</p>`]);
  $el.find('table tr').each((_, tr) => {
    rows.push($(tr).children('th, td').map((__, c) => `<p>${h.inline(c)}</p>`).get());
  });
  const cap = $el.children('figcaption');
  if (cap.length) {
    const $cap = $(`<div>${h.inline(cap)}</div>`);
    $cap.find('a[href]').each((_, a) => {
      const m = /\/writing\/[^/]+\/images\/([^/?#]+)$/.exec($(a).attr('href'));
      if (m) $(a).attr('href', `${h.MEDIA}/${m[1]}`);
    });
    rows.push([`<p>${$cap.html()}</p>`]);
  }
  return h.block('explainer role-assignments', rows);
}
