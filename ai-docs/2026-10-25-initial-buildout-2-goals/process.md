# Process

How the buildout ran, in the order it happened. Times are US Eastern on 2026-10-25. One Claude Code session (Opus 5.5, auto mode) in the Claude desktop app drove everything; parallel work ran as subagents in git worktrees.

## The shape

```
Goal 1 (single thread, 09:34 to 11:20)
  prep -> foundation -> home (first page) -> article archetype -> reconcile
Goal 2 (wide, 12:32 to 17:20)
  blocks first (main thread) -> 7 streams + 2 forks in parallel worktrees
     main thread answers their shared-file requests, owns shared code
  -> link localization -> final sweep -> dark, contrast, Lighthouse, qa, anchors
  -> staging Worker built -> design system page finished last
Prompt 3: cleanup and these docs
```

## Tools and skills

- **stardust (adobe/skills marketplace, 0.36.0):** `replica` drove the whole run (same-design migration: recreate, never copy; prove fidelity with instruments; the only permitted design deltas are register entries). Under it: `extract --prep` (the 34-page capture), `spec` (page inventory, block catalog with reuse verdicts), `dynamics` (dynamic surface triage), `audit`, the deploy scripts (DA Source API upload, media upload, link localization, sanitise, model lint, the Experience Workspace editability probe) and `qa`.
- **Gate instruments (stardust replica scripts, copied into `stardust/scripts/`):** `stitch-shot` (frozen source baselines), `gate.sh` (pixel diff with band breakdown, content-diff, visual-diff, chrome parity, clip and overflow probes), `gate-all` (every page, with content presence), `cap-probe`, `measure`, `run-bg` (background rounds with deadlines).
- **aem-edge-delivery-services:** `da-auth` for the Experience Workspace token (cached 24 hours, never printed), boilerplate conventions, docs.
- **impeccable:** its design hook reviewed every UI file written; one confirmed false positive (a CSS border triangle) is a file-scoped ignore in `.impeccable/config.json`.
- **Playwright and axe-core** for the extra checks written during the run (dark sweep, axe comparison against the source, anchor check).
- **Lighthouse 12.8.2** (mobile) for performance.

## Goal 1: prep and first page

1. **Prep.** Baselines frozen for the home page and one explainer-heavy article (2026-09-20, Google sign-in at the edge) at 1440 and 360. `extract --prep` of all 34 sitemap pages; spec steps S1 to S10 (S5 skipped: no telemetry key); dynamic features triaged; audit 74/100; the nine items of best-practices.md section 9 checked against the real platform, findings recorded there.
2. **Foundation.** v3's `tokens.css` ported as is (README decision 1); self-hosted Inter, Playfair Display and JetBrains Mono with metric-matched fallback faces; the stored theme (`jj-theme`) applied in `loadEager()`; the v3 one-row header with the Light / Dark / System control and Menu toggle; the compact footer; bands as section-metadata style words (plain, alt, tint, inverse); buttons and text links that hold up in quick edit (`.cta-slot`).
3. **Home, the first page.** Blocks hero, showcase, cards, columns. Six gate rounds on the published origin; pass at pixel 0.24% (1440) and 1.11% (360), height delta 0, content-diff 0 / 0. Lighthouse mobile 100 (source 98).
4. **Article archetype.** The article template (head, rail, watch rows, heading links, related section) and the first explainer family blocks (figure, code, compare, switch, lab) plus rail, row-list, author-box, fine-print; `stardust/scripts/import-article.mjs` converts a source article into Experience Workspace HTML. Pass at 0.05% / 0.84%, height 0, Lighthouse 100 (source 93), editability 110 of 110, 14 of 14 interactions behave as on the source.
5. **Editability contract.** Every block moves authored elements into role wrappers instead of rebuilding them, so each text stays clickable in Experience Workspace (`stardust/explainer-family.md`, EW1 to EW10). The probe (`ew-editability-probe --simulate-editor`) runs on every page.
6. **RECONCILE.** The promoted design spec agrees with v3; v3's contrast eval passes on both pages in all three themes. Stopped at Experience Workspace enablement and the register review.

## Goal 2: everything, wide and parallel

### Blocks first

