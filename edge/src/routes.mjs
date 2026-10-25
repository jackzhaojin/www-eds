/*
 * The route table for www.jackzhaojin.com (and next.jackzhaojin.com, the staging host):
 * a path under one of the GitHub Pages project sites goes to GitHub Pages, everything else to
 * Edge Delivery. See ai-docs/2026-10-24-eds-migration/routing-cloudflare.md in
 * jackzhaojin.github.io.
 */

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
