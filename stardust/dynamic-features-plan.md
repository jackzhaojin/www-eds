<!-- stardust:provenance
  writtenBy: stardust:dynamics (triage, Track B site-scope)
  writtenAt: 2026-10-25T14:32:00Z
  readArtifacts: [stardust/dynamic-features.md, stardust/spec/knowledge/features.json]
  stardustVersion: 0.36.0
  note: plan only; Phase 4 (implement) and Phase 5 (verify) belong to the main thread once an EDS origin exists.
-->
# Dynamic features plan - www.jackzhaojin.com

Static first: every page works as a static page before any of these phases wires behavior.

| phase | features | deliverable | authoring contract | verification | owner decision | effort |
|---|---|---|---|---|---|---|
| D1 chrome | #1 theme-control, #2 nav-menu | head.html pre-paint script (`jj-theme`), header block tools section and drawer | nav fragment holds the 4 links; tools are code | chrome-compare against `stardust/.work/spec/chrome/header.json` at 390 and 1440; theme persists across reloads, no flash | none | S |
| D2 article runtime | #7 article-rail, #8 lightbox, #10 youtube | rail block JS, figure/frame zoom loader, video block with facade | rail rows authored (short title, optional thumbnail); video row = YouTube URL + caption | rail current-part follows scroll; facade loads the nocookie iframe on click; no iframe before interaction | facade everywhere (recommended) | M |
| D3 writing index | #4 writing-index, #5 writing-filter | `helix-query.yaml` writing index (in the code branch), writing-list dynamic block, writing-filter widget | article metadata per the listings contract | parity.json search-query checks: stardust 1, playwright 4, mcp 5, edge functions 5, caching 2 (count + top titles) | none | M |
| D4 explainers | #6 article-explainers, #3 ambient-art | explainer + lab blocks with one variant per explainer; hero canvas JS | per open question `explainer-build` | each explainer reads complete without JS; interaction replay per article at 1440 and 360 | `explainer-build` default | L (27 articles) |
| D5 portfolio | #9 portfolio-interactions | carousel, tabs (diagram deck), timeline, stats, explainer JS | adjacent blocks beside showcase (Q-IMPL-1) | carousel, deck tabs and counters replay; reveal never hides content without JS | none | M |
| D6 tags and edge | #11 gtag, #12 cloudflare-analytics, #13 email obfuscation, #14 badges | delayed.js gtag (scaffolded off until Jack confirms), Cloudflare zone notes | none | GA hit visible on the EDS host after consent of the owner; Lighthouse stays 100 | decision batch in dynamic-features.md | S |
