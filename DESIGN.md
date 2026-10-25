<!-- stardust:provenance
  writtenBy: stardust:extract
  writtenAt: 2026-10-25T14:05:00Z
  track: site-scope
  readArtifacts:
    - stardust/current/_computed-styles.json (census, 34 pages x 1440 + 360)
    - stardust/current/_brand-extraction.json
    - stardust/current/pages/index.json#customProps (:root tokens from /design-systems/v3/tokens.css?v=3)
    - /Users/jackjin/dev/jackzhaojin/jackzhaojin.github.io/design-systems/v3/DESIGN.md (canon, vocabulary only)
  synthesizedInputs: []
  stardustVersion: 0.36.0
  note: descriptive snapshot of the live site in light mode. Not the target; the target DESIGN.md at the project root belongs to the main thread.
-->
---
name: Jack Jin (live, design system v3)
description: Editorial Field Notes - warm paper, ink, one lavender accent, hairline rules, three faces.
colors:
  paper: "#f6f4f0"
  paper-alt: "#efece6"
  paper-surface: "#ffffff"
  paper-surface-raised: "#f1eee9"
  ink: "#1a1917"
  ink-muted: "#4a4744"
  ink-faint: "#6f6b66"
  hairline: "rgba(20, 18, 15, 0.10)"
  hairline-strong: "rgba(20, 18, 15, 0.48)"
  accent: "#5b4bc4"
  accent-hover: "#4a3ba8"
  accent-soft: "rgba(91, 75, 196, 0.08)"
  on-accent: "#ffffff"
  inverse-bg: "#1a1917"
  inverse-text: "#f6f4f0"
  topic-aem-ai: "#5b4bc4"
  topic-aem: "#2f6bb3"
  topic-agents: "#c2433d"
  topic-work: "#7d5f0e"
  project-cyan: "#1d6b7a"
  project-amber: "#8a5a00"
  project-leaf: "#3b7628"
  project-bronze: "#7a4f2c"
  project-mint: "#1f6e52"
  project-rose: "#a63658"
  code-ground: "#1a1a19"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.75rem, 1.9rem + 3vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.12
  h1:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 1.5rem + 1.8vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.12
  h2:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.12
  h3:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "1.25rem"
    fontWeight: 600
  body-lg:
    fontFamily: "Inter, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + 0.35vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Inter, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  small:
    fontFamily: "Inter, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.6875rem"
    letterSpacing: "0.14em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
  "9": "96px"
  "10": "128px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  chip:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  card:
    backgroundColor: "{colors.paper-surface}"
    rounded: "{rounded.lg}"
    padding: "22px"
  panel:
    backgroundColor: "{colors.paper-surface}"
    rounded: "{rounded.lg}"
    padding: "26px"
  panel-inverse:
    backgroundColor: "{colors.inverse-bg}"
    textColor: "{colors.inverse-text}"
    rounded: "{rounded.lg}"
  theme-control-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
  code-block:
    backgroundColor: "{colors.code-ground}"
    textColor: "{colors.paper}"
    typography: "{typography.mono}"
    rounded: "{rounded.lg}"
---

# Design System: Jack Jin (live snapshot)

## Overview

The live site runs one design system across all 34 sitemap pages: design system v3, "Editorial Field Notes", loaded as `/design-systems/v3/tokens.css`, `base.css` and `components.css`, with `/css/site.css` for page-level and article-explainer styles. A warm paper ground (`#f6f4f0`, 832M px of measured background area), ink type (`#1a1917` headings, `#4a4744` body), one lavender accent (`#5b4bc4`) used mostly as link text, and 1px hairlines (`rgba(20,18,15,.10)`, 4249 border uses) do almost all the work. Depth is tonal, not shadowed.

Pages fall into a home, three hubs (writing index, talks, certifications), a portfolio scroll, a privacy page and 28 long-form articles. Articles share one template: breadcrumb, serif title, mono byline, summary, a facts table, a reading column with a sticky right rail (table of contents), numbered H2 sections with self-anchors, then Related rows and an author box. Inside the column sits a large explainer vocabulary (dark code blocks, figures, comparison tables, terminals, token labs, request flows, video embeds) that is styled in `site.css` per article family.

The home, writing, talks and certifications pages open on a `graphic-hero` band whose `canvas.ambient-art` draws a slow, theme-aware geometric field (accent, cyan, amber); it pauses off-screen and renders a still frame under reduced motion. That canvas is the site's only moving signature.

## Colors

- **Paper** `#f6f4f0` page ground; **Paper Alt** `#efece6` alternate bands; **Paper Surface** `#ffffff` cards, frames, panels (108M px area); **Surface Raised** `#f1eee9`.
- **Ink** `#1a1917` headings (856 heading uses) and primary button ground; **Ink Muted** `#4a4744` body and nav links (5454 text uses, the most frequent color); **Ink Faint** `#6f6b66` meta, captions (2501 uses).
- **Accent** `#5b4bc4` link text and active marks (1746 text, 754 link uses); **Accent soft** `#5b4bc414` washes behind the active theme button and chips (5.3M px area).
- **Topic** colors (aem-ai lavender, aem blue `#2f6bb3`, agents red `#c2433d`, work gold `#7d5f0e`) and six **project** accents appear as chip dots, band tints and chapter numerals on the portfolio.
- Dark code blocks sit on Night 850 `#1a1a19` (`/css/explainers.css` aliases `--night`); their token colors come from the palette 300 steps: lavender `#c0b3ff`, mint `#9fe0c0`, gold `#f0cf8e`, bone `#e8e5e3`.
- The census found 76 distinct colors; 52 sit below 30 uses, most of them explainer-specific (see `_brand-extraction.json#_provenance.notes`).

