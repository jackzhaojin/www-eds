# Initial buildout in two goals (2026-10-25)

www.jackzhaojin.com rebuilt on AEM Edge Delivery Services in one day and one Claude Code session, from two `/goal` prompts and a third prompt for cleanup and these docs. The plan behind it (20 decisions, best practices, open questions) lives in `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/`; this folder records what was actually done.

| File | What it holds |
|---|---|
| [prompts.md](prompts.md) | The three prompts verbatim, plus the short prompts in between |
| [process.md](process.md) | How the work ran: Goal 1 single thread, Goal 2 wide and parallel, validation, incidents |
| [decisions.md](decisions.md) | Every decision made during the build, who made it, where it is recorded |
| [whats-left.md](whats-left.md) | What waits on Jack (config, Cloudflare, register review) and the known residuals |
| [media-brief.md](media-brief.md) | Context, metrics and story beats for the video, articles and posts |

## Outcome

- **All 34 sitemap URLs live** on https://main--www-eds--jackzhaojin.aem.live at the same paths, plus `/404.html`, `/design-systems/v3/` (noindex) and the root files (Google and Bing verification, `llms.txt`, favicon).
- **Validated with the same instruments as the first page** (stardust replica gates, on the published origin, against the live GitHub Pages site):
  - final sweep (gate-all, all 34 pages): 34 of 34 pass pixel, height, clip and content presence at 1440 and 360;
  - per-page gates by each stream: content-diff 0 looks-same red and 0 nothing-lost yellow on every page, except 2026-08-15 (register R11, the source's own explainers never run) and 2025-07-06 at 1440 (-10px, R13);
  - mobile Lighthouse performance 100 on every page type;
  - dark mode (stored Dark, all 34 pages) within bounds except R11 and R13; v3's contrast eval passes on all 36 pages in Light, Dark and System;
  - `stardust:qa` swept and triaged (no migration defect left), 301 of 301 linked anchors resolve, editability 0 dead and 0 duplicated on every page.
- **Built:** 41 blocks, 5 templates (article, listing, static, portfolio, design-docs), an explainer core with 40 engines and 42 importer engines, 150 commits on `main`.
- **Not done here, by design:** config changes, Cloudflare and the www cutover, the register review. See [whats-left.md](whats-left.md).

## Where the evidence is

- Per-stream and sweep results: `stardust/rollout/streams.md`
- The register of permitted design deltas: `stardust/replica/inconsistency-register.md` (R1 to R24)
- Block catalog: `stardust/spec/judgement/catalog.json`
- Explainer family contract: `stardust/explainer-family.md`; shared rules for the parallel agents: `stardust/rollout/brief.md`
- The staging Worker: `edge/` (built and tested, not deployed)
- Gate captures (local, git-ignored): `stardust/replica/gates/`
