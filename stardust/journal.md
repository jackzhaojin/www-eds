
## First page (Track A) - home delivered and gated (2026-10-25)

- Captured home (`crawl.mjs --max 1`), froze the origin baseline at 1440 and 360, cap-probe (container 1280), dynamics triage (GA4/GTM and the Cloudflare beacon are tag rows: GA4 waits for G2 per decision 9; the beacon is edge-injected).
- Bounded promotion with v3 canon (`stardust/direction.md`). No standalone prototype: v3's CSS is canon and ported, so the EDS build is the recreation, gated on the published origin.
- Blocks: hero (home), showcase (feature), cards (list), columns; header and footer from `/nav` and `/footer`. Bands are section-metadata style words. Link paragraphs move into a `.cta-slot` wrapper (blocks and default content) so the look holds in quick edit.
- Gate rounds pub1 to pub5. Fixes off the instruments: an empty metadata section (height), card links read as body (one paragraph per card), the note's accessible name (section metadata `note-label`), footer word space, two flex-item boxes. pub5: 1440 0.25% / 360 1.11%, height 0, content-diff none, chrome 100%.
- Dark theme: 0.13% / 0.93%. Lighthouse mobile performance 100 (3 runs), source 98. Editability 28/28, 0 drift.

## Article archetype (D1) - template, explainer family, gated (2026-10-25)

- Archetype: `writing/2026-09-20-aem-edge-functions-google-sign-in`, chosen because it is explainer-heavy and uses only the shared kit (video, boards, numbered code, compare, token lab, two-way switch), no per-article one-off.
- Built `templates/article` (head, two-column layout with the rail, watch rows, heading self-links, related section) and the first family blocks: figure, code, compare, switch (with code marks), lab (token), plus rail, row-list, author-box, fine-print. Importer: `stardust/scripts/import-article.mjs`. Pattern and vocabulary: `stardust/explainer-family.md`.
- Gate rounds pub1 to pub6. Fixes off the instruments: home rhythm leaking into articles, title no-break spans, rail entries as one link, group labels, code and switch box borders, current-link marking, footer place ink (R5), token clip by mask, the lab verdict's height (R6), rail thumbnails at 360 (R7). pub6: 1440 0.05% / 360 0.84%, height 0 both, content-diff 0 red and 0 nothing-lost both.
- Editability 110/110, 0 drift per block. Dark 0.01% / 4.17%. Lighthouse mobile performance 100 (source 93). Motion 14 parity, 0 missing, 0 extra.

## Site scope (Track B) - extract prep, per-page-extraction, vision-verification, brand-surface-extraction (2026-10-25)

- `crawl.mjs --pages` over the 34 sitemap URLs, medium wait, `--dynamics`: 34/34 live Playwright renders, 0 failures. The 7 project-site prefixes and `/design-systems/2026-09-13/` are absent from the sitemap and were never queued.
- Vision check (subagent, thumb.mjs): 31 ok, 1 recaptured at slow (writing, lazy covers), 2 suspect (portfolio, patterns-of-work): native `loading="lazy"` images below the crawler's 4-step scroll were never fetched. The rendered DOM holds every img tag, so parse the `.html`, not `media.imgs`, on those two.
- Census at 1440 + 360 (34 x 2), cap-probe on 7 archetypes (shell 1280; portfolio 1200, privacy prose 666 go to the register list). Current-state PRODUCT.md, DESIGN.md, DESIGN.json (18 module candidates), brand-review.html with 7 tensions.
- state.json written with `flow: replica`; types: 28 article (spec writing archetype), landing, listing x3, unique, static.

## Site scope (Track B) - spec s1-inventory to s10-knowledge, s5-real-user skipped (2026-10-25)

- Generic parser on `#main`, `stripPrefix ^(fig|xwide|wide)$|(?<=^row)-(?=list$)` so explainer figures name themselves and the Related row list is not read as a utility class. S7: 0 unmapped. S10: spec-knowledge exit 0, every rule computed.
- Catalog: 34 entries (23 new, 10 variant, 1 reuse); facts, chapters and proof-links are paragraph-level patterns the parser reads as default content, so blocks.json shows 0 for them and their reach is a signal.
- 15 open questions, all with defaults, 2 answered from the brief (parity, Cloudflare). S5 skipped: no RUM key.
- Blind rule: judged from source pages and v3 docs only; no migration file was opened.

## Site scope (Track B) - dynamics detect, classify, triage (2026-10-25)

- 24 detector rows plus 14 spec features curated into 14 features in `stardust/dynamic-features.md`: 10 self, 4 in one owner batch (GA4 on EDS hosts, Cloudflare beacon, email obfuscation, badge hotlinks). 0 decided-out.

## Site scope (Track B) - audit of the live site (2026-10-25)

- Scorecard 74/100: brand 78, hierarchy 64, conversion 74, accessibility 84, technical SEO 86, content and LLM 88, performance 50 (mobile lab TBT poor on home and portfolio canvases). 26 findings (3 P1, 13 P2, 10 P3), 13 marked register candidates. PSI hit its daily quota, so CWV are Playwright lab numbers.

## Reconcile first page - spec promoted, catalog corrected (2026-10-25)

- Promoted Track B's design spec verbatim; it agrees with v3 (palette and font stacks).
- Catalog corrections for what D1 and the home established: hero carries the proof list, cards (list), figure delivers video, fine-print for the facts line, watch rows as template-decorated default content, switch and lab (token) added. Record in `stardust/reconcile-first-page.md`.
- Approval stays Jack's (gated mode): the state rows advance on his OK.
