// Importer engine for the "Walk the five layers" explainer (figure[data-pow], Patterns of Work)
// -> explainer (work-patterns). The layer cards come from the figure's list; the pillar view's
// text, which the source keeps in explainer.js, is carried here verbatim.
const VIEW = {
  suffix: ', up the five layers',
  hint: 'Pick a row to open that layer.',
  go: { href: '#spine', text: 'Read about the spine' },
};

export function match($, el) {
  const $el = $(el);
  return $el.is('figure[data-pow]') || ($el.is('div.wide') && $el.children('figure[data-pow]').length === 1);
}

export function convert($, el, h) {
  const $f = $(el).is('figure') ? $(el) : $(el).children('figure[data-pow]');
  const layers = $f.find('.pow__layer');
  const pillars = layers.first().find('.pow__pillars dt').map((_, dt) => `<li>${h.esc($(dt).text())}</li>`).get().join('');
  const found = $f.find('.pow__foundation');
  const rows = [[
    `<p>${h.esc($f.find('.pow__spine-label').text())}</p><ul>${pillars}</ul><p><a href="${h.esc(h.absHref(found.attr('href')))}">${h.inline(found)}</a></p>`,
  ]];
  const first = layers.first().find('.pow__pillars dt').first().text();
  rows.push([`<p><em>${h.esc(first)}</em>${h.esc(VIEW.suffix)}</p><p>${h.esc(VIEW.hint)}</p><p><a href="${VIEW.go.href}">${h.esc(VIEW.go.text)}</a></p>`]);
  layers.each((_, li) => {
    const $li = $(li);
    let card = '';
    $li.children().each((__, c) => {
      const $c = $(c);
      if ($c.is('ol.pow__climb')) {
        const tag = $c.hasClass('pow__climb--branch') ? 'ul' : 'ol';
        card += `<${tag}>${$c.children('li').map((___, s) => `<li>${h.inline(s)}</li>`).get().join('')}</${tag}>`;
      } else if ($c.is('dl')) {
        card += `<ul>${$c.children('div').map((___, d) => `<li><strong>${h.esc($(d).find('dt').text())}</strong> ${h.inline($(d).find('dd'))}</li>`).get().join('')}</ul>`;
      } else if ($c.is('p.pow__go')) {
        const a = $c.find('a');
        card += `<p><a href="${h.esc(h.absHref(a.attr('href')))}">${h.inline(a)}</a></p>`;
      } else card += `<p>${h.inline(c)}</p>`;
    });
    rows.push([`<p>${h.esc($li.attr('data-short'))}</p>`, card]);
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer work-patterns', rows);
}
