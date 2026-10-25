#!/usr/bin/env node
// Writes a state file for gate-all.mjs over every captured page: each stardust/state.json page
// marked deployed, with its aem.live URL (same path on the EDS live origin). Pages whose EDS URL
// does not answer 200 are left out and listed. Usage: rollout-gate-state.mjs [out.json]
import fs from 'node:fs';

const out = process.argv[2] || 'stardust/rollout/gate-state.json';
const EDS = 'https://main--www-eds--jackzhaojin.aem.live';
const state = JSON.parse(fs.readFileSync('stardust/state.json', 'utf8'));
const pages = [];
const missing = [];
for (const p of state.pages) {
  const { pathname } = new URL(p.url);
  const liveUrl = `${EDS}${pathname}`;
  // eslint-disable-next-line no-await-in-loop
  const res = await fetch(liveUrl, { method: 'HEAD' });
  if (res.status === 200) pages.push({ slug: p.slug, url: p.url, type: p.type, status: 'deployed', liveUrl });
  else missing.push(`${pathname} ${res.status}`);
}
fs.mkdirSync(out.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify({ flow: 'replica', pages }, null, 1)}\n`);
console.log(`rollout-gate-state: ${pages.length} deployed pages -> ${out}`);
if (missing.length) console.log(`not on aem.live yet: ${missing.join(', ')}`);
