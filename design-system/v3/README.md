# Design system v3

## Production integration: 2026-09-14

All main public pages now consume this system's tokens, base styles and components. Production compositions are in `css/site.css`; portfolio layouts bind to v3 semantic tokens. Shared theme/navigation behavior is in `js/site.js`. The canonical sections are Technical Writing, Portfolio, Talks and Certifications; Home is reached through the wordmark. Writing is intentionally empty during migration. Old `.html` addresses use the new layout with new canonical collection URLs. No deployment was performed as part of this integration.

Production navigation and publishing requirements supersede the earlier roadmap below: no booking action, Follow the work band, mandatory topic hubs or content generator. See `docs/publishing-writing.md`. The three templates here remain historical noindex design references; use production pages for the current head, header and footer.

## What this is

The design system for the whole of www.jackzhaojin.com: home, the four topic hubs, blog and posts, the portfolio scroll, talks, certifications and about. Version v3 0.1.0, built 2026-09-14 from the Claude Fable 5.1 candidate of the 2026-09-13 round after a four-way critique, with named pieces from Astra, Kimi K3 and Google Stitch. Light default, dark variant, one set of semantic tokens.

Lineage:

| Version | What it is | Where it lives | Status |
|---|---|---|---|
| v1 | The original site: home, blogs and certifications pages with one stylesheet and Font Awesome | `index.html`, `blogs.html`, `certifications.html`, `css/styles.css`, `css/blogs.css` (first commit 2025-04-01) | Live, to be replaced page by page |
| v2 | The portfolio: a dark, long-scroll project log with full-bleed chapter bands and its own tokens | `portfolio/index.html`, `portfolio/styles.css` (first commit 2026-07-25) | Live, to be restyled in place |
| v3 | One system for every page, light and dark, built from the 2026-09-13 round | this folder | Built, in review |

v1 and v2 are not recreated as design system folders. They are named here so v3's decisions can be traced back to them: v1 is the URL set and the content to preserve, v2 is the visual idea to keep (section grounds, dated evidence, one continuous scroll).

Product truth for the build is in [PRODUCT.md](PRODUCT.md), written with `/impeccable init` on 2026-09-14. Planning stays out of this folder: the content migration plan is [ai-docs/2026-09-13-seo-geo-redesign/content-plan-2026-09-14.md](../../ai-docs/2026-09-13-seo-geo-redesign/content-plan-2026-09-14.md). Visual decisions are made in the code and recorded in `DESIGN.md`.

## Identity

Editorial field notes, continuous with the v2 portfolio. Playfair Display carries headings and the wordmark; Inter carries body copy; JetBrains Mono carries labels, bylines, chips, buttons and nav. Warm paper in light, near-black in dark, a lavender accent, hairline borders, surfaces that step by tone rather than shadow. Every section is a full-bleed band with its own ground: plain, alt, a tint wash keyed to the section's topic, or inverse. Section headings are phrased as the reader's questions. Evidence is rendered as evidence: facts tables with a visible caption, a proof list in the hero, dated rows.

What v3 took from the other three candidates:

- Astra: question-shaped section headings (each section head is a question a practitioner or an assistant would ask), the inverse feature panel as the proof block, status chips on talk rows.
- Kimi K3: the "Key facts" caption and row-header treatment, the ruled grid that makes a row of cards one object, whole-card hit areas on hub cards.
- Google Stitch: the flagship card border with its status chip, the header that stays on one row at every width.
- Left behind: Stitch's inverse band alias round trip (it painted wrong intermittently in Chromium), Kimi's generated marks without alt-text syntax, section numbers, the three-restatement hero.

## Files

```
v3/
  PRODUCT.md          product truth (impeccable init)
  DESIGN.md           visual system record, written from the built code (impeccable document)
  README.md
  index.html          documentation site with stories per component and state
  tokens.css  tokens.json  base.css  components.css  scripts.js
  shared/             theme.js and data/*.json, copied from 2026-09-13/shared
  templates/          home.html  post.html  blog.html
  eval/               static-check.py, browser-check.js, render.py, results
```

