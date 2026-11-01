# Two brands, every block (v1.4.0, 2026-10-31)

Jack, setting the goal for the Sites and AI webinar page: "let's have a minor version for the Adobe themes. So we have my theme and Adobe theme. Just keep the font size. Let's not create a new design system or anything, but let's have the Adobe theme and then be switchable via page properties. I think that's best practice." Then, while it was being built: "This whole retheming thing is really important. We do it correctly. Look up best practices to do this. Ideally, all the blocks should support two themes ... the switch capability, ideally all pages and all blocks, everything should support both themes." And: "Focus on doing it correctly and not quickly, this is a demo site of high quality."

The people's explanation is [docs/theming.md](../../docs/theming.md). This is the build record.

## What the research said

- **The EDS way to switch is the `theme` metadata**, on a page's metadata block or for a folder or the whole site through the bulk metadata sheet (a `theme` column; the page's own value wins). The boilerplate's `decorateTemplateAndTheme()` already turns it into body classes. ([aem.live bulk metadata](https://www.aem.live/docs/bulk-metadata); the [EDS multi-brand starter](https://acs-ui.github.io/eds-multi-brand-docs/docs/intro) selects its brand the same way.)
- **Three tiers of tokens:** primitives (raw values), semantic tokens (roles), components that read only the semantic tier. Light and dark change the semantic tier, never the primitives, and a brand overrides the semantic tier rather than repainting another brand's primitives. ([ServiceTitan Anvil on tier-3 tokens](https://anvil.servicetitan.com/blog/posts/2026-04-13-introducing-tier-3-tokens), [MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme), [MDN light-dark()](https://developer.mozilla.org/Web/CSS/color_value/light-dark).)
- **Brand and appearance are separate axes**, and a page's brand must never overwrite the visitor's stored appearance.

The first pass (an hour earlier) had remapped Jack's primitives to Adobe's colors (`--palette-lavender-600` holding Adobe red). It looked right, but it was the pattern the research warns against, so it was replaced before anything shipped.

## The audit

Every CSS and JS file in `blocks/`, `templates/`, `styles/`, `scripts/` (226 files) was scanned for colors and faces outside the token layer: 55 files, 103 hex colors, 45 `rgb()` values, 168 references to `--palette-*` primitives, 12 face names. Each was read in context:

| Kind | Where | Done |
|---|---|---|
| Primitives read by blocks | the explainer kit's aliases (`--night`, `--bone`, `--lav`, `--mint`, `--gold`, `--rose`, `--differs`, `--pass-ink`, about 190 uses across 40 engines), code, switch, lab, the article template's plain code, the inverse band in `styles.css` | new semantic tokens, same values |
| Categorical colors written as primitives | scripted-flow, model-merge, reuse-stacks, work-patterns | the matching v3 semantic tokens (`--color-topic-*`, `--color-project-*`, `--color-accent`), which also removed their three copies per appearance |
| Status colors as literals | `#b0344f`, `#c2433d`, `rgb(194 67 61 / 6%)` in 12 engines | `--color-danger`, `--color-danger-strong`, `--color-danger-soft`, `--color-success(-strong)`, `--color-warning` |
| Display italics | 10 rules set the display face in italic | `--font-display-italic` (Jack `italic`, Adobe `normal`: the site serves no Inter italic) |
| Left as they are, on purpose | masks (`#000` in mask images), black alpha shadows, the mock-ups of other products' UI in `content-contract` and `theme-swap`, chart category colors with no v3 equivalent (score-blend, task-loop's blue), the lofi chapter's rose stroke, the year divider's mint wash, the badge's navy backing, `design-docs.js` (it documents v3's own primitives) | |

After: no block, template or shared style reads a primitive; the only primitives outside the token layer are the v3 design-system page's swatches.

## What changed (code)

