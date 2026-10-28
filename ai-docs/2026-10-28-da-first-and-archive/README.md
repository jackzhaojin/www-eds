# DA first, and an archive outside Adobe (2026-10-28)

**Decision (Jack):** DA (Experience Workspace) is the source of truth for the content, and archiving is a separate process. From his research question the day before: "we should have da.live as a source of truth. However, archiving, right, is something we do care about. Not necessarily what's in da.live, but the actual rendered output", and "in case Adobe one day takes my thing away". Then the goal: "yes i like your idea of a new repo, we can even make it public, and for content locally we do want a good collection of content that coudl guide an AI author on how to bulid content but we don't need every page ... media needs to be cleaned out ... all should be da.live and we need to archive as a separate process". The archive runs by hand for now: "we don't need a reoccuring thing or anything yet".

His answers to the three questions:
- **The archive:** a standby site at archive.jackzhaojin.com, and Wayback Machine captures.
- **Local content:** "if a block variation isn't used it's not going to get used, so like i do want local to be rich, just not every blog, maybe capture some of the more complex ones and shorter ones ... and AI should browse current site that's not local for exmaple as well".
- **Media:** none locally.

This replaces the 2026-10-26 decision ([content in git](../2026-10-26-content-in-git/README.md)), which made `content/` the source and DA the publishing step.

## The archive: www-archive

A new public repo, [jackzhaojin/www-archive](https://github.com/jackzhaojin/www-archive) (`~/dev/jackzhaojin/www-archive`), holding www as served, outside Adobe:

| | |
|---|---|
| `tools/snapshot.mjs` | fetches everything from www (so the listings and JSON-LD the Worker fills in are in the HTML): every page in the sitemap and the query index and every same-site page they link to, each as HTML, `.plain.html` and `.md`; the nav and footer (and any a page names, like the design system page's own); the sheets; robots.txt and the sitemap; the 222 code files www-eds serves (its files at `origin/main` minus `.hlxignore`); every `media_<hash>` file the pages, fragments and sheets use. Writes `_redirects` (the redirects sheet) and `_headers` (noindex). `snapshot.json` lists every file with its sha256, one line each, so `git log -p snapshot.json` is the history of every page |
| `tools/check.mjs` | tests a served copy: every file byte for byte, the code each page's blocks, template and fragments need, every redirect, noindex, the 404 |
| `tools/wayback.mjs` | asks the Wayback Machine (anonymous Save Page Now) to capture each page and keeps the captures in `wayback.json` |
| `wrangler.jsonc` | the `www-archive` Worker: `site/` as static files at archive.jackzhaojin.com (Custom Domain) and `www-archive.jackzhaojin.workers.dev` |

**The first snapshot** (www-eds code at `250dfab`): 1230 files, 64.9 MB. 57 pages with their fragments and Markdown, 8 nav and footer fragments, 7 sheets, 222 code files, 820 media files. A second run straight after changed nothing and reused all 820 media files (their names are content hashes). Four links on the site aren't pages: the design system page's three `templates/*.html` links and a literal `...` link (known from the migration).

**Tests**, local (`wrangler dev`) and live:
- `check.mjs`: PASS on wrangler dev, archive.jackzhaojin.com and workers.dev: 1230 files, 57 pages, 129 redirects.
- In the built-in browser, 10 pages (home, the three hubs, certifications, the Azure RBAC and Stitch theming articles, the adaptTo talk, Shadow Pivot, the design system page) against www at 1440 and 360: the same page heights, header and footer, every block loaded, the listings served in the HTML (`ready/server`, so nothing rebuilt them), no broken images, no errors.
- The browser test caught one real gap: the design system page names its own nav and footer (`/design-systems/v3/nav`, `/footer`), which the first snapshot missed (header 63 px instead of 89, footer 57 instead of 670). The snapshot now takes every fragment a page names, and the check fails if one is missing.

**Wayback:** see the last section.

## If Adobe can't serve the site: v1.1.6

Adobe's vendored worker refuses any origin that isn't `main--*--*.aem.live`, so www can't be pointed at the archive by `ORIGIN_HOSTNAME`. Release `v1.1.6` (PR 8) adds `ARCHIVE_ORIGIN` to the edge Worker: set, every EDS path on www comes from the archive (`archiveFetch`, the gh host's `originFetch`), its redirects pointed at www, the noindex dropped on www as usual, project sites still passing through. It is not set. Tested with the Worker in-process against the live archive (every page kind, fragments, `.md`, code, a sheet, robots.txt, the sitemap, a redirect and the 404 answer as the archive does), 22 Worker tests, `check-host --local www`; deployed to www at 00:22 ET without the var (version `8fd69f11`), `check-host` on www passes. The switch: edge/README.md, "If Adobe can't serve the site".

## Local content: examples, not the source

**Before removing anything,** every tracked file in `content/` was compared with DA: 130 of 132 identical in content, the other two (the library's `blocks.json` and `templates.json`) the same rows in different JSON formatting. Nothing existed only here.

**The rule for what stays:** the smallest set of real pages that between them use every block, block variant, section style and template on the site, with two exceptions counted as one each: explainer engines (41, each written for its article, one reused 4 times) and the portfolio's per-project chapter accents. That's a greedy set cover over the 61 documents, starting from home, the nav and footer, the three hubs, and two short articles kept on purpose (`2025-07-13-three-eds-offerings`, `2025-06-08-edge-cms-shift-adobe-eds`).

**Kept (86 files):** 36 pages (home, the three hubs, the design system page with its nav and footer, certifications, terms, 2 talk pages, 9 project pages, 18 articles), the nav and footer, the 43 block library documents and sheets, the README and the deploy ledger. `content-coverage.mjs --site ../www-archive/site` confirms it: the site uses 148 variations and the examples show all 148.

**Removed (49 files):** 11 articles, 7 talk pages, 2 project pages, privacy, the two hub drafts, and the 26 media files (17 certification badges, 8 importer-drawn diagrams, the Azure RBAC article's `storage-roles.png`). All are in DA and in the archive; git history has them too (`git show 76db38e:content/<path>`).

**New tools** (`stardust/scripts/deploy/`):
- `da-pull.mjs`: pulls documents from DA into `content/` (a page path, a DA path, `--library` for the 26 pages `build-block-library.mjs` copies its examples from, `--list <folder>`). A local copy whose content differs from DA's is kept and reported, unless `--force`.
- `content-coverage.mjs`: each variation and the example pages that show it; with `--site`, anything the site uses that no example shows.
- `build-block-library.mjs` now names `da-pull.mjs --library` when a source page isn't local.

**`.gitignore`:** `content/**` except the README. Tracked examples stay tracked; a pulled page or a new one written here stays out of git, and a new example is added with `git add -f`.

**The library rebuild, end to end:** with only the examples local, `build-block-library.mjs` failed with the new message; after `da-pull.mjs --library` (8 pages pulled, 18 already the same as DA) it rebuilt 36 block documents, 95 variants and 5 templates. One document changed: the figure library page still linked the Azure RBAC article's images on `content.da.live`, which the article stopped doing on 2026-10-27. The rebuilt page was pushed to DA and previewed (never published, as the library rules say).

**The process,** in [content/README.md](../../content/README.md): pull from DA, write in the editor's form, preview, check, publish, snapshot the archive (and capture the changed pages in Wayback), run the coverage check, commit the ledger and any changed example.

## Wayback

Pending at the time of writing.
