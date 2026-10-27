# EXECUTION: Content Signals in robots.txt (2026-10-26)

Org `jackzhaojin`, site `www-eds`, base `https://admin.hlx.page`. Auth: the da-auth IMS token as `Authorization: Bearer` (never printed or saved). Every response is in `execution-files/`. Finding 17 of the SEO and GEO audit's second pass ([ai-docs/2026-10-26-seo-geo-audit/](../../ai-docs/2026-10-26-seo-geo-audit/README.md)). Jack approved it with the rest of the audit's suggestions: "i like your suggestions ... all of them! ... everythign else try and achieve and test on prod".

Content Signals (https://contentsignals.org/, Cloudflare's policy) add a `Content-Signal` line to a robots.txt group: `search`, `ai-input` (answering questions from the pages: retrieval, grounding) and `ai-train`. They state a preference and block nothing. The values chosen are all `yes`: the site wants to be found and cited, and its writing is CC BY 4.0 (`/terms/`), which already allows reuse with attribution. To change them, edit `../robots.txt` and repeat step 2.

## Step 1: GET before ✅ COMPLETED

`GET /config/jackzhaojin/sites/www-eds/robots.txt`

**Result:** 200, identical to `../robots.txt` as sent on 2026-10-25 (one wildcard allow and the sitemap line). `step-1.1-get-robots-txt-response.txt`.

## Step 2: SET ✅ COMPLETED

`POST /config/.../robots.txt`, `Content-Type: text/plain`, `--data-binary @step-2.1-set-robots-txt-request.txt` (`../robots.txt`): a comment naming the three signals, then `Content-Signal: search=yes, ai-input=yes, ai-train=yes` in the wildcard group, before `Allow: /`. The `Allow` and `Sitemap` lines are unchanged.

**Result:** 200, echoed back (`step-2.2-set-robots-txt-response.txt`).

## Step 3: GET after ✅ COMPLETED

**Result:** 200, identical to the file sent (`step-3.1-get-robots-txt-response.txt`). `https://www.jackzhaojin.com/robots.txt` served the new file within seconds.

Rollback: POST `step-1.1-get-robots-txt-response.txt` the same way.
