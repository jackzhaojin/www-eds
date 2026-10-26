# Content in git (2026-10-26)

**Decision (Jack, 14:22 ET):** `content/` in git is the source of truth for the site's content, and DA (Experience Workspace) is where it's published from. "Let's make a decision to manage content locally, over time, it'll have best practices all stored."

The rules and the process now live in [content/README.md](../../content/README.md). AGENTS.md (and so CLAUDE.md) makes it a must-read before any content change (Jack, 14:44: "always bake in ... It's a must read"). This folder records how the decision was reached and the first full run.

## How it was decided

The question (13:24): for 1.0, should content be versioned in git, in DA, or in both? The four options considered:
1. DA as the source with git as a mirror;
2. git as the source with DA as the publish step;
3. two-way sync;
4. DA only, with its labeled versions.

Jack chose 2, so the practice can build up in the repo where agents and people both read it. What we learned on the way, in the order it came up:
- **DA stores HTML; Markdown sits in the middle.** Preview converts DA's HTML to Markdown, and delivery renders that back to HTML. Only what Markdown can carry survives: all 40 documents use just `href`, `class` (on block divs), `src`, `alt` and `title`.
- **Images:** absolute `content.da.live` URLs in DA. Preview copies each into Edge Delivery's media storage as a relative `media_<hash>`, and the original bytes stay public there.
- **content.da.live is private here** because the org's DA config has a permissions sheet. A request needs the token as a header. The editor unlocks it in a browser through a step of its own, not a cookie the API sets.
- **The upload API stores a document byte for byte.** The editor is what rewrites it, and opening a document is enough: it saves its own version within about 20 seconds.
- **Adobe's `da-content` skill** documents the accepted HTML (104 verified claims). It doesn't list everything the editor rewrites on save. This run found eleven rewrites, now in content/README.md.
- **Drafts stay private:** never previewed, excluded from the query index (`/drafts/**`), so never in the sitemap.

## The first full run

Jack's ask (14:22): every document through the process, then confirm the site still matches gh.jackzhaojin.com with stardust. Parallel where the built-in browser allows.

1. **DA against git, read-only:** 37 of 40 identical. The other three (home, portfolio, the design system page) differed only by the editor's markup: no edit existed only in DA.
2. **Round trip of all 40:** each uploaded to `/drafts/roundtrip/<path>` and opened in the editor, six background tabs at a time in the built-in browser. Each was read back and compared in two layers, content and markup with the known rewrites undone.
   - **36 pass**, and **4 pass but split links** (rewrite 9): the three-part series and the patterns-of-work foundation link.
   - **No content was lost** in any document.
   - Seven of the eleven rewrites were found during this run.
3. **Adopted:** each document's editor version, encoded back to entities, replaced its file in `content/` (40 files). A stability check on home: uploaded again and opened again, the editor didn't save, and the bytes stayed identical.
4. **Pushed to DA and previewed** (not published): 40 of 40.
5. **The render check caught a regression.** In the editor's split form, each series card fell apart into two boxes, and the nav grew from 96 to 120 px. `foldSplitLinks` in `scripts/scripts.js` now folds a split link back into one before anything decorates. Checked on a preview branch first (`fold-split-links`): the nav is back to 96 px, one link per card.
6. **Gates against gh,** at 1440 and 360, 36 pages (the 35 sitemap pages and the design system page): see Results.

## Results

All against gh.jackzhaojin.com, with the stardust replica instruments (`gate-all`: pixel, height, clip, content presence), at 1440 and 360:

| Check | Result |
|---|---|
| Full sweep, 36 pages, editor-form content on preview | 32 of 36 at both widths. The 4 failures were the split-link pages, captured before the fix reached main |
| Those 4 pages with the fix (`fold-split-links`, then main) | 4 of 4 at both widths, with **the same numbers as the 2026-10-25 sweep**: `2025-07-11` 0.03% / 0 px and 0.37% / +1 px, `2025-07-07` 0.1% / 0 px and 0.86% / 0 px, `2025-07-06` 2.53% / -10 px (R13) and 4.8% / 0 px, `2026-06-28` 0% / 0 px and 0.37% / -1 px |
| Home and the article archetype on the fix branch | 0.27% / 0 px and 1.1% / 0 px; 0.05% / 0 px and 0.72% / +1 px |
| Every other page against the 2026-10-25 sweep | within 0.5% and 3 px, except the adaptTo talks article at 360 (3.35% / -1 px to 7.89% / +5 px, still a pass). Our capture of it is **pixel-identical** to the 2026-10-25 one (0.00%, same height); the 6 px came from the source side, gh today against www then |
| Design system page | 1.68% / +2 px and 3.66% / -4 px, as on 2026-10-25 |
| Editability (`ew-editability-probe --simulate-editor`, 36 pages) | 7,350 of 7,351 authored texts editable, 0 dead, 0 duplicated, 1 exempt. Edit-mode drift identical to the old content's (same code on aem.live, run as an A/B): the content change added none |
| Publish | 40 of 40 live. Query index 36 rows, sitemap 35 URLs, no drafts. On eds.jackzhaojin.com the series nav is 96 px with 3 links |

So the site looks like-for-like with gh, and `content/` now holds every document in the form the editor keeps.

## Left

- `/drafts/roundtrip/` in DA holds the 42 scratch documents from this run. Deleting them is Jack's call, or the folder stays as the test area.
- **Media pulled in (Jack, 2026-10-26):** the 25 media files that existed only in DA are now in `content/media/`, each byte-identical to the copy the site delivers. That's the 17 certification badges (the GitHub Pages site links them from Credly and Microsoft) and 8 importer-drawn diagrams. The other 408 images still have their originals only in jackzhaojin.github.io, 30 of them uncommitted there.
