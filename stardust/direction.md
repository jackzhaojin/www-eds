# Direction: preserve mode (replica)

Flow: replica. The design is kept: www.jackzhaojin.com is design system v3, and v3 is canon (README decision 1 in `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/`).

## What was promoted

- First page first: Track A started on the bounded branch with v3's `PRODUCT.md` and `DESIGN.md` (provenance `bounded-single`, v3 canon in place of a synthesized spec).
- RECONCILE (2026-10-25, full-prep branch): root `PRODUCT.md`, `DESIGN.md` and `DESIGN.json` are Track B's `stardust/current/` files, verbatim (extract `--prep` of all 34 sitemap pages).
- Diffed against v3 (`design-system/v3/tokens.css`, `DESIGN.md`): the promoted palette and font stacks are v3's. A future mismatch is a v3 doc bug or drift on the live site, fixed at the source.

## Why the root spec matches v3

- `styles/styles.css` carries `design-system/v3/tokens.css` as is (inside a stylelint-disable fence). One delivery-only change: each font stack names its metric-matched fallback face second.
- v3's source files live in `design-system/v3/`, listed in `.hlxignore`.

## Roster caps

Extract `--prep`: 34 of 34 pages, no cap. Excluded: the 7 GitHub Pages project-site prefixes and `/design-systems/2026-09-13/`.

## Inconsistency register

`stardust/replica/inconsistency-register.md`: the only permitted design deltas. Jack reviews it once per archetype and once per batch of about 5 articles (decision 16). Audit register candidates (F-007, F-008, F-010 to F-013) are in `stardust/audit/jackzhaojin-com/audit.json#registerCandidates`.

## Breakpoints

No `--target-breakpoints`: the source breakpoints are kept.
