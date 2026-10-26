# The cutover (2026-10-26)

www.jackzhaojin.com has been served from Edge Delivery since about 15:12 ET on 2026-10-26. A separate Claude session made the switch; this record holds what it reported, the validation done afterwards from the www-eds session, and what's left. The release that marks it is `v1.0.0`, with the branch `release/1-0-0` ([releases.md](../2026-10-25-initial-buildout-2-goals/releases.md)).

## What was done (reported by the cutover session)

Route-first, not in the order [whats-left.md, section 3](../2026-10-25-initial-buildout-2-goals/whats-left.md) had planned:
1. **The Worker:** deployed the top-level Worker from `edge/` with `npx wrangler deploy --env="" --var PUSH_INVALIDATION:disabled` (version `fa323e37-fd2b-46f3-afea-a1b9d638a7cd`). Without the override, aem.live sends long cache TTLs that nothing purges yet.
2. **The route:** added `www.jackzhaojin.com/*` to `www-eds-edge` in the Cloudflare dashboard, as a Route, not a Custom Domain.
3. **GitHub Pages was not moved.** jackzhaojin.github.io keeps its `CNAME` of `www.jackzhaojin.com`. The www Worker's `PROJECT_ORIGIN = "passthrough"` sends the 7 project sites to GitHub with Host www. gh.jackzhaojin.com still mirrors the old site, because its Worker's same-zone fetch to www reaches www's origin, not the www Worker.
4. **Its checks:** `check-host.mjs` passed on www, gh and eds; all 7 project sites returned 200 on www; slashless project URLs redirected on www; the apex and jackzhaojin.github.io redirected to www.

**Rollback:** remove the www route in the dashboard (Workers & Pages > www-eds-edge > Domains).

## Repo brought in line with production

- `edge/wrangler.toml` carries `PUSH_INVALIDATION = "disabled"` in the top-level vars, with a comment, so a plain `wrangler deploy --env=""` keeps it. A dry run shows the production build with all four vars. `check-host.mjs --local www` carries it too, and the 12 tests pass.
- Updated: `edge/README.md` (the cutover, rollback, push invalidation, Phase B), whats-left.md sections 3 and 5, `README.md`, `AGENTS.md`, `content/README.md` (new writing is published to EDS), and releases.md (`v1.0.0`).
- In jackzhaojin.github.io, as local edits for Jack to commit: `routing-cloudflare.md` ("Cutover, as done") and `start-here.md` (K done, run log).

## Validation after the cutover

