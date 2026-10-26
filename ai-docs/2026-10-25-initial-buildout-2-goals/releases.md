# Releases: each prompt as an environment

Jack's idea at 21:51, as he was calling it a night: "EDS does prompt1 and prompt2 and each prompt is a env!" Edge Delivery serves every branch of the repo at its own host. A branch on the commit a prompt ended at keeps that prompt's site running next to the current one, for the video, the articles, or a before and after. It's only the code, as Jack put it ("i know it's only for code, but still good"). The content is shared.

## The releases

| Release | Commit | Range | What it is |
|---|---|---|---|
| `release/0.1` | `4575a936f7d7175dcf8403079f4eecf7bc5cca30` | `6820e00` to `4575a93`, 17 commits, 09:55 to 11:15 ET | Prompt 1: v3 foundation, header and footer, home, the article archetype, the site scope |
| `release/0.2` | `f02e0e785461302492bca9474d97e5b93cabbfe5` | `4595513` to `f02e0e7`, 112 commits, 12:41 to 16:05 ET | Prompt 2: blocks first, then seven streams, until all 34 sitemap pages passed the final sweep |
| `release/0.3` | the commit that adds this page (`git rev-parse release/0.3`) | from `f02e0e7` to the end of the day | The design system page, the 35th article, SEO parity, the eds and gh hosts, Codex's PR, these docs |
| `v1.0.0` (tag) and `release/1-0-0` (branch) | the same commit, made after the cutover (2026-10-26) | from `release/0.3` to the cutover | Content in git (every document in the editor's form, the DA-only media pulled in), the split-link fix, and the repo matching production after the cutover, validated against gh. www has served the site since 15:12 ET (21:54 the night before: "since we're not live live yet, let's do release/0.3") |
| `v1.0.1` (tag) and `release/1-0-1` (branch) | the commit after GA4 shipped (2026-10-26) | from `v1.0.0` | GA4 per decision 9: consent granted by default on www, no banner, Global Privacy Control declines, it starts 3 seconds after the page loads, and it's off on every other host |
| `v1.0.2` (tag) and `release/1-0-2` (branch) | the commit after the Worker change shipped (2026-10-26) | from `v1.0.1` | The edge Worker gives browsers 10 minutes for EDS pages (`pageCache`), as GitHub Pages did, instead of aem.live's two hours. Worker version `d329cd01`. Push invalidation itself, set up just before, is config, not part of a release |

Each boundary is the one Jack's article about the build gives: "Prompt 1: 6820e00 to 4575a93, 17 commits. Prompt 2: from 4595513, 112 more by the time all 34 pages passed at 16:05 ET". `f02e0e7` ("R24 resolved, the sweep is 34 of 34") is that 112th commit. Goal 2 itself was cleared at about 17:00, while the design system stream was still working. The stream's later commits are in 0.3.

## Permanent links

Edge Delivery names a branch's host by lowercasing it and turning every character that isn't a letter or digit into a hyphen. So `release/0.1` is `release-0-1`: the slash and the dot both become hyphens.

| Release | Live (published content) | Preview content | Code at that commit |
|---|---|---|---|
| 0.1 | https://release-0-1--www-eds--jackzhaojin.aem.live/ | https://release-0-1--www-eds--jackzhaojin.aem.page/ | https://github.com/jackzhaojin/www-eds/tree/4575a936f7d7175dcf8403079f4eecf7bc5cca30 |
| 0.2 | https://release-0-2--www-eds--jackzhaojin.aem.live/ | https://release-0-2--www-eds--jackzhaojin.aem.page/ | https://github.com/jackzhaojin/www-eds/tree/f02e0e785461302492bca9474d97e5b93cabbfe5 |
| 0.3 | https://release-0-3--www-eds--jackzhaojin.aem.live/ | https://release-0-3--www-eds--jackzhaojin.aem.page/ | https://github.com/jackzhaojin/www-eds/tree/release/0.3 |
| 1.0.0 | https://release-1-0-0--www-eds--jackzhaojin.aem.live/ (and www.jackzhaojin.com) | https://release-1-0-0--www-eds--jackzhaojin.aem.page/ | https://github.com/jackzhaojin/www-eds/tree/v1.0.0 |
| 1.0.1 | https://release-1-0-1--www-eds--jackzhaojin.aem.live/ (and www.jackzhaojin.com) | https://release-1-0-1--www-eds--jackzhaojin.aem.page/ | https://github.com/jackzhaojin/www-eds/tree/v1.0.1 |
| 1.0.2 | https://release-1-0-2--www-eds--jackzhaojin.aem.live/ (the EDS code is 1.0.1's; the change is in the Worker, live on www) | https://release-1-0-2--www-eds--jackzhaojin.aem.page/ | https://github.com/jackzhaojin/www-eds/tree/v1.0.2 |

What each prompt changed, as GitHub diffs:
- Prompt 1: https://github.com/jackzhaojin/www-eds/compare/d63e522b95954ea55aa54a15b8f507b0ab6d602b...4575a936f7d7175dcf8403079f4eecf7bc5cca30
- Prompt 2: https://github.com/jackzhaojin/www-eds/compare/4575a936f7d7175dcf8403079f4eecf7bc5cca30...f02e0e785461302492bca9474d97e5b93cabbfe5
- After prompt 2: https://github.com/jackzhaojin/www-eds/compare/f02e0e785461302492bca9474d97e5b93cabbfe5...release/0.3

The commit links never move. The branch names and hosts last as long as the branches do: never push to a release branch, and never delete one.

## What an environment shows

A branch environment pairs that commit's code with today's content. The pages that existed at the commit render as they did then. A page whose blocks came later shows those blocks undecorated, as authored rows.
- **0.1:** home and the article archetype (`/writing/2026-09-20-aem-edge-functions-google-sign-in/`) render as prompt 1 left them. The portfolio and the listings were built in prompt 2, so they show raw blocks here. The other articles get the article template, but not their explainers.
- **0.2:** all 34 sitemap pages render. The 35th article's day-in-commits chart (engine `commit-day`, added later) doesn't, and the design system page is mid-build.
- **0.3:** the site as it stands at the end of the day.

## How they were made

Pushing a branch at an older commit isn't enough. Code Sync starts a new branch as a copy of main and applies the push's changes, and a push of commits already on main has none. Both branches first served main's code. A full code sync from the real branch name fixed it: `POST /code/jackzhaojin/www-eds/release-0-1/*?branch=release%2F0.1`. Afterwards every file checked matched its commit, and the files a commit doesn't have are 404s. The steps and every response are in [hlx-config/2026-10-25-release-branches/EXECUTION.md](../../hlx-config/2026-10-25-release-branches/EXECUTION.md).

**What counts as a release (Jack, 2026-10-26):** a change to code the site runs. That means `blocks/`, `scripts/`, `styles/`, `templates/`, `widgets/`, `head.html`, `fonts/`, `icons/`, or the edge Worker's `edge/src/`. A content change, an `hlx-config/` or other Admin API change (that's documentation of the site's config), docs and ai-docs are pushed to main but get no version, tag or release branch. Versions follow semver: a fix or a small feature is a patch (`v1.0.1`), a bigger feature a minor.

**1.0 was named by Jack (2026-10-26): the tag `v1.0.0` and the branch `release/1-0-0`.** The hyphens mean the branch name and its host match (`release-1-0-0--www-eds--jackzhaojin.aem.live`). Both point at the commit that records the cutover; the tag is the permanent reference. For the next release, push the tag and the branch at the commit, and run the code sync if that commit isn't main's head.