Templates for the other page types in the site plan (about, hub, collection, project, talk, credential) are built by the content pipeline from these three; see the roadmap at the end.

## How to use

Set the default theme on the root element, copy the pre-paint snippet into the head before any stylesheet, load `tokens.css`, `base.css`, `components.css` in that order, and load `shared/theme.js` deferred. Every page carries the gtag snippet first after the viewport meta, a canonical link, and `noindex` while it is a demo. The docs site at [index.html](index.html) shows every component with light and dark stories and its markup.

## Tokens

Three tiers in `tokens.css` and `tokens.json` (W3C Design Tokens format): primitives (palette, faces, raw sizes), semantic tokens (color, type, space, layout, shape, motion), component tokens in `components.css`. Light is the default; `[data-theme="dark"]` and the OS preference under the system choice supply the dark set. Band tint strengths are per theme (9/5/4 percent light, 7/4/3 dark). v3 adds `--target-min` (44px) and `--proof-label`.

Project accents (v3 0.2.0): the portfolio colored each chapter with its own accent. Four of those already are topic colors (lavender is AEM + AI, coral is AI Agents, gold is Working with AI, steel blue is Adobe AEM and EDS). The other six are now primitives with a light and a dark value (cyan, amber, leaf, bronze, mint, rose; the light values pass AA on paper) and semantic tokens `--color-project-cyan` through `--color-project-rose`, meant for a chapter's `--band-accent`. `--color-diagram-ground` is paper in both themes, for light diagram artwork.

Inverse surfaces (the inverse band and the inverse panel) set every semantic token again, per theme, straight from primitives. No token inside refers to a token outside, so there is no alias round trip to resolve.

## Components

Everything in the 2026-09-13 contract (skip link, header, theme control, breadcrumb, page head, kicker, button, chip, card, facts table, data table, counts, row list, FAQ, filter bar, pagination, embed, chapters, transcript, author box, callout, section band, divider, CTA band, footer, icons) plus:

| Component | Class | What changed in v3 |
|---|---|---|
| Site header | `.site-header`, `.site-nav__tools` | One row at every width, sticky. Below 1024px the theme control and the primary button fold into the menu with the links; 44px targets. The toggle text swaps Menu / Close by CSS. |
| Proof list | `.proof` | New. Dated facts from shared data in the home hero. |
| Linked card | `.card--link` | New. The title's link stretches over the card; focus draws on the card. |
| Hub card | `.card--hub`, `.card__label`, `[data-flagship]` | Topic label with color dot, a question as the title, counts without facet vocabulary, a flagship border and chip. |
| Ruled grid | `.grid--rules` | New. Zero gap, shared hairlines, one object. |
| Inverse panel | `.panel--inverse` | New. The featured project's proof block. |
| Status chip | `.chip--status[data-status="flagship|upcoming|delivered"]` | Three new states. |
| Row list | `.row-list--status` | A status column. |
| CTA band | `.cta-band__contact`, `.cta-band__profiles` | The closing "Follow the work" band with the booking line as text. |
| Facts table | `.facts caption` | The caption is visible ("Key facts"). |

Extracted from the v2 portfolio page on 2026-09-14 (v3 0.2.0), CSS only, so the portfolio scroll, project pages and posts can share them. Page scripts may animate or switch them; every one reads complete without JavaScript.

| Component | Class | From the portfolio |
|---|---|---|
| Showcase | `.showcase`, `--flip`, `--wide`, `__text`, `__meta`, `__lead`, `__media` | The story block (25 on the page). Text first in the markup; the meta line sits under the title. |
| Frame | `.frame`, `--diagram`, `--portrait` | The bordered figure with a mono caption (12). The diagram variant keeps a paper ground in both themes. |
| Proof links | `.proof-links`, `.link--repo`, `.link--post`, `.link--video`, `.link--live` | The typed link row (17 rows, 48 links). Icons are CSS masks. |
| Stat chips | `.stat-chips`, `.stat`, `--block`, `--accent` | The stats (18) and counters (11). |
| Chapter head | `.chapter-head`, `--flagship`, `__num`, `__body`, `__meta`, `.method-line`, `.thesis`, `.arc` | The chapter opening (11). The numeral is decorative; the date moves under the title. |
| Timeline | `.timeline`, `__era`, `__item`, `__version`, `__body`, `__date` | The release ladder (9 rungs). |
| Tool card | `.card--tool` | The workbench card (7), a card that is itself a link. |

