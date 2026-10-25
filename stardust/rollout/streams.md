# Rollout streams: results as reported (main thread record)

Each stream gated its own pages on the published origin at 1440 and 360 (content-diff looks-same red / nothing-lost yellow, pixel %, height delta) and ran the editability probe. The main thread re-checks every page in the final sweep (gate-all over all pages).


## Final sweep (main thread, 2026-10-25, after link localization)

gate-all on the published origin over all 34 sitemap pages (`stardust/rollout/gate-state.json`; pixel <= 10%, height within 5%, clip 0, content presence), captures in `stardust/replica/gates/all-<w>/` (not committed):

| Width | Full verdict | Pixel + height only | Worst pixel |
|---|---|---|---|
| 1440 | 33 PASS / 1 FAIL | 34 PASS | 08-15 4.15% (R11), 07-06 2.53% (-10px, R13), writing 0.42% |
| 360 | 33 PASS / 1 FAIL | 34 PASS | 08-15 8.40% (R11), 07-06 4.80%, adaptTo 3.35% |

The one failure at each width is the portfolio's content presence MISSING 2: the postal repo cards, whose source wraps heading and summary in one link (recorded residual). 2025-09-01 is 0px at both widths after the code-nowrap fix.

Mobile Lighthouse performance (12.8.2, aem.live): 100 on home (runs 2 and 3; a cold first run 99), writing listing, the archetype article, portfolio, talks, certifications and privacy (two runs each, all 100; CLS at most 0.012). Reports in `stardust/rollout/lighthouse/` (not committed).

## Listings (stream-listings, done)

