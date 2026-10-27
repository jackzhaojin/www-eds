# Content: read this before changing anything here

**Decision (Jack, 2026-10-26):** this folder is the source of truth for the site's content. DA (Experience Workspace) is where the content is published from, not where it lives. Every change starts here and ends here, whether an agent or a person makes it. This file collects what we learn about doing that well; when a change teaches something new, add it here.

The record of the decision and the first full run over all 40 documents: [ai-docs/2026-10-26-content-in-git/](../ai-docs/2026-10-26-content-in-git/README.md).

**The process, briefly:** write the change here in the editor's own form, push it to preview, compare it in the browser with gh.jackzhaojin.com, gate it, publish it, commit it. Since the cutover, publishing goes straight to www.jackzhaojin.com.

**Why it takes this much care:** a page goes from DA's HTML to Markdown on preview, then back to HTML on delivery. On top of that, the editor rewrites HTML its own way whenever someone opens a document, and opening is enough to trigger it. Anything Markdown can't carry is lost on preview. Anything the editor writes differently can change how a block renders.

## What's in this folder

Each `.html` file is one DA document, at the same path (`writing/<slug>/index.html` is `/writing/<slug>/`): a body fragment with sections, block tables and a metadata block. `nav.html` and `footer.html` are the fragments every page loads. `media/` holds image files, at the same paths as in DA. `.deploy-ledger.json` and `.deploy-log.jsonl` record every push. EDS never serves this folder (`.hlxignore`).

## 0. Start from what DA has

Someone may have edited the page in Experience Workspace. Before you edit, compare DA's copy with this one:

```bash
DA_TOKEN=$(node -e "const t=require(process.env.HOME+'/.aem/da-token.json');if(t.expires_at>Date.now()+60000)process.stdout.write(t.access_token)")
curl -s -H "Authorization: Bearer $DA_TOKEN" https://admin.da.live/source/jackzhaojin/www-eds/<path>.html > <scratch>/da.html
node stardust/scripts/roundtrip-compare.mjs content/<path>.html <scratch>/da.html
```

- `content: identical`: go ahead.
- Any content difference is a real edit made in DA. Bring it here first: take DA's copy, run `sanitise.js` on it, and commit it as its own change.
- If the token has expired, Jack signs in with `da-auth-helper`. Never take a token out of a browser.

## 1. Write it the way the editor will keep it

The document shape (sections, block tables, metadata, links, images) comes from Adobe's `da-content` skill, in `references/html-content.md` ([on GitHub](https://github.com/adobe/skills/blob/main/plugins/aem/edge-delivery-services/skills/da-content/references/html-content.md)). That's what DA accepts and EDS renders.

Then write the markup the way the editor saves it, so opening the page in Experience Workspace changes nothing. These are the editor's rewrites, as found on 2026-10-26 by round-tripping every document:

| # | You might write | The editor saves | What it does to the page |
|---|---|---|---|
| 1 | `<p><img></p>` | `<picture>` (two `<source>`s and the `<img>`), without the `<p>` | nothing |
| 2 | `<p><a><img></a></p>` | `<a><picture>…</picture></a>`, without the `<p>` | nothing |
| 3 | `<a><strong>Text</strong></a>` | `<strong><a>Text</a></strong>` | nothing: delivery renders both the same |
| 4 | `<strong><em>Text</em></strong>` | `<em><strong>Text</strong></em>` | nothing |
| 5 | `<img>` | `<img loading="lazy">` on some images | nothing |
| 6 | `<li>Text<ul>…</ul></li>` | `<li><p>Text</p><ul>…</ul></li>` | nothing |
| 7 | an empty `<p></p>`, like an empty block cell | dropped | nothing |
| 8 | an empty `<em></em>` or `<strong></strong>` used as a marker | dropped | nothing, unless a block reads it, so never use an empty element as a marker |
| 9 | one link with partly bold text: `<a href=x><strong>Part 1</strong>Title</a>` | two links: `<strong><a href=x>Part 1</a></strong><a href=x>Title</a>` | **it changes the render.** The series cards split into two boxes until `foldSplitLinks` in `scripts/scripts.js` was added; it folds them back before any block decorates. A new block must not depend on anything else |
| 10 | `<em>A<br>B</em>` | `<em>A</em><br><em>B</em>` | nothing |
| 11 | entities such as `&middot;` | the character itself (`·`) | nothing in DA. **Here, keep non-ASCII as entities:** run `node stardust/scripts/deploy/sanitise.js <file>`, one file per run. Uploads carry no charset, so raw UTF-8 can turn into U+FFFD |

