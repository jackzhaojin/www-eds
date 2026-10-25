<!-- stardust:provenance
  writtenBy: stardust:extract
  writtenAt: 2026-10-25T14:00:00Z
  track: site-scope
  readArtifacts:
    - stardust/current/pages/*.json (34 live Playwright captures)
    - stardust/current/_brand-extraction.json
    - stardust/current/_computed-styles.json
    - /Users/jackjin/dev/jackzhaojin/jackzhaojin.github.io/design-systems/v3/PRODUCT.md (canon, read for vocabulary only)
  synthesizedInputs: []
  stardustVersion: 0.36.0
  note: descriptive snapshot of the live site, not the target. The target PRODUCT.md at the project root belongs to the main thread.
-->
# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

_provenance: inferred - from the captured copy (home lede, bylines, the four nav pillars) and the audience the writing addresses._

- Adobe Experience Manager and Edge Delivery Services practitioners (architects, developers, delivery leads) who read the technical writing to learn how something was built and what it cost.
- Event organizers, Adobe and Accenture peers, and prospective clients who check talks, recognition and certifications before inviting or hiring.
- Readers arriving from search or AI answers on one article, who need the byline, date, read time and related links to place it.

## Product Purpose

A personal professional site for Jack Jin, an Adobe Experience Manager Champion (class of 2026-2027), AEM Rockstar winner at Adobe Summit 2024 and Adobe Certified Master, Associate Director in Accenture's Adobe Business Group in Columbus, Ohio. It publishes long-form technical writing on AEM, Edge Delivery Services and AI agents (28 articles in the sitemap), a portfolio scroll of projects (Anima Mesh, AEM Rockstar 2024, The Content Factory, AI Builder Kit, Built with Bruce), a talk history and a certification wall. Success reads as: a visitor can verify every claim through a linked source (issuer pages, repos, videos) and can explore the work itself.

## Positioning

The home lede states it: "Adobe Experience Manager. AI agents. Work you can explore." The claim a neighbor could not copy is evidence density: dated, linked proof (Adobe announcement links, repo links, YouTube recordings, issuer verification) next to every credential, and articles that show the build (code, diagrams, measured results) rather than summarize it.

## Capabilities and Constraints

- Static HTML on GitHub Pages behind Cloudflare; one shared design system (`/design-systems/v3/` tokens, base, components CSS) plus `/css/site.css` and small page scripts (`/js/site.js`, `/js/page-art.js`, `/portfolio/script.js`).
- Light, Dark and System theme control in the header on every page (persisted client-side).
- One same-site form: the writing index search (`GET /writing/?q=`), client-side filter over 28 rows.
- Third-party surface: Google Tag Manager / gtag (`dataLayer`), Cloudflare Web Analytics beacon and RUM endpoint, YouTube nocookie embeds on 19 pages (one behind a click-to-load facade).
- No accounts, no commerce, no CMS today. Seven GitHub Pages project sites share the host and stay outside this migration.

## Brand Commitments

- Register: `brand` (editorial personal site; not a product UI). Basis: `_brand-extraction.json#register`.
- Name and wordmark: "Jack Jin" as a Playfair Display text wordmark; no image logo.
- Voice: first person, plain and specific, numbered article sections with anchor links, bylines carrying date, updated date, read time and video length. No marketing superlatives.
- Observed anti-references: no stock photography, no full-bleed photo heroes, no shadows for depth, no icon fonts.
- Design system v3 ("Editorial Field Notes") is canon; its own PRODUCT.md sits at `jackzhaojin.github.io/design-systems/v3/PRODUCT.md`.

## Evidence on Hand

- 34 live captures: `stardust/current/pages/<slug>.json` + `.html` (rendered DOM), full-page screenshots under `stardust/current/assets/screenshots/`.
- Brand surface: `stardust/current/_brand-extraction.json`; computed-style census at 1440 and 360: `stardust/current/_computed-styles.json`.
- Favicon: `stardust/current/assets/favicon.ico`. No logo file exists (text wordmark).
- Real assets referenced by URL, not downloaded: AEM Champion badge (`/assets/aem-champion-2026-2027.webp`), portfolio diagrams and screenshots under `/portfolio/assets/`, 22 certification badges, article figures, YouTube thumbnails.
- Absences future work must not fabricate: testimonials, client logos, a contact form, a booking address.

## Product Principles

_provenance: inferred - from repeated patterns across the 34 captures._

1. Every claim carries its proof: a date, an issuer, a repo or a recording.
2. The writing is the product; layout serves a single reading column with a section rail.
3. One system across every page: shared header, footer, breadcrumb, byline, related list and author box.
4. Content reads complete without JavaScript; scripts animate or switch, they never withhold.

## Accessibility & Inclusion

Observed on the live site: skip link, 44px minimum targets in header and nav, `prefers-reduced-motion` honored by the ambient hero canvas, aria-labelled nav regions (Primary, Breadcrumb, Profile links), and a theme control as a labelled group. The canon targets WCAG AA for every token pair in both themes.
