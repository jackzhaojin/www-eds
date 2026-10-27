/*
 * The route table for www.jackzhaojin.com (and eds.jackzhaojin.com, the staging host):
 * a path under one of the GitHub Pages project sites goes to GitHub Pages, everything else to
 * Edge Delivery. gh.jackzhaojin.com (MODE "github") is the whole GitHub Pages site. Only www is
 * indexable. See ai-docs/2026-10-24-eds-migration/routing-cloudflare.md in jackzhaojin.github.io.
 */

/** The robots header on every host but production (www): eds and gh stay out of search. */
export const NOINDEX = 'noindex, nofollow';

/** Crawler files only production serves: elsewhere robots.txt and the sitemaps are 404s. */
const CRAWLER_FILES = /^\/(robots\.txt|sitemap[^/]*\.(xml|json))$/;

/**
 * True when this host must not hand crawlers its robots.txt or sitemaps (every host but www).
 * @param {string} pathname The request path
 * @param {{INDEXABLE?: string}} env Worker vars
 */
export function hiddenFromCrawlers(pathname, env) {
  return env.INDEXABLE !== 'true' && CRAWLER_FILES.test(pathname);
}

/** The account's GitHub Pages project sites served under www (checked 2026-10-24). */
export const PROJECT_SITES = [
  'adapt-to-2026-demo',
  'bruce-hackathon-2026-09-12',
  'bruce-play-ten',
  'bruce-lava-dash',
  'denison-2026-04-24',
  'ai-sandbox',
  'harness-v2-test',
];

/**
 * True for /<repo> and /<repo>/..., for a repo in the allowlist; never /<repo>-something.
 * @param {string} pathname The request path
 */
export function isProjectPath(pathname) {
  const first = pathname.split('/')[1] || '';
  return PROJECT_SITES.includes(first);
}

/**
 * A project-site request. On www (PROJECT_ORIGIN "passthrough") it goes to the zone's own
 * origin, GitHub Pages, untouched. On staging there is no GitHub origin behind the hostname, so
 * it goes to the same path on PROJECT_ORIGIN (https://www.jackzhaojin.com), query string kept.
 * @param {Request} request The incoming request
 * @param {{PROJECT_ORIGIN?: string}} env Worker vars
 */
export function projectFetch(request, env) {
  const origin = env.PROJECT_ORIGIN || 'passthrough';
  if (origin === 'passthrough') return fetch(request);
  const url = new URL(request.url);
  const target = new URL(`${url.pathname}${url.search}`, origin);
  return fetch(new Request(target, request));
}

/**
 * The whole GitHub Pages site, for the gh host: the same path and query on GITHUB_ORIGIN
 * (https://www.jackzhaojin.com while GitHub Pages still answers there). A redirect GitHub sends
 * back to that origin (a folder without its slash) is pointed at this host, so it stays on gh.
 * @param {Request} request The incoming request
 * @param {{GITHUB_ORIGIN: string}} env Worker vars
 */
export async function githubFetch(request, env) {
  const url = new URL(request.url);
  const origin = new URL(env.GITHUB_ORIGIN);
  const target = new URL(`${url.pathname}${url.search}`, origin);
  const res = await fetch(new Request(target, request), { redirect: 'manual' });
  const location = res.headers.get('location');
  if (!location) return res;
  const to = new URL(location, target);
  if (to.origin !== origin.origin) return res;
  const out = new Response(res.body, res);
  out.headers.set('location', `${url.origin}${to.pathname}${to.search}${to.hash}`);
  return out;
}

/** How long a browser may keep an EDS page: 10 minutes, as GitHub Pages sent. Cloudflare keeps
 * pages longer (cdn-cache-control) and push invalidation purges it on publish, but nothing can
 * purge a browser, and aem.live tells browsers two hours. */
export const PAGE_BROWSER_TTL = 600;
const PAGE_PATH = /(\/|\/[^./]+|\.html)$/;

/**
 * Sets the browser cache time of an EDS page (an HTML response, so the .plain.html fragments
 * too) to PAGE_BROWSER_TTL. A 304 carries no body, so it is judged by its path: a browser takes
 * its new freshness from the 304. Code, media and JSON keep the origin's cache-control.
 * @param {Response} res The EDS response
 * @param {string} pathname The request path
 */
export function pageCache(res, pathname) {
  const type = res.headers.get('content-type') || '';
  const page = res.status === 304 ? PAGE_PATH.test(pathname) : type.startsWith('text/html');
  if (!page) return res;
  const out = new Response(res.body, res);
  out.headers.set('cache-control', `max-age=${PAGE_BROWSER_TTL}, must-revalidate`);
  return out;
}

/** Fragments: a page's body without its head, for the scripts that load it (the nav, the
 * footer). Adobe's own CDN keeps them noindex in production, as its Fastly guide does
 * (`if (req.url.path !~ "\.plain\.html$") { unset resp.http.X-Robots-Tag; }`). */
const FRAGMENT = /\.plain\.html$/;

/**
 * The robots header for this host: production (INDEXABLE "true") sends none, except on
 * fragments (.plain.html), every other host sends noindex, whatever its origin said.
 * @param {Response} res The response to send
 * @param {{INDEXABLE?: string}} env Worker vars
 * @param {string} [pathname] The request path
 */
export function robots(res, env, pathname = '') {
  const indexable = env.INDEXABLE === 'true' && !FRAGMENT.test(pathname);
  const tag = res.headers.get('x-robots-tag');
  if (indexable ? !tag : tag === NOINDEX) return res;
  const out = new Response(res.body, res);
  if (indexable) out.headers.delete('x-robots-tag');
  else out.headers.set('x-robots-tag', NOINDEX);
  return out;
}
