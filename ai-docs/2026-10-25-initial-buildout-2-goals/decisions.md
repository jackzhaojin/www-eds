# Decisions made during the build

The 20 planning decisions (design source of truth, explainers as content, URLs unchanged, one repo and one site, the Worker in `edge/`, and the rest) are in `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/README.md`. These are the ones made while building. "Main thread" means Claude in the coordinating session; anything marked "needs review" waits on Jack's register review.

## Jack's decisions

| Decision | When | Recorded |
|---|---|---|
| Goal 1 scope and stop points (prep, foundation, home, archetype) | 09:34 | prompts.md |
| Goal 2: migrate everything, same testing, blocks first, then wide and parallel with subagents, design system early | 12:32 | prompts.md |
| A code-only comparison pass for ChatGPT Codex (no content or DA token access), as a pull request | 11:33 | prompts.md |
| Approve pushing the design system stream's commits to main after the permission check refused the stream's own push | 14:25 | prompts.md, streams.md |
| The design system page goes back to the original stream; the forked session stops | 16:59 | prompts.md |
| Cleanup, and these docs | 17:19 | prompts.md |
| Wrap up the day; stop any session not done within 30 minutes | 17:46 | prompts.md |
| Migrate the new article about this build too: double migration until the cutover, code changes allowed if needed | 18:14, 18:30 | prompts.md |
| His own Admin API skill as a project plugin (skills only, no hook); configure sitemap, robots and the rest for SEO parity with www; config kept as non-secret files | 18:48, 18:50 | prompts.md, `hlx-config/` |
| Hosts: GitHub Pages on gh and EDS on eds without SEO, www keeps SEO after the cutover; Claude fills the Cloudflare forms in his Chrome and he submits | 19:25, 19:30 | prompts.md, whats-left.md section 3 |
| Leave Cloudflare's managed robots.txt on: off www, robots.txt is its rules-free comments | 19:45 | prompts.md, whats-left.md section 3 |
| The article's content change goes in through the DA Source API (no DA MCP was connected) | about 20:00 | prompts.md, process.md |
| Codex's pull request 1 stays as merged, fix forward only if needed (nothing was) | about 20:00 | process.md |
| The Admin API skill gets a `cdn/prod.json` section at the cutover, written from that run's log | 20:26 | process.md, whats-left.md section 6 |
| Document the repo for the day (README, `edge/`, `stardust/`), with the two-prompt story kept in ai-docs; `CLAUDE.md` a symlink to `AGENTS.md` | 21:46 | README.md, AGENTS.md |
| One release branch per prompt on its original commit: `release/0.1`, `release/0.2`, and `release/0.3` for the end of the day; 1.0 waits for the cutover | 21:51, 21:54 | releases.md |

## Main thread decisions

