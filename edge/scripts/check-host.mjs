#!/usr/bin/env node
/*
 * The routing check for a host the Worker serves (routing-cloudflare.md, "Staging"): every
 * sitemap page is EDS and answers 200, every project site answers 200 from GitHub Pages, the
 * root files are served, /drafts/ and the unmigrated round are 404s, and the legacy pages
 * redirect. On gh (the GitHub Pages site) every sitemap page comes from GitHub Pages instead
 * and a folder redirect stays on gh. Every host but www answers noindex.
 *
 *   node scripts/check-host.mjs --base https://eds.jackzhaojin.com    after a staging deploy
 *   node scripts/check-host.mjs --base https://gh.jackzhaojin.com     after a gh deploy
 *   node scripts/check-host.mjs --local staging|gh|www                 the Worker in-process
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
  staging: { host: 'eds.jackzhaojin.com', vars: { ORIGIN_HOSTNAME: 'main--www-eds--jackzhaojin.aem.live', PROJECT_ORIGIN: 'https://www.jackzhaojin.com', PUSH_INVALIDATION: 'disabled' } },
  gh: { host: 'gh.jackzhaojin.com', vars: { MODE: 'github', GITHUB_ORIGIN: 'https://www.jackzhaojin.com' } },
  www: { host: 'www.jackzhaojin.com', vars: { ORIGIN_HOSTNAME: 'main--www-eds--jackzhaojin.aem.live', PROJECT_ORIGIN: 'passthrough', INDEXABLE: 'true', PUSH_INVALIDATION: 'disabled' } },
};
const base = local ? `https://${ENVS[local].host}` : (opt('--base') || 'https://eds.jackzhaojin.com');
const host = new URL(base).host;
const github = local ? ENVS[local].vars.MODE === 'github' : host.startsWith('gh.');
const indexable = local ? ENVS[local].vars.INDEXABLE === 'true' : host === 'www.jackzhaojin.com';

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

console.log(`1. ${pages.length} sitemap pages: 200 from ${github ? 'GitHub Pages' : 'Edge Delivery'}`);
for (const path of pages) {
  // eslint-disable-next-line no-await-in-loop
  const res = await get(path);
  // eslint-disable-next-line no-await-in-loop
  const html = res.status === 200 ? await res.text() : '';
  line(res.status === 200 && html.includes('/scripts/aem.js') !== github, path, res.status === 200 ? '' : String(res.status));
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

console.log(`3. root files${indexable ? '' : ' (robots.txt and the sitemap are 404s off www)'}`);
for (const path of ['/google57906613577fdd42.html', '/BingSiteAuth.xml', '/robots.txt', '/sitemap.xml', '/llms.txt', '/favicon.ico']) {
  // eslint-disable-next-line no-await-in-loop
  const res = await get(path);
  const crawlerFile = ['/robots.txt', '/sitemap.xml'].includes(path);
  if (!crawlerFile || indexable) {
    line(res.status === 200, path, String(res.status));
  } else if (path === '/robots.txt' && res.status === 200) {
    // The zone's managed robots.txt (AI Crawl Control) answers in place of the Worker's 404:
    // its content-signals comments carry no rule and no sitemap, which crawlers read as a 404.
    // eslint-disable-next-line no-await-in-loop
    const rules = (await res.text()).split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    line(rules.length === 0, path, rules.length ? `200 with rules: ${rules.join(' | ')}` : '200, Cloudflare managed, no rules');
  } else {
    line(res.status === 404, path, String(res.status));
  }
}

if (github) {
  console.log('4. a folder without its slash redirects on gh');
  const res = await get('/writing');
  const loc = res.headers.get('location') || '';
  line([301, 302, 308].includes(res.status) && loc === `${base}/writing/`, '/writing -> /writing/', `${res.status} ${loc}`);
} else {
  console.log('4. not served');
  for (const path of ['/drafts/anything', '/design-systems/2026-09-13/']) {
    // eslint-disable-next-line no-await-in-loop
    const res = await get(path);
    line(res.status === 404, path, String(res.status));
  }

  console.log('5. legacy pages and folders redirect (the redirects sheet)');
  for (const [path, to] of [['/blogs.html', '/writing/'], ['/certifications.html', '/certifications/'], ['/writing', '/writing/']]) {
    // eslint-disable-next-line no-await-in-loop
    const res = await get(path);
    const loc = res.headers.get('location') || '';
    const done = [301, 302, 308].includes(res.status) && loc.endsWith(to);
    line(done, `${path} -> ${to}`, done ? '' : `${res.status} ${loc}`);
  }
}

console.log(`6. search engines: ${indexable ? 'indexable (no x-robots-tag)' : 'noindex on every response'}`);
for (const path of ['/', pages.find((p) => p.startsWith('/writing/2')) || '/writing/', `/${PROJECT_SITES[0]}/`, '/llms.txt']) {
  // eslint-disable-next-line no-await-in-loop
  const res = await get(path);
  const tag = res.headers.get('x-robots-tag');
  line(indexable ? !tag : /noindex/.test(tag || ''), path, tag || 'none');
}

console.log(failed ? `check-host: FAIL (${failed})` : 'check-host: PASS');
process.exit(failed ? 1 : 0);