## Typography

- Three faces from Google Fonts: **Playfair Display** (headings and wordmark, 852 elements, weight 600), **Inter** (body, 1004 elements, 400), **JetBrains Mono** (labels, bylines, chips, buttons, nav, breadcrumbs, table headers, 253 elements).
- Measured heading levels at 1440: h1 41.6px (28 pages; home display 64px), h2 30px (252), h3 20px (66), h4 19px (26). The h2 at 24px also occurs 229 times (article-family and portfolio sub-heads).
- Fixed size tokens 11/13/14/16/19/20/30/44/64 plus fluid clamp tokens for display, h1, h2 and body-lg. Scale audit: ad-hoc ladder (ratios 1.05 to 1.5), not modular.
- Leading: 1.12 tight for headings, 1.65 for body. Label tracking 0.14em, uppercase.

## Layout

- Centered container 1280px max, gutter clamp(20px, 5vw, 64px), band padding clamp(48px, 8vw, 96px), prose measure 66ch, header height 62px.
- Spacing on a 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- System breakpoints 480, 768, 1024, 1280 (base.css, components.css; max-width 479/767/1023 mirrors). Off-ladder values in page-family sheets: `site.css` 760; `article.css`, `explainers.css` and `portfolio/styles.css` 600, 640, 700 (6 rules), 860, 1080, 1100.
- Section bands are full-bleed grounds: plain, alt, tint (topic-keyed wash), inverse; content stays inside the container.
- Articles: reading column plus a sticky right rail from 1024px; `wide` (51) and `xwide` (48) figure classes break out of the measure.

## Elevation & Depth

- No shadows for depth in the system. The three shadow values measured are local: an inset 1px accent ring on the active theme button (34), a white mask on the portfolio Gantt chart (20) and a soft drop on article screenshots (12).
- Tokens `--shadow-1` / `--shadow-2` exist but are rarely painted. Separation comes from hairlines and tonal steps between Paper, Alt and Surface.

## Shapes

- Radius tokens 4 / 6 / 10 / 999. By element count the mode is 4px (1350: chips, theme buttons, code pills); by painted area it is 12px per the census, against the 10px card token; buttons 6px.
- 1px hairline borders everywhere; Hairline Strong (48 percent) for emphasis and button borders.
- Article explainers (`/css/explainers.css`, `/css/article.css` and 26 per-article `explainer.css` files) paint off-token radii: 12px (58 rules), 16px (18), 14px (14, the code block), 8px (12), 3px and 2px, beside the 4/6/10/999 tokens, and use their own ease `cubic-bezier(.4,0,.2,1)` against the token `--ease-standard`.
- Decorative gradients are rare and local: fade masks on the portfolio Gantt, striped bars in charts, a lavender diagonal hatch.

## Components

Observed on the live pages (counts are pages / elements from the class census in `stardust/.work/site-scope/class-census.tsv`):

- **Site header** (34/34): wordmark left, four nav links, Light/Dark/System theme control; folds behind a Menu toggle below 1024px.
- **Site footer** (34/34): compact single row, copyright with city, four profile links.
- **Breadcrumb** (32), **page title** (33), **summary** (33).
- **Article facts table** (28), **byline** (28), **article rail / TOC** (28), **row list** in Related (28), **author box** with avatar (28).
- **Figures** `fig` (28 pages, 230 elements), **boards** (26/108), **dark code blocks** (18/45), **chips** (18/21), **video embeds** (19/20), **token or tab labs** `lab` (14/18), **verdict** callouts (10/11), **data tables** (9/14), **comparisons** `cmp` (5).
- **Graphic hero** with ambient canvas (4: home, writing, talks, certifications).
- **Portfolio only**: hero with signal field and glow, Gantt timeline, chapter heads with outlined numerals and a flagship variant, showcase rows (flip), frames (diagram, portrait), proof links, stat chips, carousel, diagram deck, request flow, glossary, tool cards, repo grid, video facade.
- **Hubs**: writing index rows with tags and a filter bar with search; talk rows with date and event; credential rows with issuer marks.

## Do's and Don'ts

Observed rules (descriptive, from the capture):

- Do keep the paper, ink and single-accent palette; color beyond it lives in topic and project accents.
- Do separate with 1px hairlines and tonal grounds, not shadows.
- Do set labels, meta and navigation in JetBrains Mono, uppercase where they are labels.
- Do keep content complete without JavaScript; the canvas and widgets only animate or switch.
- Don't introduce photo heroes, icon fonts or image logos; the wordmark is text.
- Don't add new breakpoints beyond 480, 768, 1024, 1280 without a register entry (the live site already carries several off-ladder ones).
