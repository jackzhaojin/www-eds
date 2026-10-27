#!/usr/bin/env node
/**
 * Points the old site's image URLs in content/ at the media copy EDS serves for the same bytes:
 * https://www.jackzhaojin.com/writing/<slug>/images/<file> (the JSON-LD `image` and
 * `thumbnailUrl` values that carried over verbatim) and /portfolio/assets/<path> (the portfolio
 * diagrams' open-full-size links). They come from the GitHub Pages site, where the files
 * existed, and 404 on www since the cutover (2026-10-26 SEO audit).
 *
 * For each old URL it hashes the original on gh.jackzhaojin.com and every media_ file the page
 * (the document's own web path) serves, and swaps in the www media URL whose bytes match. A URL
 * without a match is left alone and reported. --base reads the page from a preview host, for
 * a page not published yet; the URL written is www's either way.
 *
 *   node stardust/scripts/fix-dead-image-urls.mjs [--write] [--base <host>] content/<path>/index.html …
 */
import fs from 'fs';
import crypto from 'crypto';

const WWW = 'https://www.jackzhaojin.com';
const GH = 'https://gh.jackzhaojin.com';
const OLD = /https:\/\/www\.jackzhaojin\.com(?:\/writing\/[^/"]+\/images|\/portfolio\/assets(?:\/[A-Za-z0-9._-]+)*)\/[A-Za-z0-9._-]+\.(?:jpg|png|svg)(?:\?v=\d+)?/g;
const write = process.argv.includes('--write');
const at = process.argv.indexOf('--base');
const BASE = at > 0 ? process.argv[at + 1] : WWW;
const files = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--base');

const sha = async (url) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return crypto.createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex');
};

let left = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const olds = [...new Set([...html.matchAll(OLD)].map((m) => m[0]))];
  if (!olds.length) continue;
  const page = file.replace(/^.*?content/, '').replace(/index\.html$/, '');
  const served = await (await fetch(`${BASE}${page}`)).text();
  const media = [...new Set([...served.matchAll(/media_[0-9a-f]+\.(?:jpg|png|svg)/g)].map((m) => m[0]))];
  const byHash = new Map();
  for (const m of media) byHash.set(await sha(`${BASE}${page}${m}`), `${WWW}${page}${m}`);
  for (const old of olds) {
    const want = await sha(old.replace(WWW, GH).replace(/\?v=\d+$/, ''));
    const now = want && byHash.get(want);
    if (now) {
      html = html.split(old).join(now);
      console.log(`${page} ${old.split('/').pop()} -> ${now.split('/').pop()}`);
    } else {
      left += 1;
      console.log(`${page} ${old.split('/').pop()}: NO MATCH, left as is`);
    }
  }
  if (write) fs.writeFileSync(file, html);
}
console.log(`${write ? 'written' : 'dry run'}; ${left} left`);
