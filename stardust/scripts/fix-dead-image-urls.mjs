#!/usr/bin/env node
/**
 * Points the old site's image URLs (https://www.jackzhaojin.com/writing/<slug>/images/<file>) in
 * content/ at the media copy EDS serves for the same bytes. They come from the GitHub Pages
 * site, where the files existed: the JSON-LD `image` and `thumbnailUrl` values carried over
 * verbatim, and 404 on www since the cutover (2026-10-26 SEO audit).
 *
 * For each old URL it hashes the original on gh.jackzhaojin.com and every media_ file the page
 * serves on www, and swaps in the www media URL whose bytes match. A URL without a match is left
 * alone and reported.
 *
 *   node stardust/scripts/fix-dead-image-urls.mjs [--write] content/writing/<slug>/index.html …
 */
import fs from 'fs';
import crypto from 'crypto';

const WWW = 'https://www.jackzhaojin.com';
const GH = 'https://gh.jackzhaojin.com';
const OLD = /https:\/\/www\.jackzhaojin\.com(\/writing\/[^/"]+\/)images\/([A-Za-z0-9._-]+\.(?:jpg|png|svg))/g;
const write = process.argv.includes('--write');
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));

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
  const page = olds[0].match(/\/writing\/[^/"]+\//)[0];
  const served = await (await fetch(`${WWW}${page}`)).text();
  const media = [...new Set([...served.matchAll(/media_[0-9a-f]+\.(?:jpg|png|svg)/g)].map((m) => m[0]))];
  const byHash = new Map();
  for (const m of media) byHash.set(await sha(`${WWW}${page}${m}`), `${WWW}${page}${m}`);
  for (const old of olds) {
    const want = await sha(old.replace(WWW, GH));
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
