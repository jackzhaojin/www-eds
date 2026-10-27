# v1.1.1: one page per talk and project, three indexes, the block library

Jack's goal for the release (2026-10-26, evening, verbatim):

> ya let's make them individual pages, and it's weird where codex puts it 1 more layer down than it needs to be.
>
> we can stop running stardust's migration skill going forward as well - we don't need pixel perfect as much anymore
>
> 1.1.1 ideally we move all that listing (talks, writing, portofolio) to have its own indexes and individual pages. let's defintiely figure out what's considered top knotch content, we don't need more blocks i don't think.
>
> also take soem tiem and look up experience workspace and block libraries, i think we're supposed to create them. ideally design library we refactor into BEST IN CLASS da.live authorable elements as well so it's all biult in, obviously things like icon woudlnt' go in there, however, let's put content
>
> let's obviously do as much in parallel as possible so we're not waiting too much. ideally we validate the da.live authoring and block library working in https://da.live/#/jackzhaojin/www-eds
>
> we also need to enable the block library in config, look that up and enable it as well

Asked which shipping steps to take (after the auto-mode check refused a commit): "All of it": commit and push, merge and tag v1.1.1, the index config, publish the pages, deploy the Worker (staging, then www), switch the hubs. Old talk records are unpublished, not deleted.

## The model

| Listing | Pages | Index | Hub |
|---|---|---|---|
| Writing | the 29 articles, `/writing/<slug>/` (unchanged) | `/writing-index.json` | `/writing/`: Writing index block, one Source row |
| Talks | one page per talk, `/talks/<id>/` (were noindex records under `/talks/records/`, now 301s) | `/talks-index.json` | `/talks/`: Row list (talks, dynamic) |
| Portfolio | one page per project, `/portfolio/<slug>/`, each a chapter of the old page moved verbatim | `/portfolio-index.json` (new) | `/portfolio/`: intro, gantt (bars open the pages), Row list (projects, dynamic), career notes, smaller repos |

No new blocks: the project list is a `projects` variant of row-list in the talks look; talk pages use hero, figure (a lone YouTube link embeds) and proof-links on the static template; project pages are the portfolio template's chapter, its chapter head's h2 promoted to the page's h1.

Generated, never authored (`content/README.md`, "Listing pages"):
- the hub rows and each hub's JSON-LD graph, from its index (v1.1.0's design);
- a talk page's JSON-LD: WebPage, BreadcrumbList and an Event (date, the conference as superEvent, the place, Jack as performer, the write-up as subjectOf, the project as about, and the recording as a VideoObject when the page links one and carries `video-uploaded`);
- a project page's JSON-LD: SoftwareSourceCode with its codeRepository when it links a GitHub repository, else a CreativeWork.

The edge Worker writes them into the served HTML on www; the browser builds the same on preview hosts (`scripts/page-schema.js`, `edge/src/listings.mjs`).

## What the research said