Left on the page, not in the system: the tabbed diagram deck and the glossary chips (one instance each, switched by script), the projects-over-time chart, the year rail and the scroll progress bar, the reveal animation. They stay page-level in `portfolio/script.js` and `portfolio/styles.css` when the page moves to v3.

## Theming

Three-state Light / Dark / System control, persisted in `localStorage` under `jj-theme`, applied before first paint by the head snippet; `shared/theme.js` keeps the control and the OS preference in sync and handles the menu toggle. Light is the default on every page here; the portfolio may default to system when v3 is applied to it.

## Templates

- [templates/home.html](templates/home.html): hero with the introduction and the proof list, "Start with AEM + AI" as the primary action; four question-led hub cards on a ruled grid (tint band); latest three posts (alt); the featured project in an inverse panel (tint with dots); credentials strip (plain); talks with status chips (tint); the "Follow the work" band with the booking line (inverse).
- [templates/post.html](templates/post.html): the Stardust video post with a visible "Key facts" caption, embed with a plain YouTube link placeholder, chapters, body, transcript, FAQ, related rows and the author box in an alt band. No "Discuss on LinkedIn".
- [templates/blog.html](templates/blog.html): all 39 posts newest first with the filter bar and query-string state, counts by facet, FAQ.

Post cards and related rows still point at LinkedIn URLs because the posts live there today; when the content pipeline publishes them here, every card points at `/blog/{slug}/`.

## Accessibility

WCAG AA on every semantic pair in both themes and inside inverse surfaces (measured by the eval). One H1 per page, headings in order, landmarks named. Keyboard: skip link, visible 2px focus ring, focus drawn on linked cards, the menu toggle with `aria-expanded`. Touch: 44px minimum on the wordmark, the toggle, menu links, text links (through padding), footer links, buttons in the open menu. Generated text (breadcrumb slashes, step counters) uses the CSS alt-text syntax so screen readers do not announce it. Every page reads with JavaScript disabled; `prefers-reduced-motion` is honored.

## Deviations

From the 2026-09-13 contract and the Claude Fable 5.1 base:

- Section number kickers are gone. Headings carry their own weight; the kicker class stays for card meta and labels that carry information.
- The hub card's description is the question in its title; the hub description moved to the hub page. Counts drop the facet vocabulary ("12 posts and videos").
- The flagship hub shows no count. Its curated membership is undecided, and a placeholder does not belong in the loudest slot.
- Talk rows are not links. The delivered talks used to link to certifications.html and one LinkedIn post; the section link now goes to the talk record, and rows become links when a talks page exists.
- The featured project's diagram is gone; the facts table is the evidence.
- "Book a talk" links to the contact band; the booking route is a text line with the email placeholder. Nothing routes to LinkedIn except profile links.
- `.text-link` grows its hit area with padding and a negative margin; the visible line is unchanged.
- 2026-09-14: post cards and related rows still open the LinkedIn copies, because the posts live there today and no `/blog/{slug}/` page exists yet. The content plan under `ai-docs/` schedules the move; when the pipeline publishes a post here, its card points at the on-site URL and the LinkedIn URL becomes an "Also on" fact. Until then the blog intro says so in one sentence.
- 2026-09-14: the AEM + AI set is the six posts the 2026-09-13 build marked as provisional (`data-hubs="aem-ai"` in the blog template). The home card says "6 posts, provisional set" and the blog shows a note while that topic is active. Membership per post is still Jack's call (PRODUCT.md, undecided).
- 2026-09-14: the nav item that pointed at the contact band is labelled "Contact" until an about page exists; "Talk record" names the certifications page it opens.
- 2026-09-14: the phone header row is wordmark, "Book a talk" and the Menu toggle, as decided in PRODUCT.md; the menu holds the links and the theme control at 44px. Card meta lines (format chip and date, hub label) sit under the card title, not above it, so no label acts as an eyebrow.

