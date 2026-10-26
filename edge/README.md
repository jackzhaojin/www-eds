# edge: the jackzhaojin.com Worker

One Cloudflare Worker script in front of three hosts. It sends the GitHub Pages project sites to GitHub Pages and everything else to Edge Delivery. Only www may be indexed. The routing plan behind it is `routing-cloudflare.md` in [jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration](https://github.com/jackzhaojin/jackzhaojin.github.io/tree/main/ai-docs/2026-10-24-eds-migration).

| wrangler env | Worker | Route | Serves | Search |
|---|---|---|---|---|
| `staging` | `www-eds-edge-staging` | `eds.jackzhaojin.com/*` | Edge Delivery; project sites from www (GitHub Pages today) | noindex |
| `gh` | `www-eds-edge-gh` | `gh.jackzhaojin.com/*` | the whole GitHub Pages site, read through www until GitHub Pages moves to gh; GitHub's folder redirects stay on gh | noindex |
| top level | `www-eds-edge` | none in this file: the www route is added in the Cloudflare dashboard at the cutover | Edge Delivery; project sites pass through to the zone's origin, GitHub Pages | indexed |

Both non-production Workers are deployed (2026-10-25). Their DNS records are AAAA `100::`, proxied, and `check-host.mjs` passes on both.

## A request, in order (`src/index.mjs`)

1. **Crawler files.** On every host but www, `/robots.txt` and the sitemaps are 404s. The zone's managed robots.txt (Cloudflare AI Crawl Control) then fills the robots.txt 404 with its content-signals comments, which have no rules and no sitemap. Jack chose to keep that setting on.
2. **gh mode** (`MODE = "github"`): every path goes to `GITHUB_ORIGIN`, with the path and query string kept.
3. **Project sites** (`PROJECT_SITES` in `src/routes.mjs`: `/adapt-to-2026-demo/`, `/bruce-lava-dash/` and five more): `PROJECT_ORIGIN = "passthrough"` hands the request to the zone's own origin untouched. A URL sends it to that origin instead.
4. **Everything else** goes to Edge Delivery through `src/aem.mjs`. That's Adobe's Cloudflare worker (`adobe/aem-cloudflare-prod-worker` at `ec7387c`), vendored with only its handler renamed to a named export.
5. **The robots header.** Every host but www answers `X-Robots-Tag: noindex, nofollow`, whatever the origin said. Adobe's worker drops Edge Delivery's own header, so this one is added back here.

## Files

| File | What it does |
|---|---|
| `src/index.mjs` | the request order above |
| `src/routes.mjs` | the project-site list, `projectFetch`, `githubFetch`, `hiddenFromCrawlers`, `robots` |
| `src/aem.mjs` | Adobe's worker, vendored |
| `wrangler.toml` | the three environments and their vars (vars aren't inherited by an env, so only the top level sets `INDEXABLE`) |
| `test/worker.test.mjs` | 12 tests: routing, the noindex header, gh redirects, the crawler 404s |
| `scripts/check-host.mjs` | the routing check for a host: every sitemap page, the project sites, the root files, the 404s, the legacy redirects, the robots header |

## Commands

```bash
npm test                                                   # the 12 tests
node scripts/check-host.mjs --local staging                # the Worker in-process, against the real origins (also gh, www)
node scripts/check-host.mjs --base https://eds.jackzhaojin.com
node scripts/check-host.mjs --base https://gh.jackzhaojin.com
npx wrangler deploy --env staging                          # after wrangler login; every Cloudflare change is Jack's call
npx wrangler deploy --env gh
```

Never deploy the top level with a www route before the cutover. The order is in [whats-left.md, section 3](../ai-docs/2026-10-25-initial-buildout-2-goals/whats-left.md):
1. Push invalidation.
2. GitHub Pages moves to gh, and the gh Worker switches to passthrough.
3. The www Worker's `PROJECT_ORIGIN` becomes `https://gh.jackzhaojin.com`, then the www route is added.

Setting `PROJECT_ORIGIN` to gh before GitHub Pages has moved makes the two hosts read each other in a loop.
