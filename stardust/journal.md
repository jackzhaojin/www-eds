
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
