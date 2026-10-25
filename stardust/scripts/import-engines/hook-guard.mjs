// Import engine: figure.guard[data-guard] (writing/2026-03-23-eds-hlx-admin-agentic-config) to
// explainer (hook-guard). Each preset chip becomes a row (label | command | note, from the
// chip's text, data-cmd and data-note); the checks become an ordered list (bold title, then
// the note); the static verdict and the caption follow.
export function match($, el) {
  const $el = $(el);
  return ($el.is('figure[data-guard]')) || (el.name === 'div' && $el.hasClass('wide') && $el.children('figure[data-guard]').length === 1);
}

export function convert($, el, h) {
  const $f = $(el).is('figure') ? $(el) : $(el).children('figure[data-guard]');
  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [];
  rows.push([`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]);
  $f.find('.chips button').each((_, b) => {
    const $b = $(b);
    rows.push([`<p>${h.inline(b)}</p>`, `<pre><code>${h.esc($b.attr('data-cmd'))}</code></pre>`, `<p>${h.esc($b.attr('data-note'))}</p>`]);
  });
  rows.push([`<p>${h.inline($f.find('.lab__left .lab__label').first())}</p>`]);
  const checks = $f.find('.gates li').map((_, li) => {
    const $d = $(li).children('div');
    return `<li><strong>${h.inline($d.children('b'))}</strong> ${h.inline($d.children('span').first())}</li>`;
  }).get().join('');
  rows.push([`<ol>${checks}</ol>`]);
  rows.push([`<p>${h.inline($f.find('.lab__static'))}</p>`]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer hook-guard', rows);
}
