#!/usr/bin/env node
/**
 * SEO check of every sitemap page on a host: the head tags, the JSON-LD, and every URL they or the
 * page links point at on the site. Written for the 2026-10-26 SEO and GEO audit
 * (ai-docs/2026-10-26-seo-geo-audit/); run it after a publish that touches metadata or links.
 *
 *   node stardust/scripts/seo-check.mjs [--base https://www.jackzhaojin.com] [--out report.json]
 *
 * Prints one line per page that fails a check, then the totals. Exit 1 when anything fails:
 * - the page isn't 200, has no title, description or self canonical, or has more than one h1;
 * - a JSON-LD block doesn't parse;
 * - a JSON-LD URL, og:image or twitter:image on the site doesn't answer 200;
 * - an internal link (main, nav, footer) doesn't answer 200 or a redirect.
 * External links aren't checked (GitHub rate-limits them).
 */
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cheerio = require('cheerio');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg('--base', 'https://www.jackzhaojin.com');
const OUT = arg('--out');
const SITE = 'https://www.jackzhaojin.com';
const local = (u) => u.replace(SITE, BASE);

const statusCache = new Map();
async function status(url) {
  if (!statusCache.has(url)) {
    statusCache.set(url, fetch(url, { redirect: 'manual' }).then((r) => r.status, () => 0));
  }
  return statusCache.get(url);
}

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => local(m[1]));
const fragments = ['/nav.plain.html', '/footer.plain.html'].map((p) => `${BASE}${p}`);
const rows = [];
let failures = 0;

for (const url of [...pages, ...fragments]) {
  const res = await fetch(url, { redirect: 'manual' });
  const $ = cheerio.load(await res.text());
  const path = url.replace(BASE, '');
  const problems = [];
  const fragment = path.endsWith('.plain.html');
  if (res.status !== 200) problems.push(`status ${res.status}`);
  if (!fragment) {
    if (!$('title').text().trim()) problems.push('no title');
    if (!$('meta[name="description"]').attr('content')) problems.push('no description');
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    if (local(canonical) !== url) problems.push(`canonical ${canonical || 'missing'}`);
    if ($('h1').length !== 1) problems.push(`${$('h1').length} h1`);
  }

  const assets = new Set();
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      JSON.stringify(JSON.parse($(el).text()), (key, value) => {
        if (typeof value === 'string' && value.startsWith(`${SITE}/`) && !value.includes('#')) assets.add(value);
        return value;
      });
    } catch {
      problems.push('JSON-LD does not parse');
    }
  });
  $('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) => assets.add($(el).attr('content')));
  for (const asset of assets) {
    const s = await status(local(asset));
    if (s !== 200) problems.push(`${s} ${asset.replace(SITE, '')}`);
  }

  const links = new Set();
  $(fragment ? 'a[href]' : 'main a[href]').each((_, a) => {
    try {
      const u = new URL($(a).attr('href'), url);
      if (u.origin !== new URL(BASE).origin && u.origin !== SITE) return;
      u.hash = '';
      links.add(local(u.href));
    } catch { /* not a URL */ }
  });
  for (const link of links) {
    const s = await status(link);
    if (s !== 200 && !(s >= 301 && s <= 308)) problems.push(`link ${s} ${link.replace(BASE, '')}`);
  }

  rows.push({ path, assets: assets.size, links: links.size, problems });
  if (problems.length) {
    failures += problems.length;
    console.log(`${path}\n  ${problems.join('\n  ')}`);
  }
}

if (OUT) fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
const assetTotal = rows.reduce((n, r) => n + r.assets, 0);
console.log(`${rows.length} pages and fragments, ${assetTotal} JSON-LD and social image URLs, ${statusCache.size} URLs checked: ${failures} problems`);
process.exit(failures ? 1 : 0);
