# What's left

Everything below is a stop point from the plan (Jack's call, his credentials or a config change) or a known residual with its cause. The plan's own checklist is `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/start-here.md` (its Done, Left and Run log were updated locally and are not committed; Jack commits that repo).

## 1. Register review (decisions 15 and 16)

`stardust/replica/inconsistency-register.md`, 24 entries:
- **Needs a decision:** R3 (one frame of the light canvas before a stored Dark choice applies).
- **Applied, needs review:** R6 (lab verdict box reserves its height), R11 (2026-08-15 ships working explainers), R16 (theme-swap's extra Google Fonts), R18 (a caption link moved to the media copy), R20 (explainer pickers are one tab stop with arrow keys).
- **Needs review:** R7 (owner-accepted rail thumbnail diffs at 360, now 96 entries in `accepted.json`), R22 (inline-drawn SVG diagrams), R23 (sentence templates with `{placeholders}` in explainer rows).
- **Proposed changes:** R1, R2, R4, R5, R8, R9, R10, R12, R13, R14, R15, R17, R19, R21.
- **Resolved:** R24.

## 2. Config (stop point: any Experience Workspace or site config change)

- Experience Workspace enablement: `ew.enabled` in the DA config `flags` tab and the Sidekick `editUrlPattern`.
- The block library sheet (rows listed in `stardust/rollout/streams.md`, design system section).
- The query index, so the writing listing reads `/query-index.json`, with the article metadata it needs.
- Redirects: `/blogs.html` to `/writing/`, `/certifications.html` to `/certifications/`, and every folder page without its trailing slash (qa: 33 of them).
- The sitemap (today it also lists `/nav` and `/footer`), robots, headers, bulk metadata (`og:type` on every page), JSON-LD, GA4 in `consented.js` (decision 9).
- Push invalidation: the zone ID and a Cache Purge token in the EDS site config (Jack creates the token).

## 3. Cloudflare and the cutover

1. The staging DNS record for `next.jackzhaojin.com` (proxied placeholder).
2. `wrangler login` (Jack), then from `edge/`: `npx wrangler deploy --env staging`.
3. `node scripts/check-host.mjs --base https://next.jackzhaojin.com` (it already passes with the Worker in-process; the legacy redirects show as waiting until the redirects config exists).
4. Then the cutover order in routing-cloudflare.md: push invalidation, the www route in the dashboard (its own approval), verification, `docs/site-operations.md`, the README in `jackzhaojin.github.io`.

## 4. Known residuals

- **2026-08-15** (R11): about -379px and one ROLE SWAP against a source whose explainers never run.
- **2025-07-06** at 1440 (R13): -10px from the watch-row spacing.
- **Design system page**: passes at both widths (4d7c0ad: 1440 1.68%, +2px; 360 3.66%, -4px; 0 red, 0 nothing-lost). Left: its bracketed placeholder text is Inter 15px where v3 uses mono 12.75px (+6px per placeholder story at 360; needs a content marker and a re-import), and its stories use the site's own blocks (R17, for review).
- **qa leftovers** (none a migration defect): the noindex header aem.live sends before cutover; findings the source has too (contrast in two explainers, unfocusable code scroll regions, a link told apart by colour only on the home, R1); heuristics (fleet-consensus template blocks, duplicate text, upscaled small images).
- **Quick-edit drift** in a few explainers whose derived state lines hide while editing (hook-guard, hook-switchboard, parser-lab, credential-chain, task-loop); authored text stays editable everywhere.
- **Links that stay on www**: 35 links to the v3 prototype templates and 10 portfolio diagram files are not migrated and will 404 after cutover unless those files stay served.

## 5. Double migration until the cutover

Every page published on GitHub Pages before the cutover also has to land here. The recipe, as used for the article about this build on the evening of 2026-10-25:
1. `node stardust/scripts/import-article.mjs <source index.html> <slug> content/writing/<slug>/index.html`; an `UNSUPPORTED` line means an explainer needs an engine (`blocks/explainer/engines/<word>.js` and `.css`, plus `stardust/scripts/import-engines/<word>.mjs`).
2. `node stardust/scripts/import-listing-pages.mjs <source root> content <work dir>` for the listing row. It also rewrites talks and privacy and drops the hand-added social image metadata on writing: restore those (`git diff content/`).
3. `node stardust/scripts/deploy/localize-links.mjs --source-host www.jackzhaojin.com --content content`.
4. `da-media-upload.mjs` for the article's images (`--scope writing/<slug> --dir <source images>`) and for the listing thumbnail (`--scope writing --manifest` with the one new entry of the listing importer's `media-writing.json`; without it the listing shows `about:error`).
5. `deploy-batch.mjs` for the two paths (`--force` for the listing), then gate both at 1440 and 360; rail thumbnails at 360 go to `accepted.json` (R7). Add the page to `stardust/rollout/gate-state.json` and the line to `llms.txt`.

## 6. Follow-ups worth doing

- A pull request to adobe/skills adding a colour-scheme option to stardust's capture scripts (decision 18); the dark sweep here used `stardust/.work/dark-sweep.mjs`.
- Fold the one-article variants into defaults at the next design round (R12) once the register is reviewed.
- `localize-links.mjs` rewrites every file in `content/`; a per-file option would have saved the streams some reverting.
- `import-listing-pages.mjs` could keep page metadata it does not own (the social image rows) and write one listing at a time.
