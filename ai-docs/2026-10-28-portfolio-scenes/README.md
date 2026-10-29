# Portfolio scenes: an animated plate per project (2026-10-28)

**The ask (Jack):** "for each one of my projects in my portfolio, one of the goals of splitting them up is to really make them visually beautiful ... let's have a visual for each one of my projects". His two examples: the Continuous Executive Agent ("it's really 3 gears ... the executive gear, the management gear, and then the worker gear. All collaborating together to build a thing ... a beautiful clock tower of three different agentic loops") and AnimaMesh ("with the latest stuff, with different brains, a person having brain, multiple people sharing the brain potentially, and then also making a multiplayer"). Bruce is his son's gamer name. "Before we had the scrolling thing, we had to have 3 things in 1 line or 2 lines. Now we can really make each one of those projects really showcase." He asked for competitive research, parallel subagents that have the right skills (or develop them), new blocks if needed, and "maximum with beauty and professionalism".

## What was built

**The Scene block** (`blocks/scene/`), release v1.2.0. `Scene (<word>)` is authored right after a project page's chapter head; it moves itself into the head after the heading. At 1180px and wider the heading keeps the full width and the scene floats right of everything after it (32vw, up to 480px), like a figure in a magazine column; below that it sits under the heading (up to 480px, full width on phones). The first try placed it absolutely in a third column, which squeezed the titles: AnimaMesh's subtitle broke as "company- / of-o" and its repo link broke mid-word. The float keeps every title on its line.

- **Text stays HTML.** The art is drawn in SVG or canvas by the engine (`blocks/scene/engines/<word>.js`); every word in it is an authored row (`<part> | <label>`) that the engine places over the art. Nothing is drawn as text, so every label stays editable in Experience Workspace (the editability probe: 145 scene texts on 11 pages, 0 dead, 0 duplicated, 0 drift) and readable without the drawing. `label | <sentence>` is the art's accessible name.
- **The page never waits on it.** The engine loads after the section shows, so the head (the LCP) doesn't wait; the stage is square in every engine, so nothing shifts when it draws.
- **Motion is the reader's.** The kit's loop runs only while the scene is on screen, the tab is visible and the reader hasn't paused it (a pause control in the corner, WCAG 2.2.2); under reduced motion each engine draws one designed still.
- **Not in the block library:** scenes are one per project, like the article explainers.

**Eleven engines**, one per project:

| Project | Engine | The plate |
|---|---|---|
| Anima Mesh | `brain-mesh` | v2's mesh of brains as point-sphere constellations: a person beside their own brain, three people seated around a shared, multi-player brain, an org brain whose law flows down into it. A heartbeat wakes an agent; the link forms only when a member agrees, both halves joining; the agent brings back a draft that waits at the gate until the person approves it and lands as a new point |
| Built with Bruce | `arcade` | A Lava Dash level slides through a seam: Bruce's pencil sketch on graph paper becomes the built level, where two co-op cubes run it, jumping where his arrows said |
| The Content Factory | `closed-loop` | One three-petal loop through the coordinator: content-gen makes a messy legacy page, migration (Kimi) rebuilds it as blocks, eval (Claude) fills four score bars |
| AI Builder Kit | `multi-tool` | A knife whose handle is the marketplace, nine nicks for nine skills: a task steps along them, and the matching blade swings out, works and folds back |
| Conversion Factory | `split-test` | A git graph carrying visitors: four spoke commits, a variant branch, the A/B split with tally bars, the winner promoted into main, the retrospective rewriting an instruction line |
| Continuous Executive Agent | `clock-tower` | A cut-open clock tower: executive, management and worker gears truly meshing at 1:2:4; the executive wheel is the dial whose hand lights the eight loop phases, and each worker turn lays a stone of the arch being built at the tower's foot |
| CIAM Demo | `pin-tumbler` | Two tenants' pin tumbler locks in cutaway inside the API: the key's cuts are its org-scoped claims; its own tenant's pins reach the shear line and the plug turns, the other tenant's catch |
| Postal Portal | `two-rails` | A stack of spec sheets feeds railway points: block cars ride the EDS rail into a page, a parcel rides the Next.js rail (89 sleepers, one per commit) through quote, pickup and confirmation to a postmark |
| Shadow Pivot | `three-shadows` | One voxel object, the app, pivots a third of a turn at a time in parallel light; its true shadow becomes release, infrastructure and methodology in turn |
| Azure STAR Generator | `loom` | CSV feedback rows are the warp; an Azure OpenAI shuttle weaves each story in four bands, Situation, Task, Action, Result |
| AEM Rockstar 2024 | `ripple` | A pencil review table, in the page's lofi look: a prompt ripples down the fragment, every change gets a rewrite and a tick, one press opens the variation |

## How it was made