## Sources

- Base: `design-systems/2026-09-13/claude-fable-5-1/` and its README (fidelity notes against the Claude Design canvas).
- Contract: `design-systems/2026-09-13/SPEC.md`.
- Critique: `.impeccable/critique/` snapshots of 2026-09-14 for all four candidates (untracked).
- Product record: [PRODUCT.md](PRODUCT.md). Content plan: `ai-docs/2026-09-13-seo-geo-redesign/content-plan-2026-09-14.md`.
- Data: `shared/data/*.json`, parsed from the live site on 2026-09-13.

## Status

- 2026-09-14: folder created. `PRODUCT.md` written; the content plan is under `ai-docs/`.
- 2026-09-14, later: four-way critique done and the base chosen (Claude Fable 5.1).
- 2026-09-14, later that night: v3 0.2.0. Seven components and six project accents extracted from the v2 portfolio page (see Components); the portfolio page itself is not migrated yet, that is roadmap step 6.
- 2026-09-14, night: v3 0.1.0 built. Every shared defect from the critique fixed once here: the hero proves instead of pitching, pages end on "Follow the work" with no empty ground, the header is one row with 44px targets, data vocabulary is out of the copy, placeholders never render as controls. A finish review found ten items; all were applied or recorded above as deviations. `DESIGN.md` written from the shipped code. Eval results in [eval/results.md](eval/results.md).

## Roadmap

How the rest of the site moves to v3. The order is chosen for search and AI citation: the citable units ship first, each one complete, at its final URL, and the old URLs redirect only after the new ones exist.

1. **Pick the base.** Done 2026-09-14.
2. **Build v3 here.** Done 2026-09-14 for the system and the three templates. Remaining: templates for about, hub, collection, project, talk and credential pages, built by the content pipeline from these three.
3. **Build the content pipeline.** A committed Node script (no framework) reads Markdown with front matter derived from career-blogs and the shared data, and renders pre-rendered HTML through the v3 templates. Each post gets its answer block, facts table, FAQ, schema, canonical and sitemap entry from front matter. Which posts move first, which migrate as they are and which are rewritten is in the content plan under `ai-docs/`.
4. **Ship the content home first.** `/blog/` and `/blog/{slug}/` for every converted post, the four hubs with their curated intros, `/about/` with the speaker facts, `/talks/`. Then `robots.txt` with the named AI crawlers allowed, `llms.txt` and `llms-full.txt`, a real `404.html`, `sitemap.xml` with lastmod. Add every new indexable page to `PAGES` in `scripts/check-site.sh`.
5. **Cut over the v1 pages.** Rebuild `/` on v3 with the hub navigation, move certifications to `/certifications/` and redirect `/blogs.html` to `/blog/` with Cloudflare 301s, keeping `/certifications.html` reachable until Search Console shows the new URLs indexed.
6. **Restyle the portfolio in place.** `/portfolio/` keeps its single long scroll and its `#ch-*` anchors, switches to v3 tokens and components, and stops hiding content behind reveal animations. Project detail pages under `/portfolio/{slug}/` come after, if at all.
7. **Measure and iterate.** Search Console and Bing Webmaster Tools for indexing and queries, GA4 for reading behaviour, `npx is-agentic www.jackzhaojin.com` before and after, and a check of what ChatGPT and Perplexity cite for the top ten target queries in the site plan. Adjust titles, answer blocks and hub intros from that data.

Open inputs that block specific steps: the AEM + AI hub membership per post (step 4), the email, YouTube and Credly links (steps 2 and 4), and transcripts for the video write-ups (step 3).
