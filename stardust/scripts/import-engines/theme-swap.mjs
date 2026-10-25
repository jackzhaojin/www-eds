// Import engine: figure.tkl[data-tokenlab] (writing/2026-05-24-theming-eds-with-google-stitch)
// to explainer (theme-swap): the bar, the three switch labels, the preview page (title, intro,
// closing line; the teaser's eyebrow, heading, body and button labels), the token table (one
// row per token with its group) and the note. Everything comes from the page.
export function match($, el) {
  const $el = $(el);
  return $el.is('figure[data-tokenlab]') || (el.name === 'div' && $el.hasClass('wide') && $el.children('figure[data-tokenlab]').length === 1);
}

// Inline content of the preview: the code span reads as code, the fake link as underline.
function previewInline($, node, h) {
  let html = '';
  $(node).contents().each((_, c) => {
    if (c.type === 'text') html += h.esc(c.data);
    else if (c.type === 'tag' && $(c).hasClass('tkl__code')) html += `<code>${h.esc($(c).text())}</code>`;
    else if (c.type === 'tag' && $(c).hasClass('tkl__link')) html += `<u>${h.esc($(c).text())}</u>`;
    else if (c.type === 'tag') html += previewInline($, c, h);
  });
  return html;
}

export function convert($, el, h) {
  const $f = $(el).is('figure') ? $(el) : $(el).children('figure[data-tokenlab]');
  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [];
  rows.push([`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]);
  rows.push([`<ul>${$f.find('.tkl__tog').map((_, b) => `<li>${h.inline(b)}</li>`).get().join('')}</ul>`]);
  const $page = $f.find('.tkl__page');
  const pageText = $page.children('p').map((_, p) => `<p>${previewInline($, p, h)}</p>`).get().join('');
  const $text = $page.find('.tkl__text');
  const teaser = $text.children('p').not('.tkl__ctas').map((_, p) => `<p>${previewInline($, p, h)}</p>`).get().join('');
  const btns = $text.find('.tkl__btn').map((_, b) => `<li>${h.esc($(b).text())}</li>`).get().join('');
  rows.push([pageText, `${teaser}<ul>${btns}</ul>`]);
  const $t = $f.find('.tkl__table');
  rows.push($t.find('thead th').map((_, th) => `<p>${h.inline(th)}</p>`).get());
  $t.find('tbody tr').each((_, tr) => {
    const cells = $(tr).children('td').map((__, td) => {
      $(td).children('i').remove();
      return `<p>${h.inline(td)}</p>`;
    }).get();
    rows.push([...cells, `<p>${h.esc($(tr).attr('data-g'))}</p>`]);
  });
  rows.push([`<p>${h.inline($f.find('.tkl__note'))}</p>`]);
  return h.block('explainer theme-swap', rows);
}
