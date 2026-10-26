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
