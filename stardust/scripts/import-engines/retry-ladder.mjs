// Import engine: figure.ladder[data-ladder] (writing/2026-04-05-continuous-executive-agent-v2-1)
// to explainer (retry-ladder). The chips, labels, legend, static log and caption come from the
// page; each outcome's numbers, decision line, ending and verdict, and the two limits, come
// from the article's explainer.js (OUTCOMES, DECISION, MAX_RETRIES, DIAGNOSIS_AT).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function match($, el) {
  const $el = $(el);
  return $el.is('figure[data-ladder]') || (el.name === 'div' && $el.hasClass('wide') && $el.children('figure[data-ladder]').length === 1);
}

function objectLiteral(js, name) {
  const m = new RegExp(`var ${name} = (\\{[\\s\\S]*?\\n  \\});`).exec(js);
  if (!m) throw new Error(`retry-ladder: ${name} not found in explainer.js`);
  return vm.runInNewContext(`(${m[1]})`);
}

export function convert($, el, h) {
  const $f = $(el).is('figure') ? $(el) : $(el).children('figure[data-ladder]');
  const js = fs.readFileSync(path.join(path.dirname(path.resolve(process.argv[2])), 'explainer.js'), 'utf8');
  const OUTCOMES = objectLiteral(js, 'OUTCOMES');
  const DECISION = objectLiteral(js, 'DECISION');
  const limit = /var MAX_RETRIES = (\d+);/.exec(js)[1];
  const diagnosis = /var DIAGNOSIS_AT = (\d+);/.exec(js)[1];

  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [];
  rows.push([`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]);
  $f.find('.ladder__picks button').each((_, b) => {
    const o = OUTCOMES[$(b).attr('data-s')];
    rows.push([
      `<p>${h.inline(b)}</p>`,
      `<p>${o.fails}</p>`,
      o.decision ? `<p>${h.esc(DECISION[o.decision])}</p>` : '',
      `<p>${h.esc(o.end)}</p>`,
      `<p>${h.esc(o.verdict[1])}</p>`,
    ]);
  });
  rows.push([`<p>${h.inline($f.find('.lab__left > .lab__label').first())}</p>`, `<p>${h.inline($f.find('.lab__right > .lab__label').first())}</p>`]);
  const legend = $f.find('.pips__legend span').map((_, s) => `<li>${h.inline(s)}</li>`).get().join('');
  rows.push([`<ul>${legend}</ul>`]);
  rows.push([`<ul><li>limit: ${limit}</li><li>diagnosis: ${diagnosis}</li></ul>`]);
  rows.push([`<pre><code>${h.esc($f.find('.ladder__log').text())}</code></pre>`]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer retry-ladder', rows);
}
