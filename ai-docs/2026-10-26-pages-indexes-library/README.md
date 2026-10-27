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

## Process change

Pixel-perfect gating against gh ended: AGENTS.md and `content/README.md` section 4 now ask for the built-in browser at 1440 and 360, lint, unit and Worker tests, the editability probe and the SEO check. `stardust/` stays as the migration's record.
