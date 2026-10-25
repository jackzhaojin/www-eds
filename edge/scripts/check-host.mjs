#!/usr/bin/env node
/*
 * The routing check for a host the Worker serves (routing-cloudflare.md, "Staging"): every
 * sitemap page is EDS and answers 200, every project site answers 200 from GitHub Pages, the
 * root files are served, /drafts/ and the unmigrated round are 404s, and the legacy pages
 * redirect (pending the redirects config until it exists).
 *
 *   node scripts/check-host.mjs --base https://next.jackzhaojin.com   after a staging deploy
 *   node scripts/check-host.mjs --local staging                         the Worker in-process
 *
 * --local runs src/index.mjs in this process with that environment's vars from wrangler.toml,
 * fetching the real origins (aem.live and www): the same code path without Cloudflare.
 * Exit 1 when any check fails.
 */
import worker from '../src/index.mjs';
import { PROJECT_SITES } from '../src/routes.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const local = opt('--local');
const ENVS = {
  staging: { host: 'next.jackzhaojin.com', vars: { ORIGIN_HOSTNAME: 'main--www-eds--jackzhaojin.aem.live', PROJECT_ORIGIN: 'https://www.jackzhaojin.com', PUSH_INVALIDATION: 'disabled' } },
  www: { host: 'www.jackzhaojin.com', vars: { ORIGIN_HOSTNAME: 'main--www-eds--jackzhaojin.aem.live', PROJECT_ORIGIN: 'passthrough' } },
};
const base = local ? `https://${ENVS[local].host}` : (opt('--base') || 'https://next.jackzhaojin.com');

async function get(path) {
  const url = `${base}${path}`;
  if (!local) return fetch(url, { redirect: 'manual' });
  const req = new Request(url, { headers: { host: ENVS[local].host }, redirect: 'manual' });
  return worker.fetch(req, ENVS[local].vars, {});
}

let failed = 0;
const line = (ok, label, detail = '') => {
  if (ok === false) failed += 1;
  const tag = ok === null ? 'wait' : (ok ? 'ok  ' : 'FAIL');
  console.log(`  ${tag} ${label}${detail ? `  ${detail}` : ''}`);
};

const sitemap = await (await fetch('https://www.jackzhaojin.com/sitemap.xml')).text();
const pages = [...sitemap.matchAll(/<loc>https:\/\/www\.jackzhaojin\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
console.log(`check-host: ${base}${local ? ` (Worker in-process, env ${local})` : ''}`);

console.log(`1. ${pages.length} sitemap pages: 200 from Edge Delivery`);
for (const path of pages) {
  // eslint-disable-next-line no-await-in-loop
  const res = await get(path);
  // eslint-disable-next-line no-await-in-loop
  const html = res.status === 200 ? await res.text() : '';
  line(res.status === 200 && html.includes('/scripts/aem.js'), path, res.status === 200 ? '' : String(res.status));
}

console.log(`2. ${PROJECT_SITES.length} project sites: 200 from GitHub Pages`);
for (const repo of PROJECT_SITES) {
  // eslint-disable-next-line no-await-in-loop
  let res = await get(`/${repo}/`);
  if ([301, 302].includes(res.status) && !local) res = await fetch(res.headers.get('location'));
  // eslint-disable-next-line no-await-in-loop
  const html = res.status === 200 ? await res.text() : '';
  line(res.status === 200 && !html.includes('/scripts/aem.js'), `/${repo}/`, String(res.status));
}

console.log('3. root files');
for (const path of ['/google57906613577fdd42.html', '/BingSiteAuth.xml', '/robots.txt', '/sitemap.xml', '/llms.txt', '/favicon.ico']) {
  // eslint-disable-next-line no-await-in-loop
  const res = await get(path);
  line(res.status === 200, path, String(res.status));
}

console.log('4. not served');
for (const path of ['/drafts/anything', '/design-systems/2026-09-13/']) {
  // eslint-disable-next-line no-await-in-loop
  const res = await get(path);
  line(res.status === 404, path, String(res.status));
}

console.log('5. legacy pages (redirects config, pending Jack)');
for (const [path, to] of [['/blogs.html', '/writing/'], ['/certifications.html', '/certifications/']]) {
  // eslint-disable-next-line no-await-in-loop
  const res = await get(path);
  const loc = res.headers.get('location') || '';
  const done = [301, 302, 308].includes(res.status) && loc.endsWith(to);
  line(done ? true : null, `${path} -> ${to}`, done ? '' : `${res.status}, redirect not configured yet`);
}

console.log(failed ? `check-host: FAIL (${failed})` : 'check-host: PASS');
process.exit(failed ? 1 : 0);
