# Rollout brief: shared rules for every migration agent

You are one of several agents migrating www.jackzhaojin.com (GitHub Pages, design system v3) to AEM Edge Delivery Services, in parallel. The design system, the foundation, the home page and the article archetype are done and gated. Read this file, then `AGENTS.md`, `stardust/explainer-family.md` and your own brief. Keep your context lean: follow `~/.claude/plugins/cache/adobe-skills/stardust/0.36.0/skills/replica/reference/reading-discipline.md` (no `cat` of big files, instruments through `run-bg.mjs`, one crop per fact).

## Where things are

- Repo: github.com/jackzhaojin/www-eds. Source repo (read only): `/Users/jackjin/dev/jackzhaojin/jackzhaojin.github.io` (pages, `css/`, `js/`, `writing/<slug>/{index.html,explainer.js,explainer.css,images/}`, `portfolio/`, `design-systems/v3/`).
- Experience Workspace (DA): org `jackzhaojin`, site `www-eds`. Live: `https://main--www-eds--jackzhaojin.aem.live/<path>`. Preview: `aem.page`.
- Gated references to copy: home `/`, article `/writing/2026-09-20-aem-edge-functions-google-sign-in/` (its source: `content/writing/2026-09-20-aem-edge-functions-google-sign-in/index.html`).
- Captured site scope (read only): `stardust/current/pages/<slug>.{html,json}`, the block catalog `stardust/spec/judgement/catalog.json`, `stardust/dynamic-features.md`.

## Your environment

- You work in your own git worktree. First: `ln -s /Users/jackjin/dev/jackzhaojin/www-eds/node_modules node_modules` (never `npm install`; never commit node_modules).
- Every node, npm, npx command: prefix `source ~/.nvm/nvm.sh && nvm use >/dev/null &&` (Node 22; shell state does not persist).
- DA token (never print it, never write it to a file in the repo):
  `DA_TOKEN=$(node -e "const t=require(process.env.HOME+'/.aem/da-token.json');if(t.expires_at>Date.now()+60000)process.stdout.write(t.access_token)") <command>`
  Empty = expired: stop and report.

## Ownership (one writer per path)

- The main thread owns, and you never edit: `styles/`, `scripts/`, `head.html`, `templates/article/`, `blocks/{header,footer,figure,code,compare,switch,lab,rail,author-box,fine-print,data-table,columns,explainer}/explainer.{js,css}` core files, `stardust/` run state (`status.jsonl`, `state.json`, `journal.md`, `replica/progress.json`, `replica/inconsistency-register.md`, `replica/accepted.json`, `spec/judgement/catalog.json`), `.eslintrc.js`, `.stylelintrc.json`, `.hlxignore`, `package*.json`.
- You own only the paths your brief lists. If you need a change in a file you do not own, do not edit it: work around it inside your own files if you can, and list the request in your report.

## Content protocol (pages)

1. Author the page as DA HTML in `content/<path>/index.html` (folder pages) or `content/<path>.html`. Articles: `node stardust/scripts/import-article.mjs <source index.html> <slug> content/writing/<slug>/index.html`. Text is carried verbatim; links stay absolute to www.jackzhaojin.com.
2. Images: `DA_TOKEN=… node stardust/scripts/deploy/da-media-upload.mjs --org jackzhaojin --repo www-eds --scope <scope> --dir <images dir> --ledger stardust/.work/media-ledger-<you>.json`. Articles use scope `writing/<slug>` (the importer points images there). SVGs must be pure vector and under about 40 KB.
3. `node stardust/scripts/deploy/localize-links.mjs --source-host www.jackzhaojin.com --content content` (rewrites only links whose page is already in content/), then `node stardust/scripts/deploy/davids-model-lint.mjs <file>` (D15 "code as text" is a false positive when the code is editorial content in `<pre><code>` or `<code>`; note it), then `node stardust/scripts/deploy/sanitise.js <file>` (one file per call).
4. Push your code first (below), wait for it on the code bus, then deploy: `DA_TOKEN=… node stardust/scripts/deploy/deploy-batch.mjs --org jackzhaojin --repo www-eds --branch main --content content --paths <list file> --ledger stardust/.work/deploy-ledger-<you>.json --log stardust/.work/deploy-log-<you>.jsonl` (add `--force` to re-PUT a page). The list file holds one DA path per line without extension (e.g. `/writing/<slug>/index`).
5. Commit your content files (they are the record; DA is the source of truth).

