// Copies the per-page SEO head of each source page into its Experience Workspace document's
// metadata block, so EDS renders the same tags as www: the HTML title (head > title, never an
// inline SVG's title), the JSON-LD graph (metadata json-ld, rendered server-side), og:image:alt
// and the article tags (article:published_time, article:modified_time, article:author). Other
// metadata rows are kept as they are; a row this script owns is replaced in place.
//
// Usage: node stardust/scripts/sync-head-metadata.mjs <source-root> <content-dir> [--dry-run]
// Prints one line per document it changed.
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const [srcRoot, contentDir] = process.argv.slice(2);
const dry = process.argv.includes('--dry-run');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function docs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return docs(p);
    return e.name === 'index.html' ? [p] : [];
  });
}

/** The rows this script owns, read from the source page's head. */
function headRows(html) {
  const $ = cheerio.load(html);
  const meta = (n) => $(`head meta[name="${n}"], head meta[property="${n}"]`).attr('content') || '';
  const rows = [['title', $('head > title').first().text().trim()]];
  const ld = $('script[type="application/ld+json"]').first().html();
  if (ld) rows.push(['json-ld', JSON.stringify(JSON.parse(ld))]);
  ['og:image:alt', 'article:published_time', 'article:modified_time', 'article:author']
    .forEach((n) => { if (meta(n)) rows.push([n, meta(n)]); });
  return rows.filter(([, v]) => v);
}

/** Start and end offsets of the document's metadata block (the last one). */
function metadataBlock(html) {
  const start = html.lastIndexOf('<div class="metadata">');
  if (start < 0) return null;
  let depth = 0;
  const tag = /<(\/?)div\b[^>]*>/g;
  tag.lastIndex = start;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return [start, m.index + m[0].length];
  }
  return null;
}

const row = (k, v) => `<div><div><p>${esc(k)}</p></div><div><p>${esc(v)}</p></div></div>`;

docs(contentDir).forEach((file) => {
  const rel = path.relative(contentDir, path.dirname(file));
  const src = path.join(srcRoot, rel, 'index.html');
  if (!fs.existsSync(src)) return;
  const html = fs.readFileSync(file, 'utf8');
  const at = metadataBlock(html);
  if (!at) return;
  let block = html.slice(at[0], at[1]);
  const changed = [];
  headRows(fs.readFileSync(src, 'utf8')).forEach(([k, v]) => {
    const re = new RegExp(`<div><div><p>${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p></div><div>.*?</div></div>`);
    const next = row(k, v);
    if (re.test(block)) {
      const before = block;
      block = block.replace(re, () => next);
      if (block !== before) changed.push(k);
    } else {
      block = `${block.slice(0, -'</div>'.length)}${next}</div>`;
      changed.push(k);
    }
  });
  const out = html.slice(0, at[0]) + block + html.slice(at[1]);
  if (out === html) return;
  if (!dry) fs.writeFileSync(file, out);
  console.log(`${dry ? 'would sync' : 'synced'} /${rel}: ${changed.join(', ')}`);
});
