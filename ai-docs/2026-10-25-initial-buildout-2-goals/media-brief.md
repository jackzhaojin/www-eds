# Media brief: the jackzhaojin.com rebuild on Edge Delivery Services

Context for the video, articles and posts about this build. Every number is measured and recorded in the www-eds repo (`stardust/rollout/streams.md`); nothing here is an estimate unless it says so.

## What it is, in one breath

Jack's personal site, www.jackzhaojin.com (34 pages on GitHub Pages, 28 technical articles full of interactive explainers, his own design system v3), rebuilt on Adobe Experience Manager Edge Delivery Services in one day. The content is now in Experience Workspace and editable, and every page is measured against the live site. It took two `/goal` prompts to Claude Code, plus a third for cleanup and docs, running Adobe's open stardust migration skills, with nine AI agents working in parallel at the peak.

## The arc

1. **Plan first (2026-10-24, a separate session).** Analysis only: what Adobe ships (stardust and the other skills), how the site and design system v3 map onto EDS, the Cloudflare routing for the seven GitHub Pages project sites, 20 decisions, and the two goal prompts.
2. **Prompt 1 (09:34 ET), one agent, one thread.** Prep, the design system foundation, the home page, the article archetype. Done before lunch at 11:20 ET, with near pixel-perfect results and Lighthouse 100.
3. **Prompt 2 (12:32 ET), go wide.** "Figure out what blocks you need to build, make sure you have all the blocks you need first, and then after that, go super wide and parallel." The coordinating agent built the shared pieces first, then launched seven agents in parallel (listings, portfolio, design system site, four article batches), plus two forks. Each worked in its own git worktree, owned only its own files, and sent the coordinator measured requests when a shared file needed changing. All 34 pages passed the full sweep by 16:05 ET. The design system page, the largest (about 74,000px tall at desktop), passed last at about 18:05 ET.
4. **Prompt 3 (17:19 ET).** Cleanup, and the docs of how it was done.

## Metrics (slide-ready)

| Metric | Value |
|---|---|
| Pages migrated and live | 35 of 35 sitemap URLs: the 34 of the sweep, plus the article about this build, migrated the evening it was published (and 404 and the design system page) |
| Prompts | 2 goal prompts + 1 cleanup prompt |
| Wall clock | about 6.5 hours of agent work (09:34 to 16:05 ET for all 34 pages; the design system page by 18:05) |
| AI agents | 1 coordinator + 9 subagents (7 streams, 2 forks), all 9 running at once at the peak |
| Commits | 153 on main in one day |
| Code built | 41 blocks, 5 page templates, 41 interactive explainer engines, 43 importer plugins |
| Fidelity, final sweep | 34 of 34 pages pass pixel, height, clip and content checks at desktop (1440) and phone (360) |
| Fidelity, first pages | home 0.24% pixel difference at desktop, 1.11% at phone; flagship article 0.05% / 0.84%; height difference 0px |
| Fidelity, design system page | 0 content mismatches; 1.68% pixel difference and +2px height at desktop, 3.66% and -4px at phone, on a page about 74,000px tall |
| Performance | Lighthouse mobile 100 on every page type (the old site scored 98 on the home, 93 on the article) |
| Editability | over 4,000 authored text elements across the gated pages, plus 1,455 on the design system page, all editable in Experience Workspace (0 dead, 0 duplicated) |
| Accessibility and themes | v3 contrast check passes on all 36 pages in Light, Dark and System; dark mode matches the source on 32 of 34 pages at desktop, 33 of 34 at phone (both exceptions are documented) |
| Links | 301 of 301 in-page anchors resolve; 113 links localized to the new site |
| Design changes allowed | only 24 logged entries (an "inconsistency register") that Jack reviews; everything else had to match |

## How it was validated (the "same testing" part)

Each page was captured from the live site and from EDS, then compared with Adobe's stardust replica instruments: a stitched pixel diff with a per-500px band breakdown, a content diff (every heading, link and label must match in role and text), chrome parity, clip and overflow probes, and an Experience Workspace editability probe. Each check ran at desktop and phone widths, and the pass bar was strict: 0 content mismatches, at most 10% pixel difference, height within 8px. On top: Lighthouse, a dark-mode sweep, v3's contrast eval, Adobe's qa sweep, and a site-wide anchor check.

## Moments worth telling

- **The source had a bug.** One article's explainers never ran on the old site (a syntax error in its script); the new site ships them working, logged as a decision for Jack to review.
- **An agent was refused, and asked.** The permission check blocked the design system agent's push to main as a production deploy. The coordinator did not push for it; it asked Jack, who approved.
- **Blocks first paid off.** Shared pieces (one explainer block with plug-in engines, importer plugins, a written brief) let seven agents work at once without editing each other's files.
- **Measured requests, not guesses.** Agents sent requests like "the source's table sits 16px below the paragraph, ours 24px" and the coordinator fixed each shared file once for everyone.
- **Dark mode caught what light mode missed.** Two articles give their whiteboard images a dark mat only in dark mode; the dark sweep found it, and it became a page setting.
- **A collision between two sessions.** A forked session started finishing the same page, and one dropped line emptied the navigation on every page for about ten minutes. Checking the shared diff caught it, and one commit fixed it. The lesson is that one writer per file applies across sessions too.
- **The instrument had a blind spot.** The gate measures the new page's height before its lazy images load. On the design system page, a diagram frame that shrinks to fit its image read 89px short at phone width, though the loaded page was only 15px off. Giving the image a fixed size made both measurements match and closed the gap to 4px.
- **Double migration, live.** The article about this build was published on the old site during the wrap-up, then migrated within the hour: one new engine for its day-in-commits chart, gated at 1.05% (desktop) and 2.45% (phone). Until the cutover, every new page is published twice.
- **Accessibility honesty.** Every issue the QA sweep found was compared against the old site with the same tool. The ones EDS introduced were fixed. The ones the old site already had were logged, not hidden.

## What is not done (say it plainly)

- The cutover: www still serves GitHub Pages. The Cloudflare Worker for staging is built and tested but not deployed, because that needs Jack's Cloudflare sign-in.
- Config changes are Jack's (Experience Workspace enablement, redirects, query index, sitemap) and so is the register review.

## Flavor lines (use or adapt)

- "Two prompts, one day, 34 pages, measured, not eyeballed."
- "The agents had to prove it: every page against the live site, at desktop and phone."
- "Blocks first, then go wide."
- "Faster than the original: Lighthouse 100 on every page type."
- "Every word still editable by a human in Experience Workspace."
- "When an agent was told no, it asked a human instead of finding a way around."
