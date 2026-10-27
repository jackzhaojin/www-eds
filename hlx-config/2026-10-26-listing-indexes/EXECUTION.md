# EXECUTION: the listing indexes for v1.1.1 (2026-10-26)

Org `jackzhaojin`, site `www-eds`, `https://admin.hlx.page`. Auth: the da-auth IMS token as `Authorization: Bearer` (never printed or saved). Jack's goal for v1.1.1: "move all that listing (talks, writing, portofolio) to have its own indexes and individual pages", and, asked about shipping, "All of it". The index definitions are `hlx-config/query.yaml`; this is config, not a release.

## Step 1: GET the index config (before) ✅ COMPLETED

`GET /config/jackzhaojin/sites/www-eds/content/query.yaml`: `execution-files/step-1.1-get-query-response.yaml`.

**Result:** 200. Three indexes: `default` (`/**`, without nav, footer, drafts and `/talks/records/**`), `talks` (`/talks/records/**`, links from `main ul li a`) and `writing` (`/writing/**`), as PR 2 left them.

## Step 2: SET the new definitions ✅ COMPLETED

`POST /config/jackzhaojin/sites/www-eds/content/query.yaml`, `Content-Type: text/yaml`, body `execution-files/step-2.1-set-query-request.yaml` (the file in git). The changes:
- `default` also leaves out `/docs/**`, the block library documents, so they never reach the sitemap.
- `talks` reads one page per talk, `/talks/**`, without the hub `/talks/`, the old `/talks/records/**`, nav and footer. Its links come from the page's proof-links block (`main .proof-links a`), and it gains `image` and `robots`.
- `portfolio` is new: `/portfolio/**` without the hub, target `/portfolio-index.json`, with `title` (og:title), `tagline` (the h1's italic subtitle), `description`, `image`, and the metadata `project-dates`, `project-kind`, `project-order`, `project-anchors` and `robots`.
- `writing` is unchanged.

**Result:** 204.

## Step 3: GET the index config (after) ✅ COMPLETED

The same GET as step 1: `execution-files/step-3.1-get-query-response.yaml`.

**Result:** 200, byte-identical to `hlx-config/query.yaml`. Four indexes: `default`, `talks` (`/talks/**`), `writing`, `portfolio` (`/portfolio-index.json`). An index lists published pages only, so the talk and project pages enter their indexes as they are published.

**Rollback:** POST `execution-files/step-1.1-get-query-response.yaml` back.
