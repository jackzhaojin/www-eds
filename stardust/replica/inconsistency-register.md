# Inconsistency register

The only permitted design deltas of this replica run. Each entry: evidence, the minimal change, status. Jack reviews per archetype and per batch of about 5 articles (decisions 15, 16). Empty of applied entries so far: home ships as a pure replica.

| # | Where | Evidence | Minimal change | Status |
|---|---|---|---|---|
| R1 | Home, Technical Writing column: the inline link "adaptTo() 2026 Recap..." | Lighthouse `link-in-text-block` 0 on both the source (`stardust/first-page/lighthouse/source-home-mobile-1.json`) and EDS (`home-mobile-1.json`): the link is told apart by colour only. Accessibility 96 on both. | Underline inline links in body copy, as v3 already does inside `.prose` (`a { border-bottom: 1px solid var(--color-line-strong) }`). | proposed |
| R2 | Home hero note | `--color-adobe: #fa0f00` and the banner ground `#0a0a14` are hard-coded hex values outside v3 (`css/site.css`), so they do not follow the theme. | Name them as v3 tokens (an Adobe brand primitive and a banner ground) in `tokens.css` first, then use the tokens. Look unchanged. | proposed |
| R3 | Stored Dark choice on a light OS | One frame of the light canvas (luminance 244) before `scripts.js` applies `data-theme` (`stardust/.work/flash.mjs` screencast). The source's inline head script has none. Content never paints in the wrong theme (body hidden until `appear`). | Option A: accept. Option B: a tiny classic `/scripts/theme-init.js` in `head.html` (not inline; one extra blocking request; re-check Lighthouse). best-practices.md says head.html stays stock, so this is Jack's call. | needs decision |
