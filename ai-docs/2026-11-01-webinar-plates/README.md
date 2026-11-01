# Plates and replay for the webinar deck (v1.5.0, 2026-11-01)

Jack, reviewing the first draft of the Sites and AI webinar page (`/drafts/sites-ai-webinar/`, preview only, never published): "I like having human AI in different colors ... the animations of animation is nice. Ideally, we need a replay button if you can for all the animations." And for each stage, what AI offers: "two or three things per area ... generate some graphics as well. Like my talks and my portfolio has beautiful graphics." The Start here and Go further slides "need better graphics than just a line with dots", with the prompts on screen.

The content pass (Jack's voice, and per stage a question, the problem, what AI offers, the process, then Start here and Go further with their prompts) is in DA. This is the record of the code it needed. Shipped as an incremental release (Jack: "Let's make an incremental version and get this deployed").

## What changed (code)

- **Replay for scenes** (`blocks/scene/scene.js`, `.css`): an optional `replay | <name>` row gives a scene a replay button beside its pause button. It sets the scene's clock back to 0 and plays, so an engine draws from `t` alone. Opt-in by a content row: portfolio scenes and gallery thumbnails are unchanged (no row, no button). The pause control now resyncs on the block's `scene-pause` event, so replay can unpause it.
- **Replay for the process diagram** (`blocks/explainer/engines/process-shift.js`, `.css`): an icon button at the end of the switch row plays the shown version again. Hidden under reduced motion and in print.
- **Two slide layouts** (`templates/presentation/presentation.css`), as section styles: `plates`, the heading over a row of three cards, one scene each, whose `caption` row is the card's text (an `h3` title and one paragraph); `split`, the scene on the left and the prompt on the right. Both stack on a phone. Also: a second paragraph after a slide's lead gets its gap, and the edit-mode kicker and lead rules apply to default content only (they had matched a plate card's heading and line).
- **15 plates** (`blocks/scene/engines/`), each telling its story once and then holding, with a designed reduced-motion still, the deck's actor marks (a person an ink ring, AI an accent disc, automation a faint square) and every word an authored row:
  - what AI offers: `source-sweep`, `gap-scan`, `news-radar` (research and briefs), `block-fill`, `plain-edit`, `change-trail` (authoring), `check-sweep`, `intent-match`, `rival-bars` (evaluation);
  - Start here: `brief-merge` (a stakeholder's email, your boss's notes and search data merging into one brief), `workspace-prompt` (the Experience Workspace assistant), `checklist-run`;
  - Go further: `scheduled-brief` (a weekly run through the brand guidelines), `mcp-relay`, `check-pipeline`.

Built by five parallel subagents from one brief (the `portfolio-scene` skill's method, adapted: play once, settle, replay), each against lab pages in both brands, then reviewed from their stills and on the deck itself.

## Validation (local code, `aem-up-local`)

- Every plate: `scene-shots.mjs` at 1440 and 360, light and dark, Adobe and Jack's brand: 0 errors, 0 overflow, frame p95 17 ms, every label placed; replay restarts each one from its opening frame (Playwright).
- The deck: `theme-matrix.mjs` in both brands, Light, Dark and System, 1440 and 360, with `--contrast`: 12 renders, 0 problems. Editability probe with `--simulate-editor`: 372/372 editable, 0 dead, 0 duplicated, no scene drift.
- The scene kit change: a portfolio scene keeps only its pause control and pauses and plays as before; `gallery-scroll.mjs` on `/portfolio/` (11/11) and `/talks/` (9/9) at every speed and width.
- `npm run lint` clean, `node --test test/*.test.mjs` 22/22.

## What's next

- Jack's section-by-section review of the deck.
- The CMS direction (Jack: "Ideally, we start using this like a CMS and not everything has to be a code change"): replace one-off plates with a few generic plate types (merge, pipeline, checklist, compare, timeline) whose parts are rows, so a new slide graphic is authored, not coded.
- Not run yet: the Experience Workspace assistant prompt (the panel is on, checked 2026-11-01), the MCP prompt, the weekly scheduled research task (not set up).
