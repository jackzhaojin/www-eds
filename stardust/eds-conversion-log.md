# EDS conversion log

## Decode tiers

| Block | Tier | Why |
|---|---|---|
| hero (home) | template-slotted | Fixed composition: title row, positioning, summary, actions; side note. |
| showcase (feature) | template-slotted | Text column beside a framed figure. |
| cards (list) | reconstructive | Repeat group, one card per row. |
| columns | template-slotted | Role wrappers per authored element. |
| figure (board) | template-slotted | Media then caption. |
| code | template-slotted | Bar row, then the code block. |
| compare | reconstructive | One pane per row. |
| switch | reconstructive | One mode per row, single-cell row = caption. |
| lab (token) | template-slotted | Bar row, then the two columns classified by content. |
| rail | reconstructive | One entry per row, single-cell row = closing links. |
| row-list | reconstructive | One item per row. |
| author-box | template-slotted | Avatar, then name, role, links. |
| fine-print | template-slotted | Paragraphs. |

## Content-model lint (davids-model-lint) justifications

Article `writing/2026-09-20-aem-edge-functions-google-sign-in` (2026-10-25):

- 🔴 D15 "code visible as text" (`&lt;main…`) and "inline-script text" (`try {…`): false positives. This is a technical article: the code is the editorial content, authored inside `<pre><code>` and inline `<code>`, verbatim from the source. Nothing was scraped from a `<script>`.
- 🟡 D1 single-cell `figure` and `fine-print`: genuine components. `figure` pairs one image or video with its caption and carries the board look; `fine-print` is the source's article-facts line (small, faint).
- 🟡 D3 `lab` and `switch` with differing cell counts: by design. `lab` is a one-cell bar row then a two-column row; `switch` uses a one-cell row for its caption.
