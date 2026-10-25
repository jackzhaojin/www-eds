// Import engine for figure.dg (writing/2025-10-05-mcp-server-for-eds-da-live): the redrawn scripted-flow
// board -> explainer (scripted-flow). Row shape: blocks/explainer/engines/scripted-flow.js.
// Each inline drawing is written out as an SVG image (xmlns and intrinsic size added, plus a small
// light-theme stylesheet so the file reads on its own; the engine drops it when it draws the SVG
// inline) to stardust/.work/svg/<slug>/, for da-media-upload.mjs --scope writing/<slug>.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const STANDALONE = '<style>.n rect{stroke-width:1.5}.n text{font:500 13px Inter,system-ui,sans-serif;fill:#1c1a17;text-anchor:middle;dominant-baseline:middle}'
  + '.n--fn rect{fill:#e6eef9;stroke:#2f6db5}.n--api rect{fill:#f8e7ea;stroke:#a8324f}.n--llm rect{fill:#ece9f8;stroke:#5b4bc4}.e{stroke:#57534d;stroke-width:1.5;fill:none}.head{fill:#57534d}</style>';

export const match = ($, el) => el.name === 'figure' && $(el).is('.dg');

export function convert($, el, h) {
  const $f = $(el);
  const dir = path.join(ROOT, 'stardust/.work/svg', h.slug);
  fs.mkdirSync(dir, { recursive: true });
  const imgs = $f.children('svg').map((i, svg) => {
    const $s = $(svg).clone();
    const kind = $s.hasClass('svg-tall') ? 'tall' : 'wide';
    const file = `scripted-flow-${kind}.svg`;
    $s.removeAttr('class');
    $s.attr('xmlns', 'http://www.w3.org/2000/svg');
    const [, , vw, vh] = ($s.attr('viewBox') || '').split(/\s+/);
    if (vw && vh) $s.attr('width', vw).attr('height', vh);
    $s.prepend(STANDALONE);
    fs.writeFileSync(path.join(dir, file), $.html($s));
    return `<p><img src="${h.MEDIA}/${file}" alt="${h.esc($(svg).find('title').first().text().trim())}"></p>`;
  }).get().join('');
  const legend = $f.find('.dg__legend li').map((_, li) => `<li>${h.inline(li)}</li>`).get().join('');
  const rows = [[imgs], [`<ul>${legend}</ul>`]];
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer scripted-flow', rows);
}
