// Import engine: figure.ff[data-ff] (writing/2026-01-29-playwright-stakeholder-demos) to
// explainer (freezeframe). The figure's text comes from the page; the caption times, clip
// lengths and settings come from the article's explainer.js (CAPTIONS, CLIP, RECORDED and
// the MIN_GAP / AUDIO_SHIFT values in render()), so they become rows of the block.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function match($, el) {
  return el.name === 'figure' && $(el).is('[data-ff]');
}

function literal(js, name) {
  const m = new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`).exec(js);
  if (!m) throw new Error(`freezeframe: ${name} not found in explainer.js`);
  return vm.runInNewContext(m[1]);
}

function num(js, re, name) {
  const m = re.exec(js);
  if (!m) throw new Error(`freezeframe: ${name} not found in explainer.js`);
  return m[1];
}

export function convert($, el, h) {
  const $f = $(el);
  const js = fs.readFileSync(path.join(path.dirname(path.resolve(process.argv[2])), 'explainer.js'), 'utf8');
  const captions = literal(js, 'CAPTIONS');
  const clips = literal(js, 'CLIP');
  const recorded = num(js, /const RECORDED = ([\d.]+);/, 'RECORDED');
  const gap = num(js, /const minGap = ([\d.]+);/, 'minGap');
  const shift = num(js, /const shift = (-?[\d.]+);/, 'shift');

  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [];
  rows.push([`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]);
  rows.push([
    `<p><strong>${h.esc($f.find('.ff__ctl b').first().text())}</strong></p>`,
    `<p>${h.inline($f.find('[data-reset]'))}</p>`,
  ]);
  const names = $f.find('.ff__name').map((_, n) => `<li>${h.esc($(n).text())}</li>`).get().join('');
  const legend = $f.find('.ff__legend span').map((_, n) => `<li>${h.esc($(n).text())}</li>`).get().join('');
  rows.push([`<ul>${names}</ul>`, `<ul>${legend}</ul>`]);
  const holds = $f.find('.ff__list li').map((_, li) => `<li>${h.inline(li)}</li>`).get().join('');
  rows.push([`<p>${h.inline($f.find('.ff__summary'))}</p><ol>${holds}</ol>`]);
  rows.push([`<ul><li>recorded: ${recorded}</li><li>gap: ${gap}</li><li>shift: ${shift}</li></ul>`]);
  captions.forEach(([t, text], i) => rows.push([`<p>${t}</p>`, `<p>${clips[i]}</p>`, `<p>${h.esc(text)}</p>`]));
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer freezeframe', rows);
}
