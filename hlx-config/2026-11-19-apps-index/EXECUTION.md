# EXECUTION: the app pages stay out of the query index (2026-11-19)

Org `jackzhaojin`, site `www-eds`, `https://admin.hlx.page`. Auth: the da-auth IMS token as `Authorization: Bearer` (never printed or saved). The goal: the pages under `/apps/` are each one full-screen app (Same Page's phone app and big screen, run by the remote widget since v1.8.0), never part of the site's listings or sitemap. Jack's words for the move: "keep them in a separate folder... make sure they're not being indexed". The plan he approved is in `jackzhaojin/eds-multiplayer-authoring`, `ai-docs/2026-11-19-eds-widgets/widget-plan.md`. This is config, not a release.

The pages also carry `robots | noindex, nofollow`, which the sitemap already honours. Leaving `/apps/**` out of the default index as well keeps them out of `/query-index.json`, which the listings and the edge Worker read. The order matters (the lesson of `2026-10-26-listing-indexes`): the index leaves the folder out before any page in it is published, so no row ever has to be cleared.

## Step 1: GET the index config (before) ✅ COMPLETED

`GET /config/jackzhaojin/sites/www-eds/content/query.yaml`: `execution-files/step-1.1-get-query-response.yaml`.

**Result:** 200, byte-identical to `hlx-config/query.yaml` in git before this change.

## Step 2: SET the new definition ✅ COMPLETED

`POST /config/jackzhaojin/sites/www-eds/content/query.yaml`, `Content-Type: text/yaml`, body `execution-files/step-2.1-set-query-request.yaml` (the file in git). The one change: the `default` index also excludes `'/apps/**'`. The other indexes (`talks`, `writing`, `portfolio`) only include their own folders and are unchanged.

**Result:** 204.

## Step 3: GET the index config (after) ✅ COMPLETED

The same GET as step 1: `execution-files/step-3.1-get-query-response.yaml`.

**Result:** 200, byte-identical to `hlx-config/query.yaml`. The two app pages, `/apps/same-page/play` and `/apps/same-page/show`, were previewed but not yet published when this ran.

**Rollback:** POST `execution-files/step-1.1-get-query-response.yaml` back.
