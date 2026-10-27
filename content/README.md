# Content: read this before changing anything here

**Decision (Jack, 2026-10-26):** this folder is the source of truth for the site's content. DA (Experience Workspace) is where the content is published from, not where it lives. Every change starts here and ends here, whether an agent or a person makes it. This file collects what we learn about doing that well; when a change teaches something new, add it here.

The record of the decision and the first full run over all 40 documents: [ai-docs/2026-10-26-content-in-git/](../ai-docs/2026-10-26-content-in-git/README.md).

**The process, briefly:** write the change here in the editor's own form, push it to preview, check it in the browser, publish it, commit it. Since the cutover, publishing goes straight to www.jackzhaojin.com.

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

Never write what preview's Markdown can't carry: `data-` attributes, `style`, your own `id`s (anchors come from section metadata `id`), spans, classes outside block divs, inline SVG, iframes, buttons or forms. Data and settings go into block rows; looks go into section styles and block variants ([stardust/explainer-family.md](../stardust/explainer-family.md)). Width is a section style too: a static page's sections keep the reading column unless their section metadata says `style | wide`, which runs them across the full content width, as the hero does (the privacy and terms pages; the library's Section metadata (wide)).

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
- the page on `https://main--www-eds--jackzhaojin.aem.page/<path>`, at 1440 and 360;
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

## 4. Test that it works

Pixel-perfect gating against the GitHub Pages original ended on 2026-10-26 (Jack: "we don't need pixel perfect as much anymore"). The design is v3's and can evolve; a page has to work, read well and stay editable:

- **Look at it** in the built-in browser at 1440 and 360: nothing cut off, no horizontal scroll, the blocks decorated, links working. For a change to shared code (a block, `styles/`, a template, `scripts/scripts.js`), also look at home and an article, on a preview branch first (`<branch>--www-eds--jackzhaojin.aem.page`), then main.
- **Code checks:** `npm run lint` and `node --test test/*.test.mjs`; for the Worker, `cd edge && npm test`.
- **Editability:** `node stardust/scripts/deploy/ew-editability-probe.mjs <aem.page url> --simulate-editor` should report 0 dead and 0 duplicated.
- **SEO:** `node stardust/scripts/seo-check.mjs --base https://main--www-eds--jackzhaojin.aem.page` before publishing, and on www after.
- **zsh:** a URL list in a variable doesn't split into arguments. Write `${=URLS}`, or the probe silently checks one long "URL" and reports 0 authored texts.

The replica gates (`stardust/scripts/replica/`) still run if a pixel comparison is ever wanted, but nothing requires them.

## 5. Publish and record

