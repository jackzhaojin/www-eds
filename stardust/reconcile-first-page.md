# RECONCILE: first page (home) against the site scope (2026-10-25)

Track B (site scope) ended 2026-10-25: 34 of 34 sitemap pages captured, spec S1 to S10 (S5 skipped, no telemetry key), dynamics triage, audit 74/100. Track A had home and the article archetype gated on the published origin.

## 1. Promote

Track B's `stardust/current/PRODUCT.md`, `DESIGN.md` and `DESIGN.json` replaced the bounded root spec verbatim. Diff against v3 canon (`design-system/v3/tokens.css`, `DESIGN.md`): every color in the promoted DESIGN.json (6) and DESIGN.md is a v3 token value; the three font stacks are v3's. No v3 doc bug or site drift found. `stardust/direction.md` rewritten.

## 2. Check

| # | Check | Result |
|---|---|---|
| 1 | Page type | confirmed: home is the spec's `landing` (unique type), article is the `writing` archetype (28 pages); the spec's rep is `/writing/2025-07-12-aem-headless-omnichannel-architecture/`, D1 gated `/writing/2026-09-20-aem-edge-functions-google-sign-in/` instead (shared kit only, no one-off; the spec rep has a board and a one-off explainer, so it is a Phase 3 sibling) |
| 2 | Blocks | corrected (catalog, this commit): hero side note is `proof-list (champion)`'s content model as the hero's second cell; home work links moved from `row-list (links)` to `cards (list)`; `video` is delivered by `figure`; `facts` is built as `fine-print` (the name stays free for v3's facts table); `chapters` rows are template-decorated default content; `switch` added; `lab (token)` added. Built and confirmed: header, footer, section-style, hero (home), showcase (feature), figure (board), code, compare, rail, row-list (related), author-box, breadcrumb (template) |
| 3 | Chrome | confirmed: one header and one footer variant across the 34 pages (`/nav`, `/footer`); current-page marking only on the exact page, as the source does; footer place ink differs on articles (register R5) |
| 4 | Dynamics | confirmed: the first page's rows (gtag + dataLayer, Cloudflare beacon, the locale false positive) are in `stardust/dynamic-features.md` (#11, #12, merged rows). GA4 (#11) is answered by README decision 9 (delayed, consent granted by default, GPC declines, 3 s after LCP), built in G2; the open part is whether aem.page / aem.live hosts send analytics (recommendation: no). Theme control, menu, ambient canvas and rail are built (rebuild-native). |
| 5 | Listings | deferred (G1/G2): the article metadata carries title, description, image, template, published-time, modified-time for the query index; the index definition is a site config change (Jack's OK). |
| 6 | Scope | confirmed: no link treats a project site or decided-out path as an EDS page; links to pages not yet migrated stay absolute to www.jackzhaojin.com until their wave (localize-links). |
| 7 | Canon | confirmed: base styles and tokens are v3's (`styles/styles.css`); breakpoints are the source's (760, 1023/1024, 1080, 479/480, 640, 900). |

## 3. Record

Gated run mode (decision 15): approval is Jack's, at the register review (decision 16). On his OK:

```bash
node stardust/scripts/stardust/state.mjs advance index --to approved --by jack --prototype https://main--www-eds--jackzhaojin.aem.live/
node stardust/scripts/stardust/state.mjs advance writing-2026-09-20-aem-edge-functions-google-sign-in --to approved --by jack --prototype https://main--www-eds--jackzhaojin.aem.live/writing/2026-09-20-aem-edge-functions-google-sign-in/
```
