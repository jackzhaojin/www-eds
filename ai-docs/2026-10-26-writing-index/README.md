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

## Edge rendering and generated JSON-LD (Claude's review, 2026-10-26)

Claude's review found that the drafts' served HTML had no rows and no ItemList: 0 article
links on the writing draft against 29 on www, and the same for talks. Google renders
JavaScript, but most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) and agents don't, so the
switch would have emptied both hubs for them. Jack, on the fix: no manual data entry, JSON-LD
"code-generated, not authored", and an authoring experience he can demo; then, asked where
the code should render, "Edge Worker".

- **The hub is authored as one block with a Source row**, and no `json-ld` metadata. Both
  drafts were cleaned and previewed that way.
- **One generator, two places.** `scripts/listing-cells.js` holds the rows as data (the cells
  an author would write); `writingRows`/`talkRows` build them from the index records, and
  `collectionGraph` (`scripts/collection-schema.js`) builds the page's whole graph: Person,
  WebSite, CollectionPage, BreadcrumbList and the ItemList of the visible rows. The edge
  Worker serves them as HTML (`edge/src/listings.mjs`); on preview hosts the browser builds
  them (`fillFromIndex`, `scripts/query-index.js`). The blocks then decorate them with the
  existing row code, so a generated row and an authored row render the same.
- **Checked against www:** run over the real drafts, the edge render gives the same 29
  writing rows and 9 talk rows as www serves today (text, links, cover media, heading ids and
  cell structure; only whitespace differs), and one graph per page.
- **Not covered:** the Markdown copy (`index.md`) still shows only the Source row.
- **Order of the switch:** the Worker ships with the release (a Cloudflare deploy, Jack's
  call); only then does each production hub drop its rows and `json-ld` for the Source row.

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
