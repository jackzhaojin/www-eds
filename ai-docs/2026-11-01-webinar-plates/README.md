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

## v1.5.1: the three kinds of checks

Jack, reviewing stage 03 in Experience Workspace: "eval should be classified as three different buckets" (human, deterministic and agentic checks, with Experience Workspace's Preflight panel as a deterministic example), then: "the human deterministic agentic thing could use more animations as well ... I like the graphics you did." The slide `03 · Three kinds of checks` became a row of three plates (`style | plates`), each card the plate and its bucket's text:

- `human-check`: the ink ring reads the page against the brief at a person's pace, circles a weak phrase, notes it in the margin, and makes the call with a tick. No accent at all: the person is ink.
- `rule-check`: one page through the same five rules twice, on a fixed beat; the two result strips match, and an accent "=" lands between them.
- `agent-check`: the AI disc reads out of order like a reviewer, raises questions where the page is thin, glances at two competing pages, and writes accent review notes.

Built by three parallel subagents from the same brief, who agreed one page card and actor column so the three read as a set. Validation (local code): every plate in both brands, light and dark, 1440 and 360 (0 errors, 0 overflow, frame p95 17 ms, replay restarts it); the deck in both brands, Light, Dark and System, with `--contrast`: 12 renders, 0 problems; editability 444/444; lint clean, 22/22 tests.

## v1.6.0: a small intro, and the hero art without the wait (2026-11-02)

Jack's review of the deck's opening, the night of Nov 2 (the talk track is in his brain, `bundle/professional/2026/20261111-adobe-sites-ai-webinar/20261102-talk-prep-draft-v1.md`): the opener should "capture the moment", the content should be "more illustrative ... Illustration almost always wins in giving talks", and the intro small: easier and harder, trust, start small, then the three sections.

- **`quality-bar`** (the opener, `#moment`): AI makes pages faster and faster that pile up under a rising accent line, the bar; three pages, checked by automation and approved by you, pass through it to a shelf ("Easy to make", "The bar", "Worth reading").
- **`trust-curve`** (`#trust`): trust against what you hand to AI, steep then flattening, with one AI disc at Start here, three at Build trust, nine at Go further. The idea is Lauren Tan's (@poteto), from a frame of her talk Jack shared; the plate is drawn for the deck and credits her in its caption.
- **`agenda`** (`#agenda`): one engine for the three section cards of a `plates` slide, research, authoring and evaluation; a card's stage comes from its place among the section's agenda scenes, and a three-dot strip marks where it sits.
- **`style | moment`** (`templates/presentation/presentation.css`): one plate beside the slide's heading, stacked on a phone; the heading sizes with the screen.
- **Headings:** slide `h2` and `h3` may run to 44ch (were 24ch and 30ch), so none wraps early on desktop.
- **Hero art** (`blocks/hero/hero.js`): the page art starts as soon as the hero has a size, one frame after the title paints, instead of 3 seconds after the load event. First pixels, measured: home 3.2 s to 0.2 s, writing and certifications 3.2 s to under 0.1 s; the portfolio hub's own art already started at once.

Content (DA, preview only): the title slide lost its summary and buttons; the intro is five slides; the three checks run deterministic, agentic, then human; and the deck ends with a graveyard (`content/README.md`), holding "Where does AI fit in your content work?" and "Same loop, every stage".

Validation (local code): every new slide at 1440 and 360, light and dark: 0 errors, 0 overflow, frame p95 17 ms; every slide heading checked at 1440, 1280 and 1024; the hero art on home, writing, certifications, portfolio and the deck with 0 errors; `npm run lint` clean, `node --test test/*.test.mjs` 22/22.

## What's next

- Jack's section-by-section review of the deck.
- The CMS direction (Jack: "Ideally, we start using this like a CMS and not everything has to be a code change"): replace one-off plates with a few generic plate types (merge, pipeline, checklist, compare, timeline) whose parts are rows, so a new slide graphic is authored, not coded.
- Not run yet: the Experience Workspace assistant prompt (the panel is on, checked 2026-11-01), the MCP prompt, the weekly scheduled research task (not set up).
