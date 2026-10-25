# Product

<!-- impeccable:product-schema 1 -->

## Production direction, confirmed 2026-09-14

This section supersedes conflicting hub, booking, migration and route assumptions in the earlier discovery record below. Production uses v3 on Home, Technical Writing (`/writing/`), Portfolio, Talks and Certifications. Portfolio stays one continuous page with its chapter anchors. Writing launches empty while LinkedIn articles migrate and videos receive full written companions. Topic filters added later must operate in place. No Book a talk action, Follow the work band, or AEM + AI primary navigation destination. The footer contains LinkedIn and GitHub profile links. Shared navigation and content are in the initial HTML; `js/site.js` owns Light / Dark / System and the mobile menu. No content generator or build pipeline was introduced.

The current implementation and publishing contract are in `docs/publishing-writing.md` and `docs/site-operations.md`. The review brief and 2025 article shortlist are under `ai-docs/2026-09-13-seo-geo-redesign/`. Existing templates remain noindex design references; production HTML is the current content and navigation authority. The earlier record below is retained for design lineage, not as permission to restore retired features.

Product record for www.jackzhaojin.com, written 2026-09-14 for design system v3. Scope: the whole site (home, hubs, blog and posts, portfolio, talks, certifications, about). Facts here come from the repository, the SEO site plan in `ai-docs/2026-09-13-seo-geo-redesign/`, and Jack's answers on 2026-09-14. Undecided facts are marked as such rather than filled in. This file lives beside the v3 work because impeccable resolves it from here; the content plan it refers to is `ai-docs/2026-09-13-seo-geo-redesign/content-plan-2026-09-14.md`.

## Platform

web

## Stack

Static HTML, CSS and vanilla JavaScript, pre-rendered and committed, served by GitHub Pages behind Cloudflare. No frameworks, no Jekyll, no client-side rendering of content. A committed generator script that renders pages from data and templates is allowed (site plan assumption). The only external dependency today is Font Awesome via CDN; Google Fonts are acceptable (the 2026-09-13 systems use them).

## Users

Primary: practitioners. AEM, Edge Delivery Services (EDS), DA.live and AI engineers who arrive from a Google result, an AI assistant's citation or a LinkedIn link with a specific question, and decide within one page whether this author is worth trusting and following.

Secondary, confirmed by the site plan but not designed for first: event organizers and program chairs vetting a speaker on AEM + AI, and speaking or consulting inquiries that follow from authority rather than from a pitch.

Machine audience: Google, Bing and the AI assistants (ChatGPT, Perplexity, Claude, Gemini) that read the HTML, the Markdown twins and `llms.txt` and decide whether to cite the page.

Not a target: hiring managers and prospective clients as such. They are served by the same evidence, not by pages built for them.

## Product Purpose

Jack Jin's personal site and the content home for his work. Posts publish here first; LinkedIn and a future newsletter syndicate. Videos go to YouTube as an option, but the readable write-up on this domain is the primary artifact.

The site is the destination (Jack, 2026-09-14). A reader is never sent to LinkedIn to read, watch or discuss. LinkedIn is an outbound syndication channel and a profile link, nothing more.

Migration policy (Jack, 2026-09-14): older articles migrate as they are, with only the page anatomy added. Good videos are rewritten, refreshed and brought up to date, then proposed and published as new articles with the video optional. Neither happens now; the sequencing and the video inventory are in the content plan.

Success in twelve months (Jack, 2026-09-14): the site is one of the most reputable sources for AEM + AI content and for FDE (forward deployed engineering) content, it holds his work including the portfolio, and Google and AI assistants cite it. Articles and posts that today live only on LinkedIn are converted into full write-ups here. Over time the LinkedIn and YouTube videos become long write-ups too, with the video embedded as an option, so the content can be read and can earn search traffic.

## Positioning

Hands-on and dated. Adobe Certified Master, AEM Champion 2026, Associate Director at Accenture, Columbus, Ohio. Builds AI agent systems on AEM, EDS and DA.live and ships in public: every project has a repo, a first commit, a last commit and release counts. Writes from production programs and his own repos, not from summaries of other people's work.