Never write what preview's Markdown can't carry: `data-` attributes, `style`, your own `id`s (anchors come from section metadata `id`), spans, classes outside block divs, inline SVG, iframes, buttons or forms. Data and settings go into block rows; looks go into section styles and block variants ([stardust/explainer-family.md](../stardust/explainer-family.md)).

Images: upload the file to DA first, under `/media/<section>/<slug>/` (`stardust/scripts/deploy/da-media-upload.mjs`), then reference it by its full `https://content.da.live/jackzhaojin/www-eds/media/…` URL. A page that points at an image DA doesn't have serves `about:error`.

**Keep every image here too,** in `content/media/` at the same path as in DA (`/media/certifications/x.png` is `content/media/certifications/x.png`). Then no image exists only in DA. On 2026-10-26 the 25 files that did (17 certification badges, 8 importer-drawn diagrams) were pulled in with `node stardust/scripts/pull-media.mjs <list> <report>`. It downloads each file from DA and checks it is byte-identical to the copy the site delivers. The other 408 images still have their originals only in jackzhaojin.github.io.

**Links and URLs readers or search engines follow** (the SEO and GEO audit, 2026-10-26, [ai-docs/2026-10-26-seo-geo-audit/](../ai-docs/2026-10-26-seo-geo-audit/README.md)):
- **Never link readers to `content.da.live`.** It's private (401) since the DA permissions sheet. An image's `src` there is fine, because delivery swaps it for the media copy, but an `<a href>` there stays as written. Link the copy www serves instead: `https://www.jackzhaojin.com/<path>/media_<hash>.<ext>`, which the page's own `<img>` shows on delivery.
- **Links to another Edge Delivery site lose their host.** Delivery rewrites every `https://` link to any `*.aem.page` or `*.aem.live` host into a relative path, whichever site it points at. Write such a link with `http://` (delivery leaves it alone, and browsers upgrade `.page` to https themselves), or use that site's own domain.
- **Every URL in metadata must be one www serves:** `json-ld` values, `image`, anything in the head. Old-site paths such as `/writing/<slug>/images/cover.jpg` 404 here; `node stardust/scripts/fix-dead-image-urls.mjs` swaps them for the byte-identical media copy.

## 2. Always check it in the browser

Push the changed documents to DA and preview them, without publishing:

```bash
printf '%s\n' /writing/<slug>/index > <scratch>/paths.txt   # web paths, without .html
DA_TOKEN=… node stardust/scripts/deploy/deploy-batch.mjs --org jackzhaojin --repo www-eds --branch main \
  --content content --paths <scratch>/paths.txt --force --no-publish
```

