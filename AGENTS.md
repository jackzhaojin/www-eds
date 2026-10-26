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
- www.jackzhaojin.com, migrated here from GitHub Pages on 2026-10-25 with the same design (stardust `replica`). All 35 sitemap pages are live; www still serves GitHub Pages until the cutover. `README.md` is the overview.
- What was built and what is left: `ai-docs/2026-10-25-initial-buildout-2-goals/` (start with `whats-left.md`). The plan, its 20 decisions and the rules for every run: `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/start-here.md` (local: `/Users/jackjin/dev/jackzhaojin/jackzhaojin.github.io/...`; GitHub: https://github.com/jackzhaojin/jackzhaojin.github.io/blob/main/ai-docs/2026-10-24-eds-migration/start-here.md).
- Hosts: eds.jackzhaojin.com is this site and gh.jackzhaojin.com the GitHub Pages site, both through the Worker in `edge/` and both noindex. Only www is indexable.
- Stop and ask Jack: an expired DA token (he signs in), any Experience Workspace or site config change, every Cloudflare change, the register review, the www route and the cutover.
- The DA token is the da-auth cache (`~/.aem/da-token.json`). Never print it or write it into the repo.
- The design is v3's (`DESIGN.md`). Only entries in `stardust/replica/inconsistency-register.md` may change it; any other "improvement" is a fidelity bug.
- Explainers are content: `explainer (<word>)` loads `blocks/explainer/engines/<word>.js` and `.css`, its text and data are block rows (`stardust/explainer-family.md`). Metadata `template` loads `templates/<name>/`.
- Blocks move authored elements into role wrappers and never rebuild them, so every text stays editable in Experience Workspace (the editability probe checks it).
- **Before changing any content, read `content/README.md` (a must-read).** `content/` in git is the source of truth for the content; DA is where it's published from (Jack's decision, 2026-10-26, `ai-docs/2026-10-26-content-in-git/`). That file holds the process (editor's form, preview, compare with gh.jackzhaojin.com in the built-in browser, gate, publish, commit) and the lessons learned; add new ones there. Site config lives in `hlx-config/` as files.
- A change to a shared block, style or template re-gates home and an article at 1440 and 360 (`stardust/scripts/replica/gate.sh`) before it counts.
- Until the cutover, every page published on GitHub Pages also lands here (`whats-left.md` section 5).
- Copy: plain hyphens only (no em or en dashes), content carried verbatim.
- Node 22 (`.nvmrc`). Shell state does not persist, so prefix Node commands: `source ~/.nvm/nvm.sh && nvm use >/dev/null && <cmd>`.
- Plugins (stardust, impeccable, aem-edge-delivery-services, and Jack's hlx-admin-api-executor from jackzhaojin/ai-builder-kit for Admin API work, skills only, no hook) come from `.claude/settings.json`. Never copy skill files into this repo.
- `CLAUDE.md` is a symlink to this file. Edit `AGENTS.md`.
