# Site config (hlx-config)

The site's Edge Delivery configuration, kept as files so it can be read, diffed and shown. Nothing here is secret, and nothing here is served (`.hlxignore`). The live config is in the AEM config service and in two Experience Workspace sheets; these files are what was sent there, on 2026-10-25, to match the SEO of www.jackzhaojin.com on GitHub Pages.

| File | Where it goes | What it does |
|---|---|---|
| `cdn-prod.json` | Admin API `POST /config/jackzhaojin/sites/www-eds/cdn/prod.json` | The production host: canonical links, `og:url` and sitemap URLs point at www.jackzhaojin.com. Since 2026-10-26 also push invalidation: `type: cloudflare`, `plan: free`, the zone ID, plus the Cache Purge token, which is never stored here. It's sent from a hidden prompt by `2026-10-26-push-invalidation/set-cdn-token.sh`. |
| `robots.txt` | `POST .../robots.txt` (text/plain) | Allow everything, point at the sitemap, and since 2026-10-27 state `Content-Signal: search=yes, ai-input=yes, ai-train=yes` ([2026-10-26-content-signal/EXECUTION.md](2026-10-26-content-signal/EXECUTION.md)). *.aem.page and *.aem.live keep serving "disallow all" by design; this one is served on the production host. |
| `query.yaml` | `POST .../content/query.yaml` (text/yaml) | The query index: every published page except the nav and footer fragments, with title, description, image, template, published-time, lastModified and robots. |
| `sitemap.yaml` | `POST .../content/sitemap.yaml` (text/yaml) | `/sitemap.xml` from the index, on www, with lastmod. Pages with `robots: noindex` (the design system page) are left out. |
| `metadata.tsv` | the `/metadata` sheet, through `sheets.mjs` | Bulk metadata: `og:type` (website, articles under /writing/), `og:site_name`, `og:locale`. |
| `redirects-extra.tsv` | the `/redirects` sheet, through `sheets.mjs` | Legacy pages (`/blogs.html`, `/certifications.html`), the old talk pages and their first records (since v1.3.0 a talk lives on its project's page or on `/talks/`), and the old home social image (`/assets/site-social.png`). `sheets.mjs` adds a 301 for every folder page without its trailing slash and as `.../index.html`, as GitHub Pages serves them: the published pages (the query index) and any local page not published yet; a row here wins over a folder page's. |
| `sheets.mjs` | | Builds `sheets/redirects.json` and `sheets/metadata.json`; `--upload` sends them to DA, `--publish` previews and publishes them. |
| `.env.example` | | The variables, for a temporary token in `hlx-config/.env` (git-ignored). Without one, the da-auth token cache is used: an Adobe IMS token the Admin API accepts as `Authorization: Bearer`. |

The per-page tags come from the content, not from here: `stardust/scripts/sync-head-metadata.mjs` copies each www page's JSON-LD, title, `og:image:alt`, share title and article tags into its document's metadata block.

How it was applied, step by step with every response (GET before, SET, GET after, the Admin API skill's pattern): [2026-10-25-seo-config/EXECUTION.md](2026-10-25-seo-config/EXECUTION.md).

Push invalidation (the Cloudflare Cache Purge token, the Worker without its override, a publish proving the purge): [2026-10-26-push-invalidation/EXECUTION.md](2026-10-26-push-invalidation/EXECUTION.md).

The release branches (`release/0.1` to `0.3`, one Edge Delivery environment per prompt of the build) and the code sync that made each one match its commit: [2026-10-25-release-branches/EXECUTION.md](2026-10-25-release-branches/EXECUTION.md).

## When a page is added (double migration until the cutover)

1. Import and publish it (`ai-docs/2026-10-25-initial-buildout-2-goals/whats-left.md`, section 5).
2. `node stardust/scripts/sync-head-metadata.mjs <source root> content`, then republish the documents it lists (the new page, and the listing whose JSON-LD item list grew).
3. `node hlx-config/sheets.mjs --upload --publish` for the new page's two redirects.
4. Publishing indexes the page; check `/query-index.json`, and `POST /sitemap/jackzhaojin/www-eds/main/sitemap.xml` if `/sitemap.xml` does not list it.
