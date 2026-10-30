// Builds the site's two Experience Workspace sheets from files in this folder and the content
// tree, and optionally sends them to DA and previews and publishes them:
//   /redirects  every folder page without its trailing slash and as .../index.html -> the
//               folder URL (as GitHub Pages serves them), plus redirects-extra.tsv, whose rows
//               win over a folder page's (an unpublished page that now redirects elsewhere);
//   /metadata   bulk metadata from metadata.tsv (first row is the header).
//
// Usage: node hlx-config/sheets.mjs [--upload] [--publish]
// Token: DA_TOKEN, else the da-auth cache (~/.aem/da-token.json). Never printed.
// Writes: hlx-config/sheets/redirects.json, hlx-config/sheets/metadata.json
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const ORG = process.env.ORG || 'jackzhaojin';
const SITE = process.env.SITE || 'www-eds';
const REF = process.env.REF || 'main';
const args = new Set(process.argv.slice(2));

const tsv = (file) => {
  const [head, ...lines] = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim());
  const cols = head.split('\t');
  return lines.map((l) => {
    const values = l.split('\t');
    return Object.fromEntries(cols.map((c, i) => [c, values[i] ?? '']));
  });
};

function folderPages(dir, base = '') {
  const out = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    if (e.isDirectory()) out.push(...folderPages(path.join(dir, e.name), `${base}/${e.name}`));
    else if (e.name === 'index.html') out.push(`${base}/`);
  });
  return out;
}

// content/ keeps example pages only since 2026-10-28 (DA is the source of truth), so the folder
// pages are the published ones (the query index) and any local page not published yet.
const index = await fetch(`https://${REF}--${SITE}--${ORG}.aem.live/query-index.json?limit=2000`);
if (!index.ok) throw new Error(`the query index answered ${index.status}`);
const published = (await index.json()).data.map((page) => page.path).filter((p) => p.endsWith('/'));
const pages = [...new Set([...published, ...folderPages(path.join(root, 'content'))])].sort();
const extra = tsv(path.join(here, 'redirects-extra.tsv'));
const overridden = new Set(extra.map((r) => r.Source));
const redirects = [
  ...pages.flatMap((p) => (p === '/'
    ? [{ Source: '/index.html', Destination: '/' }]
    : [{ Source: p.slice(0, -1), Destination: p }, { Source: `${p}index.html`, Destination: p }]))
    .filter((r) => !overridden.has(r.Source)),
  ...extra,
];
const metadata = tsv(path.join(here, 'metadata.tsv'));

const sheet = (data) => ({
  total: data.length, limit: data.length, offset: 0, data, ':type': 'sheet',
});
const outDir = path.join(here, 'sheets');
fs.mkdirSync(outDir, { recursive: true });
const files = { redirects: sheet(redirects), metadata: sheet(metadata) };
Object.entries(files).forEach(([name, body]) => {
  fs.writeFileSync(path.join(outDir, `${name}.json`), `${JSON.stringify(body, null, 2)}\n`);
  console.log(`sheets: ${name}.json, ${body.total} rows`);
});

if (args.has('--upload') || args.has('--publish')) {
  let token = process.env.DA_TOKEN;
  if (!token) {
    const cache = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.aem/da-token.json'), 'utf8'));
    if (cache.expires_at < Date.now() + 60000) throw new Error('the da-auth token has expired: sign in again');
    token = cache.access_token;
  }
  const auth = { Authorization: `Bearer ${token}` };
  for (const [name, body] of Object.entries(files)) {
    if (args.has('--upload')) {
      const fd = new FormData();
      fd.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }), `${name}.json`);
      // eslint-disable-next-line no-await-in-loop
      const r = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/${name}.json`, { method: 'POST', headers: auth, body: fd });
      console.log(`upload /${name}.json: ${r.status}`);
      if (!r.ok) process.exitCode = 1;
    }
    if (args.has('--publish')) {
      for (const step of ['preview', 'live']) {
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(`https://admin.hlx.page/${step}/${ORG}/${SITE}/${REF}/${name}.json`, { method: 'POST', headers: auth });
        console.log(`${step} /${name}.json: ${r.status}`);
        if (!r.ok) process.exitCode = 1;
      }
    }
  }
}
