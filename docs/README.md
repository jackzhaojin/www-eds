# Docs

How www.jackzhaojin.com works, written for people. Start here if you want to understand the system, show it to someone, or change it without reading the whole build record first.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="images/edge-hero-dark.png">
  <img alt="Edge-side rendering on www.jackzhaojin.com: the author writes a Writing index block with one Source row naming /writing-index.json, Edge Delivery keeps that index current, and the Cloudflare Worker reads it and writes 29 rows of HTML and one JSON-LD graph into the page, so everyone gets the finished /writing/ page" src="images/edge-hero-light.png">
</picture>

The highlight: a Cloudflare Worker builds the listing pages at the edge. See [edge-rendering.md](edge-rendering.md).

The other docs in this repo have different jobs:
- [`ai-docs/`](../ai-docs/) is the build record: what happened each day, the prompts, the decisions, written as it went (mostly for agents and for history).
- [`edge/README.md`](../edge/README.md), [`content/README.md`](../content/README.md) and [`hlx-config/README.md`](../hlx-config/README.md) are the operating manuals: the exact commands and rules for the Worker, for content and for the site config.
- These docs explain the design, with diagrams, and link to the manuals for the details.

## What's here

| Doc | Read it for |
|---|---|
| [architecture.md](architecture.md) | the whole system on one page: where content and code come from, which host serves what, who renders which part of a page, and how a change gets to readers |
| [cloudflare-worker.md](cloudflare-worker.md) | the Cloudflare Worker in front of www: what it does to every request, its three environments, the caches, search engines, the safety nets |
| [edge-rendering.md](edge-rendering.md) | edge-side rendering: listing pages and structured data built inside the Worker, so every reader and every crawler gets the finished page. The part worth demoing |

If you read one, read [edge-rendering.md](edge-rendering.md). If you read them all, go in the order above.

## Words you'll see

| Term | What it means here |
|---|---|
| **EDS** (Edge Delivery Services) | Adobe's publishing platform that serves this site. It turns documents into fast HTML pages and serves the code from GitHub. Its hosts are `*.aem.page` (preview) and `*.aem.live` (published) |
| **DA** (Experience Workspace, da.live) | where pages are written and edited. DA is the source of truth for content |
| **Block** | a reusable piece of a page, authored as a small table (first row is the block's name, the rest are its rows) and styled and scripted by `blocks/<name>/` |
| **Index** (query index) | a JSON file EDS keeps up to date as pages are published, such as `/writing-index.json`: one record per page with its title, date, description and chosen metadata |
| **Cloudflare Worker** | a small JavaScript program that runs in Cloudflare's data centers on every request to a route, before Cloudflare's cache. Ours is in [`edge/`](../edge/) |
| **Edge** | those data centers, close to the reader. "At the edge" means in the Worker, after the request leaves the reader and before it reaches Adobe |
| **JSON-LD** | structured data in a `<script type="application/ld+json">` tag in the page head. Search engines and AI assistants read it to know what a page is about (a person, an event, a list of articles) |
| **Preview and publish** | an edit in DA is previewed to `aem.page` first, then published to `aem.live`, which is what www serves |

## Conventions

- **Diagrams are [Mermaid](https://mermaid.js.org/)** in the Markdown. GitHub draws them; in an editor without a Mermaid preview, the source still reads top to bottom.
- **Pictures are built, not drawn by hand.** `docs/images/` comes from [`docs/scripts/build-images.mjs`](scripts/build-images.mjs), which reads the live site (aem.live and www) and renders each illustration in the site's own colors and faces, light and dark (the docs show the one that matches your theme). The numbers, titles and HTML in them are the day's. Run it again after the Worker or a hub changes: `node docs/scripts/build-images.mjs`.
- **Not served.** `docs/` is in [`.hlxignore`](../.hlxignore), so Edge Delivery never serves these files. Don't confuse this folder with the site path `/docs/library/`: that's the editor's block library, which is content in DA (its examples are in `content/docs/`), not this folder.
- **Facts are dated.** Numbers measured against the live site say when. They were last checked on 2026-10-30, and the pictures built on 2026-10-31.
- **Keep them true.** When a change touches what a doc describes (`edge/src/`, the listing scripts in `scripts/`, the hosts, the caches), update the doc in the same commit.
