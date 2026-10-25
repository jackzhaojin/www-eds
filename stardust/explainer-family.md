# Explainer family: the pattern and its variant vocabulary

Set by D1 (the article archetype, `writing/2026-09-20-aem-edge-functions-google-sign-in`, gated 2026-10-25). Phase 2 streams copy these rules; D2 adds blocks and words through the catalog first.

## How a family block takes content

- **Rows by role, classified by content.** A block reads its rows and cells by what they hold (a heading, a picture, a code block, a list, a link paragraph), never by index alone. Where order carries meaning, the JSDoc says so (for example `lab (token)`: the scenarios list is in the engine's order).
- **Move, never rebuild (EW1).** Every authored element is moved into a role wrapper (`div.<block>-<role>`). Wrappers carry the layout classes; CSS styles the authored element as a descendant (`.code .code-bar p`), never through a class on it or a `>` / positional selector on the path to it (EW2).
- **Classes a block adds to authored lists or anchors die in quick edit.** Style lists through their wrapper (`.lab .lab-checks li`), not `ol.lab-gates`.
- **Link paragraphs go into a `.cta-slot` wrapper.** The text-link look keys off the wrapper and the authored marks (`.cta-slot a:not(.button, strong a, em a)`), so it holds in quick edit. Default content does the same (`scripts.js` `decorateDefaultCtas`).
- **Hidden metadata hides through a wrapper**, never the `hidden` attribute on the authored element (the editor shows it again): the video source link (`.figure-source`), code marks (`.switch-marks`), the switch name (`.switch-name`), the lab's no-JavaScript verdict (`.lab-static`). Declare each with `@ew-exempt` in the JSDoc.
- **Presentation refinements keep the text.** Line numbers, syntax colors, code marks, console lines, title no-break spans and byline `<time>` wrap existing text; `textContent` is unchanged. Line spans stay inline (their own newlines break them), and line breaks stay between block spans, so the editor swap measures no drift.
- **Interactive hosts are not `<button>` (EW7).** A tab, radio option or chip hosts its authored paragraph or list item in a focusable element with the right role (`div[role=tab]`, `div[role=radio]`, `li[role=radio]`), with click and keyboard handlers.
- **One link per card.** A card or rail entry that is one link on the source is authored as one paragraph (bold title or label, a line break, then the rest), so the whole entry reads as one link; several block paragraphs inside a link read as a card and lose the link in content-diff.
- **Dynamic content keeps its final size.** A box that changes as an explainer runs reserves its final height when decorated (the lab verdict), so nothing shifts while it runs. The gate's build capture has no settle pass; a growing box is a layout shift for readers too.
- **Engines are variant words.** Behavior that a variant switches on (`lab (token)`) is the only reason a block reads its classes in `decorate()`; CSS-only variants need no JavaScript.

## Variant vocabulary (closed sets)

| Block | Words | Default | Meaning, mapped to v3 |
|---|---|---|---|
| hero | home | home | The home introduction band: display title with the ambient art space, positioning line, summary, actions, side note (v3 page title, positioning, buttons; css/site.css home intro). |
| showcase | feature | feature | Text beside a framed figure, 1fr / 1.2fr (v3 showcase and frame; the home's selected work). |
| cards | list | list | An open row of linked items under a strong rule (the home's selected work links). |
| columns | (none) | | Two to four even columns. |
| figure | board | board | A diagram or screenshot on a white ground with a hairline. A YouTube link makes it a video (inferred, no word). |
| code | (none) | | Night-ground excerpt, bar with file label and source link, numbered and colored lines. |
| compare | (none) | | Tabs over stacked screenshots. |
| switch | (none) | | Two or more modes behind a radio switch; code marks `mark`, `add`, `note` color runs of a mode's code. |
| lab | token | token | The token lab engine (Web Crypto RS256, the four checks of `src/lib/google-token.js`). |
| rail | (none) | | The article outline: thumbnails, part labels, the current part, reading progress. |
| row-list | (none) | | v3 row list: kind, title, note. |
| author-box | (none) | | v3 author box. |
| fine-print | (none) | | The article-facts line. |

Section-metadata style words: `plain` (default), `alt`, `tint`, `inverse` for bands; `related` closes an article column. Section metadata `id` anchors a section (`#part-1`, `#video`); `note-label` names the hero's side note for assistive tech.

## Authoring shapes

- **figure**: one cell, an image paragraph (or a YouTube link paragraph, its text is the player title) then caption paragraphs.
- **code**: a bar row (label paragraph naming `lines N to M`, then the source link paragraph), then a row with the code block.
- **compare**: one row per pane: tab label | image paragraph and caption.
- **switch**: optional first single-cell row naming the switch; one row per mode: label | column | column; a last single-cell row is the caption. A column: label paragraph, code block, optional `mark:` / `add:` / `note:` list, label paragraph, image paragraph, console paragraph (line breaks = error lines, none = passing note).
- **lab (token)**: a bar row (label, source link), then left | right: left = scenarios list, label, token paragraph, label, decoded JSON code block; right = keys label, keys row (inline code: `kid`, the key id in bold, the modulus), keys note, the checks list (bold title, then the note), the no-JavaScript verdict.
- **rail**: one row per entry: thumbnail | one paragraph (bold part label, line break, the link with the short title and the part's `#id`); a last single-cell row holds the closing links.
- **row-list**: kind | title | note per row. **author-box**: initials | name, role, links paragraph.

## Article template conventions (`templates/article/`)

- The first section is the head: an ordered list (breadcrumb, last item is the page), the h1, the byline (`By ...`, dates become `<time>`), the summary.
- One section per part, with section metadata `id`. A paragraph starting "Watch this part" with video links is a watch row. Every part h2 gets a `#` self link.
- The rail block's section moves whole into the right rail, so it still loads with the sections.

## Gate lessons (D1)

- A link that holds two block paragraphs reads as a card in content-diff: no CTA, two body items. Keep one paragraph per link.
- Where the source's link is a flex item (a cluster of actions, a bar), make the authored paragraph a flex container so the link keeps the same box.
- The home rhythm (`main > .section > .default-content-wrapper p`) is for band sections only; templates set their own.
- Lazy images without width and height on the source move its layout as they load; measure with a scroll pass.
- Hidden content that the probe cannot pixel-sign (images in a closed `<details>`) falls back to file names, which DA rehosting changes: record an owner acceptance in `stardust/replica/accepted.json` with the evidence, never a blanket one.