- **Publish:** the same `deploy-batch.mjs` command, without `--no-publish`. Each publish purges Cloudflare (push invalidation), so www serves the new version within seconds. Browsers keep pages for 10 minutes (the Worker's `pageCache`), so a browser that loaded the page just before may need a hard reload.
- **After a batch publish, check www itself,** not just aem.live. A request that reaches Cloudflare in the seconds after the last purge, while aem.live is still updating, caches the old page, and nothing purges it for two days (on 2026-10-26, one of 29 pages). `curl` the changed pages on www; for one that is stale, publish it again, which purges again.
- **IndexNow** (since 2026-10-27): a run that publishes ends by sending the pages that went live to IndexNow (`stardust/scripts/deploy/indexnow.mjs`), so Bing, which feeds Copilot, and the other IndexNow engines hear of them at once. Google doesn't take part. A failed ping prints its status and doesn't fail the run; `node stardust/scripts/deploy/indexnow.mjs <page paths>` sends it again. The key is the file at the site root, `<key>.txt`.
- **Check SEO** after a publish that touches metadata or links: `node stardust/scripts/seo-check.mjs` (www) prints every page with a dead JSON-LD, social image or internal link URL. On a preview host (`--base https://main--www-eds--jackzhaojin.aem.page`) the project sites also show as 404s, because only the www Worker serves them.
- **Commit:** `content/` and `content/.deploy-ledger.json`. Push to main after `git pull --rebase`, never force-push. **A content change is never a release:** no version, tag or release branch (AGENTS.md, "Releases are for code only").
- **New pages:** since the cutover (2026-10-26) new writing is published here, to EDS; a page added to GitHub Pages no longer shows on www. An article drafted as HTML converts with the recipe in [whats-left.md, section 5](../ai-docs/2026-10-25-initial-buildout-2-goals/whats-left.md). Then sync its SEO ([hlx-config/README.md](../hlx-config/README.md)): its head metadata, the redirects sheet, the sitemap.

## Listing pages: authored once, generated from the index

Writing, talks and the portfolio each have one page per item and a hub that lists them (since v1.1.1). A hub is authored as a hero, one listing block and the page metadata. The block has a single row: `Source | /writing-index.json` (block **Writing index**), `Source | /talks-index.json` (block **Row list (talks, dynamic)**) or `Source | /portfolio-index.json` (block **Row list (projects, dynamic)**). Never author its rows or a `json-ld` metadata row: both are generated from the index. The portfolio hub also keeps its gantt, career notes and smaller repos as authored blocks.

- **On www** the edge Worker serves the hub with the rows inside the block and one JSON-LD graph in the head (Person, WebSite, CollectionPage, BreadcrumbList, and an ItemList of the visible rows), so crawlers that don't run JavaScript get the whole list ([edge/README.md](../edge/README.md), `src/listings.mjs`). The Markdown copy (`<path>index.md`) isn't rewritten: it shows the Source row.
- **On preview hosts** (aem.page, no Worker) the browser builds the same rows and graph from the same code (`scripts/listing-cells.js`, `writing-index.js`, `talks-index.js`, `portfolio-index.js`, `collection-schema.js`).
- **Publishing a page updates its list.** An article, talk page or project page goes into its index when published; www serves the new list within 5 minutes (the Worker's cache of the index, purged sooner by the publish). The hub itself isn't republished. Unpublishing removes a page from its index, but only while the index's definition still matches that path (`hlx-config/2026-10-26-listing-indexes/`, step 5).
- **Check a hub before it publishes:** `node edge/scripts/preview-listing.mjs` serves a preview host through the Worker's render, so view-source shows what crawlers will get.

**Writing:** `/writing-index.json` indexes the article documents. The title and date come from the h1 and `published-time`; optional `listing-*` metadata owns the card: summary, image (a public www media URL), pipe-separated topics, reading and video times, the related talk link and note, the watch link, search keywords and comma-separated keep-together title runs. Without them the article's description and social image are the card's.

**Talks:** `/talks-index.json` indexes the talk pages, `talks/<id>/index.html` (web path `/talks/<id>/`). A page is a `hero page` (breadcrumb, the h1 title, the event line), then the date and kind line, the description, the recording as a lone YouTube link paragraph (it embeds), the status line, a `proof-links` block with the talk's links (the index reads them there), and a link back to `/talks/`; template `talk` (since v1.1.4: the event line is the head's italic accent subtitle, the date and kind line and the description sit under the head, and everything else goes in one story box, with a slide or diagram right before prose beside it on wide screens). Metadata carries `talk-id`, optional space-separated `talk-aliases` (older anchors that still land on the hub row), `talk-order` (ascending), the display `talk-date` as authored (keep a partial date partial), `talk-kind`, `talk-event` ("Event · Place · with co-speakers"), `talk-status`, the description (the hub row shows it in full), and for a recorded talk `video-uploaded` and `video-duration` (from the YouTube video; they make the page's VideoObject). A thin talk (one sentence) is `robots: noindex, follow`: it still lists on the hub. The first records, under `/talks/records/`, are unpublished and redirect to the pages.

**Portfolio:** `/portfolio-index.json` indexes the project pages, `portfolio/<slug>/index.html`. A page is the project's chapter section (style `chapter, <accent>`), its chapter head's title the page's h1 with the italic subtitle as the tagline, then a link back to `/portfolio/`; template `portfolio`. Metadata carries the title (`<name> | Jack Jin`, the list shows the name), the description, `image`, `project-order` (also the chapter numeral), `project-dates` (`2026` or `2025 to 2026`), `project-kind` (the build method) and `project-anchors` (the old `/portfolio/#ch-*` and `#p-*` ids, so old links land on the hub row). A GitHub link on the page makes its JSON-LD SoftwareSourceCode. On the hub's gantt, a project's label links to its page.

**Related lists:** a talk or project page that an article links to ends with a section headed `Related` holding a `Row list (related, dynamic)` block with the single row `Source | /writing-index.json` (before the way back on project pages, after the body on talk pages). The rows are the articles that link to the page, newest first (date, linked title, card summary), generated the same way as the hubs: the writing index records each article's links to talk and project pages (`pages`), and a new link counts once the article is published. If nothing links to the page, the browser hides the section; so add one only where an article links today.

**A talk or project page's JSON-LD** is generated too, from its own metadata and links (`scripts/page-schema.js`): the WebPage, its BreadcrumbList and an Event (talks) or SoftwareSourceCode or CreativeWork (projects). Don't add a `json-ld` row: a page with its own JSON-LD keeps it and gets nothing generated.

The records, the Admin API trail and the validation are in [the v1.1.1 record](../ai-docs/2026-10-26-pages-indexes-library/README.md), [the talks index record](../ai-docs/2026-10-26-talks-json/README.md) and [the writing index record](../ai-docs/2026-10-26-writing-index/README.md).

## The block library (Experience Workspace)

The editor's Library (Blocks and Templates) reads `/docs/library/`: one document per block at `docs/library/blocks/<block>.html`, each variant a section with an `h2` naming it, the block table copied from a real page, and a `library-metadata` block (`description`, `searchtags`); the `blocks` sheet (`docs/library/blocks.json`); the page templates at `docs/library/templates/<name>.html` (placeholder text, no `json-ld`); and the `templates` sheet. The site's DA config points at the two sheets ([hlx-config/2026-10-26-block-library/](../hlx-config/2026-10-26-block-library/EXECUTION.md)).

- **Rebuild it** after a block or variant changes: `node stardust/scripts/build-block-library.mjs --paths-out <scratch>/library-paths.txt --upload --preview`, then push the documents with `deploy-batch.mjs ... --paths <scratch>/library-paths.txt --no-publish`. Every example is pinned to a page in this folder, so a run fails loudly when that page no longer holds it.
- **Preview only, never publish:** www would serve them. The query index leaves `/docs/**` out, but a `deploy-batch.mjs` run without `--paths` (or with these paths and no `--no-publish`) would publish them. Keep `/docs/**` out of every publish batch.
- **In the editor:** Experience Workspace's tools panel menu > Library > Blocks (the Insert block dialog: expand a block, preview a variant, + inserts it) or Templates (preview, insert).

## Stop points

Ask Jack first for: an expired DA token, deleting anything in DA, any site config or Experience Workspace config change, any Cloudflare change, and the cutover.
