# Site config (hlx-config)

The site's Edge Delivery configuration, kept as files so it can be read, diffed and shown. Nothing here is secret, and nothing here is served (`.hlxignore`). The live config is in the AEM config service and in two Experience Workspace sheets; these files are what was sent there, on 2026-10-25, to match the SEO of www.jackzhaojin.com on GitHub Pages.

| File | Where it goes | What it does |
|---|---|---|
| `cdn-prod.json` | Admin API `POST /config/jackzhaojin/sites/www-eds/cdn/prod.json` | The production host: canonical links, `og:url` and sitemap URLs point at www.jackzhaojin.com. No push invalidation yet (that needs the Cloudflare zone and a purge token at cutover). |
| `robots.txt` | `POST .../robots.txt` (text/plain) | The same robots.txt as www: allow everything, point at the sitemap. *.aem.page and *.aem.live keep serving "disallow all" by design; this one is served on the production host. |
| `query.yaml` | `POST .../content/query.yaml` (text/yaml) | The query index: every published page except the nav and footer fragments, with title, description, image, template, published-time, lastModified and robots. |
| `sitemap.yaml` | `POST .../content/sitemap.yaml` (text/yaml) | `/sitemap.xml` from the index, on www, with lastmod. Pages with `robots: noindex` (the design system page) are left out. |
| `metadata.tsv` | the `/metadata` sheet, through `sheets.mjs` | Bulk metadata: `og:type` (website, articles under /writing/), `og:site_name`, `og:locale`. |
| `redirects-extra.tsv` | the `/redirects` sheet, through `sheets.mjs` | Legacy pages (`/blogs.html`, `/certifications.html`). `sheets.mjs` adds a 301 for every folder page without its trailing slash and as `.../index.html`, as GitHub Pages serves them. |
| `sheets.mjs` | | Builds `sheets/redirects.json` and `sheets/metadata.json`; `--upload` sends them to DA, `--publish` previews and publishes them. |
| `.env.example` | | The variables, for a temporary token in `hlx-config/.env` (git-ignored). Without one, the da-auth token cache is used: an Adobe IMS token the Admin API accepts as `Authorization: Bearer`. |

The per-page tags come from the content, not from here: `stardust/scripts/sync-head-metadata.mjs` copies each www page's JSON-LD, title, `og:image:alt`, share title and article tags into its document's metadata block.

How it was applied, step by step with every response (GET before, SET, GET after, the Admin API skill's pattern): [2026-10-25-seo-config/EXECUTION.md](2026-10-25-seo-config/EXECUTION.md).

## When a page is added (double migration until the cutover)

1. Import and publish it (`ai-docs/2026-10-25-initial-buildout-2-goals/whats-left.md`, section 5).
2. `node stardust/scripts/sync-head-metadata.mjs <source root> content`, then republish the documents it lists (the new page, and the listing whose JSON-LD item list grew).
3. `node hlx-config/sheets.mjs --upload --publish` for the new page's two redirects.
4. Publishing indexes the page; check `/query-index.json`, and `POST /sitemap/jackzhaojin/www-eds/main/sitemap.xml` if `/sitemap.xml` does not list it.
