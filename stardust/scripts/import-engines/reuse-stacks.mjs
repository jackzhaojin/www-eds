// Import engine: figure.ru[data-reuse] (writing/2026-02-05-reusable-ai-development-modules) to
// explainer (reuse-stacks). The bar, picks, static result and caption come from the page; the
// pieces come from the stage's widest column (the bottom piece first) and the box notes from
// the article's explainer.js (the "built here" and "reused" tags in render()).
import fs from 'node:fs';
import path from 'node:path';

export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-reuse]');
}

export function convert($, el, h) {
  const $f = $(el);
  const js = fs.readFileSync(path.join(path.dirname(path.resolve(process.argv[2])), 'explainer.js'), 'utf8');
  const tag = /kind === 'built' \? '([^']+)' : '([^']+)'/.exec(js);
  if (!tag) throw new Error('reuse-stacks: box notes not found in explainer.js');
  const pieces = /const PIECES = \[([\s\S]*?)\];/.exec(js);
  if (!pieces) throw new Error('reuse-stacks: PIECES not found in explainer.js');
  const names = [...pieces[1].matchAll(/name: '([^']+)'/g)].map((m) => m[1]);

  const rows = [];
  rows.push([`<p>${h.inline($f.find('.lab__bar span').first())}</p>`]);
  const chips = $f.find('.chips button').map((_, b) => `<li>${h.inline(b)}</li>`).get().join('');
  rows.push([`<p>${h.inline($f.find('.ru__label').first())}</p><ul>${chips}</ul>`]);
  rows.push([
    `<ol>${names.map((n) => `<li>${h.esc(n)}</li>`).join('')}</ol>`,
    `<ul><li>${h.esc(tag[1])}</li><li>${h.esc(tag[2])}</li></ul>`,
  ]);
  rows.push([`<p>${h.inline($f.find('.ru__static'))}</p>`]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer reuse-stacks', rows);
}
