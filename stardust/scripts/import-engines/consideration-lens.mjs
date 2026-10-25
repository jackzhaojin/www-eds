// Import engine for figure.lens (writing/2025-07-12-aem-headless-omnichannel-architecture): the
// consideration lens -> explainer (consideration-lens). Row shape:
// blocks/explainer/engines/consideration-lens.js.
// Each inline diagram is written out as an SVG image (xmlns added, plus a small light-theme
// stylesheet so the file reads on its own; the engine drops it when it draws the SVG inline) to
// stardust/.work/svg/<slug>/, for da-media-upload.mjs --scope writing/<slug> --dir <that folder>.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const STANDALONE = '<style>.lens__node rect{fill:#fff;stroke:#a39e94;stroke-width:1.2}.lens__node text{fill:#1c1a17;font-family:Inter,system-ui,sans-serif;font-weight:500}'
  + '.lens__edge{fill:none;stroke:#a39e94;stroke-width:1.4;marker-end:var(--m)}.lens__head{fill:#a39e94}.lens__elabel{fill:#6b665e;font:500 11px ui-monospace,monospace;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}'
  + '.lens__note{fill:#6b665e;font:400 11.5px ui-monospace,monospace}</style>';

export const match = ($, el) => el.name === 'figure' && $(el).is('[data-lens], .lens');

function writeSvg($, svg, file, slug) {
  const $s = $(svg).clone();
  $s.removeAttr('class');
  $s.attr('xmlns', 'http://www.w3.org/2000/svg');
  const [, , vw, vh] = ($s.attr('viewBox') || '').split(/\s+/);
  if (vw && vh) $s.attr('width', vw).attr('height', vh);
  $s.prepend(STANDALONE);
  const dir = path.join(ROOT, 'stardust/.work/svg', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), $.html($s));
}

export function convert($, el, h) {
  const $f = $(el);
  const bar = $f.find('.lens__bar').children('span').map((_, s) => `<p>${h.inline(s)}</p>`).get().join('');
  const name = $f.find('.lens__chips').attr('aria-label');
  const rows = [[`${bar}${name ? `<p><em>${h.esc(name)}</em></p>` : ''}`]];

  rows.push($f.find('.lens__sol').map((_, sol) => {
    const $sol = $(sol);
    const id = $sol.attr('data-sol');
    const imgs = $sol.find('svg').map((__, svg) => {
      const kind = $(svg).hasClass('lens__svg--tall') ? 'tall' : 'wide';
      const file = `lens-${id}-${kind}.svg`;
      writeSvg($, svg, file, h.slug);
      const alt = $(svg).find('title').first().text().trim();
      return `<p><img src="${h.MEDIA}/${file}" alt="${h.esc(alt)}"></p>`;
    }).get().join('');
    return `<p>${h.inline($sol.find('.lens__name'))}</p>${imgs}`;
  }).get());

  const $all = $f.find('.lens__all');
  rows.push([`<p>${h.inline($all.children('summary'))}</p>`]);
  rows.push($all.find('thead th').map((_, th) => `<p>${h.inline(th)}</p>`).get());
  const def = 'pushpull'; // explainer.js: show('pushpull')
  $all.find('tbody tr').each((_, tr) => {
    const $tr = $(tr);
    const label = h.inline($tr.children('th'));
    const cells = $tr.children('td').map((__, td) => {
      const ids = `${$(td).attr('data-n') || ''} ${$(td).attr('data-e') || ''}`.trim().split(/\s+/).filter(Boolean);
      return `<p>${h.inline(td)}</p>${ids.length ? `<p><code>${ids.join(' ')}</code></p>` : ''}`;
    }).get();
    rows.push([`<p>${$tr.attr('data-c') === def ? `<strong>${label}</strong>` : label}</p>`, ...cells]);
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer consideration-lens', rows);
}