| Page | 1440 | 360 | Editability |
|---|---|---|---|
| /writing/ | 0/0, 0.00%, 0px | 0/0, 0.08%, 0px | 198 authored, 197 editable, 0 dead, 0 dup (1 exempt: widget link) |
| /talks/ | 0/0, 0.06%, 0px | 0/0, 0.05%, 0px | 77/77, 0, 0 |
| /certifications/ | 0/0, 0.06%, 0px | 0/0, 0.20%, 0px | 140/140, 0, 0 |
| /privacy/ | 0/0, 0.00%, 0px | 0/0, 0.00%, 0px | 19/19, 0, 0 |
| /404.html | pixel 0.00%, heights equal (own captures: stitch-shot refuses the source's "Page not found" as a denial page) | same | 7/7, 0, 0 |

Built: hero variants writing, talks, certifications, page; row-list (talks); writing-list block; widgets/writing-filter; credentials block; templates listing (section style `note`) and static; 404.html. Re-gated home and the archetype clean after the hero change.

Register candidates: privacy prose column centred at 666px while the hero is left-aligned (copied); talks row "Columbus AI 2025" empty cluster leaves 24px (copied); GH-300 badge SVG over 40 KB, shipped as PNG (no visible change).

Follow-ups for the main thread: run localize-links over the whole content tree at the end (33 links in 11 files); query-index switch needs a site config and article metadata (title, summary, display date, topics, read time, video length, YouTube URL, talk link and note, cover, keywords, title-keep-together).

## Portfolio (stream-portfolio, done)

| Page | 1440 | 360 | Editability |
|---|---|---|---|
| /portfolio/ | 0/0, 0.28%, -1px | 0/0, 1.23%, -1px | 508/508, 0 dead, 0 dup, 0 edit drift |

All 11 `#ch-*` anchors resolve at the source's 90px scroll margin (plus #timeline-view, #year-2025, #career, #workbench, #p-kit-video). Home re-gated after the showcase and cards changes: 1440 0.26%, 360 1.09%, 0px, content-diff none.

Built: showcase story / flip / wide / tall; cards tool / project / repo; chapter-head; divider (rule, year); jump-links; timeline (gantt with year rail, ladder, milestones); tabs (diagram deck); panel (edge, pulse, glossary, compare, wire, flow, bakeoff); stats; stat-chips; proof-links; frame (diagram, sub, portrait); carousel; templates/portfolio; import-portfolio.mjs. Config rows `key | value` in hidden wrappers (label, id, title, replay, max, previous, next, range, now, rail, legend, fallback).

Register candidates: v3 components.css rules that hit portfolio class names on the source (.story box, .thesis 18px, .cred-strip padding, .proof-links a 10px) copied as is; two empty proof-links paragraphs keep 18px (minimal change: drop them). Residual advisories: 135 EXTRA (hidden config rows, glossary, no-JS fallback); content-presence 2 MISSING LINK (postal repo cards: whole-card link would break quick edit) and 6 MISSING BUTTON (deck tabs are role=tab hosts, EW7). Follow-ups: 10 diagram links point at www.jackzhaojin.com/portfolio/assets/ (404 after cutover unless served); JSON-LD not carried (G2).

## Article batch A1 (stream-articles-a1, done)

| Page | 1440 | 360 | Editability |
|---|---|---|---|
| 2025-04-13-vibe-coding-star-story-generator | 0/0, 0.01%, 0 | 0/0, 0.60%, 0 | 143/143/0/0 |
| 2025-05-28-aem-headless-when-frontend-teams-lead | 0/0, 0.06%, 0 | 0/0, 0.17%, 0 | 109/109/0/0 |
| 2025-06-04-seven-aem-capabilities-tradeoffs | 0/0, 0.03%, 0 | 0/0, 0.07%, 0 | 251/251/0/0 |
| 2025-06-08-edge-cms-shift-adobe-eds | 0/0, 0.00%, 0 | 0/0, 0.00%, 0 | 115/115/0/0 |
| 2025-06-12-azure-rbac-cicd-for-ai-agents | 0/0, 0.05%, 0 | 0/0, 0.35%, 0 | 159/159/0/0 |
| 2025-07-06-ai-coded-nextjs-agent-release-1 | 0/0, 2.49%, -10 (R13) | 0/0, 4.80%, 0 | 114/114/0/0 |

Engines: era-steps, request-pipe, role-assignments, capability-pivot, spec-filter, persisted-query, credential-chain, parser-lab, option-pair, option-matrix. Residuals: quick-edit drift in three live-state lists (parser-lab steps 317 to 290px; credential-chain chain 404 to 486px, switches 162 to 251px inside a closed disclosure); content-presence "buttons missing" (role hosts, EW7). Rail thumbnails owner-accepted at 360 (local only, 20 entries). D15 false positives on 04-13, 05-28, 06-12, 07-06.

## Article batch A2 (stream-articles-a2, done)

| Page | 1440 | 360 | Editability |
|---|---|---|---|
| 2025-07-07 | 0/0, 0.07%, 0 | 0/0, 0.86%, 0 | 154/154/0/0 |
| 2025-07-11 | 0/0, 0.03%, 0 | 0/0, 0.38%, 0 | 105/105/0/0 |
| 2025-07-12 | 0/0, 0.01%, 0 | 0/0, 0.42%, 0 | 128/128/0/0 |
| 2025-07-13 | 0/0, 0.01%, 0 | 0/0, 0.33%, 0 | 61/61/0/0 |
| 2025-09-01 | 0/0, 0.04%, 0 | 0/0, 9.74%, -27 (summary nowrap; fixed in fc8724f, re-checked in the sweep) | 158/158/0/0 |
| 2025-10-05 | 0/0, 0.02%, 0 | 0/0, 0.34%, 0 | 130/130/0/0 |
| 2025-10-12 | 0/0, 0.05%, 0 | 0/0, 0.72%, -1 | 138/138/0/0 |
| 2026-01-05 | 0/0, 0.01%, 0 | 0/0, 0.75%, 0 | 122/122/0/0 |

Engines: branch-push, task-protocol, consideration-lens, offering-path, stale-timeline, header-relay, scripted-flow, tool-loop, tool-dialects, score-blend, task-loop, trail; 8 SVGs uploaded to media. Residual: task-loop quick-edit (generated finding switches hide, authored text shows). Register R19 to R23. Rail thumbnails owner-accepted at 360 (local only, 34 entries). D15 false positives on 5 pages.

## Article batch A3 (stream-articles-a3, done)

| Page | 1440 | 360 | Editability |
|---|---|---|---|
| 2026-01-29-playwright-stakeholder-demos | 0/0, 0.01%, 0 | 0/0, 0.62%, 0 | 156/156/0/0 |
| 2026-02-05-reusable-ai-development-modules | 0/0, 0.00%, 0 | 0/0, 0.49%, 0 | 73/73/0/0 |
| 2026-03-23-eds-hlx-admin-agentic-config | 0/0, 0.01%, 0 | 0/0, 0.66%, 0 | 109/109/0/0 |
| 2026-04-05-continuous-executive-agent-v2-1 | 0/0, 0.04%, 0 | 0/0, 0.80%, 0 | 153/153/0/0 |
| 2026-04-12-two-ai-skills-team-enablement | 0/0, 0.01%, 0 | 0/0, 0.56%, 0 | 105/105/0/0 |
| 2026-05-17-adobe-eds-skills-hands-on | 0/0, 0.00%, 0 | 0/0, 0.77%, 1px | 123/123/0/0 |
| 2026-05-24-theming-eds-with-google-stitch | 0/0, 0.00%, 0 | 0/0, 0.50%, 0 | 134/134/0/0 |

Engines: freezeframe, reuse-stacks, hook-guard, retry-ladder, harvest-sorter, skill-tracker, step-checklist, line-map, content-contract, theme-swap. Residuals: hook-guard edit-mode drift (-39px in quick edit: derived match lines hide while editing); hidden data rows count as advisory EXTRA; some derived strings stay in engines (log templates, rule reasons, verdicts). Register candidates: theme-swap loads the source's extra Google Fonts sheet on 2026-05-24 (approved; alternative: self-host four faces); freezeframe's static fallback differs from its JS output in the source (both carried). Rail thumbnails owner-accepted at 360 (local only, 31 entries). D15 false positives on 01-29, 04-05, 05-17.

## Article batch A4 (stream-articles-a4, done)

| Page | 1440 | 360 | Editability |
|---|---|---|---|
| 2026-05-31-continuous-agent-second-brain | 0/0, 0.05%, 0 | 0/0, 0.85%, 0 | 152/152/0/0 |
| 2026-06-28-patterns-of-work | 0/0, 0.00%, 0 | 0/0, 0.37%, 0 | 221/221/0/0 |
| 2026-07-21-four-frontier-models-one-prompt | 0/0, 0.00%, 0 | 0/0, 0.85%, -1 | 130/130/0/0 |
| 2026-08-09-adobe-stardust-explained | 0/0, 0.00%, 0 | 0/0, 0.40%, 0 | 99/99/0/0 |
| 2026-08-15-anima-mesh-company-of-zero | 1/0, 4.15%, -379 | 1/0, 8.42%, -374 | 250/250/0/0 |
| 2026-10-10-adaptto-2026-25-talks | 0/0, 0.04%, 0 | 0/0, 3.31%, 0 | 332/332/0/0 |

08-15 fails by design (register R11): the source's explainer.js does not parse (line 338, an unescaped apostrophe), so www shows only the static no-JS example; our engines run. That gives the height delta and the one red (ROLE SWAP on "Skipped"). Engines: hook-switchboard, empty-cohort, work-patterns, model-merge (+ import engine work-patterns-photo), stardust-lifecycle, stardust-versions, beat-sim, defect-lab; block talk-list. Residuals: hook-switchboard quick-edit drift 3 (+34px: hidden flag-off lines show in the editor); adaptTo advisories (hidden anchor ids EXTRA, talk 10 "My take" MISSING BODY + EXTRA, 3.31% sub-pixel image drift at 360). Requests: article.css skips inline code inside .lab, so lab-frame engines repeat that look; localize-links needs a per-file option (streams reverted each other's files); aem-cli 16 serves local content/ and redirects to sign-in (forks moved content/ aside to test).

