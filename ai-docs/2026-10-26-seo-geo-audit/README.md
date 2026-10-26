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