Before going wide, the main thread built what every stream would share, so no two agents would invent the same thing:
- an **explainer core block** that loads `engines/<word>.js` and `.css` for `explainer (<word>)`, with the shared kit chrome (labs, chips, verdicts, json, code bars) in one stylesheet; one-off explainers become engines, and their text and data become block rows (explainers are content, README decision 2);
- an **importer plugin system**: `stardust/scripts/import-engines/<word>.mjs` with `match()` and `convert()`, so each stream extends the article importer without editing it;
- a **template loader** (metadata `template` loads `templates/<name>/`);
- `stardust/rollout/brief.md`: the shared rules (ownership, content, code, push and gate protocols, the never-list);
- `rollout-gate-state.mjs` for the final sweep.

The design system itself (v3 tokens, type, bands, chrome) was already moved in Goal 1, so every page was built on it from the start; the design system documentation site ran as its own stream because its stories needed blocks the other streams were still building.

### Seven streams in parallel

Each stream ran as a subagent in its own git worktree with a written brief, owning only its paths, pushing to `main` after `pull --rebase`, deploying through the DA Source API and gating its own pages on the published origin at 1440 and 360:

| Stream | Pages | Built |
|---|---|---|
| Listings | writing, talks, certifications, privacy, 404 | listing and static templates, hero variants, writing-list, writing filter widget, credentials, row-list talks |
| Portfolio | /portfolio/ (all 11 `#ch-*` anchors) | portfolio template, showcase and cards variants, chapter-head, divider, timeline, tabs, panel, stats, stat-chips, proof-links, frame, carousel, jump-links |
| Articles A1 to A4 | 27 articles in four batches (plus two A4 forks) | 40 explainer engines with importer engines, the talk-list block |
| Design system | /design-systems/v3/ | the design-docs template, faq, callout, cta-band, transcript, chapters, pagination, facts, the v3 icon set |

### The request loop

