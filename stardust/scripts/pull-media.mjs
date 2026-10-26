// Pulls DA media files into content/media/ (same path as in DA) and checks each one against the
// copy the site delivers: images line up by position between a document's DA HTML (content/) and
// its delivered .plain.html, and a media_ URL without options returns the original bytes.
// Usage (from the www-eds root): node stardust/scripts/pull-media.mjs <file listing media/... paths> <report.json>
// Token: the da-auth cache, never printed.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const cheerio = createRequire(`${process.cwd()}/`)('cheerio');
const [listFile, reportFile] = process.argv.slice(2);
const cache = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.aem/da-token.json'), 'utf8'));
if (cache.expires_at < Date.now() + 60000) throw new Error('da-auth token expired');
const auth = { Authorization: `Bearer ${cache.access_token}` };
const DA = 'https://content.da.live/jackzhaojin/www-eds/';
const LIVE = 'https://main--www-eds--jackzhaojin.aem.live';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

function docs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'media' ? [] : docs(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

const wanted = fs.readFileSync(listFile, 'utf8').split('\n').filter(Boolean);
// where each wanted file is delivered: document -> position of its <img>
const delivered = {};
for (const f of docs('content')) {
  // the metadata block's image becomes a meta tag, so it never appears in the delivered body
  const $doc = cheerio.load(fs.readFileSync(f, 'utf8'));
  const imgs = $doc('main img').filter((i, el) => !$doc(el).closest('.metadata').length).map((i, el) => el.attribs.src).get();
  if (!imgs.some((s) => wanted.includes(s.replace(DA, '')))) continue;
  const web = `/${path.relative('content', f)}`.replace(/index\.html$/, '').replace(/\.html$/, '');
  // eslint-disable-next-line no-await-in-loop
  const html = await (await fetch(`${LIVE}${web === '/' ? '/' : web}${web.endsWith('/') ? 'index' : ''}.plain.html`)).text();
  const out = cheerio.load(html)('img').map((i, el) => el.attribs.src).get();
  if (out.length !== imgs.length) { console.log(`count mismatch on ${web}: ${imgs.length} vs ${out.length}`); continue; }
  imgs.forEach((s, i) => {
    const p = s.replace(DA, '');
    if (wanted.includes(p) && !delivered[p]) delivered[p] = { page: web, url: new URL(out[i].split('?')[0], `${LIVE}${web}`).href };
  });
}

const report = [];
for (const p of wanted) {
  // eslint-disable-next-line no-await-in-loop
  const r = await fetch(`https://admin.da.live/source/jackzhaojin/www-eds/${p}`, { headers: auth });
  // eslint-disable-next-line no-await-in-loop
  const buf = Buffer.from(await r.arrayBuffer());
  const head = buf.subarray(0, 64).toString('latin1');
  const kind = head.startsWith('\x89PNG') ? 'png' : /<svg|<\?xml/.test(buf.subarray(0, 400).toString('utf8')) ? 'svg' : 'unknown';
  const out = path.join('content', p);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (r.ok && kind !== 'unknown') fs.writeFileSync(out, buf);
  const d = delivered[p];
  let deliveredSha = null;
  if (d) {
    // eslint-disable-next-line no-await-in-loop
    const dr = await fetch(d.url);
    // eslint-disable-next-line no-await-in-loop
    deliveredSha = dr.ok ? sha(Buffer.from(await dr.arrayBuffer())) : `http ${dr.status}`;
  }
  report.push({ path: p, status: r.status, kind, bytes: buf.length, sha256: sha(buf), page: d?.page || null, delivered: d?.url || null, matchesDelivered: deliveredSha === sha(buf) });
}
fs.writeFileSync(reportFile, JSON.stringify(report, null, 1));
const ok = report.filter((x) => x.status === 200 && x.kind !== 'unknown');
console.log(`downloaded ${ok.length} of ${report.length}; byte-identical to the delivered copy: ${report.filter((x) => x.matchesDelivered).length}`);
report.filter((x) => !x.matchesDelivered || x.status !== 200).forEach((x) => console.log(`  check: ${x.path} status=${x.status} kind=${x.kind} delivered=${x.delivered || 'not found'}`));
