# Rollout streams: results as reported (main thread record)

Each stream gated its own pages on the published origin at 1440 and 360 (content-diff looks-same red / nothing-lost yellow, pixel %, height delta) and ran the editability probe. The main thread re-checks every page in the final sweep (gate-all over all pages).

## Listings (stream-listings, done)

| Page | 1440 | 360 | Editability |
|---|---|---|---|
| /writing/ | 0/0, 0.00%, 0px | 0/0, 0.08%, 0px | 198 authored, 197 editable, 0 dead, 0 dup (1 exempt: widget link) |
| /talks/ | 0/0, 0.06%, 0px | 0/0, 0.05%, 0px | 77/77, 0, 0 |
| /certifications/ | 0/0, 0.06%, 0px | 0/0, 0.20%, 0px | 140/140, 0, 0 |
| /privacy/ | 0/0, 0.00%, 0px | 0/0, 0.00%, 0px | 19/19, 0, 0 |
| /404.html | pixel 0.00%, heights equal (own captures: stitch-shot refuses the source's "Page not found" as a denial page) | same | 7/7, 0, 0 |

Built: hero variants writing, talks, certifications, page; row-list (talks); writing-list block; widgets/writing-filter; credentials block; templates listing (section style `note`) and static; 404.html. Re-gated home and the archetype clean after the hero change.

Register candidates: privacy prose column centred at 666px while the hero is left-aligned (copied); talks row "Columbus AI 2025" empty cluster leaves 24px (copied); GH-300 badge SVG over 40 KB, shipped as PNG (no visible change).

Follow-ups for the main thread: run localize-links over the whole content tree at the end (33 links in 11 files); query-index switch needs a site config and article metadata (title, summary, display date, topics, read time, video length, YouTube URL, talk link and note, cover, keywords, title-keep-together).

## Article batch A4 forks

- patterns-of-work: 1440 0/0, 0.00%, 0px; 360 0/0, 0.37%, 0px; edit 221/221. four-frontier: 1440 0/0, 0.00%, 0px; 360 0/0, 0.85%, -1px; edit 130/130. Rail thumbnails owner-accepted at 360 (9 and 7), as on the archetype.
