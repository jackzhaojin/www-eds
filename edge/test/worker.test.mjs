// Route table and Worker behaviour, with fetch stubbed: `npm test` in edge/.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';
import { isProjectPath, PROJECT_SITES } from '../src/routes.mjs';

const WWW = { ORIGIN_HOSTNAME: 'main--www-eds--jackzhaojin.aem.live', PROJECT_ORIGIN: 'passthrough' };
const STAGING = {
  ORIGIN_HOSTNAME: 'main--www-eds--jackzhaojin.aem.live',
  PROJECT_ORIGIN: 'https://www.jackzhaojin.com',
  PUSH_INVALIDATION: 'disabled',
};

let calls;
const realFetch = globalThis.fetch;
beforeEach(() => {
  calls = [];
  globalThis.fetch = async (input) => {
    const req = input instanceof Request ? input : new Request(input);
    calls.push(req);
    return new Response('ok', { status: 200, headers: { age: '5', 'x-robots-tag': 'noindex' } });
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const get = (url, host) => new Request(url, { headers: { host: host || new URL(url).host } });

test('the allowlist matches /<repo> and /<repo>/..., never /<repo>-something', () => {
  for (const repo of PROJECT_SITES) {
    assert.equal(isProjectPath(`/${repo}`), true, repo);
    assert.equal(isProjectPath(`/${repo}/`), true, repo);
    assert.equal(isProjectPath(`/${repo}/assets/app.js`), true, repo);
    assert.equal(isProjectPath(`/${repo}-something/`), false, repo);
  }
  for (const path of ['/', '/writing/', '/portfolio/', '/design-systems/v3/', '/ai-sandboxes/', '/AI-SANDBOX/']) {
    assert.equal(isProjectPath(path), false, path);
  }
});

test('www: a project site passes through to the zone origin untouched', async () => {
  const res = await worker.fetch(get('https://www.jackzhaojin.com/ai-sandbox/app/?level=3'), WWW, {});
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://www.jackzhaojin.com/ai-sandbox/app/?level=3');
});

test('staging: a project site comes from www, path and query kept', async () => {
  await worker.fetch(get('https://next.jackzhaojin.com/bruce-lava-dash/?seed=7'), STAGING, {});
  assert.equal(calls[0].url, 'https://www.jackzhaojin.com/bruce-lava-dash/?seed=7');
});

test('a page goes to the EDS origin with the BYO CDN headers and no query string', async () => {
  const res = await worker.fetch(get('https://www.jackzhaojin.com/writing/?utm_source=x'), WWW, {});
  const req = calls[0];
  assert.equal(req.url, 'https://main--www-eds--jackzhaojin.aem.live/writing/');
  assert.equal(req.headers.get('x-forwarded-host'), 'www.jackzhaojin.com');
  assert.equal(req.headers.get('x-byo-cdn-type'), 'cloudflare');
  assert.equal(req.headers.get('x-push-invalidation'), 'enabled');
  assert.equal(res.headers.get('age'), null);
  assert.equal(res.headers.get('x-robots-tag'), null);
});

test('staging opts out of push invalidation', async () => {
  await worker.fetch(get('https://next.jackzhaojin.com/'), STAGING, {});
  assert.equal(calls[0].headers.get('x-push-invalidation'), null);
  assert.equal(calls[0].headers.get('x-forwarded-host'), 'next.jackzhaojin.com');
});

test('media keeps only its image parameters; json keeps limit, offset, sheet', async () => {
  await worker.fetch(get('https://www.jackzhaojin.com/writing/media_1f73c391a7589d5fffdbc1b60356286cc33a76e8e.jpg?width=750&format=webply&optimize=medium&x=1'), WWW, {});
  assert.equal(calls[0].url, 'https://main--www-eds--jackzhaojin.aem.live/writing/media_1f73c391a7589d5fffdbc1b60356286cc33a76e8e.jpg?format=webply&optimize=medium&width=750');
  await worker.fetch(get('https://www.jackzhaojin.com/query-index.json?offset=0&limit=10&q=x'), WWW, {});
  assert.equal(calls[1].url, 'https://main--www-eds--jackzhaojin.aem.live/query-index.json?limit=10&offset=0');
});

test('/drafts/ is a 404 and never reaches an origin', async () => {
  const res = await worker.fetch(get('https://www.jackzhaojin.com/drafts/x'), WWW, {});
  assert.equal(res.status, 404);
  assert.equal(calls.length, 0);
});

test('an unknown path is an EDS path (its 404 comes from EDS), including the unmigrated round', async () => {
  await worker.fetch(get('https://www.jackzhaojin.com/design-systems/2026-09-13/'), WWW, {});
  assert.equal(new URL(calls[0].url).host, 'main--www-eds--jackzhaojin.aem.live');
});
