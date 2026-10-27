#!/usr/bin/env node
/**
 * indexnow.mjs - tells the IndexNow search engines (Bing, which feeds Copilot, and Yandex, Naver,
 * Seznam, Yep; Google doesn't take part) which www pages a publish changed. deploy-batch.mjs calls
 * it after every batch that publishes; it also runs on its own.
 *
 * The key is the file at the site root, `<key>.txt`, whose content is the key itself (IndexNow's
 * proof that the site owns it). It's a code file, so it's served from main.
 *
 *   node stardust/scripts/deploy/indexnow.mjs /writing/<slug>/ /talks/<id>/ ...
 *   node stardust/scripts/deploy/indexnow.mjs --paths <file>   (web paths, one per line)
 *
 * Exit 0 when the engines accepted the list (200, or 202 while they check the key), 1 otherwise.
 * SEO and GEO audit, finding 16 (ai-docs/2026-10-26-seo-geo-audit/).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const HOST = 'www.jackzhaojin.com';
export const KEY = 'b102bdc9486813820d648c5fff4073ff';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * The www URL of a document's web path (`/writing/x/index` is `/writing/x/`), or null for paths
 * search engines never get: fragments, the block library, drafts, sheets.
 * @param {string} webPath A DA document path without .html, or a page path
 */
export function pageUrl(webPath) {
  const path = webPath.startsWith('/') ? webPath : `/${webPath}`;
  if (/(^|\/)(nav|footer)$/.test(path) || /^\/(docs|drafts)\//.test(path) || /\.json$/.test(path)) return null;
  return `https://${HOST}${path.replace(/(^|\/)index$/, '$1')}`;
}

/**
 * Submits the pages; returns { status, count }. Never throws on a network error: a publish
 * already succeeded, so a failed ping is reported, not fatal.
 * @param {string[]} webPaths Web paths (document paths or page paths)
 */
export async function submit(webPaths) {
  const urlList = [...new Set(webPaths.map(pageUrl).filter(Boolean))];
  if (!urlList.length) return { status: 0, count: 0 };
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList,
      }),
    });
    return { status: res.status, count: urlList.length, text: res.ok ? '' : (await res.text()).slice(0, 200) };
  } catch (e) {
    return { status: 0, count: urlList.length, text: e.message };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--paths');
  const paths = i >= 0
    ? (await readFile(args[i + 1], 'utf8')).split('\n').map((s) => s.trim()).filter(Boolean)
    : args;
  const r = await submit(paths);
  console.log(`[indexnow] ${r.count} URLs: HTTP ${r.status}${r.text ? ` ${r.text}` : ''}`);
  process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
}
