/* eslint-env node */
/* eslint-disable no-await-in-loop, no-restricted-syntax, max-len, no-console */
// One operation at a time; full mutation responses are recorded in one JSONL journal.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies -- Admin-only development tool.
import yaml from 'js-yaml';

const root = 'ai-docs/2026-10-26-writing-index/admin';
const files = `${root}/execution-files`;
const records = JSON.parse(fs.readFileSync(`${files}/expected-cards.json`, 'utf8'));
const cached = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.aem/da-token.json'), 'utf8'));
if (!(cached.expires_at > Date.now() + 60000)) throw new Error('DA token expired; Jack must sign in');
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function request(method, url, options = {}) {
  const headers = { Authorization: `Bearer ${cached.access_token}` };
  let body;
  let input;
  if (options.bodyFile) {
    input = fs.readFileSync(options.bodyFile);
    if (options.multipart) {
      body = new FormData();
      body.append('data', new Blob([input], { type: 'text/html' }), path.basename(options.bodyFile));
    } else {
      body = input;
      headers['Content-Type'] = 'text/yaml';
    }
  }
  const response = await fetch(url, {
    method, headers, body, redirect: 'error',
  });
  const raw = await response.text();
  let result = raw;
  try { result = JSON.parse(raw); } catch { /* YAML, HTML or empty response. */ }
  const entry = {
    at: new Date().toISOString(),
    method,
    url,
    ...(options.bodyFile ? { bodyFile: options.bodyFile, bodySha256: sha(input) } : {}),
    status: response.status,
    ...(options.gitResponse ? { responseBodyGit: options.gitResponse, responseSha256: sha(raw) } : { response: result }),
  };
  fs.appendFileSync(`${files}/operations.jsonl`, `${JSON.stringify(entry)}\n`);
  console.log(`${method} ${new URL(url).pathname}: HTTP ${response.status}`);
  if (!response.ok && !options.allow?.includes(response.status)) throw new Error(`Stop: ${method} returned ${response.status}`);
  return raw;
}

const stage = process.argv[2];
if (stage === 'read') {
  const config = await request('GET', 'https://admin.hlx.page/config/jackzhaojin/sites/www-eds/content/query.yaml');
  fs.writeFileSync(`${files}/query-before.yaml`, config);
  const hashes = {};
  for (const record of records) {
    const file = `content${record.path}index.html`;
    const raw = await request('GET', `https://admin.da.live/source/jackzhaojin/www-eds${record.path}index.html`, {
      gitResponse: `4af175a:${file}`,
    });
    assert.equal(raw, fs.readFileSync(file, 'utf8'), `DA differs from git: ${record.path}`);
    hashes[file] = sha(raw);
  }
  fs.writeFileSync(`${files}/source-hashes-before.json`, `${JSON.stringify(hashes, null, 2)}\n`);
  await request('GET', 'https://admin.da.live/source/jackzhaojin/www-eds/drafts/writing-index/index.html', { allow: [404] });
} else if (stage === 'index') {
  const fresh = await request('GET', 'https://admin.hlx.page/config/jackzhaojin/sites/www-eds/content/query.yaml');
  assert.deepEqual(yaml.load(fresh), yaml.load(fs.readFileSync(`${files}/query-before.yaml`, 'utf8')), 'Index configuration changed; review before applying');
  await request('POST', 'https://admin.hlx.page/config/jackzhaojin/sites/www-eds/content/query.yaml', { bodyFile: `${files}/query-request.yaml` });
  const after = await request('GET', 'https://admin.hlx.page/config/jackzhaojin/sites/www-eds/content/query.yaml');
  fs.writeFileSync(`${files}/query-after.yaml`, after);
  assert.deepEqual(yaml.load(after), yaml.load(fs.readFileSync(`${files}/query-request.yaml`, 'utf8')));
} else if (stage === 'articles') {
  for (const record of records) {
    const source = `content${record.path}index.html`;
    await request('PUT', `https://admin.da.live/source/jackzhaojin/www-eds${record.path}index.html`, { bodyFile: source, multipart: true });
    await request('POST', `https://admin.hlx.page/preview/jackzhaojin/www-eds/main${record.path}`);
    await request('POST', `https://admin.hlx.page/live/jackzhaojin/www-eds/main${record.path}`);
  }
} else if (stage === 'draft') {
  await request('PUT', 'https://admin.da.live/source/jackzhaojin/www-eds/drafts/writing-index/index.html', {
    bodyFile: 'content/drafts/writing-index/index.html', multipart: true,
  });
  await request('POST', 'https://admin.hlx.page/preview/jackzhaojin/www-eds/main/drafts/writing-index/');
} else {
  throw new Error('Stage must be read, index, articles or draft');
}
