# SEO and GEO audit of www.jackzhaojin.com (2026-10-26)

The first SEO and GEO (AI search) audit of www since it moved to Edge Delivery at the cutover (about 15:12 ET the same day). The skills from the old site's research came first, then the audit, then submission to Google and Bing.

Jack's words: "can you see all the SEO work we did on jackzhaojin github io project and see if those skills are good and maybe we port them over? we did do a lot of research. after you read those skills in context ideally we'll want to do a full SEO / GEO analysis, and after we feel good about SEO/GEO, let's submit to google site and bing search console". Mid-run: "i logged into bing search consoel and google search console in your attached browser!"

## The skills

jackzhaojin.github.io had five SEO skills installed on 2026-09-13 with `npx skills` (`skills-lock.json` there), not checked in: `seo-audit`, `ai-seo`, `schema`, `site-architecture` and `programmatic-seo`, all from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT, updated daily). They drove the research in `jackzhaojin.github.io/ai-docs/2026-09-13-seo-geo-redesign/`: the site plan, the page blueprint and the v3 build that www still has.

The copies there are six weeks old, and the upstream versions read for this audit are newer:

| Skill | Old repo | Upstream | What changed that matters here |
|---|---|---|---|
| `ai-seo` | 2.5.0 | 2.11.0 | Bing's AI Performance report and grounding queries; AgentReady (October 21, 2026) and its MUST/SHOULD/MAY practices; ChatGPT 5.6's shift away from listicles; crawler groups by purpose |
| `seo-audit` | 2.0.1 | 2.2.2 | title tag and rankings-push references |
| `schema` | 2.0.0 | 2.0.2 | Google stopped showing FAQ rich results on May 7, 2026, so the September plan's FAQPage idea gets no rich result now |
| `site-architecture`, `programmatic-seo` | 2.0.0 | 2.1.0 | planning skills; nothing to plan at scale on a personal site |

**Verdict:** worth keeping. `ai-seo` is the strongest: it is current, it separates Google's stance (no special files or markup needed for AI Overviews) from what ChatGPT, Claude, Perplexity and Copilot reward, and it ranks its own evidence (platform docs over vendor studies). `seo-audit` is a sound checklist, mostly generic. Their stats come from vendors and say so; none of them is a forecast for this site.

**Ported** as a plugin, the way this repo takes skills (no copies): `.claude/settings.json` adds the `marketingskills` marketplace and enables `marketing-skills`. The plugin is all or nothing, so it brings all 52 of its skills; the SEO ones are the reason. A new session here loads them.

## How the audit ran

The `seo-audit` priority order (crawl and index, technical, on-page, content, authority) with the `ai-seo` checks (bot access, extractability, discovery files, entity), against production www:
- `stardust/scripts/seo-check.mjs` (new): every sitemap page's head tags, JSON-LD and the URLs they and the page links point at;
- crawler user agents against `/writing/` and `/robots.txt` (Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, CCBot, Bytespider, meta-externalagent);
- every external link on the 35 pages (662 URLs);
- Lighthouse 12 locally (the PageSpeed API was over its anonymous quota);
- Google Search Console and Bing Webmaster Tools, read in the built-in browser, where Jack was signed in;
- the old site (gh.jackzhaojin.com) as the reference for anything that changed at the cutover.

## What's already right

- **Crawl and index:** robots.txt is one wildcard allow with the sitemap line (AgentReady's default, so search APIs with their own crawlers aren't left out). Every crawler above gets 200. The sitemap lists all 35 pages on www. Unknown paths are real 404s. The old URLs (`/blogs.html`, `/certifications.html`, `/index.html`, paths without their slash) are 301s, and the apex and `jackzhaojin.github.io` redirect to www.
- **Head tags on all 35 pages:** title, description, a self canonical, one h1, Open Graph and Twitter tags, and a JSON-LD graph that parses, tied to one Person `@id`, with breadcrumbs on every page but home.
- **Content in the initial HTML:** the text, the links in the main content and the article bylines (author, published, updated, reading time) are in the raw HTML, so agents that don't run JavaScript read them. The header and footer load as fragments, which Adobe found no SEO cost in, and Google renders them.
- **Images:** the cards' and badges' empty `alt=""` is deliberate (the text sits next to them) and identical to gh.
- **Speed:** Lighthouse mobile on home and an article: SEO 100, performance 97 (LCP 2.2 s simulated, CLS 0 and 0.025, blocking time 0 ms), best practices 100 and 96, accessibility 96 and 100. HTTPS with HSTS.
- **GEO files:** `llms.txt` lists 34 of the 35 pages with a one-line description each, and every link answers 200. Edge Delivery serves every page as Markdown at `<path>index.md` (`text/markdown`) without any setup.

