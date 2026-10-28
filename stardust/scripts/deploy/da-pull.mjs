#!/usr/bin/env node
/**
 * Pulls documents from DA into content/, at their DA paths. Since 2026-10-28 DA is the source of
 * truth for the content and content/ keeps example pages only (content/README.md): pull a page
 * before editing it, or the source pages build-block-library.mjs reads before rebuilding the
 * library. Pulled pages that aren't examples stay out of git (.gitignore).
 *
 *   node stardust/scripts/deploy/da-pull.mjs /writing/<slug>/ [more pages]   page paths, as on www
 *   node stardust/scripts/deploy/da-pull.mjs writing/<slug>/index.html         or DA document paths
 *   node stardust/scripts/deploy/da-pull.mjs --library    every page build-block-library.mjs reads
 *   node stardust/scripts/deploy/da-pull.mjs --list writing    what DA has in a folder
 *
 * A local copy whose content differs from DA's (stardust/scripts/roundtrip-compare.mjs) may hold
 * an edit that isn't pushed yet: it is left alone and reported, unless --force. A copy that
 * differs only in markup is replaced by DA's.
 * Token: DA_TOKEN, else the da-auth cache (~/.aem/da-token.json). Never printed.
 * Run from the www-eds root. Exit 1 when a document can't be pulled or was left alone.
 */
/* eslint-disable no-console, no-restricted-syntax, no-continue -- a dev script: it reports to the
   console and walks documents in loops */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORG = 'jackzhaojin';
const REPO = 'www-eds';
const CONTENT = 'content';
const LIBRARY = 'stardust/scripts/build-block-library.mjs';
const args = process.argv.slice(2);
const force = args.includes('--force');

function token() {
  if (process.env.DA_TOKEN) return process.env.DA_TOKEN;
  try {
    const cache = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.aem/da-token.json'), 'utf8'));
    if (cache.expires_at > Date.now() + 60000) return cache.access_token;
  } catch { /* no cache */ }
  console.error('da-pull: no valid DA token. Jack signs in: npx github:adobe-rnd/da-auth-helper token >/dev/null');
  return process.exit(1);
}
const headers = { Authorization: `Bearer ${token()}` };

/** A page path (/writing/x/, /, /nav) or a DA path (writing/x/index) as a document path. */
function documentPath(input) {
  let p = input.replace(/^\/+/, '');
  if (p === '' || p.endsWith('/')) p += 'index';
  return p.endsWith('.html') || p.endsWith('.json') ? p : `${p}.html`;
}

/** The pages build-block-library.mjs copies its examples from: its `from:` entries. */
function librarySources() {
  const src = fs.readFileSync(LIBRARY, 'utf8');
  const named = {
    DS: src.match(/const DS = '([^']+)'/)[1],
    PF: src.match(/const PF = '([^']+)'/)[1],
    HOME: src.match(/const HOME = '([^']+)'/)[1],
  };
  return [...new Set([...src.matchAll(/from: (?:W\('([^']+)'\)|(DS|PF|HOME)\b|'([^']+)')/g)]
    .map(([, slug, name, literal]) => (slug ? `writing/${slug}/index.html` : literal || named[name])))];
}

if (args[0] === '--list') {
  const folder = (args[1] || '').replace(/^\/+|\/+$/g, '');
  const res = await fetch(`https://admin.da.live/list/${ORG}/${REPO}/${folder}`, { headers });
  if (!res.ok) { console.error(`da-pull: list ${folder}: HTTP ${res.status}`); process.exit(1); }
  (await res.json()).forEach((item) => console.log(`${item.ext ? '' : 'dir '}${item.path.replace(`/${ORG}/${REPO}/`, '')}`));
  process.exit(0);
}

const paths = args.includes('--library') ? librarySources() : args.filter((a) => !a.startsWith('--')).map(documentPath);
if (!paths.length) { console.error('da-pull: name the pages to pull, or --library, or --list <folder>'); process.exit(1); }

let failed = 0;
for (const doc of paths) {
  const local = path.join(CONTENT, doc);
  // eslint-disable-next-line no-await-in-loop
  const res = await fetch(`https://admin.da.live/source/${ORG}/${REPO}/${doc}`, { headers });
  if (!res.ok) { console.log(`  FAIL ${doc}: HTTP ${res.status}`); failed += 1; continue; }
  // eslint-disable-next-line no-await-in-loop
  const body = Buffer.from(await res.arrayBuffer());
  let verdict = 'new';
  if (fs.existsSync(local)) {
    if (fs.readFileSync(local).equals(body)) { console.log(`  same ${doc}`); continue; }
    const tmp = path.join(os.tmpdir(), `da-pull-${process.pid}.html`);
    fs.writeFileSync(tmp, body);
    const compare = spawnSync('node', ['stardust/scripts/roundtrip-compare.mjs', local, tmp], { encoding: 'utf8' });
    fs.rmSync(tmp, { force: true });
    const sameContent = /content: identical/.test(compare.stdout);
    if (!sameContent && !force && doc.endsWith('.html')) {
      console.log(`  KEPT ${doc}: its content differs from DA's (an edit not pushed yet?); --force takes DA's`);
      failed += 1;
      continue;
    }
    verdict = sameContent ? 'markup' : 'replaced';
  }
  fs.mkdirSync(path.dirname(local), { recursive: true });
  fs.writeFileSync(local, body);
  console.log(`  ${verdict.padEnd(8)} ${doc}`);
}
console.log(`da-pull: ${paths.length - failed} of ${paths.length} in ${CONTENT}/`);
process.exit(failed ? 1 : 0);
