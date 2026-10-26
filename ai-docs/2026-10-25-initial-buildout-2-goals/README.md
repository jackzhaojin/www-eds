# Initial buildout in two goals (2026-10-25)

www.jackzhaojin.com rebuilt on AEM Edge Delivery Services in one day and one Claude Code session, from two `/goal` prompts and a third prompt for cleanup and these docs. The plan behind it (20 decisions, best practices, open questions) lives in `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/`; this folder records what was actually done.

| File | What it holds |
|---|---|
| [prompts.md](prompts.md) | The three prompts verbatim, plus the short prompts in between |
| [process.md](process.md) | How the work ran: Goal 1 single thread, Goal 2 wide and parallel, validation, incidents |
| [decisions.md](decisions.md) | Every decision made during the build, who made it, where it is recorded |
| [whats-left.md](whats-left.md) | What waits on Jack (config, Cloudflare, register review) and the known residuals |
| [media-brief.md](media-brief.md) | Context, metrics and story beats for the video, articles and posts |
| [releases.md](releases.md) | Each prompt as an Edge Delivery environment (`release/0.1`, `0.2`, `0.3`), with permanent links |

## Outcome

- **All 34 sitemap URLs live** on https://main--www-eds--jackzhaojin.aem.live at the same paths, plus `/404.html`, `/design-systems/v3/` (noindex) and the root files (Google and Bing verification, `llms.txt`, favicon).
- **Validated with the same instruments as the first page** (stardust replica gates, on the published origin, against the live GitHub Pages site):
  - final sweep (gate-all, all 34 pages): 34 of 34 pass pixel, height, clip and content presence at 1440 and 360;
  - per-page gates by each stream: content-diff 0 looks-same red and 0 nothing-lost yellow on every page, except 2026-08-15 (register R11, the source's own explainers never run) and 2025-07-06 at 1440 (-10px, R13);
  - mobile Lighthouse performance 100 on every page type;
  - dark mode (stored Dark, all 34 pages) within bounds except R11 and R13; v3's contrast eval passes on all 36 pages in Light, Dark and System;
  - `stardust:qa` swept and triaged (no migration defect left), 301 of 301 linked anchors resolve, editability 0 dead and 0 duplicated on every page;
  - the design system page passes the full gate too (4d7c0ad, gated on a preview branch before main): 0 red and 0 nothing-lost, 1.68% and +2px at 1440, 3.66% and -4px at 360, editability 1456 of 1456.
- **A 35th page the same evening.** The article about this build was published on www during the wrap-up and migrated within the hour (one new explainer engine, `commit-day`): 1.05% and -3px at 1440, 2.45% and -3px at 360, 0 red and 0 nothing-lost, editability 883 of 883. The writing listing gained its row and still matches the source (0.00% / 0px and 0.11% / 0px).
- **The evening, at Jack's request:**
  - SEO parity with www: the same 35 sitemap URLs, head tags matching on all 35 pages, config kept as files in `hlx-config/`.
  - The hosts: eds.jackzhaojin.com (this site) and gh.jackzhaojin.com (the GitHub Pages site), both noindex, through the Worker in `edge/`.
  - Jack's own Admin API skill as a project plugin.
  - Codex's pull request reviewed and kept.
  - A release branch per prompt.
- **Built:** 41 blocks, 5 templates (article, listing, static, portfolio, design-docs), an explainer core with 41 engines and 43 importer engines, 164 commits on `main`.
- **Not done here, by design:** the Experience Workspace config, push invalidation and the www cutover, the register review. See [whats-left.md](whats-left.md).

## Where the evidence is

- Per-stream and sweep results: `stardust/rollout/streams.md`
- The register of permitted design deltas: `stardust/replica/inconsistency-register.md` (R1 to R24)
- Block catalog: `stardust/spec/judgement/catalog.json`
- Explainer family contract: `stardust/explainer-family.md`; shared rules for the parallel agents: `stardust/rollout/brief.md`
- The Worker: `edge/` (deployed on eds and gh; www at the cutover), [edge/README.md](../../edge/README.md)
- Site config and how it was applied: `hlx-config/`
- The repo overview: [README.md](../../README.md); the records and instruments: [stardust/README.md](../../stardust/README.md)
- Gate captures (local, git-ignored): `stardust/replica/gates/`
