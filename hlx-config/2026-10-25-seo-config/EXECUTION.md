# EXECUTION: SEO config to match www (2026-10-25)

Org `jackzhaojin`, site `www-eds`, ref `main`, base `https://admin.hlx.page`. Auth: the da-auth IMS token as `Authorization: Bearer` (never printed or saved). Every response is in `execution-files/`. Requested by Jack at 18:50 ET ("configure our site so we have sitemap.xml and robots.txt to match the SEO of https://www.jackzhaojin.com/ ... and whatever configurations we should do").

## Step 1: GET before ✅ COMPLETED

`GET /config/jackzhaojin/sites/www-eds/{cdn/prod.json, robots.txt, content/query.yaml, content/sitemap.yaml, metadata.json}`

**Result:** 404 for all five: nothing configured, nothing to merge. Site config at version 6 (code and content only). EDS served the default robots.txt (disallow all) and an unconfigured sitemap: the 35 pages plus four nav and footer fragments, on the aem.live host.

## Step 2: SET the production host ✅ COMPLETED

`POST /config/.../cdn/prod.json` with `../cdn-prod.json` (`{"host": "www.jackzhaojin.com"}`).

**Result:** 200, echoed back. Canonical links and `og:url` now point at www.

## Step 3: SET robots.txt ✅ COMPLETED

`POST /config/.../robots.txt`, `Content-Type: text/plain`, `--data-binary @../robots.txt` (www's file, byte for byte).

**Result:** 200, echoed back.

## Step 4: SET the query index ✅ COMPLETED

`POST /config/.../content/query.yaml`, `Content-Type: text/yaml`, `--data-binary @../query.yaml`.

**Result:** 204.

## Step 5: SET the sitemap ✅ COMPLETED

`POST /config/.../content/sitemap.yaml`, `Content-Type: text/yaml`, `--data-binary @../sitemap.yaml`.

**Result:** 204.

## Step 6: GET after ✅ COMPLETED

The same four GETs: 200 each, `query.yaml` and `sitemap.yaml` identical to the files sent. Site config now version 8, `cdn.prod.host` www.jackzhaojin.com.

## Step 7: Sheets ✅ COMPLETED

`node hlx-config/sheets.mjs --upload --publish`: `/redirects.json` (73 rows) and `/metadata.json` (3 rows) uploaded to DA (201), previewed and published (200).

**Result:** `/writing`, `/talks/index.html`, `/blogs.html`, `/certifications.html`, `/index.html` and an article without its slash all answer 301 to the folder URL, as on www. `og:type`, `og:site_name` and `og:locale` appear on every page without republishing them.

## Step 8: Per-page tags ✅ COMPLETED

`node stardust/scripts/sync-head-metadata.mjs <source> content`: 35 documents gained `json-ld`, `og:image:alt` and the article tags; three article titles lost an inline SVG's title text; the new article got its own share title. Republished with `deploy-batch.mjs --force` (35 of 35 live).

## Step 9: Re-index ✅ COMPLETED

`POST /index/jackzhaojin/www-eds/main/*` with `execution-files/step-9.1-bulk-index-request.json` (36 paths): 202, job `job-2026-10-25-23-04-35-fd3d7666`, 36 processed, 0 failed. `/query-index.json`: 36 rows, the design system page with `robots: noindex`.

## Step 10: Sitemap ✅ COMPLETED

`POST /sitemap/jackzhaojin/www-eds/main/sitemap.xml`: 200. `/sitemap.xml` lists the same 35 URLs as www's sitemap, on https://www.jackzhaojin.com, without the fragments or the design system page. lastmod is each page's last publish (2026-10-25 for all), where www's sitemap carries hand-set dates.

## Verification

Head tags compared on all 35 sitemap pages, www against aem.live: title, description, canonical, og and twitter tags, article tags and the JSON-LD graph match. Left: `og:image:width` and `og:image:height` (1280x720 on three articles), which www declares and EDS leaves out because its social image is resized to 1200 wide.
