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
- www.jackzhaojin.com moving here from GitHub Pages. Plan, decisions and status start at `jackzhaojin.github.io/ai-docs/2026-10-24-eds-migration/start-here.md` (local: `/Users/jackjin/dev/jackzhaojin/jackzhaojin.github.io/...`; GitHub: https://github.com/jackzhaojin/jackzhaojin.github.io/blob/main/ai-docs/2026-10-24-eds-migration/start-here.md).
- Node 22 (`.nvmrc`). Shell state does not persist, so prefix Node commands: `source ~/.nvm/nvm.sh && nvm use >/dev/null && <cmd>`.
- Plugins (stardust, impeccable, aem-edge-delivery-services, and Jack's hlx-admin-api-executor from jackzhaojin/ai-builder-kit for Admin API work, skills only, no hook) come from `.claude/settings.json`. Never copy skill files into this repo.