## Code protocol

- Blocks follow `stardust/explainer-family.md`: move authored elements into role wrappers, style through wrapper descendants, `.cta-slot` for link paragraphs, no `<button>` hosting authored text, hidden metadata through wrappers, dynamic boxes keep their final size, `@variants` declared in the JSDoc.
- Explainer engines: `blocks/explainer/engines/<word>.{js,css}`, loaded by the core for a block `explainer (<word>)`. `export default async function engine(block, { slot, rows, onceVisible, wait, reduceMotion, plainLinks })`. JSDoc at the top: the row shape authors use, behaviour, `@ew-exempt` for derived text. CSS: every selector scoped `.explainer.<word> …`; the source's class names may be kept (lint allows BEM in engines); the shared kit chrome (`.lab`, `.lab__bar`, `.lab__grid`, `.lab__label`, `.chips`, `.ctl`, `.verdict`, `.json`, `.bar`, `.code`, `.cmp__tabs`, `.pvl__switch`, the night and token aliases) is already in `blocks/explainer/explainer.css`. Data that the source kept in its JS (labels, rows, scenarios) moves into the block's rows: explainers are content.
- Importer engines: `stardust/scripts/import-engines/<word>.mjs` exporting `match($, el)` and `convert($, el, h)` returning the block HTML (`h.block(name, rows)`, `h.inline`, `h.img`, `h.esc`, `h.absHref`, `h.codeText`). Name files after your engines so no two agents collide.
- `npm run lint` must pass before every commit. Small commits, conventional messages, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Push: `git fetch origin main && git rebase origin/main && git push origin HEAD:main`. On rejection, fetch, rebase and push again. Never force-push. A rebase conflict in a file you do not own: stop and report.
- Code Sync takes seconds: before gating, poll a marker in your pushed file, e.g. `curl -s --compressed https://main--www-eds--jackzhaojin.aem.live/blocks/<block>/<file> | grep -c <marker>`, a few seconds apart, capped.

## Gate protocol (per page, on the published origin)

- Scripts are under `stardust/scripts/`. Long ones run through `node stardust/scripts/replica/run-bg.mjs start --name <job> -- <cmd>` then `run-bg.mjs wait`.
- Freeze the source once per page and width: `stitch-shot.mjs <live> stardust/replica/gates/<slug>-<w>/baseline.png --freeze-baseline --width <w> --settle`.
- Round: `stardust/scripts/replica/gate.sh <slug> <live> <eds> <w> pub<N> --full --main main --marker "Jack Jin" --gate-against-baseline`, at 1440 and 360.
- Pass bar per width: content-diff 0 looks-same red and 0 nothing-lost yellow; pixel diff at most 10%; height delta within 8px; chrome parity quiet; clipped 0; no overflow. At most 3 fix rounds per width; then record the residual with its cause.
- Probe limitations (an image the probe cannot sign, a timing artifact you have proven): you may add an entry to `stardust/replica/accepted.json` in your worktree for your own runs, but never commit it. Put the entry and its evidence in your report.
- Editability per page: `node stardust/scripts/deploy/ew-editability-probe.mjs <eds url> --blocks-dir blocks --simulate-editor` must show 0 dead and 0 duplicated; aim for 0 edit-mode drift and 0 block height delta in your blocks.
- Lazy images: measure with a scroll pass (the source's images often have no width and height).
- Any look change you must make (a one-off that cannot map exactly, a source inconsistency) is a register candidate: describe it with evidence in your report. Never apply a design improvement on your own.

## Never

- No site config, DA config, Experience Workspace settings, redirects sheet, query index, library or Cloudflare changes. If a page needs one, report it.
- No edits to `jackzhaojin.github.io`. No content invented, reworded or dropped. Plain hyphens only in anything you write (no em or en dashes). Never send readers to LinkedIn in new copy.

## Report (your final message, under 600 words)

1. Per page: EDS URL; at 1440 and 360: red / yellow, pixel %, height delta; editability authored / editable / dead / dup; residuals.
2. Blocks or engines built (one line each, with variants).
3. Register candidates (what, evidence, minimal change).
4. Requests for files you do not own; accepted.json entries you used, with evidence.
5. Catalog additions (block, variants, why). Anything blocked.
