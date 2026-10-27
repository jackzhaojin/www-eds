// Route table and Worker behaviour, with fetch stubbed: `npm test` in edge/.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';
import { isProjectPath, PROJECT_SITES } from '../src/routes.mjs';

const WWW = { ORIGIN_HOSTNAME: 'main--www-eds--jackzhaojin.aem.live', PROJECT_ORIGIN: 'passthrough', INDEXABLE: 'true' };
const GH = { MODE: 'github', GITHUB_ORIGIN: 'https://www.jackzhaojin.com' };
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
  await worker.fetch(get('https://eds.jackzhaojin.com/bruce-lava-dash/?seed=7'), STAGING, {});
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
  await worker.fetch(get('https://eds.jackzhaojin.com/'), STAGING, {});
  assert.equal(calls[0].headers.get('x-push-invalidation'), null);
  assert.equal(calls[0].headers.get('x-forwarded-host'), 'eds.jackzhaojin.com');
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

test('only www is indexable: eds answers noindex on pages and project sites', async () => {
  const page = await worker.fetch(get('https://eds.jackzhaojin.com/writing/'), STAGING, {});
  assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
  const project = await worker.fetch(get('https://eds.jackzhaojin.com/bruce-play-ten/'), STAGING, {});
  assert.equal(project.headers.get('x-robots-tag'), 'noindex, nofollow');
  const www = await worker.fetch(get('https://www.jackzhaojin.com/bruce-play-ten/'), WWW, {});
  assert.equal(www.headers.get('x-robots-tag'), null);
});

test('gh: every path is the GitHub Pages site from www, path and query kept, noindex', async () => {
  const res = await worker.fetch(get('https://gh.jackzhaojin.com/writing/?q=1'), GH, {});
  assert.equal(calls[0].url, 'https://www.jackzhaojin.com/writing/?q=1');
  assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
  await worker.fetch(get('https://gh.jackzhaojin.com/ai-sandbox/'), GH, {});
  assert.equal(calls[1].url, 'https://www.jackzhaojin.com/ai-sandbox/');
});

test('gh: a redirect GitHub sends to www stays on gh; one elsewhere is left alone', async () => {
  globalThis.fetch = async (input) => {
    const req = input instanceof Request ? input : new Request(input);
    calls.push(req);
    const to = req.url.includes('/writing') ? 'https://www.jackzhaojin.com/writing/' : 'https://github.com/jackzhaojin';
    return new Response(null, { status: 301, headers: { location: to } });
  };
  const res = await worker.fetch(get('https://gh.jackzhaojin.com/writing'), GH, {});
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), 'https://gh.jackzhaojin.com/writing/');
  const away = await worker.fetch(get('https://gh.jackzhaojin.com/elsewhere'), GH, {});
  assert.equal(away.headers.get('location'), 'https://github.com/jackzhaojin');
});

test('robots.txt and the sitemaps are 404s on eds and gh, never fetched; www serves them', async () => {
  for (const [host, env] of [['eds', STAGING], ['gh', GH]]) {
    for (const path of ['/robots.txt', '/sitemap.xml', '/sitemap.json']) {
      // eslint-disable-next-line no-await-in-loop
      const res = await worker.fetch(get(`https://${host}.jackzhaojin.com${path}`), env, {});
      assert.equal(res.status, 404, `${host}${path}`);
      assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
    }
  }
  assert.equal(calls.length, 0);
  const www = await worker.fetch(get('https://www.jackzhaojin.com/robots.txt'), WWW, {});
  assert.equal(www.status, 200);
  assert.equal(calls.length, 1);
});

const respond = (headers, status = 200) => {
  globalThis.fetch = async (input) => {
    calls.push(input instanceof Request ? input : new Request(input));
    return new Response(status === 304 ? null : 'x', { status, headers });
  };
};
const ORIGIN_CACHE = 'max-age=7200, must-revalidate';

test('www: browsers keep an EDS page, and a fragment, for 10 minutes', async () => {
  respond({ 'content-type': 'text/html; charset=utf-8', 'cache-control': ORIGIN_CACHE, 'cdn-cache-control': 'max-age=172800' });
  for (const path of ['/', '/privacy/', '/footer.plain.html']) {
    // eslint-disable-next-line no-await-in-loop
    const res = await worker.fetch(get(`https://www.jackzhaojin.com${path}`), WWW, {});
    assert.equal(res.headers.get('cache-control'), 'max-age=600, must-revalidate', path);
    assert.equal(res.headers.get('cdn-cache-control'), 'max-age=172800', path);
  }
});

test('www: a 304 for a page keeps the 10 minutes; code and media keep the origin cache-control', async () => {
  respond({ 'cache-control': ORIGIN_CACHE }, 304);
  const revalidated = await worker.fetch(get('https://www.jackzhaojin.com/writing/'), WWW, {});
  assert.equal(revalidated.status, 304);
  assert.equal(revalidated.headers.get('cache-control'), 'max-age=600, must-revalidate');
  const script = await worker.fetch(get('https://www.jackzhaojin.com/scripts/scripts.js'), WWW, {});
  assert.equal(script.headers.get('cache-control'), ORIGIN_CACHE);
  respond({ 'content-type': 'image/png', 'cache-control': ORIGIN_CACHE });
  const media = await worker.fetch(get('https://www.jackzhaojin.com/writing/media_abc.png'), WWW, {});
  assert.equal(media.headers.get('cache-control'), ORIGIN_CACHE);
});

