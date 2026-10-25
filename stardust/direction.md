# Direction: preserve mode (replica)

Flow: replica. The design is kept: www.jackzhaojin.com is design system v3, and v3 is canon (README decision 1 in `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/`).

## What was promoted (Track A, first page first, 2026-10-25)

- Bounded branch (`preserve-direction.md` § 1a), provenance `bounded-single` with v3 canon in place of a synthesized spec:
  - root `PRODUCT.md` and `DESIGN.md` are `design-system/v3/PRODUCT.md` and `DESIGN.md` (source commit a550091 of `jackzhaojin.github.io/design-systems/v3`);
  - root `DESIGN.json` is the home capture's cap-probe (`stardust/first-page/current/DESIGN.json`): container 1280px, shell fluid, probe width 2560.
- At RECONCILE, Track B's `stardust/current/PRODUCT.md`, `DESIGN.md` and `DESIGN.json` replace these verbatim, and are diffed against v3's `DESIGN.md` and `tokens.css`. The live site is v3, so they should agree; a mismatch is a v3 doc bug or drift on the live site, fixed at the source.

## Why the root spec matches v3

- `styles/styles.css` carries `design-system/v3/tokens.css` as is (inside a stylelint-disable fence). One delivery-only change: each font stack names its metric-matched fallback face second.
- v3's source files (`PRODUCT.md`, `DESIGN.md`, `tokens.json`, `tokens.css`, `base.css`, `components.css`, `eval/`) live in `design-system/v3/`, listed in `.hlxignore`.

## Inconsistency register

`stardust/replica/inconsistency-register.md`. The only permitted design deltas. Jack reviews it once per archetype (decision 16).

## Breakpoints

No `--target-breakpoints`: the source breakpoints are kept (760, 1023/1024, 479/480, 768).
