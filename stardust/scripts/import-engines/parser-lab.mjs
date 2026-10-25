// Import engine for figure.fig.pl [data-parser-lab] (writing/2025-04-13-vibe-coding-star-story-generator) -> explainer (parser-lab).
// Row shape: blocks/explainer/engines/parser-lab.js. The replies and their takeaways move from
// the source's <template> elements into rows (in the chips' order; the opening reply, the one
// the source's script picks first, is bold). The takeaway after a reader's own edit lived in the
// source's explainer.js; it is carried here as content.
const OPENING = 'wrapped';
const EDIT_TAKEAWAY = 'Your own edit: the steps above show the path it took.';

// The importer loads the page with decodeEntities off, so attribute and template text arrive raw.
const decode = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-parser-lab]');
}

export function convert($, el, h) {
  const $el = $(el);
  const p = (html) => `<p>${html}</p>`;
  const bar = $el.find('.pl__bar').first();
  const link = bar.find('a').first();
  const cols = $el.find('.pl__grid').first().children('div');
  const $l = cols.eq(0);
  const $r = cols.eq(1);
  const labels = $l.children('.pl__label');
  const left = [
    p(h.inline(labels.eq(0))),
    p(h.inline(labels.eq(1))),
    p(h.esc(decode($l.find('textarea').attr('aria-label') || ''))),
    p(h.inline($l.children('.pl__note').first())),
  ].join('');
  const right = [
    p(h.inline($r.children('.pl__label').first())),
    `<ul>${$r.find('.psteps li').map((_, li) => `<li><strong>${h.inline($(li).children('b').first())}</strong></li>`).get().join('')}</ul>`,
    p(h.esc(EDIT_TAKEAWAY)),
  ].join('');
  const rows = [
    [p(h.inline(bar.children('span').first())), p(`<a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a>`)],
    [left, right],
  ];
  $l.find('.chips button').each((_, b) => {
    const id = $(b).attr('data-pick');
    const t = $el.find(`template[data-reply="${id}"]`).first();
    const label = h.inline(b);
    rows.push([
      p(id === OPENING ? `<strong>${label}</strong>` : label),
      `<pre><code>${h.esc(decode(t.html()).replace(/^\n/, ''))}</code></pre>`,
      p(h.esc(decode(t.attr('data-takeaway') || ''))),
    ]);
  });
  $el.find('.pl__static tr').each((_, tr) => rows.push($(tr).children('th, td').map((__, c) => p(h.inline(c))).get()));
  const cap = $el.children('figcaption');
  if (cap.length) rows.push([p(h.inline(cap))]);
  return h.block('explainer parser-lab', rows);
}