test('project sites and gh keep their own cache-control', async () => {
  respond({ 'content-type': 'text/html', 'cache-control': 'max-age=600' });
  const project = await worker.fetch(get('https://www.jackzhaojin.com/bruce-lava-dash/'), WWW, {});
  assert.equal(project.headers.get('cache-control'), 'max-age=600');
  respond({ 'content-type': 'text/html', 'cache-control': 'max-age=900' });
  const gh = await worker.fetch(get('https://gh.jackzhaojin.com/writing/'), GH, {});
  assert.equal(gh.headers.get('cache-control'), 'max-age=900');
});

/* Dynamic listings: the hub is authored as one block with a Source row; the edge fills it. */
const HUB = `<html><head><title>Talks &amp; Presentations | Jack Jin</title>
<link rel="canonical" href="https://www.jackzhaojin.com/talks/">
<meta name="description" content="Talks.">
<script type="application/ld+json">{"@graph":[{"@type":"CollectionPage"}]}</script>
</head><body><main><div><div class="row-list talks dynamic">
  <div><div>Source</div><div><a href="/talks-index.json">/talks-index.json</a></div></div>
</div></div></main></body></html>`;
const TALK = {
  path: '/talks/records/example', id: 'example', aliases: 'older-example', order: '1', date: 'September 29, 2026',
  kind: 'Conference session', title: 'OpenClaw: 24/7 <agents>', event: 'adaptTo() 2026', description: 'A talk.',
  status: '', linkLabels: ['Explore the project'], linkUrls: ['https://www.jackzhaojin.com/portfolio/#ch-factory'],
};
const serveHub = (index) => {
  globalThis.fetch = async (input) => {
    const req = input instanceof Request ? input : new Request(input);
    calls.push(req);
    if (new URL(req.url).pathname === '/talks-index.json') return index();
    return new Response(HUB, { headers: { 'content-type': 'text/html; charset=utf-8', etag: '"origin"', 'content-length': String(HUB.length) } });
  };
};

test('www: a dynamic listing is served with its rows and one generated JSON-LD graph', async () => {
  serveHub(() => Response.json({ total: 1, offset: 0, limit: 200, data: [TALK] }));
  const res = await worker.fetch(get('https://www.jackzhaojin.com/talks/'), WWW, {});
  const html = await res.text();
  assert.equal(calls[1].url, 'https://main--www-eds--jackzhaojin.aem.live/talks-index.json?offset=0&limit=200');
  assert.match(html, /<h2 id="openclaw-247-agents">OpenClaw: 24\/7 &lt;agents&gt;<\/h2>/);
  assert.match(html, /<a href="\/portfolio\/#ch-factory">Explore the project<\/a>/);
  assert.match(html, /<div><p>example older-example<\/p><\/div><\/div><\/div><\/div><\/main>/);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.equal(ld.length, 1, 'the authored CollectionPage graph is replaced');
  const list = ld[0]['@graph'].find((node) => node['@type'] === 'ItemList');
  assert.equal(list.itemListElement[0].position, 1);
  assert.equal(list.itemListElement[0].item['@id'], 'https://www.jackzhaojin.com/talks/#example');
  assert.equal(ld[0]['@graph'].find((node) => node['@type'] === 'BreadcrumbList').itemListElement[1].name, 'Talks & Presentations');
  assert.equal(res.headers.get('etag'), null, 'the origin validators no longer describe the body');
  assert.equal(res.headers.get('cache-control'), 'max-age=600, must-revalidate');
});

test('www: a listing whose index fails goes out as authored, for the browser to fill', async () => {
  serveHub(() => new Response('Unavailable', { status: 503 }));
  const res = await worker.fetch(get('https://www.jackzhaojin.com/talks/'), WWW, {});
  assert.equal(await res.text(), HUB);
  assert.equal(res.headers.get('etag'), '"origin"');
});

test('a page without a listing keeps its body and validators; a fragment is left alone', async () => {
  respond({ 'content-type': 'text/html; charset=utf-8', etag: '"page"' });
  const page = await worker.fetch(get('https://www.jackzhaojin.com/privacy/'), WWW, {});
  assert.equal(await page.text(), 'x');
  assert.equal(page.headers.get('etag'), '"page"');
  assert.equal(calls.length, 1);
  respond({ 'content-type': 'text/html; charset=utf-8' });
  await worker.fetch(get('https://www.jackzhaojin.com/footer.plain.html'), WWW, {});
  assert.equal(calls.length, 2, 'a fragment is not a page: no index request');
});

test('www: a talk page gets its generated JSON-LD; a page with authored JSON-LD keeps it', async () => {
  const page = (head) => `<html><head><title>OpenClaw | Jack Jin</title>
<link rel="canonical" href="https://www.jackzhaojin.com/talks/ai-tinkerers-2026/">
<meta name="talk-id" content="ai-tinkerers-2026"><meta name="talk-date" content="April 6, 2026">${head}
</head><body><main><h1>OpenClaw</h1></main></body></html>`;
  respond({ 'content-type': 'text/html; charset=utf-8' });
  globalThis.fetch = async () => new Response(page(''), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const html = await (await worker.fetch(get('https://www.jackzhaojin.com/talks/ai-tinkerers-2026/'), WWW, {})).text();
  const [ld] = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.equal(ld['@graph'].find((n) => n['@type'] === 'Event').startDate, '2026-04-06');
  const authored = page('<script type="application/ld+json">{"@type":"Thing"}</script>');
  globalThis.fetch = async () => new Response(authored, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  assert.equal(await (await worker.fetch(get('https://www.jackzhaojin.com/talks/ai-tinkerers-2026/'), WWW, {})).text(), authored);
});
