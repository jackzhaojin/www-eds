// Round trip for many documents: upload each local content/ file to /drafts/roundtrip/<path>,
// then (after each is opened in the editor) collect DA's copy and classify it with roundtrip-compare.mjs.
// Usage (from the www-eds root; <workdir> is any scratch folder):
//   node stardust/scripts/roundtrip-batch.mjs upload <workdir> [page.html…]  uploads those content/ files (default: all),
//                                                                           writes <workdir>/state.json
//   node stardust/scripts/roundtrip-batch.mjs urls <workdir> [n]          prints the next n editor URLs not yet saved
//   node stardust/scripts/roundtrip-batch.mjs collect <workdir>           reads DA's copies back; marks saved ones; classifies
// Token: the da-auth cache, never printed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [cmd, work, n] = process.argv.slice(2);
const here = path.dirname(new URL(import.meta.url).pathname);
const cache = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.aem/da-token.json'), 'utf8'));
if (cache.expires_at < Date.now() + 60000) throw new Error('da-auth token expired');
const auth = { Authorization: `Bearer ${cache.access_token}` };
const SRC = 'https://admin.da.live/source/jackzhaojin/www-eds/drafts/roundtrip';
const stateFile = path.join(work, 'state.json');
const load = () => JSON.parse(fs.readFileSync(stateFile, 'utf8'));
const save = (s) => fs.writeFileSync(stateFile, JSON.stringify(s, null, 1));

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

if (cmd === 'upload') {
  fs.mkdirSync(path.join(work, 'editor'), { recursive: true });
  const state = {};
  const only = process.argv.slice(4).map((x) => x.replace(/^content\//, ''));
  const picked = files('content').filter((f) => !only.length || only.includes(path.relative('content', f)));
  await Promise.all(picked.map(async (f) => {
    const rel = path.relative('content', f);
    const fd = new FormData();
    fd.append('data', new Blob([fs.readFileSync(f)], { type: 'text/html' }), path.basename(f));
    const put = await fetch(`${SRC}/${rel}`, { method: 'POST', headers: auth, body: fd });
    const head = await fetch(`${SRC}/${rel}`, { method: 'HEAD', headers: auth });
    state[rel] = { put: put.status, uploaded: head.headers.get('last-modified'), saved: false };
  }));
  save(state);
  const bad = Object.entries(state).filter(([, v]) => v.put >= 300);
  console.log(`uploaded ${Object.keys(state).length}, failed ${bad.length}`);
  bad.forEach(([k, v]) => console.log(`  ${k}: ${v.put}`));
} else if (cmd === 'urls') {
  const state = load();
  Object.entries(state).filter(([, v]) => !v.saved && !v.opened).slice(0, Number(n) || 6).forEach(([rel]) => {
    console.log(`https://da.live/edit#/jackzhaojin/www-eds/drafts/roundtrip/${rel.replace(/\.html$/, '')}`);
  });
} else if (cmd === 'collect') {
  const state = load();
  await Promise.all(Object.entries(state).map(async ([rel, v]) => {
    const r = await fetch(`${SRC}/${rel}`, { headers: auth });
    const lm = r.headers.get('last-modified');
    const out = path.join(work, 'editor', rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await r.text());
    v.lastModified = lm;
    v.saved = lm !== v.uploaded;
  }));
  const rows = [];
  for (const [rel, v] of Object.entries(state).sort()) {
    if (!v.saved) { rows.push([rel, 'not saved yet']); continue; }
    const res = spawnSync('node', [path.join(here, 'roundtrip-compare.mjs'), path.join('content', rel), path.join(work, 'editor', rel)], { encoding: 'utf8' });
    const content = /content: identical/.test(res.stdout);
    const markup = /markup after undoing known rewrites: identical/.test(res.stdout);
    const split = Number((/split links \(check the render\): (\d+)/.exec(res.stdout) || [])[1] || 0);
    v.split = split;
    v.verdict = content && markup ? (split ? 'pass-check-render' : 'pass') : content ? 'review-markup' : 'content-changed';
    v.report = res.stdout;
    rows.push([rel, v.verdict]);
  }
  save(state);
  const count = rows.reduce((a, [, x]) => ({ ...a, [x]: (a[x] || 0) + 1 }), {});
  console.log(JSON.stringify(count));
  rows.filter(([, x]) => x !== 'pass' && x !== 'not saved yet').forEach(([k, x]) => console.log(`  ${x}: ${k}`));
}