## Design system (stream-design-system, finished, blocked)

Its `git push origin HEAD:main` was refused by the permission check as a production deploy, so its 4 commits wait on branch `worktree-agent-abd6bd6521e3db01a` (1ac8627, 0fa8803, 7534ff7, c95a983) for Jack's decision; the page is previewed in DA, not published. Local gates before the other streams landed: 1440 186 red / 31 yellow, 14.33%, -4935px; 360 185/31, 19.76%, -3784px, mostly 45 stories that waited on portfolio blocks and main-thread items. Built: faq, callout (warn), cta-band, transcript (open), chapters, pagination, facts, templates/design-docs, import-design-system.mjs. Main-thread items done since: dark inverse for a band forced dark (styles.css), unique nav id for a second header, theme control in scripts/theme-control.js. Still waiting: kicker, icons, band words (accent, dots, milestone), a chips block, the proof list's label column, embed. Register candidates: header and footer stories show the live chrome; button ghost / small / icon / disabled have no EDS equivalent; v3 .placeholder look lost; embed placeholder state; rowspan in the rhythm table; page-head story uses a paragraph; filter bar story is the writing filter. Follow-up: 35 links to /design-systems/v3/templates/*.html stay absolute and 404 after cutover.

## Article batch A4 forks

- patterns-of-work: 1440 0/0, 0.00%, 0px; 360 0/0, 0.37%, 0px; edit 221/221. four-frontier: 1440 0/0, 0.00%, 0px; 360 0/0, 0.85%, -1px; edit 130/130. Rail thumbnails owner-accepted at 360 (9 and 7), as on the archetype.
