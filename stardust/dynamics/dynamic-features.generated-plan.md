<!-- stardust provenance: skill=stardust:dynamics · phase=plan draft · 2026-10-25T14:22:11.476Z · input stardust/current/_dynamics.json (10 pages, 38 findings) · spec knowledge stardust/spec/knowledge -->
# Dynamic features — draft inventory (curate into `stardust/dynamic-features.md`)

One row per detected finding. Merge duplicates, drop noise, keep every axis honest. Columns: disposition = what we do · target = the delivery form (widget where no authored rows remain) · reproducibility = what it needs · status = where it stands (reference/triage.md).

| # | id | class | feature | pages | disposition | target | reproducibility | status | pattern | decision needed | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | a-cms-app-settings-object-datalayer | A | CMS / app settings object dataLayer | 10/10 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 2 | a-unknown-third-party-host-www-gstatic-com | A | unknown third-party host www.gstatic.com | 4/10 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 3 | a-unknown-third-party-host-jnn-pa-googleapis-com | A | unknown third-party host jnn-pa.googleapis.com | 4/10 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 4 | f-form-less-control-group-in-article-writing-article-2-contr | F | form-less control group in article.writing-article (2 controls) | 1/10 | client-only | widget | self | pending | client-compute | none |  |
| 5 | i18n-locale-variants-in | I18N | locale variants in | 6/10 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 6 | i18n-locale-variants-in-in | I18N | locale variants in,in | 2/10 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 7 | i18n-locale-variants-en-en-en-en-en | I18N | locale variants en,en,en,en,en | 1/10 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 8 | i18n-locale-variants-en-in | I18N | locale variants en,in | 1/10 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 9 | l-listing-candidate-row-list-3-cards | L | listing candidate row-list (3 cards) | 3/10 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 10 | l-listing-candidate-writing-list-28-cards | L | listing candidate writing-list (28 cards) | 1/10 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 11 | l-listing-candidate-deck-panes-6-cards | L | listing candidate deck-panes (6 cards) | 1/10 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 12 | l-listing-candidate-bruce-grid-reveal-3-cards | L | listing candidate bruce-grid reveal (3 cards) | 1/10 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 13 | m-modal-trigger-lightbox-file-target-outside-dom-at-capture | M | modal trigger lightbox-file → target outside DOM at capture | 1/10 (reach 1/34) | rebuild-native | runtime | self | pending | modal-loader | none |  |
| 14 | m-modal-trigger-lightbox-zoom-target-outside-dom-at-capture | M | modal trigger lightbox-zoom → target outside DOM at capture | 1/10 (reach 1/34) | rebuild-native | runtime | self | pending | modal-loader | none |  |
| 15 | s-site-search-form-js-submitted | S | site search form → (JS-submitted) | 1/10 (reach 1/34) | index-backed | widget | self | pending | search-index-backed | none (corpus = the migrated pages; second corpora stay out) |  |
| 16 | t-unknown-third-party-host-static-cloudflareinsights-com | T | unknown third-party host static.cloudflareinsights.com | 10/10 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 17 | t-tag-manager-google-tag-manager | T | tag manager: Google Tag Manager | 10/10 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 18 | t-analytics-google-analytics-ads | T | analytics: Google Analytics / Ads | 10/10 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 19 | t-unknown-third-party-host-www-google-com | T | unknown third-party host www.google.com | 4/10 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 20 | t-unknown-third-party-host-yt3-ggpht-com | T | unknown third-party host yt3.ggpht.com | 4/10 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 21 | t-unknown-third-party-host-images-credly-com | T | unknown third-party host images.credly.com | 1/10 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 22 | t-unknown-third-party-host-learn-microsoft-com | T | unknown third-party host learn.microsoft.com | 1/10 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 23 | v-video-youtube | V | video: YouTube | 4/10 | embed-passthrough | content | self | pending | media-as-url | none (player ids are public) |  |
| 24 | x-sign-in-account-links | X | sign-in / account links | 5/10 | decided-out | — | needs-backend | pending | decided-out | auth / commerce on the new host? |  |
| 25 | spec-theme-control | M | Light / Dark / System theme control | 34/34 (reach 34/34) | rebuild-native | — | self | pending | chrome interaction + pre-paint head script | Keep the jj-theme key so returning visitors keep their choice |  |
| 26 | spec-nav-menu | M | Header Menu drawer below 1024px | 34/34 (reach 34/34) | rebuild-native | — | self | pending | chrome interaction | none |  |
| 27 | spec-ambient-art | M | Ambient canvas hero art | 4/34 (reach 4/34) | rebuild-native | — | self | pending | decorative client render | Port page-art.js as-is (signature) or replace it with a static frame; replica keeps it |  |
| 28 | spec-writing-index | L | Writing index list | 1/34 (reach 1/34) | index-backed | — | self | pending | query-index listing | Topics (aem, ai-engineering) and cover image become page metadata |  |
| 29 | spec-writing-filter | S | Writing filter and search | 1/34 (reach 1/34) | client-only | — | self | pending | client filter over an index | none |  |
| 30 | spec-article-explainers | M | Interactive article explainers and labs | 27/34 (reach 27/34) | client-only | — | self | pending | inline client compute, no network | Block variant per explainer, or a code-only widget per explainer |  |
| 31 | spec-article-rail | M | Article rail progress and current part | 28/34 (reach 28/34) | rebuild-native | — | self | pending | scroll-linked UI | none |  |
| 32 | spec-youtube | V | YouTube embeds | 19/34 (reach 19/34) | embed-passthrough | — | self | pending | player URL is the content | Use a facade everywhere for Lighthouse 100, or keep direct iframes |  |
| 33 | spec-lightbox | M | Figure zoom and open-file lightbox | 1/34 (reach 1/34) | rebuild-native | — | self | pending | modal loader | none |  |
| 34 | spec-portfolio-interactions | M | Portfolio interactions | 1/34 (reach 1/34) | rebuild-native | — | self | pending | block JS | Reveal-on-scroll must not hide content without JS (canon rule) |  |
| 35 | spec-gtag | T | Google tag (GA4 G-ZVENE6BXTJ) | 34/34 (reach 34/34) | embed-passthrough | — | needs-business-decision | scaffolded-awaiting-owner | tag manager in delayed phase | Same GA4 property for EDS hosts · Keep loading without a consent banner, as today |  |
| 36 | spec-cloudflare-analytics | T | Cloudflare Web Analytics beacon and RUM | 34/34 (reach 34/34) | embed-passthrough | — | needs-business-decision | pending | edge-injected tag | Keep Cloudflare Web Analytics beside EDS RUM, or drop it |  |
| 37 | spec-cloudflare-email-obfuscation | T | Cloudflare email obfuscation rewriting article text | 3/34 (reach 3/34) | embed-passthrough | — | needs-business-decision | pending | edge rewrite | Disable Scrape Shield email obfuscation on www (owner decision; not decided-out until the owner states it) |  |
| 38 | spec-hotlinked-badges | V | Hotlinked certification badge images | 1/34 (reach 1/34) | embed-passthrough | — | needs-business-decision | pending | third-party image | Copy badges into DA media |  |

## Triage

- **Ships autonomously (reproducibility `self`):** 16 row(s) — read-settings, client-compute, modal-loader, search-index-backed, media-as-url, chrome interaction + pre-paint head script, chrome interaction, decorative client render, query-index listing, client filter over an index, inline client compute, no network, scroll-linked UI, player URL is the content, modal loader, block JS.
- **One owner decision batch:** 20 row(s) — inspect the XHR, add a vendor row · scope of the locale trees · index-driven or editorially curated? · which tags run on the new host; property ids · Keep Cloudflare Web Analytics beside EDS RUM, or drop it · Disable Scrape Shield email obfuscation on www (owner decision; not decided-out until the owner states it).
- **Already delivered by the capture pipeline:** 0 row(s) — no work.
- **Host-bound on the target:** 0 of 0 probed API paths — the off-origin data work.

## Phases

- **spec** — 14
- **tags** — 7
- **locale wave** — 4
- **listings** — 4
- **detect** — 3
- **interactive** — 2
- **client tools** — 1
- **search** — 1
- **media** — 1
- **register** — 1
