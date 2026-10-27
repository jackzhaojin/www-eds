# AGENTS.md

Edge Delivery Services. Read a block first. Omissions are in the repo or known.

## Avoid
- `scripts/aem.js` is vendored. Never edit.
- Markup comes from the backend. `curl localhost:3000/x.plain.html` first.
- `buildAutoBlocks` rewrites content before your block runs.
- Authors omit and add cells. Decorate defensively.
- No build step; devDependencies only.
- Scope CSS to `.blockname`; `-wrapper`/`-container` are section classes.
- `fragment/fragment.js` is the only cross-block import. Otherwise use `/scripts/`.

## Outdated
- `fstab.yaml`, `helix-query.yaml`, `paths.json` are retired. Config lives at tools.aem.live.

## Remember
- `npx -y @adobe/aem-cli up`: local code, previewed content.
- Merging `main` ships code; content publishes separately.
- A PR without a `{branch}--www-eds--jackzhaojin.aem.page/{path}` link is rejected.
- All committed files are served. Use `.hlxignore`.
- Skills: `/plugin marketplace add adobe/skills`, then `aem-edge-delivery-services` (24 skills, incl. `docs-search`).

## This project
- www.jackzhaojin.com, migrated here from GitHub Pages on 2026-10-25 with the same design (stardust `replica`). www has served it since the cutover (2026-10-26, about 15:12 ET; release `v1.0.0`). `README.md` is the overview; what's left after the cutover is in `ai-docs/2026-10-26-cutover/`.
- What was built and what is left: `ai-docs/2026-10-25-initial-buildout-2-goals/` (start with `whats-left.md`). The plan, its 20 decisions and the rules for every run: `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/start-here.md` (local: `/Users/jackjin/dev/jackzhaojin/jackzhaojin.github.io/...`; GitHub: https://github.com/jackzhaojin/jackzhaojin.github.io/blob/main/ai-docs/2026-10-24-eds-migration/start-here.md).
- Hosts: www.jackzhaojin.com is this site (indexable), and eds.jackzhaojin.com is too (noindex). gh.jackzhaojin.com is the old GitHub Pages site (noindex). All three go through the Worker in `edge/`. GitHub Pages still answers at www's origin (its `CNAME` must stay www): the 7 project sites pass through to it. Rollback is removing the www route in the Cloudflare dashboard.
- Stop and ask Jack: an expired DA token (he signs in), any Experience Workspace or site config change, every Cloudflare change (including any Worker deploy), any Cloudflare token (Jack creates it and enters it himself; never through Claude), the register review.
- The DA token is the da-auth cache (`~/.aem/da-token.json`). Never print it or write it into the repo.
- The design is v3's (`DESIGN.md`), and it can now evolve. **Pixel-perfect gating against the old site ended on 2026-10-26** (Jack: "we can stop running stardust's migration skill going forward as well - we don't need pixel perfect as much anymore"): don't run the stardust replica gates or the migration skills for new work. `stardust/` stays as the record of the migration.
- Explainers are content: `explainer (<word>)` loads `blocks/explainer/engines/<word>.js` and `.css`, its text and data are block rows (`stardust/explainer-family.md`). Metadata `template` loads `templates/<name>/`.
- Blocks move authored elements into role wrappers and never rebuild them, so every text stays editable in Experience Workspace (the editability probe checks it).
- Talks and portfolio projects have a page each (`/talks/<id>/`, `/portfolio/<slug>/`, since v1.1.1). Listing pages (blocks Writing index, Row list (talks, dynamic), Row list (projects, dynamic)) and a talk or project page's Related list (Row list (related, dynamic)) are authored as one block with a Source row. Their rows and JSON-LD, and a talk or project page's JSON-LD, are generated, by the edge Worker on www and by the browser on preview hosts (`content/README.md`, "Listing pages"). Never author either. The editor's block library is `/docs/library/` (preview only, never publish; `content/README.md`, "The block library").
- **Before changing any content, read `content/README.md` (a must-read).** `content/` in git is the source of truth for the content; DA is where it's published from (Jack's decision, 2026-10-26, `ai-docs/2026-10-26-content-in-git/`). That file holds the process (editor's form, preview, compare with gh.jackzhaojin.com in the built-in browser, gate, publish, commit) and the lessons learned; add new ones there. Site config lives in `hlx-config/` as files.
- A change to a shared block, style or template is checked in the built-in browser on a branch preview (home, an article and the pages it touches, at 1440 and 360), with `npm run lint`, the unit tests and the editability probe (`content/README.md`, section 4) before it counts.
- The double migration ended at the cutover: new writing is published here, to EDS (`content/README.md`), not on GitHub Pages.
- **Releases are for code only** (Jack, 2026-10-26). A release (a `vX.Y.Z` tag plus a `release/X-Y-Z` branch, `ai-docs/2026-10-25-initial-buildout-2-goals/releases.md`) needs a change to code the site runs: `blocks/`, `scripts/`, `styles/`, `templates/`, `widgets/`, `head.html`, `fonts/`, `icons/`, or the edge Worker's `edge/src/`. Content changes, `hlx-config/` and other Admin API changes, docs, ai-docs and stardust records are not releases: commit and push them, but don't tag or branch.
- Copy: plain hyphens only (no em or en dashes), content carried verbatim.
- Node 22 (`.nvmrc`). Shell state does not persist, so prefix Node commands: `source ~/.nvm/nvm.sh && nvm use >/dev/null && <cmd>`.
- Plugins (stardust, impeccable, aem-edge-delivery-services, Jack's hlx-admin-api-executor from jackzhaojin/ai-builder-kit for Admin API work, skills only, no hook, and marketing-skills from coreyhaines31/marketingskills for SEO and GEO: `seo-audit`, `ai-seo`, `schema`) come from `.claude/settings.json`. Never copy skill files into this repo.
- `CLAUDE.md` is a symlink to this file. Edit `AGENTS.md`.
