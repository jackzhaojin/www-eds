# Draft validation

The real EDS preview is
https://codex-list-seo-research--www-eds--jackzhaojin.aem.page/drafts/talks-index/.
The runtime commit initially tested was `26ce1b4`; subsequent validation-only commits do not
change the site code.

## Passing checks

- Native API: nine records, all fields/links/order/aliases match the original authored talks.
- Public www API: HTTP 200. Production `/talks/` still has its static nine rows.
- General index and sitemap: no `/talks/records/` documents.
- `npm run lint`: passes, with one existing warning in `sanitise.js`.
- `node --test test/talks-index.test.mjs`: four tests pass, including pagination and bad data.
- Browser: API-driven DOM and schema, changed API data, text escaping, legacy anchor scroll,
  empty state and unavailable state pass. Zero page errors and unexpected console errors.
- Editability: five authored texts, five editable, zero dead, zero duplicated; editor
  simulation has no drift. API-derived copy is edited in the source records.

`browser.json`, `editability.json` and `production.json` contain the machine-readable results.
`draft-1440.png` and `draft-360.png` are captures of the real branch preview.

## Fidelity gate limitations

The full `stardust/scripts/replica/gate.sh` checks compare with gh.jackzhaojin.com, which does
not have the production Privacy footer link added under register R25. Desktop footer links
are consequently shifted, and mobile EDS pages have an existing 41px footer overflow. The
unchanged production talks page measures the same overflow as the dynamic draft. Listing
content has zero overflow at both widths.

The draft URL also does not activate the header's `/talks/` navigation link at desktop. That
is a preview-path difference; the production hub is not switched in this PR.

These failures are recorded as failures, not waived into passing full gates. All six probes
report zero missing/hidden headings or links and zero clipped text/controls. Five have zero
structural red; the mobile article has two thumbnail filename findings. A direct current
production versus branch comparison reports zero findings, confirming those two migration
findings are inherited (`article-production-baseline.txt`). The final six results are in
`fidelity.json` and their probe reports.

| Page | Width | Pixel difference | Height change | Full gate |
|---|---:|---:|---:|---|
| Home | 1440 | 0.27% | 0 | Fail: existing footer difference |
| Home | 360 | 1.11% | 0 | Fail: existing footer overflow/difference |
| Article | 1440 | 0.04% | 0 | Fail: existing footer difference |
| Article | 360 | 0.07% | 0 | Fail: existing footer and thumbnail findings |
| Dynamic talks | 1440 | 0.08% | 0 | Fail: existing footer and draft-path navigation |
| Dynamic talks | 360 | 0.05% | 0 | Fail: existing footer overflow/difference |

## Hosted CI

The GitHub Build check on `26ce1b4` passed. Adobe's `aem-psi-check` failed because Google's
PageSpeed API quota was exceeded for the service project; it returned no Lighthouse score.
This is distinct from a measured low performance score. The check will need a later rerun
when service quota is available.

## Review boundary

PR https://github.com/jackzhaojin/www-eds/pull/2 is a draft for Jack and Claude. No merge,
release deployment or production talks-content switch has been performed.