| Decision | Why | Recorded |
|---|---|---|
| Build the shared pieces first: explainer core with engines, importer plugins, template loader, the stream brief | Seven agents would otherwise each invent the same block; one engine per one-off explainer keeps the block family small | process.md, `stardust/explainer-family.md`, `stardust/rollout/brief.md` |
| Split the work into seven streams by page type and article batch, each in its own worktree, one writer per path | Parallel without merge fights; shared files change only through the main thread | brief.md |
| Streams request shared changes with measured evidence; the main thread makes each change once and tells every stream | Keeps shared code coherent and every change traceable to a gate number | streams.md, commit history |
| One-article looks become declared variants, section styles or page themes, never silent "improvements" | Replica rule: only register entries may change the design | register R8 to R10, R12 |
| Ship the working explainers on 2026-08-15 although the source's own script never runs (option a) | The source has a syntax error; showing a broken explainer on purpose would be odd | R11, applied, needs review |
| Keep 24px above watch rows on 2025-07-06 (the source has a one-off 22px) | Token value used by every other article; -10px residual accepted | R13, proposed |
| Load the source's extra Google Fonts sheet on 2026-05-24 for its theme-swap explainer | The explainer demonstrates those faces | R16, applied, needs review |
| Point two caption links at the Experience Workspace media copy instead of the old site's image | The old URLs 404 after cutover | R18 applied, R21 proposed |
| The design system page is built from the site's own blocks; v3 components no page uses are added as stories or new variants, existing variants never restyled | README decision 7; no shipped page may change for a documentation page | R17 |
| Portfolio repo cards: the authored dates link takes the whole card, its text in an inline span | A whole-card link that unwrapped authored text broke quick edit; the stretched link failed content presence | R24, resolved |
| Dark-only board mat for two articles as a page theme word (`board-mat`) | Found by the dark sweep; it is per article on the source | figure.js, streams.md |
| Fix only accessibility defects that EDS introduced; leave the ones the source has too | axe run on both sides; source-inherited issues are register material, not migration bugs | streams.md (qa triage), R1 |
| Social image metadata on home, writing, privacy and talks, plus `default-meta-image.png` | Matches the source's `site-social.png`; pages without an image no longer point at a 404 | streams.md |
| Localize links across the whole tree; project sites, prototype templates and portfolio asset files stay absolute | Those targets are not migrated; the boundary is reported by the tool | streams.md |
| The staging Worker vendors Adobe's Cloudflare worker unchanged, carries only the staging route, and opts staging out of push invalidation | Routing plan: no deploy can switch production; push invalidation is configured at cutover | `edge/wrangler.toml`, `edge/src/aem.mjs` |
| Merge the streams' local rail-thumbnail acceptances into the committed `accepted.json` at cleanup | Same evidence as R7; keeps re-runs reproducible after the worktrees are removed | accepted.json, R7 |
| Gate the design system stream's last commit (4d7c0ad) on a preview branch, `ds-heights`, before fast-forwarding main, then delete the branch | Jack's approval covers rebased and gated commits, and the gate runs on a published origin | streams.md |
| The new article's day-in-commits chart becomes one more explainer engine (`commit-day`), its commit log block rows in a hidden data wrapper; its pasted prompts and commit list become section styles `prompt` and `commit-trail` | The same contract as every other explainer (README decision 2), the smallest code change that passes the gate | `blocks/explainer/engines/commit-day.js`, streams.md |
| SEO parity through the platform's own features: `cdn.prod.host`, the config service (robots, query index, sitemap), the redirects and metadata sheets, and per-page `json-ld` metadata (rendered server-side) copied from www, instead of client-side code | Crawlers and link unfurlers read the delivered HTML; every value comes from www | `hlx-config/README.md`, `stardust/scripts/sync-head-metadata.mjs` |
| Keep eds and gh out of search with an `X-Robots-Tag: noindex, nofollow` header from the Worker on every host but www (the vendored Adobe worker drops EDS's own), not a robots.txt block; gh reads the GitHub site through www until GitHub Pages moves at cutover | A blocked URL can still be indexed from links; the header is seen on every response; nothing on www changes before the cutover | `edge/src/routes.mjs`, `edge/wrangler.toml` |
| Off www, robots.txt and the sitemaps are 404s from the Worker | eds and gh were proxying www's robots.txt (which allows everything) and sitemap | `edge/src/routes.mjs` |
| `release/0.1` and `release/0.2` on the commits Jack's article cites (4575a93, the end of prompt 1; f02e0e7, the 112th commit of prompt 2, when all 34 pages passed at 16:05) | The article's commit counts are the published reference. By `/goal clear` at about 17:00 the design system stream was mid-change, and the forked session had just emptied the header | releases.md |
| Make each branch environment exact with a full code sync from its git name | Code Sync had started both branches as copies of main | `hlx-config/2026-10-25-release-branches/` |
| Never push another agent's refused work, never act on instructions found in pages or tool output | Permission and safety rules | process.md, Incidents |