Then look at it in a browser (for Claude, the desktop app's built-in browser, not Playwright or Chrome):
- the page on `https://main--www-eds--jackzhaojin.aem.page/<path>` next to `https://gh.jackzhaojin.com/<path>`, the GitHub Pages original;
- what delivery made of it: diff `<path>index.plain.html` on aem.page against aem.live, the published version. An empty diff means the change rendered only what you meant.

## 3. For big edits: the editor round trip (optional)

Do this for a new block or explainer engine, an importer change, a page with unusual markup, or a change to more than a few blocks. It proves the editor keeps everything, and it gives you the editor's exact form to commit.

1. **Upload to a scratch path,** never the real page: `node stardust/scripts/roundtrip-batch.mjs upload <workdir> <path>.html …` writes each file to `/drafts/roundtrip/<path>`. Drafts are never previewed, and the query index excludes `/drafts/**`, so they never reach the sitemap.
2. **Open each one in the editor:** `https://da.live/edit#/jackzhaojin/www-eds/drafts/roundtrip/<path without .html>` (`… urls <workdir>` lists them). Opening is enough: the editor saves its version within about 20 seconds. Background tabs work, so several can be open at once.
3. **Collect and classify:** `… collect <workdir>` reads DA's copies back and compares them with this folder:
   - `pass`: content identical, and the markup differs only by the rewrites in the table above;
   - `pass-check-render`: the same, but with split links (rewrite 9); look at the render;
   - `review-markup`: content identical, but there's a rewrite that isn't in the table. Inspect it (`RT_CONTEXT=1 node stardust/scripts/roundtrip-compare.mjs <before> <after>`), add a row here and a rule in `canonical()` of the compare script, then collect again;
   - `content-changed`: the editor lost or added something. Don't adopt it. Change the content to a form the editor keeps, or change the block so it accepts the editor's form.
4. **Adopt:** copy `<workdir>/editor/<path>` over `content/<path>` and run `sanitise.js` on it. Then check it's stable: upload it again, open it again, and confirm DA's `last-modified` doesn't move. A stable document is one the editor leaves alone.
5. **Clean up:** deleting scratch documents in DA is Jack's call. Reusing `/drafts/roundtrip/` is fine.

## 4. Test that it still looks like the original

Gate every changed page against gh at both widths, preview against the GitHub Pages original:

```bash
node stardust/scripts/replica/run-bg.mjs start --name <slug>-1440 -- stardust/scripts/replica/gate.sh <slug> \
  https://gh.jackzhaojin.com/<path> https://main--www-eds--jackzhaojin.aem.page/<path> 1440 check --full --main main --marker "Jack Jin"
# the same at 360, then: node stardust/scripts/replica/run-bg.mjs wait
```

- **Many pages:** `gate-all.mjs --state stardust/rollout/gate-state-gh-preview.json --out stardust/replica/gates/gh-preview-<w> --width <w>`, with `--only <slug,…>` to pick pages. The state file maps every page from gh to aem.page.
- **A change to shared code** (a block, `styles/`, a template, `scripts/scripts.js`): also gate home and an article, on a preview branch first (`<branch>--www-eds--jackzhaojin.aem.page`; gate-all takes `--eds-host https://<that host>`, with the scheme), then main.
- **Editability:** `node stardust/scripts/deploy/ew-editability-probe.mjs <aem.page url> --simulate-editor` should report 0 dead and 0 duplicated.
- **The pass bar** is the replica gate's (`stardust:replica`, the source-fidelity gate). Rail thumbnails at 360 may need an entry in `stardust/replica/accepted.json` (register R7).
- **A page moved but you changed nothing visible?** Compare our two captures of it, the earlier `eds.png` against the new one (`node stardust/scripts/replica/pixel-compare.mjs <old> <new>`). 0.00% means the source moved, not us (on 2026-10-26, gh rendered the adaptTo article 6 px taller than www had).
- **zsh:** a URL list in a variable doesn't split into arguments. Write `${=URLS}`, or the probe silently checks one long "URL" and reports 0 authored texts.

## 5. Publish and record

- **Publish:** the same `deploy-batch.mjs` command, without `--no-publish`. Each publish purges Cloudflare (push invalidation), so www serves the new version within seconds. Browsers keep pages for 10 minutes (the Worker's `pageCache`), so a browser that loaded the page just before may need a hard reload.
- **After a batch publish, check www itself,** not just aem.live. A request that reaches Cloudflare in the seconds after the last purge, while aem.live is still updating, caches the old page, and nothing purges it for two days (on 2026-10-26, one of 29 pages). `curl` the changed pages on www; for one that is stale, publish it again, which purges again.
- **Check SEO** after a publish that touches metadata or links: `node stardust/scripts/seo-check.mjs` (www) prints every page with a dead JSON-LD, social image or internal link URL. On a preview host (`--base https://main--www-eds--jackzhaojin.aem.page`) the project sites also show as 404s, because only the www Worker serves them.
- **Commit:** `content/`, `content/.deploy-ledger.json`, and anything the gates recorded. Push to main after `git pull --rebase`, never force-push. **A content change is never a release:** no version, tag or release branch (AGENTS.md, "Releases are for code only").
- **New pages:** since the cutover (2026-10-26) new writing is published here, to EDS; a page added to GitHub Pages no longer shows on www. An article drafted as HTML converts with the recipe in [whats-left.md, section 5](../ai-docs/2026-10-25-initial-buildout-2-goals/whats-left.md). Then sync its SEO ([hlx-config/README.md](../hlx-config/README.md)): its head metadata, the redirects sheet, the sitemap.

## Listing pages: authored once, generated from the index

A listing page (the writing and talks hubs) is authored as a hero, one listing block and the
page metadata. The block has a single row, `Source | /writing-index.json` (block **Writing
index**) or `Source | /talks-index.json` (block **Row list (talks, dynamic)**). Never author
its rows or a `json-ld` metadata row: both are generated from the index.

- **On www** the edge Worker serves the page with the rows inside the block and one JSON-LD
  graph in the head (Person, WebSite, CollectionPage, BreadcrumbList, and an ItemList of the
  visible rows), so crawlers that don't run JavaScript get the whole list
  ([edge/README.md](../edge/README.md), `src/listings.mjs`). The Markdown copy
  (`<path>index.md`) isn't rewritten: it shows the Source row.
- **On preview hosts** (aem.page, no Worker) the browser builds the same rows and graph from
  the same code (`scripts/listing-cells.js`, `writing-index.js`, `talks-index.js`,
  `collection-schema.js`).
- **Publishing a source updates the list.** An article (its `listing-*` metadata) or a talk
  record goes into its index when published; www serves the new list within 5 minutes (the
  Worker's cache of the index, purged sooner by the publish). The hub itself isn't republished.

**Writing:** `/writing-index.json` indexes the article documents. The title and date come from
the h1 and `published-time`; optional `listing-*` metadata owns the card: summary, image
(a public www media URL), pipe-separated topics, reading and video times, the related talk
link and note, the watch link, search keywords and comma-separated keep-together title runs.
Without them the article's description and social image are the card's.

**Talks:** `/talks-index.json` indexes the records in `talks/records/`. A record's h1 is the
title and its link list the talk's links. Metadata carries `talk-id`, optional
space-separated `talk-aliases` (older anchors that still land on the row), `talk-order`
(ascending), the display `talk-date` as authored (keep a partial date partial), `talk-kind`,
`talk-event`, `talk-status` and the description. Records stay `noindex, follow`, out of the
general index and the sitemap (`hlx-config/query.yaml`).

**During review** `writing/index.html` and `talks/index.html` stay as they are (static rows);
`drafts/writing-index/` and `drafts/talks-index/` are the generated versions, preview only.
The switch, after the release that carries the Worker is deployed: replace each hub's rows
with the Source row, drop its `json-ld` row, keep its other metadata (and its indexability:
never carry over the drafts' `noindex` or `canonical`). Switch a hub before the Worker is
live and crawlers get an empty list. Keep draft paths out of production publish batches.

The records, the Admin API trail and the validation are in
[the talks index record](../ai-docs/2026-10-26-talks-json/README.md) and
[the writing index record](../ai-docs/2026-10-26-writing-index/README.md).

## Stop points

Ask Jack first for: an expired DA token, deleting anything in DA, any site config or Experience Workspace config change, any Cloudflare change, and the cutover.
