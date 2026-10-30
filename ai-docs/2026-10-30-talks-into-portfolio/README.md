# Talks fold into the portfolio (v1.3.0, 2026-10-30)

Jack, setting the goal: "let's maybe never have talk pages and link out to other things ... I like talks being a list of things. But yeah, I don't like talks having some pages on ourselves. And then ideally, they should be folded into ideally portfolio, right? If it's special, if it's portfolio ... the YouTube video should go into the portfolio, right? And then we just link to the portfolio, or you watched it directly on YouTube."

## What changed

- **`/talks/` is one authored list.** The Row list (talks, dynamic) block, filled from `/talks-index.json` (the talk pages), became a Row list (talks) block with nine authored rows, the same rows the index made. Each title links straight to the recording (else the event page; Denison and Columbus 2025 have neither, so no link). The links out are the ones the rows had, minus the two cross-links between the adaptTo talks, which pointed at talk pages and sit in adjacent rows anyway. The rows are now editable in DA (84 of 84 texts), which generated rows never were.
- **A talk about a project is a story on the project's page,** the last story of the chapter, with the recording as a click-to-load video and a Proof links block for the event page and slides:

| Talk | Now at | Moved with it |
|---|---|---|
| adaptTo() 2026, AI Agent-Driven Content Migration for Edge Delivery Services | `/portfolio/content-factory/#adaptto-2026` | the talk page's prose (Our talk ..., My take, the three call-outs) and the framework slide |
| adaptTo() 2026, Conversion Factory (lightning) | `/portfolio/conversion-factory/#adaptto-2026-lightning` | (the talk page's paragraph repeated the project's own thesis, so it stays out) |
| AI Tinkerers, AnimaMesh | `/portfolio/anima-mesh/#ai-tinkerers-2026-animamesh` | the write-up and Top AI Demos links |
| AI Tinkerers, OpenClaw 24/7 Development Agent | `/portfolio/continuous-executive-agent/#ai-tinkerers-2026` | the write-up and Community Spotlights links |
| Adobe Summit 2024, AEM Rockstar | `/portfolio/aem-rockstar-2024/#aem-rockstar-2024` | the event page link |
| Columbus AI Week 2026 talk and panel, Denison, Columbus AI Week 2025 | the row on `/talks/` (`/talks/#<id>`) | no project; the rows link to the event page or the materials |

  The Columbus 2025 and Denison talk pages had a few lines beyond their descriptions (the Columbus 2025 pitch paragraph and two bullets, Denison's CS 271 line and its parts list). They aren't on the list rows: the archive keeps them (archive.jackzhaojin.com and the Wayback Machine have the talk pages as they were).
- **Links to talk pages now point where the talk lives:** 14 links, one on the home page (AEM Rockstar winner, now to the project) and 13 in nine articles (to the project page's story). `llms.txt` lists the talks at their new homes.
- **Redirects.** The nine talk pages (`/talks/<id>/`, without the slash and as `index.html`) and their first records (`/talks/records/<id>`) 301 to the story or the row (`hlx-config/redirects-extra.tsv`). A redirect wins over a page that still exists (checked on aem.page), and the pages are unpublished too, so they leave the query index and the sitemap. `hlx-config/sheets.mjs` now takes the folder pages from the published query index (since 2026-10-28 `content/` keeps examples only, so the old way would have dropped most of the 129 redirects), and a row in `redirects-extra.tsv` wins over a folder page's. The sheet goes from 129 rows to 134; the only rows dropped are the slash redirects of two preview-only drafts.
- **Code (v1.3.0).** `scripts/talks-list.js` writes the talks list's JSON-LD in the browser from the rows: the CollectionPage's ItemList holds an Event per talk (date, event, place, kind, the performer, its write-up and project when the row links them; `collection-schema.js` gives an Event no author). Gone: the talk template, `scripts/talks-index.js`, the Row list (talks, dynamic) listing (browser and edge Worker), the talk-page JSON-LD in `scripts/page-schema.js` and the Worker, the talk-page Related lists (the writing index's `pages` now keeps project pages only). Tests: 19 unit tests, 23 Worker tests.
- **Block library.** Row list (talks) is the authored variant from `/talks/`; Showcase gets "Showcase (story) with a talk" (the AEM Rockstar story); the Talk page template is gone from the templates sheet.

## Left as it is (Jack's call)

- **The talks query index definition** (`hlx-config/query.yaml`, `talks:` to `/talks-index.json`): unused now and empty once the pages are unpublished. Removing it is a site config change.

## Validation (branch preview `talks-into-portfolio--www-eds--jackzhaojin.aem.page`)

- `/talks/` and the five project pages at 1440 and 360, light and dark: no console errors, no horizontal overflow, the stories decorated with the video poster and the adopted slide and proof links.
- The talks list's JSON-LD: one graph, nine Events, no author on any.
- Home, an article, the writing and portfolio hubs (the gallery's 11 cards), two project pages' Related lists: no errors, no overflow, no link left to a talk page.
- Editability (`--simulate-editor`): `/talks/` 84/84, the five project pages 95, 39, 125, 126 and 37, all editable, home 28/28.
- `seo-check.mjs` on the branch: no dead link, JSON-LD or social image URL beyond the expected (the talk pages answering 301, and the project sites only www serves).
- `npm run lint` (0 errors), `node --test test/*.test.mjs` (19/19), `cd edge && npm test` (23/23).

## Live (2026-10-30)

- **Published** at 13:10 ET: `/talks/`, the five project pages, home and the nine articles (16 pages, IndexNow 200). Then the redirects sheet (preview and live), then the nine talk pages unpublished and unpreviewed (all 204), and the nine old URLs sent to IndexNow (200). v1.3.0 merged after that ([jackzhaojin/www-eds#14](https://github.com/jackzhaojin/www-eds/pull/14), checks passing), so www never served the new code with the old dynamic hub.
- **On www:** every old talk URL answers 301 to its new home; `/talks-index.json` is empty, the query index and the sitemap have no talk pages. `/talks/` serves the nine authored rows (five titles linking to YouTube, no link to a talk page) and, once the browser runs, one graph with nine Events. Home, `/talks/`, both hubs, an article and the five project pages at 1440 and 360: no errors, no overflow, no link left to a talk page; the project pages' Related lists picked up the articles that now link to them (Content Factory 8). `seo-check.mjs` on www: 49 pages, 181 URLs, 0 problems.
- **One quirk:** Edge Delivery adds a request's query string after the destination, so an old talk URL with one (`?utm_source=...`) lands on `/portfolio/content-factory/#adaptto-2026?utm_source=...`: the right page, at its top rather than at the story. Without a query string the anchor works.
- **Archive:** snapshot `dfcd552` (the talk pages leave `site/` and become 301s in `_redirects`; check PASS locally: 1225 files, 48 pages, 134 redirects). Wayback: `/talks/` 20261030171748, the five project pages 20261030171815 to 20261030172056, home 20261030172125 (`wayback.json`, `7ed0c8a`). Both deployed at 13:28 to 13:29 ET with Jack's OK ("Deploy both"), below.
- `content-coverage.mjs --site ../www-archive/site`: the examples show all 159 variations the site uses (160 before: the talk template is gone).

## Deployed (2026-10-30, Jack: "Deploy both")

- **`www-eds-edge` on www,** 13:28 ET, version `4db8a928` (replacing v1.1.6's `8fd69f11`), from tag `v1.3.0`: the Worker without its talk code. Same three vars, `ARCHIVE_ORIGIN` unset. Before: Worker tests 23/23, `check-host.mjs --local www` PASS. After: `check-host.mjs --base https://www.jackzhaojin.com` PASS; `/portfolio/` still filled at the edge, project pages with their graph, `/talks/` served as authored.
- **`www-archive`,** 13:29 ET, version `a276bc2b` (replacing `af460fbd`), 97 changed assets. `tools/check.mjs` PASS on archive.jackzhaojin.com and on workers.dev: 1225 files, 48 pages, 134 redirects.
- Recorded in `jack-dev-server-configs/server/cloudflare/history.md` (`9a91a5e`), with the rollback for each.

## The talks gallery (v1.3.1, 2026-10-30)

Jack, after v1.3.0: "I wanted talk page to be as beautiful as the portfolio page. It's more of a visual thing as well, right? It animates, it's beautiful ... don't do the timeline bar, but I do want each talk to have some kind of animation. It could even be the same animation, right, of the other thing."

- **Every talk is a card,** the portfolio gallery's (`decorateGallery` in `blocks/row-list/row-list.js`, now shared): numbered, on its accent's tint, the scene revealed when the card is half on screen and played on hover (or, on touch, the card most in view). The newest talk spans the row, the rest run in threes. The card links where the title links (the play mark for a recording, the out arrow for an event page); the talk's own links and status stay clickable above it, with a thin underline in the card's accent.
- **The animation:** a talk whose links include its project page plays that project's scene in the project's accent (the accent from the portfolio index's chapter anchor; the `--c-*` project accents moved from the portfolio template to `styles.css` so `/talks/` has them). The four talks without a project take the topic colors in turn (work, agents, aem) and a new engine, `stage`, built by the gallery (never authored): slides advance on a screen, the voice goes out in arcs and the listeners light as it reaches them; a "panel" or "fireside" kind draws four chairs passing the voice, a "lecture" or "class" kind a lecture whose raised hands get their answers.
- **Checked** on the branch preview: 1440 and 360, light and dark, no errors, no overflow; `gallery-scroll.mjs` (now for `/talks/` too) 9 of 9 reveals at 120, 500 and 3000 px/s at both widths, the portfolio's still 11 of 11; the stage plates at 60 fps, no long tasks; editability 84/84 on `/talks/`, 99/99 on `/portfolio/`; the JSON-LD unchanged (nine Events).
- **DA cleaned up** (Jack: "clean up the other files in experience workspace under talks and just have index"): the nine talk documents and the nine first records under `/talks/records/` are deleted, so `/talks/` holds only `index`; so are the library's Talk page template and the `/drafts/talks-index/` validation draft (both preview-only, now unpreviewed). Their published versions stay in the archive's history and the Wayback Machine.
- **Live:** v1.3.1 merged ([jackzhaojin/www-eds#15](https://github.com/jackzhaojin/www-eds/pull/15)) and tagged; the changed code purged from the CDN. On www: nine cards with their accents and scenes, no errors, no overflow, one JSON-LD graph; `gallery-scroll.mjs` 9 of 9 on `/talks/` and 11 of 11 on `/portfolio/` at 1440 and 360; the project pages keep their accents (`--c-*` from `styles.css`). The PR's PageSpeed check scored `/talks/` 100 on mobile and desktop and failed on `/portfolio/` (mobile TBT 17 s, desktop timeout); main's `/portfolio/` measures the same under a throttled phone (about 5.3 s of long tasks in 10 s, against 5.6 s on the branch), so that is the gallery playing a scene on touch screens since v1.2.1, not this change.
- **Archive:** snapshot `c84a7d0` (13 changed files and the stage engine; check PASS locally, 1227 files, the talks gallery working from the archive). `/talks/` serves the same HTML as at 13:10, so the Wayback capture of it stands (20261030171748).
