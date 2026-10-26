# edge: the jackzhaojin.com Worker

One Cloudflare Worker script in front of three hosts. It sends the GitHub Pages project sites to GitHub Pages and everything else to Edge Delivery. Only www may be indexed. The routing plan behind it is `routing-cloudflare.md` in [jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration](https://github.com/jackzhaojin/jackzhaojin.github.io/tree/main/ai-docs/2026-10-24-eds-migration).

| wrangler env | Worker | Route | Serves | Search |
|---|---|---|---|---|
| top level | `www-eds-edge` | `www.jackzhaojin.com/*`, added in the Cloudflare dashboard at the cutover, never in this file | Edge Delivery; the 7 project sites pass through to the zone's origin, GitHub Pages, untouched | indexed |
| `staging` | `www-eds-edge-staging` | `eds.jackzhaojin.com/*` | Edge Delivery; project sites from www (they pass through there to GitHub Pages) | noindex |
| `gh` | `www-eds-edge-gh` | `gh.jackzhaojin.com/*` | the whole old GitHub Pages site. It fetches `www.jackzhaojin.com`, and a same-zone fetch from a Worker reaches the zone's origin, GitHub Pages, not the www Worker. GitHub's folder redirects stay on gh | noindex |

All three are deployed, and `check-host.mjs` passes on all three (2026-10-26).

## The cutover (2026-10-26, about 15:12 ET)

Done route-first from another session, not in the order whats-left.md had planned:
1. The top-level Worker was deployed with `npx wrangler deploy --env="" --var PUSH_INVALIDATION:disabled` (version `fa323e37-fd2b-46f3-afea-a1b9d638a7cd`). The override is now in `wrangler.toml` too, so a plain redeploy keeps it.
2. The route `www.jackzhaojin.com/*` was added to `www-eds-edge` in the dashboard (Workers & Pages > www-eds-edge > Domains; a Route, not a Custom Domain).
3. GitHub Pages was **not** moved. jackzhaojin.github.io keeps its `CNAME` of `www.jackzhaojin.com`. GitHub still serves the project sites and the old main site at the zone origin; `PROJECT_ORIGIN = "passthrough"` hands the project sites to it, and gh mirrors the rest.

**Rollback:** remove the www route in the dashboard. www then goes straight to GitHub Pages again, which never stopped serving it.

**Push invalidation isn't set up yet.** Until the Cache Purge token is in the site config (`hlx-config/cdn-prod.json`, type `cloudflare` plus the zone ID), `PUSH_INVALIDATION = "disabled"` keeps aem.live from sending long cache TTLs that nothing would purge. Once it works, remove the line and redeploy the top level.

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
| `wrangler.toml` | the three environments and their vars (vars aren't inherited by an env, so only the top level sets `INDEXABLE` and `PUSH_INVALIDATION`) |
| `test/worker.test.mjs` | 12 tests: routing, the noindex header, gh redirects, the crawler 404s |
| `scripts/check-host.mjs` | the routing check for a host: every sitemap page, the project sites, the root files, the 404s, the legacy redirects, the robots header |

## Commands

```bash
npm test                                                   # the 12 tests
node scripts/check-host.mjs --local www                    # the Worker in-process, against the real origins (also staging, gh)
node scripts/check-host.mjs --base https://www.jackzhaojin.com   # and https://eds… , https://gh…
npx wrangler deploy --env="" --dry-run --outdir <scratch>  # shows the vars a deploy would carry, deploys nothing
npx wrangler deploy --env=""                               # production; every Cloudflare change is Jack's call
npx wrangler deploy --env staging
npx wrangler deploy --env gh
```

## Later, optional: moving GitHub Pages to gh (Phase B)

Today gh only mirrors GitHub Pages through www's origin. To give GitHub Pages its own domain (gh), the code needs three fixes first:
1. `githubFetch` needs a `"passthrough"` branch, because `new URL("passthrough")` throws.
2. `projectFetch` must rewrite GitHub's `Location` header back to the request host.
3. Staging's `PROJECT_ORIGIN` must move from www to gh.

Then the GitHub custom domain change and the www Worker's `PROJECT_ORIGIN = "https://gh.jackzhaojin.com"` go out together. One without the other loops or breaks the project sites.