**Top-notch talk and project pages** (a research agent: Google Search Central, schema.org, the marketing-skills references, the site's audit):
- A past talk gets no event rich result (Google shows events only for the future), but its recording can: the two recorded talks' pages are watch pages, the one rich result in reach (the audit found 0 of 19 videos indexed, "not on a watch page").
- Event for a talk (a conference presentation is schema.org's own subEvent example); SoftwareSourceCode for a project with a public repo; not SoftwareApplication (needs a price and ratings) or Project (an Organization subtype).
- Old `#` anchors never reach a server, so a 301 can't move them; the hub rows keep the old ids so `/talks/#<id>` and `/portfolio/#ch-*` still land, and the site's own links now point at the pages.
- Thin pages: columbus-ai-2025 is one sentence, so it stays `noindex, follow` (still listed on the hub). The gaps Jack would fill are below.

**The block library** (a research agent: adobe/da-live source, aem.live's Experience Workspace docs, da-admin):
- One config for both editors: a `library` tab in the site's DA config (`https://admin.da.live/config/jackzhaojin/www-eds/`; the classic editor reads only the site config, Experience Workspace merges site and org). The site had no config of its own; the org config holds `data`, `permissions` and `flags` (`ew.enabled`).
- Blocks: a `blocks` sheet at `/docs/library/blocks` (`name`, `path`) and one document per block, each variant in its own section under a heading, with a `library-metadata` block (`description`, `searchtags`). Templates: a `templates` sheet (`key`, `value`) of full pages.
- Library documents are previewed, never published (www would serve them), and kept out of the index (`/docs/**`).

## Top-notch pages: the bar, and what was applied

The research's bar for a talk or project page, without inventing copy (Google's helpful-content guidance asks for "substantial value compared to other pages"; AI answer engines quote self-contained pages):

| The bar | Applied |
|---|---|
| Its own indexable URL, in the sitemap and llms.txt, linked both ways | yes: 19 indexable pages, in the sitemap (54 URLs) and llms.txt; 60 links across the site point at them; each page links back to its hub |
| Its text in the initial HTML | yes: the pages are authored content; the hubs' rows come in the HTML from the edge |
| Structured data that says what it is | yes, generated: Event (date, conference, place, performer, write-up, project) and SoftwareSourceCode (repository) |
| The one rich result in reach: the recording on a watch page | yes: the two recorded talks embed their video and carry a VideoObject (upload date and duration from their articles) |
| Everything the site already has about the item, gathered on its page | yes: the event page, write-up, project, recognition, repository and, for the adaptTo session, its slides (PDF) and the recap article, all from existing pages |
| A breadcrumb | yes: the talk pages' hero, and BreadcrumbList on both kinds |
| No thin page in search | columbus-ai-2025 (one sentence) is `noindex, follow`; the rest are indexable |
| No dead links | the 14 `/portfolio/assets/` links fixed; seo-check: 0 problems; one external link (Rockstar's Summit 2024 session) now redirects to Adobe's Summit home, kept as the official source |
| More words where a page is thin | not done: that is Jack's writing (below) |

## Process change

Pixel-perfect gating against gh ended: AGENTS.md and `content/README.md` section 4 now ask for the built-in browser at 1440 and 360, lint, unit and Worker tests, the editability probe and the SEO check. `stardust/` stays as the migration's record.

## Built in parallel

Four background agents and the main thread, on one branch (`v1-1-1`) in its own worktree, each on its own files:
- research: the DA block library and Experience Workspace; best-in-class talk and project pages;
- `talk-pages` (`content/talks/**`): the nine pages and the hub;
- `portfolio-pages` (`content/portfolio/**`): the eleven pages and the hub;
- `block-library` (`content/docs/library/**`, `stardust/scripts/build-block-library.mjs`): 35 block documents (91 variants, examples copied from real pages, the design system page's first) and 5 templates;
- the main thread: the code, the index config, the cross-site links, the docs, the release, the Worker, the publishing.

## Shipped (2026-10-26, about 21:00 to 22:00 ET)

- **Release `v1.1.1`** (PR 3, squash `9504361`, tag and `release/1-1-1`). PR checks: build and PageSpeed pass.
- **Index config** live (`hlx-config/2026-10-26-listing-indexes/`): talks at `/talks/**`, portfolio new, `/docs/**` out of the general index.
- **Published:** the 9 talk pages, the 11 project pages, home, the design system page and 22 articles (their links), the redirects sheet (126 rows), then the three hubs once the Worker was live. The nine records unpublished and their index rows cleared.
- **Worker** v1.1.1 on staging (`63c0f8a3`) and www (`bedb628f`), recorded in `jack-dev-server-configs/server/cloudflare/history.md`.
- **Block library** previewed (never published) and enabled in the site's DA config (`hlx-config/2026-10-26-block-library/`).

## Verified

- Unit tests 21/21, Worker tests 19/19, lint clean (one existing warning).
- `check-host.mjs` passes on eds and www.
- www's raw HTML: `/writing/` 29 rows, `/talks/` 9, `/portfolio/` 11, one generated graph each; a talk page's Event (with the VideoObject on the two recorded talks), a project page's SoftwareSourceCode.
- `/talks-index.json` 9 rows, `/portfolio-index.json` 11, `/writing-index.json` 29; the sitemap 54 URLs (the 19 indexable new pages in).
- `seo-check.mjs` on www: 56 pages and fragments, 327 JSON-LD and social image URLs, **0 problems** (14 before: the `/portfolio/assets/` links now point at media copies).
- In the built-in browser: talk and project pages at 1440 and 360 (no overflow; the footer wraps), the portfolio hub (gantt bars open the pages, no year rail, 11 rows, old anchors land), and the library in Experience Workspace: the 35 blocks list and search ("row list" finds the three Row list variants), variants preview with the site's styles (Callout, Row list with the talks and projects lists rendering live from their indexes), a block inserts (Callout (warn)) and persists across a reload, the five templates list, Talk page previews, and Project page inserts as editable content.

## Gaps Jack would fill (no copy was invented)

- **columbus-ai-2025:** one sentence, no links (noindex until it has more).
- **denison-2026:** one sentence; no event page or recording.
- **adaptto-2026:** one sentence (its slides PDF and the recap article are now linked).
- **adaptto-2026-lightning:** one sentence; no event link or slides.
- **aem-rockstar-2024:** its "View event source" link now redirects to the Adobe Summit home page (the hub had it too); the competition's repository is now linked.
- **columbus-ai-2026-talk and -panel:** no recording or slides; the talk still says "Write-up in progress".
- **Projects:** STAR (103 words), Shadow (146) and CIAM (161) are the thinnest; Bruce, CIAM and STAR have no image of their own for social cards; Anima, Postal and Rockstar's first images are SVGs, which most social cards don't show.
- **Portfolio hub copy:** the gantt's fallback still says "written up in full below" (shown only when the chart can't draw).
- **The Markdown copy** of a generated hub (`index.md`) shows only the Source row.
- **DA:** the nine record documents under `/talks/records/` and the scratch `/drafts/library-check` remain in DA; deleting them is Jack's call.
