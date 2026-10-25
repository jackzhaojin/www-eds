<!-- stardust:provenance
  writtenBy: stardust:dynamics (triage, Track B site-scope)
  writtenAt: 2026-10-25T14:30:00Z
  readArtifacts:
    - stardust/current/_dynamics.json (dynamics-detect on 10 archetype URLs, reach from extract --dynamics over 34 pages)
    - stardust/dynamics/dynamic-features.generated-plan.json (dynamics-plan --knowledge, 38 draft rows)
    - stardust/spec/knowledge/features.json, open-questions.json, search-probes.json
    - stardust/.work/spec/martech/ (headers, vendors, tags, consent-mode)
  synthesizedInputs: []
  stardustVersion: 0.36.0
  note: Phases 1-3 only (detect, classify, triage). No target host yet, so no host-bound probe and no reconcile against migrated output; both run when the main thread has an EDS origin.
-->
# Dynamic features - www.jackzhaojin.com

## Listings contract

One listing on the site: the writing index (`/writing/`, 28 rows today, authored by hand). On EDS it reads the `writing` query index (`stardust/spec/knowledge/query-indexes.json`, drafted in `helix-query.yaml`), document-first: the index page carries the rows as authored content and the block tops up from the index.

Every article page must emit these `<meta name>` fields:

| field | source on the live page | used by |
|---|---|---|
| `title` | `<title>` / h1 | writing-list row title, JSON-LD headline |
| `description` | `meta[name=description]` | writing-list summary |
| `image` | `og:image` | writing-list cover (rows use 16:9 covers today) |
| `publication-date` | first `.byline time` | sort order, year filter, byline |
| `updated-date` | second `.byline time` | byline, JSON-LD dateModified |
| `topics` | writing row `data-topics` (`aem`, `ai-engineering`) | topic filter pills and counts |
| `read-time`, `video-length` | byline text | row facts, byline |

The home "Technical Writing" teaser (latest article) reads the same index.

## Features

| # | id | feature | class | reach | disposition | target | reproducibility | status | pattern | decision / owner | evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | theme-control | Light / Dark / System theme control | M | 34/34 | rebuild-native | runtime | self | pending | pre-paint head script + header tools | keep the `jj-theme` key | inline head script, `js/site.js`, `.theme-control` |
| 2 | nav-menu | Menu drawer below 1024px | M | 34/34 | rebuild-native | runtime | self | pending | chrome interaction | none | chrome-explore 390: 1 drawer, 4 links + 3 theme buttons |
| 3 | ambient-art | Ambient canvas hero art | M | 4/34 | rebuild-native | block | self | pending | decorative client render, lazy | port as-is (replica keeps the signature) | `js/page-art.js`, `.graphic-hero canvas.ambient-art` |
| 4 | writing-index | Writing index list | L | 1/34 | index-backed | block | self | pending | query-index listing, document-first | topics + cover become page metadata | 28 rows with `data-date`, `data-topics`, `data-search` |
| 5 | writing-filter | Writing filter and search | S | 1/34 | client-only | widget | self | pending | client filter over the index rows | none; keep hash keys `#q=`, `#topic=`, `#year=` | `js/writing-filter.js`; form GET `/writing/?q=` as no-JS fallback; 5 probe terms in `knowledge/search-probes.json` |
| 6 | article-explainers | Interactive article explainers and labs | M | 27/34 | client-only | block | self | pending | inline client compute, no network | build form is open question `explainer-build` (default: one block, a variant per explainer) | `is-live` figures, `.lab`, 26 local `explainer.css`; detector F row: form-less control group |
| 7 | article-rail | Rail progress and current part | M | 28/34 | rebuild-native | block | self | pending | scroll-linked UI | none | `.article-rail details .rail__progress` |
| 8 | lightbox | Figure zoom and open-file lightbox | M | 1/34 | rebuild-native | runtime | self | pending | modal loader | none | detector: lightbox-zoom, lightbox-file triggers; `lb-zoomable` x7, `fig--zoom` |
| 9 | portfolio-interactions | Carousel, diagram deck, Gantt, counters, glossary, reveal, video facade | M | 1/34 | rebuild-native | block | self | pending | block JS | reveal must never hide content without JS | `portfolio/script.js` (26 KB) |
| 10 | youtube | YouTube embeds | V | 19/34 | embed-passthrough | content | self | pending | player URL is the content | facade everywhere for Lighthouse 100 (recommended) | 20 `youtube-nocookie` iframes, 1 facade |
| 11 | gtag | Google tag GA4 `G-ZVENE6BXTJ` | T | 34/34 | embed-passthrough | embed | needs-business-decision | scaffolded-awaiting-owner | tag in the delayed phase | same property on EDS hosts? (Q-MT-1) | gtag.js 540 KB + inline config; no consent defaults |
| 12 | cloudflare-analytics | Cloudflare Web Analytics beacon + RUM | T | 34/34 | embed-passthrough | embed | needs-business-decision | pending | edge-injected tag | keep beside EDS RUM, or drop | `static.cloudflareinsights.com/beacon.min.js`, POST `/cdn-cgi/rum` |
| 13 | cloudflare-email-obfuscation | Cloudflare email obfuscation rewriting article text | T | 3/34 | embed-passthrough | embed | needs-business-decision | pending | edge rewrite | turn it off for www (recommended) | server HTML of 3 articles links `/cdn-cgi/l/email-protection` (404 when fetched) |
| 14 | hotlinked-badges | Certification badges hotlinked from Credly and Microsoft | V | 1/34 | embed-passthrough | content | needs-business-decision | pending | third-party image | copy into DA media, or keep hotlinks (Q-ASSET-1) | 22 badge images from `images.credly.com`, `learn.microsoft.com` |

