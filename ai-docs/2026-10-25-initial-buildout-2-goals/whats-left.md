# What's left

Everything below is a stop point from the plan (Jack's call, his credentials or a config change) or a known residual with its cause. The plan's own checklist is `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/start-here.md` (its Done, Left and Run log were updated locally and are not committed; Jack commits that repo).

## 1. Register review (decisions 15 and 16)

`stardust/replica/inconsistency-register.md`, 24 entries:
- **Needs a decision:** R3 (one frame of the light canvas before a stored Dark choice applies).
- **Applied, needs review:** R6 (lab verdict box reserves its height), R11 (2026-08-15 ships working explainers), R16 (theme-swap's extra Google Fonts), R18 (a caption link moved to the media copy), R20 (explainer pickers are one tab stop with arrow keys).
- **Needs review:** R7 (owner-accepted rail thumbnail diffs at 360, now 104 entries in `accepted.json`), R22 (inline-drawn SVG diagrams), R23 (sentence templates with `{placeholders}` in explainer rows).
- **Proposed changes:** R1, R2, R4, R5, R8, R9, R10, R12, R13, R14, R15, R17, R19, R21.
- **Resolved:** R24.

## 2. Config (stop point: any Experience Workspace or site config change)

**Done 2026-10-25 evening, at Jack's request (SEO parity with www):** the production host (`cdn.prod.host`), robots.txt, the query index, the sitemap (the same 35 URLs as www), the redirects sheet (trailing slashes, `index.html`, `/blogs.html`, `/certifications.html`), bulk metadata (`og:type`, `og:site_name`, `og:locale`) and per-page JSON-LD, titles, share titles and article tags. Files and the step-by-step log: `hlx-config/`. Still open below: the Experience Workspace items, the library sheet, GA4 and push invalidation.


- Experience Workspace enablement: `ew.enabled` in the DA config `flags` tab and the Sidekick `editUrlPattern`.
- ~~The block library sheet~~: done in v1.1.1 (2026-10-26): 35 blocks, 91 variants and 5 templates under `/docs/library/`, enabled in the site's DA config (`hlx-config/2026-10-26-block-library/`).
- The query index, so the writing listing reads `/query-index.json`, with the article metadata it needs.
- ~~Redirects~~, ~~the sitemap~~, ~~robots~~, ~~bulk metadata~~, ~~JSON-LD~~: done (above). Headers: none needed (www sets none). GA4 in `consented.js` (decision 9) is still open.
- Push invalidation: the zone ID and a Cache Purge token in the EDS site config (Jack creates the token).

## 3. Cloudflare and the cutover

Jack's host plan (19:25): GitHub Pages moves to gh.jackzhaojin.com without SEO, EDS gets eds.jackzhaojin.com without SEO before the cutover, and www keeps its SEO after it.

**Done 2026-10-25 evening:**
- DNS records `eds` and `gh`, AAAA `100::`, proxied (Claude filled the forms in Jack's Chrome, Jack saved them).
- Workers deployed from `edge/` with the existing wrangler sign-in: `www-eds-edge-staging` on `eds.jackzhaojin.com/*` (EDS and the project sites) and `www-eds-edge-gh` on `gh.jackzhaojin.com/*` (the whole GitHub Pages site, read through www for now). Every host but www answers `X-Robots-Tag: noindex, nofollow`; canonicals point at www; robots.txt allows crawling, so crawlers see the noindex.
- `check-host.mjs` passes on both live hosts; www is unchanged (its home page is byte-identical to the source repo).
- Off www, robots.txt and the sitemaps are 404s from the Worker. The zone's managed robots.txt (AI Crawl Control) fills the robots.txt 404 with its content-signals comments, no rules and no sitemap; Jack chose to leave that setting on (19:45).

**The cutover: done 2026-10-26, about 15:12 ET, route-first, from another session.** The details are in [../2026-10-26-cutover/](../2026-10-26-cutover/README.md) and `edge/README.md`. In short:
- the top-level Worker was deployed with `PUSH_INVALIDATION = "disabled"` (now in `edge/wrangler.toml`);
- the route `www.jackzhaojin.com/*` was added in the dashboard;
- GitHub Pages stayed on www, and its `CNAME` must stay.

Rollback: remove the www route in the dashboard.

Validated after it, on 2026-10-26:
- `check-host.mjs` passes on www, gh and eds;
- all 7 project sites answer 200 on www;
- every SEO tag on all 35 pages matches gh;
- the full stardust sweep compared www with gh.

**Left after the cutover:**
1. ~~Push invalidation~~: done 2026-10-26 (`hlx-config/2026-10-26-push-invalidation/`). Every publish purges Cloudflare now, and since `v1.0.2` browsers keep pages for 10 minutes.
2. ~~GA4 is off on www~~: done in 1.0.1, per decision 9 (granted by default, no banner, Global Privacy Control declines, starts 3 seconds after the page loads). See the cutover record. Left: a look at GA4's real-time report.
3. **24 URLs (74 links) that 404 on www but are still served on gh:** the 15 portfolio diagram files, the 5 v3 prototype template URLs, the older `/design-systems/2026-09-13/` round and an ai-docs file. The proposal is to pass their prefixes through to GitHub Pages the way the project sites are, plus one content fix for a full-size image link. See the cutover record.
4. **Search Console:** submit the sitemap and inspect the home page URL.
5. **jackzhaojin.github.io:**
   - rewrite `docs/site-operations.md` for the new request path;
   - add a README saying the main site moved and `CNAME` must stay;
   - update the publishing docs (item 5 in the cutover record).
6. **Later, optional (Phase B):** move GitHub Pages to gh after the three code fixes in `edge/README.md`.

## 4. Known residuals

- **2026-08-15** (R11): about -379px and one ROLE SWAP against a source whose explainers never run.
- **2025-07-06** at 1440 (R13): -10px from the watch-row spacing.
- **Design system page**: passes at both widths (4d7c0ad: 1440 1.68%, +2px; 360 3.66%, -4px; 0 red, 0 nothing-lost). Left: its bracketed placeholder text is Inter 15px where v3 uses mono 12.75px (+6px per placeholder story at 360; needs a content marker and a re-import), and its stories use the site's own blocks (R17, for review).
- **qa leftovers** (none a migration defect): the noindex header aem.live sends before cutover; findings the source has too (contrast in two explainers, unfocusable code scroll regions, a link told apart by colour only on the home, R1); heuristics (fleet-consensus template blocks, duplicate text, upscaled small images).
- **Quick-edit drift** in a few explainers whose derived state lines hide while editing (hook-guard, hook-switchboard, parser-lab, credential-chain, task-loop); authored text stays editable everywhere.
- **Links that stay on www**: 35 links to the v3 prototype templates and 10 portfolio diagram files are not migrated and will 404 after cutover unless those files stay served.

## 5. Double migration (ended at the cutover)

Until the cutover, every page published on GitHub Pages also had to land here. Since 2026-10-26 GitHub Pages main-site pages no longer show on www, so **new writing has to be published to EDS**, following [content/README.md](../../content/README.md). The recipe below still converts an article drafted as GitHub Pages HTML into EDS content. As used for the article about this build on the evening of 2026-10-25:
1. `node stardust/scripts/import-article.mjs <source index.html> <slug> content/writing/<slug>/index.html`; an `UNSUPPORTED` line means an explainer needs an engine (`blocks/explainer/engines/<word>.js` and `.css`, plus `stardust/scripts/import-engines/<word>.mjs`).
2. `node stardust/scripts/import-listing-pages.mjs <source root> content <work dir>` for the listing row. It also rewrites talks and privacy and drops the hand-added social image metadata on writing: restore those (`git diff content/`).
3. `node stardust/scripts/deploy/localize-links.mjs --source-host www.jackzhaojin.com --content content`.
4. `da-media-upload.mjs` for the article's images (`--scope writing/<slug> --dir <source images>`) and for the listing thumbnail (`--scope writing --manifest` with the one new entry of the listing importer's `media-writing.json`; without it the listing shows `about:error`).
5. `deploy-batch.mjs` for the two paths (`--force` for the listing), then gate both at 1440 and 360; rail thumbnails at 360 go to `accepted.json` (R7). Add the page to `stardust/rollout/gate-state.json` and the line to `llms.txt`.
6. The SEO steps in `hlx-config/README.md`: sync the head metadata (JSON-LD, titles), republish, rebuild the redirects sheet, check the sitemap.

## 6. Follow-ups worth doing

- A pull request to adobe/skills adding a colour-scheme option to stardust's capture scripts (decision 18); the dark sweep here used `stardust/.work/dark-sweep.mjs`.
- Fold the one-article variants into defaults at the next design round (R12) once the register is reviewed.
- `localize-links.mjs` rewrites every file in `content/`; a per-file option would have saved the streams some reverting.
- `import-listing-pages.mjs` could keep page metadata it does not own (the social image rows) and write one listing at a time.
- **The Admin API skill's CDN section (Jack, 20:26):** when step 1 of the cutover sets push invalidation, keep its EXECUTION.md. Then add a `cdn/prod.json` section to `hlx-admin-api-executor` in ai-builder-kit, written from that run.
- **A version for the skills-only plugin:** it has none, so every commit to ai-builder-kit looks like a new version of it. A `version` on its marketplace entry would make updates mean something (ai-builder-kit, Jack's call).
- **Content in git (2026-10-26):** decided and done, see [../2026-10-26-content-in-git/](../2026-10-26-content-in-git/README.md). Left from it: the 42 scratch documents in DA's `/drafts/roundtrip/` (Jack's call), and the 25 media files that exist only in DA.
- **Protect the release branches** on GitHub, so `release/*` can't be pushed to or deleted (a repository setting, Jack's call).
