---
name: portfolio-scene
description: Build or change the animated hero scene on a www-eds portfolio project page - a `Scene (<word>)` block engine in blocks/scene/engines/, the scene's authored rows in the project's DA page, and the local check at 1440 and 360 in both themes. Use when a project page needs its visual, when a scene engine is changed or polished, or when a new project joins the portfolio. Not for article explainers (blocks/explainer) or the home hero.
---

# Portfolio scenes

Every project page (`/portfolio/<slug>/`) opens with its chapter head; a scene is the project's hero art beside it: one code-drawn, animated plate that shows **how the project works**, in the project's accent. Jack's brief (2026-10-28): "make each one visually beautiful", "go maximum with beauty and professionalism", the Continuous Executive Agent as "a beautiful clock tower of three agentic loops working together", AnimaMesh as brains (a person's brain, people sharing a brain, multi-player).

Read first: `blocks/scene/scene.js` (the kit, its JSDoc is the contract), `blocks/scene/scene.css`, `content/README.md` sections 1 and 2 (how DA content is written), and the project page itself (`content/portfolio/<slug>/index.html` and https://www.jackzhaojin.com/portfolio/<slug>/). Know the project before drawing it: the page, and its repo under `~/dev/jackzhaojin/` when there is one.

## How a scene works

- **Block:** `Scene (<word>)`, authored right after the `chapter-head` block in the project's chapter section. The scene moves itself into the head after the heading: the right column at 1180px and wider (a 400 to 500px square), under the heading below that (up to 480px; full width at 360).
- **Engine:** `blocks/scene/engines/<word>.js` (default export `engine(block, kit)`, may be async) and optional `<word>.css`. Loaded after the section shows, so the page never waits on it. Keep each engine under about 15 KB unminified JS plus CSS; no libraries, no images, no fetches.
- **Stage:** `kit.stage` is a square `div[role=img]` (its aria-label is the `label` row). Draw an SVG with a square viewBox (e.g. `0 0 500 500`) or a canvas (`kit.canvas`). Never change the stage's size or aspect ratio.
- **Text stays HTML.** Every word a reader sees in the scene is an authored row: `kit.parts` maps each part key to its label wrapper, `kit.place(part, x, y, size, align)` puts it at (x, y) of a `size` square (`align`: center, left, right, top, bottom). Never draw text in SVG or canvas, never rebuild or copy a label's text: move and style only (EW1, `stardust/explainer-family.md`). Engines may add classes to label wrappers (`is-active`) and set `pointer-events: auto` on them for hover.
- **Kit:** `stage`, `labels`, `parts`, `caption`, `place`, `slot`, `svg(name, attrs, parent)`, `canvas(stage, onResize)` (DPR-scaled, `{ el, ctx, size, dpr }`), `loop(stage, draw(t, dt), { still })` (runs only on screen, tab visible, not paused; under reduced motion draws one frame at `still`; returns a redraw function), `pointer(stage)` (eased -1..1, call `update(dt)` per frame), `palette(el)`, `onTheme(el, fn)`, `rgb`, `alpha`, `random(seed)`, `reduceMotion()`.
- **Thumbnails:** the hub's gallery copies each project page's scene into its card with `data-mode="thumb"`: no pause control, the clock starts at your `still`, and it plays only while the card is hovered, focused or (on touch) most in view. So `still` must be a frame that reads on its own at about 300px, and the engine must be a pure function of `t` from any starting point (never assume the intro ran).
- **States on the block:** `is-ready` (labels fade in), `is-playing`, `is-paused` (the kit's pause control, WCAG 2.2.2), `is-fallback` (the engine failed: labels show as a list).
- **Theme:** SVG takes colors from CSS custom properties, so the light and dark themes just work: `var(--scene-accent)` (the project's accent: the 700 step on paper, 300 on night), `--color-text`, `--color-text-muted`, `--color-text-faint`, `--color-line`, `--color-bg`, `--color-surface`. A canvas reads them with `kit.onTheme(block, fn)` and redraws. Test both themes; the site's theme control sets `data-theme` on `<html>`.
- **CSS scope:** every rule starts `.scene.<word>`, and classes an engine creates start with the word (`.clock-tower-wheel`). Stylelint standard config applies.

## Authoring the rows (in the DA page)

Insert the block in `content/portfolio/<slug>/index.html`, immediately after the chapter-head block's closing `</div>`, in the same section. The editor's form: one row per `<div>`, two cells, each cell's text in a `<p>`; non-ASCII as entities (run `node stardust/scripts/deploy/sanitise.js <file>` after editing); plain hyphens only, never em or en dashes.

```html
<div class="scene clock-tower"><div><div><p>label</p></div><div><p>A clock tower whose three gears ...</p></div></div><div><div><p>caption</p></div><div><p>...</p></div></div><div><div><p>executive</p></div><div><p><strong>Executive</strong></p><p>picks the goal</p></div></div></div>
```

- `label`: one sentence that says what the picture shows, for screen readers.
- `caption` (optional): one short mono line under the art. Most scenes are better without; never repeat the head's text.
- Reserved keys (never a part): `label`, `caption`, `pause`, `play`.
- Part rows: 2 to 4 labels, a word or three each (a bold name, optionally a second short line). Use the project's own vocabulary from its page; never invent facts or numbers. At 360 the scene is about 320px wide, so labels must still fit: a long label is the wrong label.
- Document the parts in the engine's JSDoc: word, what the scene shows, the parts and where each sits.

## Visual language (one family, eleven plates)

The site is "Editorial Field Notes" (DESIGN.md): warm paper or night ground, ink, one accent, hairlines, Playfair, Inter, JetBrains Mono. A scene is a **plate** in a field notebook, not an illustration:

- **Ink draws, the accent tells.** Ink (text color at 60 to 90%, construction in `--color-line`) makes 85 to 90% of the strokes; the accent marks only the moving subject and its trail, plus one soft accent wash behind it. No second hue.
- **Line weights** (at a 500 viewBox drawn at about 500px): construction 0.75 at 35% opacity, structure 1.25, subject 1.75 to 2, never above 2.5. Round caps and joins. Dots 1.5 to 3. Use `vector-effect: non-scaling-stroke` so weights hold at 320px.
- **Depth by tone, not shadow:** three planes (construction, mechanism, subject and labels) by opacity and size. No drop shadows. Dissolve the edges into the ground with a radial `mask-image` on the SVG or canvas, so there is no box.
- **Callouts:** each label ends a hairline leader drawn by the engine (0.75 stroke, a 2px dot at the part). Labels never sit on top of moving strokes.
- **Composition:** one mechanism, subject on an upper-third point, about 8% margin, weight leaning toward the title (left at desktop). Leave air; the scene beside a dense head should feel calmer than the text.
- **Avoid:** glowing brains, circuit traces, robots, sparkles, isometric servers, floating shadowed cards, gradient blobs, neon on paper, rainbow palettes, stock icons, fake code, lens flares, everything moving at once, gears that don't mesh, Perlin noise by default, perfect symmetry for its own sake.

## Motion grammar

- **One primary motion** (the mechanism), at most two secondary (its consequences), ambient drift under 2% amplitude. At most three state changes at once.
- **Loops:** the story cycle is exactly periodic, 8 to 12 s; ambient periods incommensurate (17, 23, 31 s). Rotation and conveyors are linear; easing is for state changes.
- **Curves:** arrive `cubic-bezier(0.16, 1, 0.3, 1)` 700 to 1100 ms; travel `cubic-bezier(0.65, 0, 0.35, 1)` 900 to 1800 ms; breath `0.5 - 0.5 * cos(2 * PI * t / T)`; snap (a tick, a landing, an approval) `cubic-bezier(0.34, 1.56, 0.64, 1)` 180 to 260 ms; leave `cubic-bezier(0.32, 0, 0.67, 0)` 300 ms. Implement them as JS easing functions of t (cubic-bezier solver or close polynomial).
- **Intro, once when first shown** (`t` starts at 0): construction draws on (800 ms, 60 ms stagger), the mechanism's timescale eases 0 to 1 over 1.2 s (spins up, never jumps). Settled by 2 s.
- **Hover (pointer only):** 3 to 6px parallax across the planes, timescale up to 1.4; optionally, hovering a part highlights it while the rest dims to 45%. Nothing follows the cursor; nothing needed on touch.
- **Reduced motion:** `loop` draws once at `still`: pick a designed mid-action moment where every part reads (not t = 0, not an empty frame).
- **Cost:** one rAF via `kit.loop`, under 2 ms a frame; no per-frame layout reads, no `filter: blur` or `shadowBlur` animation, no per-frame DOM creation. Precompute geometry; update transforms and a few attributes.

## Technique notes

- **Gears:** module `m` (tooth size); pitch radius `r = m * N / 2`; centre distance `m * (N1 + N2) / 2`; addendum `m`, dedendum `1.25 m`. Speeds `w2 = -w1 * N1 / N2`. Phase so teeth interlock, with tooth 0 at local angle 0 and `phi` the centre-line angle: `theta2 = phi + PI + PI / N2 - (N1 / N2) * (theta1 - phi)`. Gears on one arbor share an angle. A rounded trapezoid tooth is enough at this size if the pitch geometry is right. Check the mesh at 4x zoom: no overlap, no gap.
- **Point spheres:** Fibonacci `y = 1 - 2 * (i + 0.5) / N`, `r = sqrt(1 - y * y)`, `th = i * 2.39996`; rotate, project `s = 3.5 / (3.5 - z)`, size by `s`, alpha `0.12 + 0.88 * ((z + 1) / 2) ** 1.6`; draw back to front; a 1px rim ring at 10%. 150 to 600 points in typed arrays, on canvas.
- **Travel along paths:** SVG `pathLength="1"` with a dash for a moving highlight, or a lookup table of points sampled once with `getPointAtLength`; never call it per frame.
- **Glow:** on night, a pre-rendered radial-gradient sprite drawn with `globalCompositeOperation = 'lighter'`, or a wide low-alpha stroke under a thin one; on paper, a plain tint at about 6% (additive glow washes out on light).
- **Crisp at every size:** SVG with `vector-effect`; canvas through `kit.canvas` (DPR capped at 2).

## Build and check loop

You own only your engine files (`blocks/scene/engines/<word>.*`) and your project's page (`content/portfolio/<slug>/index.html`, its scene block only). Other agents may be working on other scenes at the same time: never edit `scene.js`, `scene.css`, other engines, other pages, or shared styles; never commit, push, or write to DA. If the kit is missing something, work around it in your engine and say so in your report.

```bash
cd /Users/jackjin/dev/jackzhaojin/www-eds && source ~/.nvm/nvm.sh && nvm use >/dev/null
node stardust/scripts/deploy/local-preview.mjs /portfolio/<slug>/        # after every edit to the page
node stardust/scripts/deploy/scene-shots.mjs http://localhost:3001/portfolio/<slug>/ --name <word>
npx eslint blocks/scene/engines/<word>.js && npx stylelint blocks/scene/engines/<word>.css
```

- The page is served at http://localhost:3001 by the AEM CLI (the `aem-up-local` launch config: local code, local page, everything else from preview). It is already running; never start, stop or restart it. Code edits show on reload.
- `scene-shots.mjs` captures the scene at 1440 and 360, light and dark, at 1.5 s and 7 s (`--at` to change), and a still under reduced motion, into `.playwright-cli/scene-<word>-*.png`, and prints frame time, long tasks, errors and overflow. **Look at every image** (Read the PNGs), at the scene crops and at the `-screen` shots (the scene beside or under the head). For anything else, the `playwright-cli` skill; keep all output in `.playwright-cli/`.
- Iterate until it passes the bar below. Then use the `impeccable` skill's critique or polish guidance for one fresh-eyes pass on the design, and fix what it finds.

## Family rules (from the first review, 2026-10-28)

- **Fill the plate:** the drawing's bounding box covers 80 to 84% of the square on each axis, so the 11 plates read at one size beside their titles. No banner strips in a square, no empty third.
- **The subject is never the smallest thing:** whatever carries the story (a token, a car, a draft, a stone) is at least 8px at a 460px stage. The moment that matters (a match, an approval, a win) gets a visible change: an accent snap, a press, a lift.
- **No frozen holds:** a hold lasts 1.5 s at most, and even then something breathes (about 2% on the accent wash, a caret).
- **Soft resets:** the loop never clears everything at once; things leave staggered over at least 300 ms, or the last result fades while the next builds.
- **Labels at 320:** every label at least 12px inside the stage, never touching another label, a leader dot or a moving part.
- **Line plates:** big flat fills are the exception; a mass larger than a label block is a tint (about 20%) with an outline.
- **Dashes:** `vector-effect: non-scaling-stroke` puts dash lengths in screen pixels (and breaks `pathLength` dashes in Chromium); a scene with dashed or drawn-on strokes scales stroke widths itself (a CSS variable set from the stage size) instead.
- **Size:** engines run 13 to 20 KB unminified (about 5 KB compressed); stay in that range.

## The bar (all of these before it's done)

1. It shows how the project works: someone who reads the labels and watches one loop could explain the mechanism in a sentence.
2. Beautiful at 1440 and at 360, in light and in dark: balanced, calm, nothing cramped, clipped or overlapping; labels legible and clear of moving strokes.
3. One accent, ink everywhere else; line weights and motion per the grammar; it settles by 2 s and loops seamlessly (no jump at the seam).
4. A designed still under reduced motion; the pause control stops it on the current frame.
5. No console errors, no horizontal overflow, frame p95 at or under 20 ms, no long tasks from the scene.
6. Every visible word is an authored row; the label row describes the picture; plain hyphens only.
7. Lint clean. The engine's JSDoc names its word, what it shows, and its parts.