1. **Research** (one subagent): how the best teams draw explanatory motion (Ciechanowski's gears and watch, the Stripe and GitHub globes, Linear, Vercel's beams, Rive's state thinking), turned into one visual language for the site's "Editorial Field Notes" design: every scene a plate in a field notebook, ink for 85 to 90% of the strokes and the project's accent only on the moving subject, hairline callouts, three depth planes and no shadows, story loops of 8 to 12 seconds, named easing curves, a designed reduced-motion still.
2. **A skill for the builders:** `.claude/skills/portfolio-scene/SKILL.md` holds the block contract, the authoring form, that visual language and motion grammar, the gear and point-sphere math, the build-and-check loop and the bar. It is the method for any future scene (a new project, a change).
3. **Seven builders in parallel**, each owning only its engine files and its page's scene rows, each checking its own work with `scene-shots.mjs` at 1440 and 360 in both themes, and an impeccable critique pass.
4. **An independent review** of all eleven, frames every 0.5 s for a full loop: one REWORK (brain-mesh: a person read as a dot, not a person with a brain) and ten POLISH, plus family-wide rules (fill 80 to 84% of the square, story subjects at least 8px, holds at most 1.5 s, soft resets, labels 12px inside at 320), now in the skill. Every builder then made its fixes.

**Local checks before anything reaches DA:** `stardust/scripts/deploy/local-preview.mjs` turns a `content/` page into `.local-preview/<path>/index.plain.html` (section metadata as delivery serves it, images swapped for www's copies), and the `aem-up-local` launch config serves it at the page's own path with the local code (`aem up --html-folder .local-preview --html-mount / --no-livereload`, port 3001). `scene-shots.mjs` captures a scene at 1440 and 360, light and dark, at two moments and under reduced motion, and prints frame time, long tasks, errors and overflow.

## Verification (local, on the branch, before anything reaches DA)

- **scene-shots,** all 11 after the fixes: 55 of 55 captures `ok` (1440 at a 461px stage and 360 at 320px, light and dark, two moments each, plus the reduced-motion still): every scene ready, every label placed, frame p95 17 ms, 0 long tasks, 0 px horizontal overflow, no console errors. The pause control holds the frame; a theme switch while paused redraws.
- **Editability probe** (`--simulate-editor`) on all 11 pages: 0 dead, 0 duplicated, 0 drift; 145 scene texts, all editable.
- **Layout** in the built-in browser at 1440, 1200, 900 and 390: the title keeps its line beside the floated scene, the repo callout fits beside it, and below 1180px the scene sits under the heading.
- `npm run lint` (0 errors), `node --test test/*.test.mjs` (22 of 22), no em or en dashes, the page files' non-ASCII as entities.
- **Sizes:** engines 13 to 20 KB unminified each (about 5 KB compressed), loaded after the page shows; `scene.js` and `scene.css` 16 KB together.

The final frames, 1440 at 7.5 s: [light](scenes-light.jpg), [dark](scenes-dark.jpg).

## v1.2.1: the number and the tint move to the listing, and the hub becomes a gallery

**Jack, after seeing v1.2.0:** "the 1, 2, 3 ... 10, the background difference and all that stuff only makes sense on the listing page ... that number thing cannot be part of the details page. It has to be part of the listing. I think that's why we liked it initially." Then: "the listing page has to pop as well ... sometimes I try to click on the whole line, doesn't click ... the user experience and the whole thing needs to be made a lot better." And: "the clock tower needs to shift up quite a bit", "'system' should almost always be the default of any visitor".

- **Project pages:** the chapter head drops its numeral (a head whose title is the page's h1 has none), and the chapter no longer tints the ground; the accent stays on the subtitle, the callout and the scene. On wide screens the scene now floats from the top of the head, beside the title (scene.js moves it before the heading at 1180px and wider, after it below), so the tower sits level with the title.
- **The hub's project gallery** (`blocks/row-list`, projects only, built by one designer subagent with the impeccable skill): each project is a card whose whole surface is one link, with its outlined numeral (01 to 11, the row's place), its accent-tinted ground (two tones: a deeper media panel, a lighter text panel) and its own scene as a thumbnail. 01 (the newest, the flagship) and 11 (the prologue) span the row; 02 to 10 are a 3x3 grid from 1024px, two columns from 768, one on phones. Hover or focus deepens the tint, fills the numeral and plays that card's scene, one at a time; on touch, the card most in view plays. A page without a scene shows the numeral large on the tinted panel. All of it is decoration in the browser, from the rows the Worker and the browser already generate (the accent from the row's first old chapter anchor, `ch-<word>`), so no Worker redeploy, index column or content change.
- **Scene thumbnails** (`data-mode="thumb"` in the kit): the gallery copies each project page's scene from its `.plain.html`; a paused thumbnail draws the engine's designed still, and plays on from there.
- **The theme default is System:** a visitor with no stored choice follows the OS (it was Light, as on the source site).

Checks: lint (0 errors), unit tests 22/22, the editability probe on the hub (99/99) and a project page (116/116), the talks list pixel-identical to before at 1440 and 360, no horizontal overflow at 360 to 1440, a fresh visitor in a dark OS gets the night theme with System pressed.

## What's left

- **AnimaMesh's page text** still describes v0.16 (Jul to Aug 2026, 38 tags); the engine is at v2.4 (brains anywhere, the mesh of brains, multi-player, Slack). The scene shows v2; the copy is a separate content edit.
- **The hub** (`/portfolio/`) could show each project's still as a thumbnail; not done.
