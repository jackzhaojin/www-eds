# The Events errors in Search Console (2026-10-30)

Issue [#9](https://github.com/jackzhaojin/www-eds/issues/9): Search Console's 2026-10-28 email reported 10 Events structured data issues for www, critical for missing `location` and `startDate`, non-critical for missing `eventStatus`, `offers`, `organizer`, `endDate` and `description`. The email named no URLs.

## Does it still happen (yes, before this fix)

The talk pages the issue pointed at (`scripts/page-schema.js`, v1.1.1 to v1.2.2) are gone since v1.3.0 and their URLs answer 301. But `/talks/` still writes an Event per talk in the browser (`scripts/talks-list.js`), and every one carried the same nested `superEvent`, an Event with only a name.

Google's Rich Results Test on `https://www.jackzhaojin.com/talks/` (live URL, rendered, 2026-10-30 14:16 ET):

| Items | Result |
|---|---|
| Events | 18 detected, some invalid |
| the 9 talks | valid, 6 non-critical each: `organizer`, `eventStatus`, `endDate`, `image`, `offers`, `address` (in `location`) |
| the 9 `superEvent`s (adaptTo() 2026 twice, AI Tinkerers Columbus twice, Columbus AI Week 2026 twice, Columbus AI Week 2025, Denison University CS 271, Adobe Summit 2024) | invalid, 2 critical each (`location`, `startDate`) and 7 non-critical (the email's list, plus `image`) |
| Breadcrumbs, Articles | valid |

So the critical errors are the name-only `superEvent`s, the same pattern the talk pages had. The partial dates (`2026-09`, `2026-04`, `2025-09`) and the city-only places pass.

## The fix

`talkSchemaItems` no longer nests the event a talk was part of: the row gives the conference no date or place of its own, and copying the talk's would be wrong for a multi-day conference. A row without a date or a place is now left out of the JSON-LD (it still shows on the page), so an authoring gap can't bring the error back. Every other part of the graph is unchanged.

The talks' remaining warnings are optional, and the content can't support them honestly: no organizer, ticket offers, end times or street addresses are on the page. Google's Event experience is for upcoming events the public can book, one per page; `/talks/` is a list of past talks, so it isn't trying to qualify. That rationale is in `content/README.md` ("Talks").

## Checked

- Unit tests 21 of 21 (`test/talks-list.test.mjs` walks the whole hub graph: every Event node has a name, a date and a place, and none is nested); Worker tests 23 of 23; `npm run lint` clean.
- Locally (`aem-up-local`, `local-preview.mjs /talks/`): 9 rows, one graph, 9 Event nodes, no `superEvent`.
- That graph (with www's canonical) in the Rich Results Test's code mode: 12 valid items, 0 invalid. Events 9 valid with non-critical issues, Breadcrumbs 1, Articles 2.

## What's left (Jack)

- Search Console's Events report (signed in): record the affected URLs and crawl dates, and once this is on www, **Validate fix**.
- Re-run the Rich Results Test on the live `/talks/` after the merge, then snapshot www into the archive as usual.