Direction: forward deployed engineering for AEM + AI. FDE is where Jack is heading, not a current title. The title line stays "Associate Director at Accenture. Cloud architect. Adobe Certified Master. AEM Champion 2026." FDE appears as positioning and as a content topic, not as a role claim.

Flagship topic: AEM + AI, the intersection a neighboring AEM consultant or a general AI writer could not truthfully own.

## Operating Context

- Content source: `/Users/jackjin/dev/career-blogs` holds the full post text and images (`LinkedIn2025/`, `LinkedIn2026/`), `talks/`, `portfolio/`, `accolades/` and the AEM Champion application. Posts arrive two to four a month.
- Structured data parsed from the live site on 2026-09-13: `design-systems/2026-09-13/shared/data/` (`site.json`, `posts.json`, `credentials.json`, `talks.json`). Every design system template is built only from these files.
- Target information architecture: `ai-docs/2026-09-13-seo-geo-redesign/seo-site-plan.md` (page types, listing decision, detail anatomy, agent readiness, site map) and `seo-page-blueprint.md` (per page-type slots and schema). Four topic hubs: `/aem-ai/` (flagship, curated), `/adobe-aem/`, `/ai-agents/`, `/working-with-ai/`. Collections: `/blog/`, `/videos/`, `/portfolio/`, `/talks/`, `/certifications/`. Detail pages: `/blog/{slug}/`, `/portfolio/{slug}/`, `/talks/{slug}/`, `/certifications/{slug}/`. Profile: `/about/`.
- Design system lineage: v1 is the original site (index, blogs, certifications; `css/styles.css`, first commit 2025-04-01). v2 is `/portfolio/` (`portfolio/styles.css`, first commit 2026-07-25, dark, chapter bands). v3 is this system, built for the whole site from the outputs of the 2026-09-13 round: its contract (`design-systems/2026-09-13/SPEC.md`), shared theme script and data, the eval, and one of the four candidate systems as the base with pieces from the others. v1 and v2 are not recreated retroactively.
- Reading contexts: a search result or AI citation on a phone, a LinkedIn link, and a desktop browser for the portfolio scroll.
- Operations: `docs/site-operations.md` (Cloudflare DNS, redirects and cache; GitHub Pages; GA4 property `G-ZVENE6BXTJ` on the personal "Jack Jin" account; Search Console). `scripts/check-site.sh` verifies the live site after a push.

## Capabilities and Constraints

Confirmed:

- Every content slot is in the initial HTML. JavaScript only filters, sorts, animates and switches theme. Every page reads with JavaScript disabled; reveal animations never hide content from a crawler.
- Head contract on every page: the gtag.js snippet first after the viewport meta, a canonical link, and a `sitemap.xml` entry for indexable pages. Demo and design-system pages carry `noindex` and stay out of the sitemap.
- Never delete `google57906613577fdd42.html`, the `google-site-verification` meta tag in `index.html`, or `CNAME`.
- URLs to preserve: `/`, `/blogs.html` (to 301 to `/blog/` at cutover, via Cloudflare), `/certifications.html`, `/portfolio/` with its `#ch-*` anchors, `/google57906613577fdd42.html`.
- The portfolio stays one long scroll page (Jack, 2026-09-14). v3 restyles it; it does not split it into project detail pages by default. Project detail URLs from the site plan are additive.
- Blog filtering has three dimensions: topic (ai, aem), type (technical, leadership), media (article, post, video), plus date. Hubs are real links, not JavaScript filter states.
- Agent readiness per the site plan: `robots.txt` allowing the named AI crawlers, `llms.txt` and `llms-full.txt`, a Markdown twin per page advertised with `rel="alternate"`, JSON-LD `@graph` per page with a shared Person `@id`, a real `404.html`.
- No LinkedIn as a destination: no "Discuss on LinkedIn", "Watch on LinkedIn" or "Read on LinkedIn" links, no post cards that leave the site, and no Book a talk button that resolves to LinkedIn once an email exists. LinkedIn appears only as a profile link in the footer, the author box and `sameAs`. The 2026-09-13 templates and shared data still point cards at LinkedIn because the posts live there today; v3 templates point at `/blog/{slug}/`.
- Writing rule: no em dashes or other special dash characters anywhere, including code comments and generated pages.
- Terminology: AEM (Adobe Experience Manager), EDS (Edge Delivery Services), DA.live, FDE (forward deployed engineering), "AEM + AI" with spaces around the plus.