- **The token contract** (`styles/styles.css`): new semantic groups, per appearance where the value differs: night (`--color-night-bg`, `-bg-raised`, `-line`, `-text`, `-text-muted`, `-text-faint`, `-accent`, `-success`, `-warning`, `-danger`), code (`--color-code-keyword`, `-string`, `-number`, `-comment`, `-gutter`), status (above), the inverse band (`--inverse-*`, 16 tokens; the band's rule is now one rule over them instead of three copies), the board (`--color-board`, `--color-board-accent`), `--shadow-card`, `--font-display-italic`.
- **The Adobe brand** (`styles/themes/adobe.css`, 9 KB, loaded only on a page that names it): its own primitives (`--adobe-*`), the semantic tokens for light, chosen dark and System dark, the same for a section that forces its appearance, upright Inter in the display role, pill buttons, accent buttons on `#eb1000`. Contrast by script, all AA (in the file's header).
- **The switch** (`scripts/scripts.js` `applyBrand()`): a brand name among the theme metadata words sets `html[data-brand]` and loads its stylesheet; the body waits for it, so no page shows in the wrong brand. Theme words that aren't brands (`code-nowrap, board-mat` on the caching article) are left to the body classes as before.
- **Blocks and engines** moved onto semantic tokens: explainer kit, code, switch, lab, figure, hero, chapter-head, panel, cards, row-list, showcase, stats, the article and portfolio templates, the writing list, and 16 explainer engines.
- **The presentation template** (`templates/presentation/`) and **the process-shift explainer** (`blocks/explainer/engines/process-shift.*`), built for the webinar page and usable by any page.
- **The hero's side-note list** takes a bold title where an item has no link (a date, a time).
- **Two bugs the contrast check found, live on www before this work:** the parser lab's selected chip had black bold text on a black chip ("JSON inside prose" was invisible), and the offering-path explainer showed its picker's name, near-white on the white diagram board, because the editor saves the picture without a `<p>` and decoration then wrapped the picture and the name together.
- **Checks:** `test/theme-contract.test.mjs` (every brand maps every semantic token in every appearance; Jack's appearances agree; no block reads a primitive; mutation-tested: dropping one Adobe token, or adding one primitive to a block, fails it), `stardust/scripts/deploy/theme-matrix.mjs` (renders, contrast, leaks, pixel diffs), `npm run lint` now covers `styles/**` and `templates/**`, and `local-preview.mjs` builds non-index documents (the block library).

## Validation

All on the 76 example pages (34 site pages, the 36 block library pages, the four library templates, the v3 design system page and the writing hub) through `aem-up-local`, plus the webinar draft. Each page in three appearances (Light with the OS dark, Dark with the OS light, System with the OS dark) at 1440 and 360.

- **Jack's brand is unchanged.** Every render pixel-diffed against the code before this work (a worktree of `6d5c7bf` serving the same pages): 456 renders, 426 identical, 0 console errors, 0 overflow. The 30 that differ: the three deliberate changes (18 renders: the switch block's code-note grey, now the code-comment token, `#7d7975` to `#9a958f`; the parser lab's chip label, now visible; the offerings explainer's board, 27px shorter without the stray name) and 12 renders that differ between two runs of the old code too (proved by diffing the baseline against itself: the gantt's scroll position at 360, 0.72%; the token lab's demo key, generated per load; a row-list hairline). Other harmonisations in the audit (article plain code and the switch console on the dark ground in dark, the empty-cohort and retry-ladder comment greys, the dark fail borders in two labs) don't show in any example's captured state.
- **Every page takes the Adobe brand.** 462 renders: all took the brand, 0 console errors, 0 overflow, 0 leaks (no element shows one of Jack's own colors or Playfair) except the v3 design system page's 20 swatches, which show v3's primitives because that is what the page documents. Contrast: every page passes except the v3 page, whose story frames are drawn behind their rows (the probe reads the page ground instead; the same 116 show in Jack's brand), and the two bugs above, fixed and re-checked (24 renders of the changed pages and the draft: 0 problems).
- **Editability** (`ew-editability-probe.mjs --simulate-editor`): the draft 181/181 editable, 0 dead, 0 duplicated, 0 edit-mode drift; home 28/28. The probe caught the first version of the process-shift engine rebuilding its step lists (13 dead); it now keeps the authored lists whole. It also found the hero's title wrapping in quick edit (the editor wrapper became the flex item), fixed in `hero.css`, and the slide kicker and lead losing their look in quick edit, fixed in the template.
- **Code checks:** `npm run lint` 0 errors (one existing warning in `sanitise.js`), `node --test test/*.test.mjs` 22/22, `cd edge && npm test` 23/23.
- **The draft** in the built-in browser at 1440 and 360, light and dark: every slide, the five process diagrams (switching by click and by keyboard, the run, the split bar), no overflow; printed to PDF (26 pages, landscape Letter): each slide starts a page and every process prints all its versions under their labels.

## The webinar page

`/drafts/sites-ai-webinar/` (DA, preview only, `noindex, nofollow`): `template | presentation`, `theme | adobe`. Seventeen slides, built from Jack's structure (2026-10-29) and the spec in `local-only/2026-10-31-sites-ai-presentation/`: the question with the whole lifecycle as a process diagram (today and with AI), the generic loop as the theory (intent and context in, a check out), then each stage with its own process diagram (today, start here, go further) and one slide per use case (why it works, the demo, try it this week, what you need), the pre-publish checklist written out, the thread back to the original intent, three things to try on Monday, questions, and draft notes on what each demo still needs. Two demos show real output from 2026-10-31: the archive's diff after one publish (`7f01594`) and `seo-check.mjs` on www (51 pages and fragments, 300 JSON-LD and social image URLs, 190 URLs, 0 problems).

## Release

Jack, 2026-10-31 22:30 ET: "Let's get things merged into main and close out all local branches and worktrees." v1.4.0 is the `presentation-theme` branch, squash-merged to main, tagged `v1.4.0` with the branch `release/1-4-0`.

## Left for Jack

- The bulk metadata sheet can switch a folder or the site to the Adobe brand; that is a site config change.
- The talk track, the throughline page, live or recorded demos, and the four demos still to build (listed on the page's last slide).
