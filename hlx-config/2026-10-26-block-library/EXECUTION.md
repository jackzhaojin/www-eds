# EXECUTION: the block library in the site's DA config (2026-10-26)

`https://admin.da.live/config/jackzhaojin/www-eds/`, auth the da-auth IMS token as `Authorization: Bearer` (never printed or saved). Jack's goal for v1.1.1: "we also need to enable the block library in config, look that up and enable it as well". This is config, not a release.

How the library is configured (researched from adobe/da-live and https://www.aem.live/docs/ew/administering/set-up-library): a `library` tab in the site's DA config, one row per tool. `title` Blocks or Templates picks the built-in tool, `path` is the sheet it reads. The classic editor reads only the site config; Experience Workspace merges the site and org configs. A write replaces the whole stored config, so the body carries every tab; the org config (`data`, `permissions`, `flags` with `ew.enabled`) is a separate key and is not touched.

## Step 1: GET the site config (before) ✅ COMPLETED

`GET /config/jackzhaojin/www-eds/`: `execution-files/step-1.1-get-site-config-response.json`.

**Result:** 404. The site had no DA config of its own; the org config (`GET /config/jackzhaojin/`) answered 200 with its three tabs.

## Step 2: SET the site config with the library tab ✅ COMPLETED

`POST /config/jackzhaojin/www-eds/`, `multipart/form-data` with the field `config` holding `execution-files/step-2.1-set-site-config-request.json`: a multi-sheet body with an empty `data` tab (it keeps the body multi-sheet, which Experience Workspace reads) and a `library` tab with two rows, Blocks (`https://main--www-eds--jackzhaojin.aem.page/docs/library/blocks.json`) and Templates (`.../templates.json`).

**Result:** 201 (`execution-files/step-2.2-set-site-config-response.txt`).

## Step 3: GET the site config (after) ✅ COMPLETED

**Result:** 200, `:names` `["data","library"]`, multi-sheet, the two library rows as sent (`execution-files/step-3.1-get-site-config-response.json`). The org config still answers 200.

## Step 4: verify in da.live ✅ COMPLETED

In the built-in browser, signed in as Jack: `https://da.live/edit#/jackzhaojin/www-eds/drafts/library-check` opened Experience Workspace (the canvas editor) on a new scratch document. The tools panel's menu shows a **Library** section with **Blocks** and **Templates**. Blocks opened **Insert block** with the 35 blocks of the sheet; Callout expanded to Callout and Callout (warn), the preview rendered both with the site's styles, and + inserted Callout (warn) into the document (the Outline listed it). Templates listed Article, Static page, Listing hub, Talk page and Project page, and the Talk page preview rendered.

The scratch document `/drafts/library-check` stays in DA (never previewed); deleting it is Jack's call.

Later the same evening, more of the library on the scratch document: search ("row list" finds the three Row list variants), variant previews with the site's styles (Row list, with the talks and projects lists rendering live from their indexes), the inserted block still there after a reload, and the Project page template inserted as editable content. Then on a real published page, `/talks/denison-2026/index`, opened without editing: Experience Workspace renders it with the site's code (hero, breadcrumb, prose, the typed links), the Outline lists its blocks as an author sees them (`hero (page)`, default content, `proof-links`), and the Insert block dialog opens there with every block. DA's copy afterwards was unchanged (last modified at the publish, markup identical to git after the known rewrites).

**Rollback:** `DELETE /config/jackzhaojin/www-eds/` removes the site config, and with it the library (the org config is separate).
