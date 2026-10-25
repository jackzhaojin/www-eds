// Import engine: figure.skl[data-skilllab] (writing/2026-05-17-adobe-eds-skills-hands-on) to
// explainer (skill-tracker). The lines, the static spans, tags and note, and the caption come
// from the page; the built-in commands come from the article's explainer.js (BUILTIN_COMMANDS).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function match($, el) {
  const $el = $(el);
  return $el.is('figure[data-skilllab]') || (el.name === 'div' && $el.hasClass('wide') && $el.children('figure[data-skilllab]').length === 1);
}

export function convert($, el, h) {
  const $f = $(el).is('figure') ? $(el) : $(el).children('figure[data-skilllab]');
  const js = fs.readFileSync(path.join(path.dirname(path.resolve(process.argv[2])), 'explainer.js'), 'utf8');
  const m = /var BUILTIN_COMMANDS = new Set\((\[[\s\S]*?\])\);/.exec(js);
  if (!m) throw new Error('skill-tracker: BUILTIN_COMMANDS not found in explainer.js');
  const builtin = vm.runInNewContext(m[1]);

  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [];
  rows.push([`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]);
  const left = $f.find('.lab__left');
  const lines = left.find('.skl__lines li').map((_, li) => `<li><strong>${h.inline($(li).find('b'))}</strong><code>${h.esc($(li).find('code').text())}</code></li>`).get().join('');
  rows.push([`<p>${h.inline(left.children('.lab__label').first())}</p><ul>${lines}</ul>`]);
  const right = $f.find('.lab__right');
  const labels = right.children('.lab__label');
  const spans = right.find('.skl__spans li').map((_, li) => {
    const note = $(li).children('span').text();
    return `<li><code>${h.esc($(li).children('code').text())}</code>${note ? ` ${h.esc(note)}` : ''}</li>`;
  }).get().join('');
  rows.push([`<p>${h.inline(labels.eq(0))}</p><ul>${spans}</ul><p>${h.inline(labels.eq(1))}</p><pre><code>${h.esc(right.find('.skl__tags').text())}</code></pre><p>${h.inline(right.find('.skl__note'))}</p>`]);
  rows.push([`<ul><li>built-in commands: ${h.esc(builtin.join(', '))}</li></ul>`]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer skill-tracker', rows);
}