Undecided, do not invent:

- AEM + AI hub membership per post (curated, not a facet).
- Email address, YouTube channel and Credly profile links.
- The contact route behind Book a talk until the email exists. Today it resolves to LinkedIn, which the rule above forbids as a destination.
- Whether video transcripts and chapters exist for each video; the plan assumes they will be produced.

Decided 2026-09-14 after the four-way critique:

- v3's base is Claude Fable 5.1. Astra, Kimi K3 and Google Stitch contribute named pieces (listed in the v3 README); their folders are not modified.
- Phone header: one row with the wordmark, the menu button and one primary link; the three-state theme control moves inside the menu panel; every header target is at least 44px.
- Placeholders never render as controls and never occupy the loudest slot on a page; generated text marks (kickers, brackets, counters) use the CSS alt-text syntax so screen readers do not announce them.

## Brand Commitments

- Name and wordmark: "Jack Jin", text only, no glyph or mark beside it. Site name www.jackzhaojin.com.
- Voice (from the existing site copy; edit if wrong): first person, plain, specific, dated. Facts before adjectives. Placeholders stay visible in brackets until the real value exists; nothing is invented to fill a slot.
- Binding visual constraints Jack set on 2026-09-13 and 2026-09-14, recorded here without expansion: one design system across the whole site including `/portfolio/`; light and dark palettes; light is the site default and the portfolio may default to system; a three-state Light / Dark / System control in the header, persisted in localStorage and applied before first paint; keep the portfolio's full-bleed section grounds (accent wash, hairline edges, labeled dividers, milestone band) as section separators in both themes; the container is centered at wide widths; WCAG AA contrast on every token pair in both themes.
- Assets on hand: `favicon.ico`; credential badges in `assets/` (Adobe Certified Professional, Adobe Digital Experience Developer, AI Automation Explorer, Claude Certified Architect, GitHub Copilot); `assets/blog-thumbnail.jpg`. No headshot is in the repo.

## Evidence on Hand

- 39 posts (7 articles, 13 short posts, 19 videos; topic ai 27, aem 12; type technical 22, leadership 17), 12 projects, 22 certifications, 6 talks. Parsed into `design-systems/2026-09-13/shared/data/`.
- Full post bodies and images in the career-blogs repo. Decks and talk records in `career-blogs/talks/`.
- Portfolio chapters with repo URL, license, version, stack, build method and release counts in `portfolio/index.html` (for example Anima Mesh: nine agents, 36 tags in 29 days, Apache 2.0, TypeScript on Cloudflare Workers).
- Credly links per credential on `certifications.html`. Known: the Summit 2024 link is dead and kept on purpose; AI-102 is expired with no renewal path.
- LinkedIn engagement per post exists in career-blogs and may be cited as numbers, not as testimonials.
- Absent, must not be fabricated: transcripts, chapters and watch times for videos; testimonials; client names; project metrics not derivable from git; a headshot; the three missing links above.

## Product Principles

1. Publish the answer, not the link. Every page carries its full content in HTML so a practitioner or an assistant can read, quote and cite it without leaving. The site is the destination; nothing routes the reader to LinkedIn.
2. Real, dated facts only. Names, dates, counts, repos and credentials come from the source data; a missing value stays a visible placeholder.
3. One system, every page. Home, hubs, collections, posts, the portfolio scroll, talks, certifications and about share the same tokens, components and theme control.
4. Read first, watch optional. A video post is a write-up with the video embedded and a plain watch link, never an embed with a caption.
5. Trust before pitch. Depth and evidence for practitioners come first; speaking and FDE opportunities follow from that reputation.

## Accessibility & Inclusion

WCAG AA contrast in both themes on every semantic token pair (gated by the eval). Keyboard-operable header, filters and theme control with visible focus. Content and navigation work with JavaScript disabled. `prefers-reduced-motion` is honored and no animation withholds content. Tables have headers; every image and diagram has descriptive alt text; every embed has a plain link.
