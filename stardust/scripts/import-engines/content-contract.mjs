// Import engine: figure.ccl[data-contract] (writing/2026-05-17-adobe-eds-skills-hands-on) to
// explainer (content-contract). The bar, labels, chips, static explanation and markup, and the
// caption come from the page; each scenario's settings and lead and the teaser entries come
// from the article's explainer.js (SCENARIOS, ENTRIES).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function match($, el) {
  const $el = $(el);
  return $el.is('figure[data-contract]') || (el.name === 'div' && $el.hasClass('wide') && $el.children('figure[data-contract]').length === 1);
}

export function convert($, el, h) {
  const $f = $(el).is('figure') ? $(el) : $(el).children('figure[data-contract]');
  const js = fs.readFileSync(path.join(path.dirname(path.resolve(process.argv[2])), 'explainer.js'), 'utf8');
  const sc = /var SCENARIOS = (\{[\s\S]*?\n {4}\});/.exec(js);
  const en = /var ENTRIES = (\[[\s\S]*?\n {2}\]);/.exec(js);
  if (!sc || !en) throw new Error('content-contract: SCENARIOS or ENTRIES not found in explainer.js');
  const SCENARIOS = vm.runInNewContext(`(${sc[1]})`);
  const ENTRIES = vm.runInNewContext(en[1]);

  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [];
  rows.push([`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]);
  rows.push([
    `<p>${h.inline($f.find('.ccl__controls .lab__label').first())}</p>`,
    `<p>${h.inline($f.find('.lab__left > .lab__label').first())}</p>`,
    `<p>${h.inline($f.find('.lab__right > .lab__label').first())}</p>`,
    `<p>${h.inline($f.find('.ccl__prevwrap .lab__label').first())}</p>`,
  ]);
  $f.find('[data-group="scenario"] [role="radio"]').each((_, b) => {
    const s = SCENARIOS[$(b).attr('data-v')];
    const settings = [
      `variant: ${s.variant || 'none'}`, `rows: ${s.rows}`, `links: ${s.ctas}`, `eyebrow: ${s.eyebrow ? 'italics' : 'plain'}`, `extra: ${s.extra ? 'yes' : 'no'}`,
    ].map((x) => `<li>${h.esc(x)}</li>`).join('');
    rows.push([`<p>${h.inline(b)}</p>`, `<ul>${settings}</ul>`, `<p>${h.esc(s.lead)}</p>`]);
  });
  ENTRIES.forEach((e) => rows.push([
    `<p>${h.esc(e.eyebrow)}</p>`, `<p>${h.esc(e.heading)}</p>`, `<p>${h.esc(e.body)}</p>`, `<ul>${e.links.map((l) => `<li>${h.esc(l)}</li>`).join('')}</ul>`,
  ]));
  rows.push([`<p>${h.inline($f.find('.ccl__why'))}</p><pre><code>${h.esc($f.find('.ccl__tree').text())}</code></pre>`]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer content-contract', rows);
}
