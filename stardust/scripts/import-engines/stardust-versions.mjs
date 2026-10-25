// Importer engine for the three-version block viewer of "Adobe Stardust explained"
// (figure.fig.wide.vs [data-versions]) -> explainer (stardust-versions), a matrix: the switch
// names and the version tabs, then one row per block with one cell per version, then the
// caption (blocks/explainer/engines/stardust-versions.js lists the row shape).

export function match($, el) {
  const $el = $(el);
  return $el.is('[data-versions]') || ($el.is('div.wide') && $el.children('[data-versions]').length === 1 && $el.children().length === 1);
}

export function convert($, el, h) {
  const $f = $(el).is('[data-versions]') ? $(el) : $(el).children('[data-versions]');
  const $blocks = $f.find('[data-blocks] [role="radio"]');
  const $vers = $f.find('[data-vers] [role="tab"]');
  const head = [
    `<p>${h.esc($f.find('[data-blocks]').attr('aria-label') || '')}</p><p>${h.esc($f.find('[data-vers]').attr('aria-label') || '')}</p>`,
    ...$vers.map((_, t) => `<p>${h.inline(t)}</p>`).get(),
  ];
  const body = $blocks.map((_, b) => {
    const key = $(b).attr('data-b');
    const cells = $vers.map((__, t) => {
      const $p = $f.find(`.vs__pane[data-b="${key}"][data-v="${$(t).attr('data-v')}"]`);
      const $cap = $p.find('figcaption');
      const tag = $cap.find('.vs__tag');
      const tagHtml = tag.length ? `<strong>${h.inline(tag)}</strong>` : '';
      tag.remove();
      return `<p>${h.img($p.find('img'))}</p><p>${tagHtml}${h.inline($cap)}</p>`;
    }).get();
    return [[`<p>${h.inline(b)}</p>`, ...cells]];
  }).get();
  const cap = $f.children('figcaption');
  const rows = [head, ...body];
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer stardust-versions', rows);
}