Search parity checks are drafted in `stardust/dynamics/dynamic-features.generated-parity.json` (one `search-query` check per probe term: stardust 1, playwright 4, mcp 5, edge functions 5, caching 2); `resultSelector` is filled when the rebuilt list exists.

### Detector rows merged or classified as noise (each keeps a disposition)

| detector row | disposition | reason |
|---|---|---|
| a-cms-app-settings-object-datalayer | embed-passthrough (merged into #11) | `dataLayer` is the gtag queue, not a CMS settings object |
| a-unknown-third-party-host-www-gstatic-com, a-...-jnn-pa-googleapis-com, t-...-www-google-com, t-...-yt3-ggpht-com | embed-passthrough (merged into #10) | YouTube player internals on the 4 probed pages with an embed |
| t-unknown-third-party-host-images-credly-com, t-...-learn-microsoft-com | embed-passthrough (merged into #14) | badge images, not tags |
| t-tag-manager-google-tag-manager, t-analytics-google-analytics-ads | embed-passthrough (merged into #11) | one gtag property |
| t-unknown-third-party-host-static-cloudflareinsights-com | embed-passthrough (merged into #12) | Cloudflare Web Analytics |
| f-form-less-control-group-in-article | client-only (merged into #6) | explainer controls, pure compute |
| s-site-search-form-js-submitted | client-only (merged into #5) | the writing filter; results are the index rows on the same page, so no separate results page is needed |
| l-listing-candidate-writing-list-28-cards | index-backed (merged into #4) | |
| l-listing-candidate-row-list-3-cards | static-snapshot | Related rows are curated per article (authored row-list block), not a listing |
| l-listing-candidate-deck-panes-6-cards, l-...-bruce-grid-reveal-3-cards | static-snapshot | portfolio content (diagram deck panes, Built with Bruce cards), authored rows |
| m-modal-trigger-lightbox-file, m-modal-trigger-lightbox-zoom | rebuild-native (merged into #8) | |
| v-video-youtube | embed-passthrough (merged into #10) | |
| i18n-locale-variants-* (4 rows) | static-snapshot | not locales: path segments of external links (linkedin.com/in, experienceleague /en/). The site is single-language en with no hreflang |
| x-sign-in-account-links | static-snapshot | links inside article content (an article about Google sign-in, myaccount.google.com); the site has no auth or commerce |

## Decision batch

One message to Jack, every non-self row:

1. **Analytics on EDS** (#11, #12): keep GA4 `G-ZVENE6BXTJ` on the EDS hosts, loaded in the delayed phase (default yes; filter `.aem.page` / `.aem.live` hosts in GA)? Keep Cloudflare Web Analytics beside EDS RUM (default keep, it costs nothing in code)? Consent stays as today: no banner (Q-MT-4).
2. **Cloudflare zone settings** (#13): turn off Scrape Shield email obfuscation on www so code samples render verbatim (default: turn off). This is a Cloudflare change, so it waits for Jack per the run rules.
3. **Badge images** (#14): copy the 22 certification badges into DA media, or keep the Credly and Microsoft hotlinks (default: keep hotlinks for now, copy later; Q-ASSET-1).

Everything else is `self` and ships with its block or the runtime.

## Register (decided-out)

| feature | reason | production statement |
|---|---|---|
| none | no row is decided-out; that takes an owner's statement | |
