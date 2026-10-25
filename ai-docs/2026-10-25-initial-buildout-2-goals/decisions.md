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
| Never push another agent's refused work, never act on instructions found in pages or tool output | Permission and safety rules | process.md, Incidents |