## Search Console and Bing, before submitting

- **Google** (URL-prefix property `https://www.jackzhaojin.com/`, verified by `google57906613577fdd42.html`, still served): 48 pages indexed, which are the sitemap pages plus the project sites. 6 not indexed: 2 are alternates with a proper canonical (as intended), and 4 are "Discovered - currently not indexed": `/privacy/` and three 2025 articles (`2025-06-12-azure-rbac…`, `2025-07-06-ai-coded-nextjs-agent-release-1`, `2025-07-11-scaling-ai-coding…`). The sitemap was last submitted and read on 2026-10-25, before the cutover: 35 pages. Enhancements: 7 breadcrumbs, 1 profile page, 3 videos valid. 19 clicks in six weeks.
- **Google video indexing:** 0 of 19 videos, all "Video isn't on a watch page". This is by design, not a defect: Google only indexes a video as a video result where it is the page's main content, and here the article is (Jack's rule that the site is the destination). YouTube indexes the videos itself.
- **Bing** (verified by `BingSiteAuth.xml`): the sitemap was submitted and crawled on 2026-10-25. AI Performance (Copilot and partners): **58 citations** this month, 39 on October 11 and 19 on October 14, the days after the adaptTo recap went out. Search: 5 clicks, 11 impressions.

## Findings, by priority

| # | Finding | Impact | Fix | Status |
|---|---|---|---|---|
| 1 | **50 JSON-LD image URLs 404 on www** (29 article `image`, 21 video `thumbnailUrl`; 30 files). They came from gh verbatim (`/writing/<slug>/images/cover.jpg`), where the files existed. A video without a working thumbnail isn't eligible for video features, and articles lose their image in rich results. The head comparison at cutover matched the tags but didn't fetch the URLs | High | Content: each points at the media copy www serves, after checking the bytes are the same as the original on gh (`stardust/scripts/fix-dead-image-urls.mjs`). The one without a copy (`live-poster.jpg`, the second video's poster on the v2.1 article) points at that video's YouTube thumbnail | **Live** (Jack: "publish the 29 fixed pages"): preview against live differed only in those JSON-LD lines before publishing; on www all 50 answer 200 |
| 2 | **An external link became a 404.** Edge Delivery rewrites every `https://` link to any `*.aem.page` or `*.aem.live` host into a relative path, whichever site it points at (`rewriteUrl` in helix-html-pipeline). So the Patterns of Work link to the adaptTo demo site (`main--adapt-to-2026-demo--jackzhaojin.aem.page/ai-content/`) became `/ai-content/` on www | Medium | Content: the link is written `http://…aem.page/…`, which the pipeline leaves alone. `.page` is on the browsers' HSTS preload list, so browsers go straight to https; crawlers get one 301 | **Live** |
| 3 | **16 internal links 404.** 15 are the portfolio's diagram files (`/portfolio/assets/…`) and 1 is "Open the diagram full size" on the three-offerings article (register R21). All were on the 404 list at cutover | Medium | R21: point it at the media copy www serves (byte-identical). The 15 diagram files: the Worker passthrough already proposed in [the cutover record](../2026-10-26-cutover/README.md), Left item 3 (a release and a Worker deploy, Jack's call) | R21 **live**; the passthrough is still a proposal |
| 4 | **A caption link is 401 for readers** (register R18): "my portal screenshot" on the Azure RBAC article points at DA (`content.da.live`), which has been private since the DA permissions sheet went in. That file, `storage-roles.png`, exists only in DA: the page never shows it, so www doesn't serve it, and `content/media/` lacks it | Medium-low | Pull it into `content/media/` (the media rule). Then serve it, either by previewing and publishing the DA file so www serves it under `/media/…`, or by showing it on the page (a design change, so a register entry). Jack's call | Proposed |
| 5 | **52 zoom links point at DA in the raw HTML.** Images wrapped in a link to their DA copy: talk-list's `zoom()` and the article blocks swap in the delivered URL in the browser (0 left after load on all 4 pages checked), so readers are fine. Agents that don't run JavaScript see 401 links | Low | Optional: write the delivered media URL into the content | Proposed |
| 6 | **No `lang` on `<html>` in the raw HTML.** gh served `<html lang="en">`; here `scripts.js` sets it after load. Google reads the language from the text; Bing takes `lang` as a signal, and agents read the raw HTML | Low | The Worker sets `lang="en"` with an `HTMLRewriter` on EDS pages (`edge/src`, so a release and a deploy, Jack's call) | Proposed |
| 7 | **Discovery files aren't linked.** Nothing links `llms.txt`, and nothing advertises the Markdown copies. In Ora's study 86-100% of visits to such files came through a link | Low | `llms.txt`: add the privacy page, and link it from the head (`head.html`, a release) or the footer (a register entry). Markdown: the same Worker release can send `Link: <…index.md>; rel="alternate"; type="text/markdown"`. `llms-full.txt` is optional | Proposed |
| 8 | **The old home social image is gone:** `/assets/site-social.png` 404s; Brave still lists it, and old LinkedIn previews point at it | Low | A redirect to `/default-meta-image.png` (the redirects sheet, a config change) or the passthrough list | Proposed |
| 9 | **sameAs lists only LinkedIn and GitHub.** A YouTube channel and a Credly profile would tie the Person entity to more of what assistants cite (`ai-seo`, Presence) | Low | Content, once Jack gives the URLs | Ask Jack |
| 10 | **Sitemap `lastmod` is the last publish:** all 35 pages say 2026-10-25 or 26 after the content-in-git republish | Info | Sorts itself out as pages change. Taking it from `article:modified_time` would be a query index change (config) | Leave |
| 11 | **15 titles run past 60 characters** with the `| Jack Jin` suffix, carried from gh | Info | Content is carried verbatim; Jack's call per page | Leave |

## Submission plan (after the fixes are live)

1. Publish the 29 fixed documents and rerun `seo-check.mjs` on www: what should be left is the 15 portfolio files (finding 3).
2. **Google Search Console:** resubmit `/sitemap.xml`; URL Inspection and "Request indexing" for home, the newest article, `/privacy/` and the three discovered-not-indexed articles.
3. **Bing Webmaster Tools:** resubmit `/sitemap.xml`; URL Submission for the same pages.
4. Optional: Brave's submit-url page for home (Claude's web search uses Brave), and IndexNow for future publishes.

