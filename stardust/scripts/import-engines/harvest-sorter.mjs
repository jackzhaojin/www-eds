// Import engine: figure.hv[data-sorter] (writing/2026-04-12-two-ai-skills-team-enablement) to
// explainer (harvest-sorter). The chips, labels, static destination, reasons and caption come
// from the page; each example file (repo, path, text) and the date come from the article's
// explainer.js (SAMPLES, DATE).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-sorter]');
}

export function convert($, el, h) {
  const $f = $(el);
  const js = fs.readFileSync(path.join(path.dirname(path.resolve(process.argv[2])), 'explainer.js'), 'utf8');
  const m = /const SAMPLES = (\{[\s\S]*?\n {2}\});/.exec(js);
  if (!m) throw new Error('harvest-sorter: SAMPLES not found in explainer.js');
  const SAMPLES = vm.runInNewContext(`(${m[1]})`);
  const date = /const DATE = '([^']+)';/.exec(js)[1];

  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [];
  rows.push([`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]);
  $f.find('.chips button').each((_, b) => {
    const s = SAMPLES[$(b).attr('data-sample')];
    rows.push([`<p>${h.inline(b)}</p>`, `<p>${h.esc(s.repo)}</p>`, `<p>${h.esc(s.path)}</p>`, `<pre><code>${h.esc(s.text)}</code></pre>`]);
  });
  rows.push($f.find('.hv__label').map((_, p) => `<p>${h.inline(p)}</p>`).get());
  const why = $f.find('.hv__why li').map((_, li) => `<li>${h.inline(li)}</li>`).get().join('');
  rows.push([`<p>${h.inline($f.find('.hv__dest'))}</p><ul>${why}</ul>`]);
  rows.push([`<ul><li>date: ${h.esc(date)}</li></ul>`]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer harvest-sorter', rows);
}
