# Writing draft validation

Runtime commit: `a655e23`. Draft:
https://codex-list-seo-research--www-eds--jackzhaojin.aem.page/drafts/writing-index/.
API: https://www.jackzhaojin.com/writing-index.json.

## Functional and source checks

- All 29 native records match the original card fields, dates, order, covers and links.
- All source DA documents matched git before editing. Metadata-only proof verifies their
  article bodies and previous SEO metadata are unchanged.
- Lint and eight writing/talks unit tests pass.
- Real writing browser tests pass for all 29 cards, topic/year filters, search, reset,
  slash shortcut, URL hash state, changed API data, schema, text escaping and empty/error states.
- Browser page errors and unexpected console errors: zero.
- Both widths retain the same document overflow as production: zero at 1440 and the existing
  footer's 41px at 360. The new block does not add overflow.
- Editability: eight authored texts, seven editable, one existing widget exemption, zero
  dead or duplicated texts. Editor simulation has no drift.
- The talks browser regression passes after shared pagination/schema extraction: nine records,
  both old anchors, matching schema, empty/error states and zero errors.
- The served shared modules were compared byte-for-byte with the committed files.

Results are in `api.json`, `browser.json`, `editability.json` and `writing-index.json`.
The talks regression results remain in the talks validation folder.

## Fidelity

All pixel comparisons pass with zero height change. Full gates remain failed on the documented
production Privacy/footer differences from gh, including 41px mobile overflow; draft paths
also do not activate their canonical desktop navigation item. The existing article has two
mobile thumbnail filename findings already reconciled against production in the talks audit.

| Page | Width | Pixel difference | Height change |
|---|---:|---:|---:|
| Writing draft | 1440 | 0.01% | 0 |
| Writing draft | 360 | 0.11% | 0 |
| Home | 1440 | 0.28% | 0 |
| Home | 360 | 1.11% | 0 |
| Article | 1440 | 0.04% | 0 |
| Article | 360 | 0.07% | 0 |

All six content-presence and clip probes report zero missing/hidden headings or links and
zero clipped content. Writing has zero structural red at both widths. The complete summaries
and probe reports are saved beside this document; inherited failures are not waived.

## Production SEO

The production SEO scan reports no writing findings. Its nonzero exit is due to 14 existing
portfolio asset links returning 404, outside this change (`production-seo.txt`). All 191
JSON-LD/social image URLs checked were free of reported problems. Both production hubs remain
static; neither draft was published to live.

## Review

The same draft PR now covers talks and writing:
https://github.com/jackzhaojin/www-eds/pull/2. Await Jack and Claude before merge, code release
and the two production-content switches.