## Results (2026-10-26, evening)

Jack: "Yes: publish the 29 fixed pages, rerun seo-check on www, then resubmit the sitemap and request indexing in Google Search Console and Bing Webmaster Tools. Commit and push the skills port, the audit record and the content when done."

- **Published:** 29 of 29 (`deploy-batch.mjs`). One page, the two-prompts article, still served its old head on www afterwards. aem.live had the new version, but Cloudflare had cached the old one from a moment when aem.live was still updating, just after the last purge, and would have kept it for two days. Republishing that page purged it again. Lesson in `content/README.md`, step 5.
- **`seo-check.mjs` on www:** 46 problems before, **14 after**, all of them the portfolio's diagram files (finding 3, the passthrough proposal). None of the 29 pages has an old image URL left.
- **Bing Webmaster Tools:** `https://www.jackzhaojin.com/sitemap.xml` resubmitted ("successfully submitted for processing", 35 URLs). URL Submission for home, the two-prompts article, `/privacy/` and the three discovered-not-indexed articles: "6 URLs submitted", 94 left of the day's 100.
- **Google Search Console** (after Jack signed in again; Google had signed the browser session out): `/sitemap.xml` resubmitted (submitted Oct 26, 2026, 35 pages). URL Inspection, then "Request indexing", for the same six pages; each answered "Indexing requested: URL was added to a priority crawl queue". Before the request, home and the two-prompts article were "URL is on Google" (home with a valid profile page; the article with valid breadcrumbs and video markup from the earlier crawl). `/privacy/` and the three 2025 articles were "Discovered - currently not indexed", found through the sitemap and never crawled.

**To check in a few days:** Page indexing (the four discovered pages indexed?), the Videos enhancement (the thumbnails now resolve), and Bing's AI Performance.

## Tools