| Check | Result |
|---|---|
| `check-host.mjs` on www, gh and eds | PASS on all three |
| Project sites on www | all 7 answer 200; slashless URLs 301 to the slash |
| Redirects | apex and jackzhaojin.github.io go to www; `/blogs.html` goes to `/writing/`; an unknown path is a real 404 |
| SEO on www against the original (gh), all 35 sitemap pages | every tag identical: title, description, canonical, Open Graph, Twitter, article tags, JSON-LD |
| Crawler files | `robots.txt` on www byte-identical to `hlx-config/robots.txt`; `sitemap.xml` lists 35 URLs, all on www; www sends no `X-Robots-Tag` |
| Editability on www (`ew-editability-probe`, 36 pages) | 7,350 of 7,351 authored texts editable, 0 dead, 0 duplicated, 1 exempt: the same as on aem.live |
| Mobile Lighthouse on www | home 99 and 98, the article archetype 97 and 94 (the old site's home: 97 in the same run). Measured while two gate sweeps ran on the same laptop, so lower than the build's 100s on aem.live; worth a clean rerun |
| Full stardust sweep (`gate-all`: pixel, height, clip, content presence), www against gh, 36 pages | **36 of 36 at 1440 and 36 of 36 at 360.** Every page within 0.5% and 3 px of the 2026-10-25 sweep against www; the highest is `2026-08-15` (4.15% and 8.4%, register R11). The adaptTo article's 7.89% on the afternoon preview sweep is back to 3.34% / -1 px: that was the source capture, not EDS |

## Left

1. **Push invalidation: done the same day.** It followed [Adobe's Cloudflare guide](https://www.aem.live/docs/byo-cdn-cloudflare-worker-setup):
   - Claude filled in the token form, and Jack created the token and sent it from a hidden prompt;
   - the CDN config was set (version 9);
   - the override came out, and the Worker was redeployed (`9cf85aef`);
   - a publish purged the zone within 3 seconds.

   Browsers then still kept pages for two hours, as aem.live tells them. **`v1.0.2`** has the Worker give them 10 minutes, as GitHub Pages did: pages and fragments get `max-age=600`, and code, media, JSON and the project sites keep their own headers. It was deployed to staging first, then production (`d329cd01`). See [hlx-config/2026-10-26-push-invalidation/EXECUTION.md](../../hlx-config/2026-10-26-push-invalidation/EXECUTION.md) and `edge/README.md`.
2. **GA4: done in 1.0.1 (Jack, 2026-10-26: "implement GA4 per decision 9").** What changed:
   - `consent-check.js` grants consent by default with no banner. A Global Privacy Control signal declines, and `?consent=accept|decline` still overrides, for testing.
   - `consented.js` carries the old site's gtag calls for `G-ZVENE6BXTJ`.
   - `loadDelayed` starts the consent check 3 seconds into the delayed phase.

   Checked on the `ga4` preview branch:
   - by default, gtag.js loads about 3.2 s after LCP, and GA answers the `page_view` hit with 204;
   - with GPC on, and with `?consent=decline`, nothing loads and nothing is sent;
   - no console errors (the CSP and Trusted Types allow it);
   - mobile Lighthouse 100 on home and the article, with and without GA4 (0 ms blocking time);
   - home and the article archetype gate unchanged against gh at both widths.

   Then one refinement before shipping: the default applies on **www.jackzhaojin.com only**. Otherwise eds, the aem.page previews, branch hosts and every stardust sweep (about 70 headless page loads each) would fill the property with test traffic. The old site only ever ran on www. `?consent=accept` still turns GA4 on anywhere, for testing.

   On production, once Cloudflare's cached copy of `consented.js` expired (it holds scripts for up to two hours, and nothing purges it until push invalidation is set up):
   - gtag.js loads about 3.5 s after LCP, and the `page_view` hit is answered 204;
   - with GPC, and with `?consent=decline`, nothing loads;
   - eds stays off.

   The validation sent a handful of test `page_view`s: from `ga4--…aem.page` before the guard, and two from www. Left for Jack: a look at GA4's real-time report, and dropping the "gtag first in `<head>`" rule from jackzhaojin.github.io's `docs/site-operations.md` (decision 9).
3. **Old URLs that 404 on www.** 24 URLs, linked 74 times from the content, are still served on gh:

   | Prefix | URLs | Proposal |
   |---|---|---|
   | `/portfolio/assets/` | 15 diagram files (`anima/agent-roster.svg` and others) | pass through to GitHub Pages |
   | `/design-systems/v3/templates/` | 5 (the v3 prototype templates `blog.html` with four topics, `home.html`, `post.html`) | pass through |
   | `/design-systems/2026-09-13/` | the older design round, not linked but public before | pass through |
   | `/ai-docs/` | 1 (`2026-09-13-seo-geo-redesign/seo-page-blueprint.md`) | pass through |
   | `/writing/2025-07-13-three-eds-offerings/images/` | 1 full-size image link | point the link at the DA media copy (a content fix, like R18) |

   **The proposal:** a second allowlist in `edge/src/routes.mjs`, path prefixes handled exactly like `PROJECT_SITES` (`projectFetch`, so GitHub still serves them on www). It needs a test per prefix, a check in `check-host.mjs`, and a Worker deploy (Jack's call). `/design-systems/v3/` itself stays EDS, so the prefix is `/design-systems/v3/templates/`, not `/design-systems/`. Moving them into EDS instead isn't worth it: they're files, not pages.
4. **Publishing has to move to EDS** (the double migration is over). What has to change:
   - **`docs/publishing-writing.md` in jackzhaojin.github.io:** "Add an article" steps 1 to 9 build the page on GitHub Pages: the listing in `writing/index.html` and `blogs.html`, `sitemap.xml`, `scripts/check-site.sh`, the Pages build. Under the new flow:
     - the article is written, or imported with `import-article.mjs`, into www-eds `content/writing/<slug>/index.html`;
     - images go to DA and `content/media/`;
     - the listing row goes into `content/writing/index.html`;
     - the head metadata syncs (`sync-head-metadata.mjs`), and the redirects sheet is rebuilt;
     - publishing follows `content/README.md`;
     - the sitemap updates itself from the query index;
     - `llms.txt` is in www-eds.
     - "Retiring or replacing an article" can now use a real 301 (the redirects sheet), which GitHub Pages couldn't.
   - **`jack-technical-writing` (user skill):** it writes to `jackzhaojin.github.io/writing/<slug>/` and hands off to `publishing-writing.md` (its section 7). Either it keeps drafting HTML there as the source and adds the import step into www-eds, or it writes EDS content directly. The listing, sitemap and `check-site.sh` steps go away.
   - **career-blogs `video-release` skill:** its outputs table points the article at `jackzhaojin.github.io/writing/<slug>/`. Its step that follows `publishing-writing.md`, and the release template's checklist line ("noindex off, listing, sitemap, commit and push on Jack's ask, Pages built, check-site"), describe the GitHub Pages flow. They become: publish to EDS, then `check-host` on www.
5. **The runbook's remaining steps:**
   - Search Console: submit the sitemap and inspect the home page URL. Taken up with Bing in the [SEO and GEO audit](../2026-10-26-seo-geo-audit/README.md), which also found the dead JSON-LD image URLs;
   - rewrite `docs/site-operations.md` in jackzhaojin.github.io for the new request path;
   - add a README there saying the main site moved and `CNAME` must stay.
6. **Later, optional (Phase B):** move GitHub Pages to gh.jackzhaojin.com. First the three code fixes in `edge/README.md`; then the GitHub custom domain change and the www Worker's `PROJECT_ORIGIN = https://gh.jackzhaojin.com`, together.

## Prompts

Jack's words in this session, word for word (US Eastern, 2026-10-26):
- 15:26, picked from the next-step box: "Pull the 25 media files that exist only in DA (17 badges, 8 importer diagrams) into the repo, following content/README.md, and commit." (Done: `content/media/`, each file byte-identical to the delivered copy; see [../2026-10-26-content-in-git/](../2026-10-26-content-in-git/README.md).)
- 15:27: "also when you're done, a different claude session finished the cutover, this is the promtp from that session, it doesn't know about EDS as well as you but cutover is done, and after you do your final checks above task, let's tag with v1.0.0 and create a release branch of release/1-0-0 do as much updating and documetnation and validation before tagging"
- 15:29: "from the other session -", followed by the cutover session's report and its to-do list. The report is summarized above under "What was done". Its to-do items are in "Repo brought in line with production" (item 1) and "Left" (items 2 to 7).
- About 16:45: "OK and without incrementing versions for content stuff, let's see if we can get a privacy / consent page and add it to the footer, i know we're managing content in code but we should only create release branches for real code changes", then "We'll also need this privacy and content for the google authenication and other stuff as well for oauth, so feel free to make it broader and use best legal language for a personal website and someone who builds oauth apps and other apps", then "Yup and add a note to AGENTS.md or AI documentation that when we make content changes, pushing is fine but we shouldn't version the release, release must have some eds block change or something, or example updating hlx api stuff is NOT a release, that's just documentation". (`/privacy/` became the full policy for the website and Jack's apps. Every commitment the old page made is kept word for word; the rest covers GA4 and the choices around it, Adobe's telemetry, hosting, embeds, Sign in with Google, the Google user data rules with Limited Use, sharing, retention, security, children, rights, where data is processed, changes and contact. It went through the editor round trip with no losses, was reviewed by Jack on preview, and was published with a Privacy link in the footer (register R25). No version: AGENTS.md, "Releases are for code only".)
- Then: "Publish the privacy policy and the footer link as they are on preview (contact through GitHub), then commit the content."