Streams never edited shared files (styles, scripts, the article template, figure, code, data-table, header, footer, the importer). When a page missed because of one, the stream measured it against the source and sent the main thread a request with the numbers; the main thread made the change once, pushed it, and told every stream that could use it. That loop produced most of the shared vocabulary, for example:
- `series` (the three-part series navigation), code `prose`, `plain`, `stack`; data-table `nowrap`, `cheat`, `rank`, `stack`, `caption`, `sr-caption`, `row-heads`, `fill-in`, `span-first`, `mono-head`, `compact` and merged cells; figure `compact`, `tall`, split boards;
- article section styles `code-wrap`, `code-wrap-wide`, `roomy-h3`; page themes `code-nowrap` and `board-mat` (through the boilerplate's `theme` metadata);
- importer fixes (wrapped figure ids, doubled code newlines, empty cells).
One-article variants are listed for review in register R12 rather than applied silently.

### Validation, after everything was live

1. **Link localization** over the whole content tree: 113 links in 19 pages now point at the migrated pages; the rest (project sites, prototype templates, portfolio asset files) stay absolute on purpose.
2. **Final sweep** with `gate-all` over all 34 pages at both widths (pixel at most 10%, height within 5%, clip 0, content presence): 34 of 34 after the portfolio repo card fix.
3. **Lighthouse** mobile performance on every page type: 100.
4. **Dark mode** (decision 18): a new sweep with Dark stored on source and EDS. It caught one real defect (two articles give their whiteboards a dark mat), fixed as the page theme `board-mat`.
5. **v3 eval** on all 36 pages in three themes: pass.
6. **`stardust:qa`**, then triage: fixes for social images, an ARIA state, a list role, an author box landmark and a lost anchor; everything left is pre-cutover, config, inherited from the source (axe run on both sides) or a heuristic false positive.
7. **Anchors:** every fragment link on the source site checked on EDS after decoration: 301 of 301 resolve.
8. **Staging Worker:** `edge/` holds the Worker from routing-cloudflare.md (project sites first, then Adobe's Cloudflare worker, vendored unchanged), with 8 route-table tests and a host check that already passes with the Worker run in-process against the real origins. Deploying is a stop point.

## Incidents and what they taught

- **A symlink into the source repo.** An agent linked a shared scratch folder to the source repo to read it; another agent copied files into that folder and overwrote the source `index.html`. It was reverted within a minute and verified clean. Rule added to the brief: read the source repo by its real path only, never link to it, scratch only inside your own worktree.
- **A refused push.** The permission check refused the design system stream's `git push` to main as a production deploy. Claude did not push on its behalf (that would launder the refusal); it asked Jack, who approved, and the main thread pushed.
- **Two sessions on one page.** A forked session started finishing the design system page in the same worktree and branch as the stream. Its last commit dropped one line from the shared header, and every page served an empty navigation for about ten minutes. Caught by checking the shared diff, fixed in one commit, verified on three pages at both widths. Lessons: one writer per path holds across sessions too, and any change to a shared block re-gates home and an article before it counts.
- **Fixes that traded one check for another.** Making a portfolio repo card one link fixed content presence but broke the content diff; the change was reverted, then solved properly (the authored link takes the card, its text in an inline span, nothing unwrapped).
- **A height the gate measured too early.** The gate settles lazy images on the source side only, so it measures the new page's height before its images load. A design system diagram frame that shrinks to fit its image read 89px short at 360 while the loaded page was +15px. Pinning the image at the SVG's natural width made both heights match (final -4px). Anything whose size depends on an image loading needs a fixed size before its height can be trusted.
- **Tool pitfalls worth remembering:** `run-bg` jobs stop at 900 seconds unless given `--timeout`; zsh does not split an unquoted `$VAR` into arguments; ESLint 8 here lints only `.js`; `node --test` needs a file glob; an `.eslintignore` line had merged two patterns.

## After the wrap-up: the 35th page

At 18:14 Jack asked for one more page: the article about this build, written in another session and published on www at about 18:30. The importer converted everything except its day-in-commits chart, which became the 41st explainer engine (`commit-day`, its 132-commit log as block rows in a hidden data wrapper). Two of its looks became section styles: `prompt` (a pasted prompt with its byline line) and `commit-trail` (a commit list without bullets). The code was gated on a preview branch against the live article: 1.05% and -3px at 1440, 2.45% and -3px at 360, 0 red (8 rail thumbnails accepted as R7), clipped 0, editability 883 of 883. Then it was fast-forwarded to main and published, along with the writing listing's new row (0.00% / 0px and 0.11% / 0px). One snag: the listing thumbnail was not uploaded at first, so the listing served `about:error` until it was. whats-left.md has the recipe for the next page, until the cutover ends the double migration.

## Then: the Admin API skill and SEO parity

No Adobe skill covers the Admin API beyond preview and publish, so Jack's own `hlx-admin-api-executor` (jackzhaojin/ai-builder-kit) became a project plugin, skills only. Its guard hook was fixed in the local ai-builder-kit clone (it missed `-XPOST`, `--request=DELETE`, `-d` and `--data-binary`, and api.aem.live) and documented for use without the plugin; the skill gained the note that a DA site's IMS token works as a bearer. Then the site config, done the skill's way (GET before, SET, GET after, every response kept in `hlx-config/2026-10-25-seo-config/`): the production host, robots.txt, the query index, the sitemap, the redirects and metadata sheets, and per-page JSON-LD and titles synced from www. A head-tag comparison on all 35 pages found one real defect on the way: three article titles carried an inline SVG's title text. After the change, all 35 match www except `og:image` sizes that EDS resizes anyway, and the sitemap lists the same 35 URLs on www.

## Then: eds and gh

Jack's plan for the hosts (19:25): GitHub Pages at gh.jackzhaojin.com and EDS at eds.jackzhaojin.com, both out of search, www keeping its SEO after the cutover. The Worker in `edge/` gained a gh mode (the whole GitHub Pages site, read through www until GitHub Pages moves, with its redirects kept on gh) and a noindex header on every host but www, tested in-process first. Then, in Jack's Chrome with Claude in Chrome, Claude filled the two DNS record forms (AAAA `100::`, proxied) and Jack clicked Save on each; the Workers went out with the wrangler sign-in already on the laptop. The host check passes on both live hosts, and www is byte-for-byte unchanged.

## Numbers

153 commits on `main` between 09:05 and 19:00; 41 blocks; 5 templates; 41 explainer engines and 43 importer engines; 40 content documents; 9 subagents; register R1 to R24; 96 owner-accepted content-diff entries (rail thumbnails at phone width, where the probe can only compare file names).