- Skills: `seo-audit`, `ai-seo` and `schema` from coreyhaines31/marketingskills 2.13.5 (read from the upstream repo; the plugin loads from the next session on); `content/README.md` for the content change.
- Scripts: `stardust/scripts/seo-check.mjs` and `stardust/scripts/fix-dead-image-urls.mjs` (new), `roundtrip-compare.mjs` (DA's copies matched git before editing), `deploy-batch.mjs --no-publish`.
- Lighthouse 12; curl with crawler user agents; `gh api` for the upstream skills and helix-html-pipeline's `rewriteUrl`.
- The desktop app's built-in browser for Search Console, Bing Webmaster Tools and the rendered link checks.

## Second pass: what Edge Delivery and Cloudflare add (2026-10-26, night)

Jack's words: "can you do a SEO/GEO best practice audit and see what's there that we can enhance with EDS? looks like we're doing edge workers in cloudflare which is great, anythign else i should consider?"

Run on www after v1.1.3 and v1.1.4, with 56 pages in the sitemap (35 at the first pass). `seo-check.mjs`: 0 problems across 58 pages and fragments, 336 JSON-LD and social image URLs, and 186 URLs. Every crawler user agent from the first pass gets 200. Google read the new sitemap (56 pages); Bing shows it as processing. For what a production Edge Delivery host should send, www.aem.live and www.adobe.com (Adobe's own CDN) were the reference, along with Adobe's bring-your-own-CDN guides.

**The first pass's open items:**
- 3 is closed: the portfolio pages rebuilt in v1.1.1 have no `/portfolio/assets/` links.
- 4 and 5 are open: there are 6 `content.da.live` URLs in the raw HTML of the 2025 Azure RBAC article.
- 6 is open: `<html>` still has no `lang`.
- 7 is open.
- 8 is open: `/assets/site-social.png` still answers 404.
- 9 is open.
- 10 stays left as is.

**Also right:**
- The page has no Cloudflare HTML rewrites (Rocket Loader, email obfuscation).
- 27 of the 29 articles have a `dateModified`.
- `llms.txt` lists all 56 sitemap pages except `/privacy/` and `/terms/`.

| # | Finding | Impact | Fix | Status |
|---|---|---|---|---|
| 12 | **Every page's `.plain.html` copy can be indexed on www.** Edge Delivery sends `x-robots-tag: noindex, nofollow` from aem.live, and the production CDN is meant to remove it from pages only. Adobe's Fastly guide keeps it on fragments (`if (req.url.path !~ "\.plain\.html$") { unset resp.http.X-Robots-Tag; }`), and www.aem.live and www.adobe.com still send it on `.plain.html`. Adobe's Cloudflare worker (`edge/src/aem.mjs`) removes it on every path, and `robots()` removes it again. Nothing links to the page copies, so the exposure is mostly `/nav.plain.html` and `/footer.plain.html`, which the browser fetches on every page | Low-medium | On www, `robots()` sends `noindex, nofollow` for `*.plain.html` | **Live** (v1.1.5, Worker `a9d52169`) |
| 13 | **`/terms` answers 404.** Every other folder page 301s to its trailing slash; the redirects sheet is older than the page | Low-medium | `node hlx-config/sheets.mjs --upload --publish` | **Live** |
| 14 | **The Markdown copies (`index.md`) have no canonical**, so a crawler that indexes one has a second copy of the page | Low | On `.md` responses, the Worker sends `Link: <page URL>; rel="canonical"`. On pages, it sends `Link: <...index.md>; rel="alternate"; type="text/markdown"` (finding 7). Optional: a request with `Accept: text/markdown` on a page path gets its `index.md`. Cloudflare's Markdown for Agents does this by converting the HTML, but only on Pro plans and up; Edge Delivery already has the Markdown. The copies render blocks as grid tables, so it's unproven that agents gain anything | Left (Jack: "i'm not sure about 6,14") |
| 15 | **The YouTube player loads with the page on talk pages.** `loading="lazy"` does nothing in the first screen. In PR 6's check the lightning talk scored 84 on mobile PSI (TBT 554 ms); the other pages scored 96 to 100. The talk pages are now where the recordings live, so they're the pages that could pass Google's watch-page rule (first pass: "Video isn't on a watch page") | Medium | A click-to-play facade in `blocks/figure`: the YouTube thumbnail and a play button, with the player loading on click. The VideoObject stays in the JSON-LD | **Live** (v1.1.5), with the player also loading by itself, see below |
| 16 | **Nothing tells Bing that a page changed.** Bing feeds Copilot (58 AI citations in October), and IndexNow also reaches Yandex, Naver, Seznam and Yep. Google doesn't use IndexNow | Low-medium | `deploy-batch.mjs` posts the URLs it published to `api.indexnow.org`, with the key file at the root (served like `BingSiteAuth.xml`, so not a release). Cloudflare's Crawler Hints is a dashboard toggle that does the same from cache changes, but every publish purges the whole zone | **Live** |
| 17 | **robots.txt states no AI preference.** Content Signals (`Content-Signal: search=yes, ai-input=yes, ai-train=...`) are a stated preference, not a block. The managed robots.txt only fills the 404 on eds and gh | Info | Jack picks the three values, then they go into `hlx-config/robots.txt` and the Admin API | **Live**: all three `yes` |
| 18 | **GEO data is collected but not read.** Edge Delivery's operational telemetry (`/.rum/1`, 201) and Cloudflare Web Analytics (`/cdn-cgi/rum`, 204) both run on www | Info | The OpTel explorer (`aem.live/tools/oversight/explorer.html?domain=www.jackzhaojin.com`) needs a domain key from Adobe; its `enter` facet shows referrers such as chatgpt.com. Cloudflare's AI Crawl Control shows which AI crawlers came and whether any is blocked. Bing's AI Performance shows citations | Jack: see below |
| 19 | **1 of 29 public repos links back to the site.** Only `bruce-hackathon-2026-09-12` sets a homepage. GitHub is in the Person's `sameAs`, and repos are where assistants find the projects | Medium (GEO) | `gh repo edit --homepage` for each repo with a portfolio or article page (anima-mesh, ai-builder-kit, continuous-agent, ciam-demo and the others), plus www-eds itself | **Live**: 23 repos |

One edge release can close 6, 12 and 14 together: an `HTMLRewriter` for `lang`, the robots header for fragments, and the `Link` headers.

### Results (2026-10-26 night to 2026-10-27)

Jack: "i like your suggestions, including modifying github repo on the websites, all of them! i do notice that my video is higher result than my pages and this is probably why. i'm not sure about 6,14 line, but everythign else try and achieve and test on prod". He also gave the two profiles for finding 9: "my youtube channel - https://www.youtube.com/@jackjin8467", "credly - https://www.credly.com/users/jack-jin/badges/credly" (`sameAs` takes the profile, `https://www.credly.com/users/jack-jin`).

| # | What shipped | Checked on www |
|---|---|---|
| 19 | `gh repo edit --homepage` on 23 public repos: each points at its portfolio page, article or talk, the games at their playable sites, www-eds and jackzhaojin.github.io at home. Left without a page: eds-doc-authoring, a2a-demo, nextjs-azure-swa-2025-05, shadow-pivot-nextjs, plus the two that already had a homepage (slicc, adobe-champion-forum-2026-hype) | every target answers 200 |
| 9 | Content commit `489f165`: the Person on the 33 pages with authored JSON-LD adds the YouTube channel and Credly; v1.1.5 does the same for the generated graphs (hubs, talk and project pages) | 33 of 33 after republishing the 7 Cloudflare cached in the purge window; `/writing/` and `/talks/adaptto-2026/` carry it |
| 4, 5 | The same commit: the Azure RBAC article's 5 zoom links and its screenshot link point at the media copies www serves (byte-identical to DA's files); `storage-roles.png`, which existed only in DA, is in `content/media/` and previewed and published | 0 `content.da.live` links on the page |
| 8, 13 | Config commit `ed495bf`: the redirects sheet (129 rows) adds `/terms`, `/terms/index.html` and `/assets/site-social.png` -> `/default-meta-image.png` | all three 301 |
| 17 | The same commit: `Content-Signal: search=yes, ai-input=yes, ai-train=yes` ([hlx-config/2026-10-26-content-signal/](../../hlx-config/2026-10-26-content-signal/EXECUTION.md)) | served on `/robots.txt` |
| 12 | v1.1.5 (PR 7, `f768cb0`), Worker `a9d52169` on www and `04c063e1` on staging | `.plain.html` fragments `noindex, nofollow`; pages, `index.md`, robots.txt and the sitemap without it; `check-host.mjs` PASS |
| 15 | v1.1.5: the figure poster, with the player on a click or by itself in the delayed phase | Lighthouse 12 mobile on www, two runs each: lightning talk 97/97, adaptto-2026 98/99, aem-rockstar-2024 97/96, the two-prompts article 98/98; YouTube on load 7 to 17 KB (it was 955 to 1008 KB); TBT 0. The player starts at 3.4 s, CLS 0 |
| 16 | v1.1.5: the key file and `indexnow.mjs`, called by `deploy-batch.mjs` after a publish | the 56 sitemap pages submitted (202 while the key was checked, then 200); a publish run ends with "IndexNow: 1 URLs, HTTP 200"; Bing's IndexNow report lists the submissions |
| 18 | Read, not shipped: Cloudflare's AI Crawl Control and Web Analytics, and Bing's AI Performance (below). No setting needed changing | every AI crawler allowed; 3 of 629 AI requests unsuccessful in 24 hours |

**The player loads by itself, on purpose.** A click-only facade would have been the simplest fix, but Google's video guidance says "Don't rely on user actions (such as swiping, clicking, or typing) to load the video", and the talk pages are the pages that could show as the recordings' watch pages, where Jack wants his pages, not YouTube, to rank. So the poster holds the place while the page loads, and the player follows 3 seconds after load (the site's delayed phase) once the figure is near the screen. Waiting for the load event alone wasn't enough: on EDS it fires before the blocks and the template finish (66 ms against an LCP of 124 ms locally). On the lightning talk the poster is now the mobile LCP element.

**Each item through dev, test, deploy and the prod test** (the last column is one consolidated check of www at the end, 2026-10-27, all PASS):

| # | Dev | Test | Deploy | Prod test (www) |
|---|---|---|---|---|
| 19 | the page for each repo, every target checked 200 | `gh repo list`: 23 with a site homepage | `gh repo edit --homepage` x23 | 23 repos, every homepage 200 |
| 9 | 33 files in `content/` (DA matched git first); `scripts/collection-schema.js` | preview: 32 pages no body change, the head carries the new `sameAs`; branch preview `/writing/` graph | publish 33 (7 republished after the purge window); v1.1.5 + Worker `a9d52169` | 56 of 56 sitemap pages carry YouTube and Credly |
| 4, 5 | the article's 6 hrefs; `storage-roles.png` into `content/media/` | bytes of DA's files = www's media copies; preview diff only those 6 hrefs; built-in browser: 0 DA links | publish the article and the image path | 0 DA links, the 6 links answer 200 |
| 8, 13 | `redirects-extra.tsv`, `sheets.mjs` build (129 rows) | the built sheet holds the 3 new rows | `sheets.mjs --upload --publish` | `/terms`, `/terms/index.html`, `/assets/site-social.png` 301 to their targets |
| 17 | `hlx-config/robots.txt` | GET before matched the file; GET after identical to the file sent | Admin API POST (200) | `/robots.txt` has the Content-Signal and sitemap lines |
| 12 | `robots()` in `edge/src/routes.mjs` | new Worker test, 21 of 21 pass; `wrangler deploy --dry-run` bundle has the rule | v1.1.5, Worker `a9d52169` (www), `04c063e1` (staging) | fragments `noindex, nofollow`; home, a talk page, its `index.md`, the sitemap without it; `check-host.mjs` PASS |
| 15 | `blocks/figure/`, `templates/talk/talk.css`; `aem up` on localhost | localhost: poster, player at 3.06 s, CLS 0, Enter loads it with autoplay; branch preview at 1440 and 360, editability 0 dead and 0 duplicated, Lighthouse 100 with YouTube on load 983 to 17 KB; PSI 100 | v1.1.5 merged (PR 7) | www serves the poster code; built-in browser: poster, then the player at 3.36 s; Lighthouse mobile 96 to 99 |
| 16 | `indexnow.mjs`, the `deploy-batch.mjs` hook, the key file | the URL mapping by hand (pages map, fragments, docs and sheets skip); branch preview serves the key | v1.1.5 merged; 56 pages submitted | key served; a publish run ends "IndexNow: 1 URLs, HTTP 200"; a live ping 200; Bing's IndexNow report lists the URLs |
| 18 | | | | read on prod: AI Crawl Control (nothing blocked, 3 of 629 unsuccessful in 24 hours), Web Analytics (field CWV, referrers), Bing AI Performance (58 citations). The OpTel domain key is out of scope (Jack: "we're not going to get adobe done") |

**The PR's `aem-psi-check` failed, and not on a page:** PSI scored every changed page 100 for performance on the branch (lightning talk mobile: LCP 1.7 s, TBT 40 ms), but it also tried the IndexNow key file ("NOT_HTML", scored 0), and SEO is always 66 to 69 on aem.page, which is noindex by design.

**The 58 was an outlier.** The first Lighthouse run on www (the lightning talk at 58, LCP 10.9 s) didn't repeat: two more runs before the release scored 96 and 98. It was a cold run with the 1 MB player loading beside the page, which v1.1.5 removes.

**Measurement (18):** Jack signed in to Cloudflare in the built-in browser, and the Adobe domain key is out ("we're not going to get adobe done"). What the data says, read at about 00:20 ET on 2026-10-27. Mind the windows: the cutover was on 2026-10-26 at about 15:12 ET, so the 7-day windows (from October 20) are mostly the GitHub Pages site, and the 24-hour windows start about 14 hours before the cutover. The AI Crawl Control pages only take their presets, so there is no exact post-cutover split:
- **AI Crawl Control, Security:** no crawler is blocked (every Block Crawler switch off). Last 7 days, allowed and unsuccessful: Googlebot 749/73, ClaudeBot 297/164, Applebot 246/10, BingBot 142/16, Meta-ExternalAgent 122/23, PetalBot 92/0, Amazonbot 62/9, GPTBot 23/13, ChatGPT-User 22/7, PerplexityBot 18/7, OAI-SearchBot 12/12, Claude-User 11/22, Perplexity-User 10/20, DuckAssistBot 6/11, Claude-SearchBot 6/6.
- **Metrics:** the unsuccessful ones are not the site. Over 7 days the 409 404s are mostly `/sitemap.xml` on eds and gh, which the Worker hides on noindex hosts by design (www answers 200), old GitHub Pages files (`/css/*.css`, `/design-systems/v3/*.css`), and scanners (`/.env`, Vite source maps); the most crawled path, `/login`, is content-factor-dash.jackzhaojin.com. In the 24 hours to 00:20 ET on October 27, which take in about 9 hours after the cutover: 629 AI-crawler requests, 598 answered 200, 28 redirects, 3 404s. The hourly chart puts most of them after the cutover (Googlebot peaks just after it).
- **Zone settings, left as they are:** Markdown for Agents is a Pro plan feature (the zone is on Free). Bot Preference Sync would prepend Cloudflare's settings to robots.txt; robots.txt now states its own Content-Signal, so it stays off. Crawler Hints would duplicate the IndexNow ping.
- **Web Analytics (Core Web Vitals from real visits, bots excluded):** 7 days LCP 96% good, INP 97%, CLS 87%; the last 24 hours LCP 98%, INP 97%, CLS 90%. Most layout-shift samples are the GitHub Pages markup (`article.writing-article > header.article-head`): www before the cutover, or gh since. A few are on the EDS article template (`#main > div.article-layout`, 0.16 to 0.20, 2 samples each): worth a look as more data comes in.
- **Referrers:** 2,220 visits in 7 days (mostly before the cutover, on all hosts), 2,196 direct and almost all desktop Chrome on macOS (our own testing), then LinkedIn 12 and Google 8. No AI referrer (chatgpt.com, perplexity.ai, claude.ai, copilot) yet.
- **Bing AI Performance:** still 58 citations (39 on October 11, 19 on October 14), no grounding queries listed: the baseline.

**Not done:** 6 (`lang` in the raw HTML) and 14 (Markdown `Link` headers), per Jack. YouTube's own descriptions linking to the matching page are Jack's to edit in YouTube Studio; they're the other half of finding 19 for the videos.

**Tools:** `seo-check.mjs`; curl with crawler user agents and `Accept: text/markdown`; the docs-search index of aem.live (the BYO CDN guides, network profile, OpTel); WebSearch and WebFetch for Cloudflare's Markdown for Agents, Content Signals and Crawler Hints docs; `gh repo list` and `gh repo edit`; the built-in browser for the RUM requests, the branch preview, Bing's IndexNow and AI Performance reports; `npx lighthouse@12`; `wrangler deploy`.
