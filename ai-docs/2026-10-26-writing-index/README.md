# Dynamic writing index

Jack requested a separate writing index and block in the existing talks PR before review.
Use the 29 existing article documents as the indexed records. Production `/writing/` stays
static until Jack and Claude approve the content switch.

## Source and model

The article h1, published-time and description are already authored on each article. The
existing listing also has card-specific summaries, covers, topic labels, facts, talk/video
links, search keywords and title keep-together hints. Preserve those as namespaced listing
metadata on the article, keeping the source in git. Publishing that metadata lets the native
index populate the API without duplicate article records or a JSON export step.

`Writing index` is a configuration block with one Source URL, `/writing-index.json`. It
shares the existing writing-row renderer and styles through `/scripts/` and `/styles/`, and
works with the existing search/topic/year filter. It contains no static article rows.

| API field | Article source |
|---|---|
| title, headingId | h1 text and its server-generated id |
| date | published-time metadata, as an ISO date |
| summary | listing-summary; description is the fallback |
| image | listing-image, a public www media URL; og:image is the fallback |
| topics | listing-topics, with labels separated by a pipe |
| readTime, videoTime | listing-reading-time and listing-video-time display strings |
| talkUrl, talkLabel, talkNote | listing-talk-url, listing-talk-label, listing-talk-note |
| watchUrl, watchLabel | listing-watch-url and listing-watch-label |
| keywords, nowrap | listing-keywords and listing-nowrap; the latter is comma-separated |
| template, robots | Existing metadata; ineligible or noindex records are omitted by the UI |

Index pagination and CollectionPage/ItemList updates are shared utilities. Writing and talks
keep their own normalizers, source models, blocks and draft pages. The existing static writing
block and new API block share the same DOM decorator and v3 stylesheet rather than duplicating
the presentation code.

## Acceptance and review

- Preserve all 29 existing cards, text, links, covers, ordering and old anchors.
- Preserve search, topic/year filters, hash state, keyboard shortcut and reset behavior.
- Read every API page; reject unsafe URLs and distinguish empty from unavailable data.
- Generate one ItemList from the same records as the visible cards.
- Keep the general and talks index definitions unchanged when adding the writing index.
- Keep article bodies, existing SEO metadata and production hub content unchanged.
- Test the draft at 1440 and 360 and re-gate home and an article after shared-code changes.
- Record inherited footer/migration findings rather than turning them into passing gates.
- Extend PR #2 and wait for Jack and Claude. No merge, release or production hub switch.

## Execution

Use the hlx-admin-api-executor GET/SET/GET workflow with the existing cached Adobe IMS token.
Never print or store the token. Check DA copies against git before adding article metadata.
All remote operations run sequentially and are recorded under `admin/`. Only the draft is
previewed; source articles receive listing metadata needed by the live API.
