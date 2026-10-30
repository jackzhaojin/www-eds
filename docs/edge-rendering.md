# Edge-side rendering

The writing, talks and portfolio hubs on www list every article, talk and project (49 rows between them today), and nobody types those lists. Each hub is authored as one block with a single row that names an index. On the way out of Cloudflare, the Worker reads that index and writes the full list, and the structured data that describes it, into the HTML. Readers, search engines and AI crawlers all get the finished page in the first response.

This page explains the idea, shows it working on the live site, and walks through the code. The Worker as a whole is in [cloudflare-worker.md](cloudflare-worker.md).

## The idea

```mermaid
flowchart LR
  subgraph DA["What the author writes"]
    a["Row list (talks, dynamic)<br/>Source | /talks-index.json"]
  end
  subgraph EDS["What publishing keeps current"]
    i["/talks-index.json<br/>one record per talk page"]
  end
  subgraph WWW["What www serves"]
    s["the same block, plus 9 talk rows<br/>and a JSON-LD graph in the head"]
  end
  a --> w(("Cloudflare<br/>Worker"))
  i --> w
  w --> s
```

- The **author** writes the hub once: a hero, the listing block with its `Source` row, and the page metadata.
- **Edge Delivery** keeps the index current: publishing a talk page adds or updates its record in `/talks-index.json`.
- The **Worker** joins the two on every request. Publish a new talk and the hub lists it, without anyone opening the hub.

## Why at the edge

A list built by JavaScript in the browser is invisible to anything that doesn't run JavaScript. When the hubs were first rebuilt as generated lists (as drafts, on 2026-10-26), the served HTML of the writing draft had 0 article links, against 29 on www. Google runs JavaScript, but most AI crawlers and agents (GPTBot, ClaudeBot, PerplexityBot) read the HTML as it arrives. The switch would have emptied both hubs for them.

Jack's requirements for the fix: no manual data entry, JSON-LD "code-generated, not authored", and an authoring experience worth demoing. Asked where the code should render: "Edge Worker". The options looked like this:

| Where the list is built | Crawlers that don't run JavaScript | Author's work | |
|---|---|---|---|
| typed by the author into the hub | see it | every new item means editing the hub and its JSON-LD by hand, and the two drift | how the hubs worked until v1.1.1 |
| by the browser only | see an empty block | none | what preview hosts still do |
| by Edge Delivery's servers | would see it | none | not possible: Edge Delivery renders documents and runs no site code |
| **by the Cloudflare Worker** | **see the whole list and its JSON-LD** | **none** | **what www does since v1.1.1** |

The full record of that decision is in [ai-docs/2026-10-26-writing-index/](../ai-docs/2026-10-26-writing-index/README.md#edge-rendering-and-generated-json-ld-claudes-review-2026-10-26).

## See it yourself

The same page from Edge Delivery directly (no Worker) and from www (through the Worker):

```bash
for host in main--www-eds--jackzhaojin.aem.live www.jackzhaojin.com; do
  curl -s "https://$host/writing/" | grep -o 'href="/writing/20[^"]*"' | sort -u | wc -l
done
```

Measured on 2026-10-30:

| Page | aem.live, as authored | www, rendered at the edge |
|---|---|---|
| `/writing/` | 0 article links, no JSON-LD | 29 article links, one JSON-LD graph with an ItemList of 29 |
| `/talks/` | 0 talk links, no JSON-LD, 3 KB | 9 talk links, one JSON-LD graph with an ItemList of 9, 16 KB |
| `/portfolio/` | the gallery block empty, no JSON-LD | 11 project cards, one JSON-LD graph with an ItemList of 11 |
| `/talks/adaptto-2026/` | the Related list empty, no JSON-LD | the articles that link to the talk, and a graph with the WebPage, its breadcrumb and the talk as an Event |

In a browser, open the hub, then the developer console:

```js
document.querySelector('.writing-index').dataset.rendered
```

It says `server` on www (the Worker filled it) and `browser` on aem.page (the browser did).

### Before and after

What Edge Delivery serves for the talks hub's block, exactly as authored:

```html
<div class="row-list talks dynamic">
  <div>
    <div>Source</div>
    <div><a href="/talks-index.json">/talks-index.json</a></div>
  </div>
</div>
```

What www serves (one of the 9 rows shown, shortened):

```html
<div class="row-list talks dynamic">
  <div>
    <div>Source</div>
    <div><a href="/talks-index.json">/talks-index.json</a></div>
  </div>
  <div><div><p>September 29, 2026</p><p>Conference session</p></div><div><h2 id="ai-agent-driven-content-migration-for-edge-delivery-services"><a href="/talks/adaptto-2026/">AI Agent-Driven Content Migration for Edge Delivery Services</a></h2>...</div></div>
  ...
</div>
```

And in the head, one graph: `Person`, `WebSite`, `CollectionPage`, `BreadcrumbList` and an `ItemList` of the rows.

The generated rows are the same cells an author would have typed. The block's own JavaScript then decorates them exactly like authored rows, so nothing downstream knows the difference.

## How it works

```mermaid
sequenceDiagram
  autonumber
  participant R as Reader or crawler
  participant W as Worker
  participant C as Cloudflare cache
  participant E as Edge Delivery
  R->>W: GET /talks/
  W->>C: the page, through Adobe's worker
  C-->>W: the page as authored (cached up to 2 days)
  W->>W: a 200 HTML page with a listing block? read its Source row
  W->>C: /talks-index.json on aem.live, every page of it
  alt cached (5 min)
    C-->>W: the index
  else not cached
    C->>E: fetch the index
    E-->>C: JSON records
    C-->>W: the index
  end
  W->>W: build the rows and the JSON-LD with the shared code
  W->>W: write them into the block and the head
  W-->>R: the finished page, browsers keep it 10 min
```

The code is `renderListings` in [`edge/src/listings.mjs`](../edge/src/listings.mjs). In order:

1. **Only pages.** It acts on a `GET` that came back `200` as HTML, on a path ending in `/` or a name without a dot. Code, media, JSON, `.plain.html` fragments and the Markdown copies (`index.md`) pass through untouched.
2. **Find the listing.** It looks for one of four exact opening tags (the table below). A page without one goes out as it came.
3. **Read the Source row.** The first link in the block names the index, and it has to end in `.json`.
4. **Load the index from aem.live,** not from www: a Worker's fetch to its own zone's hostname reaches the zone's origin, which is GitHub Pages. It reads every page of the index (200 records a page), gives the whole load 3 seconds, and lets Cloudflare cache it for 5 minutes (`INDEX_TTL`).
5. **Build the rows** with the same functions the browser uses, and write them into the block right after the Source row.
6. **Build the JSON-LD** (`collectionGraph`): the Person, the WebSite, the CollectionPage, its BreadcrumbList and an ItemList of the visible rows. Any authored CollectionPage graph is dropped, so the page has exactly one, and the new graph goes in before `</head>`. A Related list gets no graph of its own.
7. **Talk and project pages** (`renderPageSchemaHTML`): a page whose head carries `talk-id` or `project-order` metadata and no JSON-LD of its own gets a graph built from its head and links (`scripts/page-schema.js`): the WebPage, its BreadcrumbList, and an Event for a talk or a SoftwareSourceCode or CreativeWork for a project.
8. **Fix the headers.** The body changed, so `content-length` goes, and on a filled page so do `etag` and `last-modified`, which described the authored page and would let a browser keep an old list. Then the usual 10-minute browser cache applies.

## The four listings

| Block, as written in DA | Class the Worker looks for | Index | Rows | JSON-LD | Used on |
|---|---|---|---|---|---|
| Writing index | `writing-index` | `/writing-index.json` | one card per article: date, topics, title, summary, cover | CollectionPage and ItemList | `/writing/` |
| Row list (talks, dynamic) | `row-list talks dynamic` | `/talks-index.json` | one row per talk | CollectionPage and ItemList | `/talks/` |
| Row list (projects, dynamic) | `row-list projects dynamic` | `/portfolio-index.json` | one gallery card per project | CollectionPage and ItemList | `/portfolio/` |
| Row list (related, dynamic) | `row-list related dynamic` | `/writing-index.json` | the articles that link to this page, newest first | none: the page's own graph describes it | talk and project pages |

How to author them, and what each index reads from a page, is in [content/README.md](../content/README.md#listing-pages-authored-once-generated-from-the-index).

## One generator, two places

The Worker doesn't have its own copy of the listing logic. It imports the browser's modules from `scripts/`, and Wrangler bundles them in at deploy time.

```mermaid
flowchart TB
  subgraph shared["scripts/: shared modules"]
    idx["writing-index.js, talks-index.js, portfolio-index.js<br/>read an index, turn records into rows"]
    cells["listing-cells.js<br/>rows as data, then HTML or DOM"]
    ld["collection-schema.js, page-schema.js<br/>records to JSON-LD"]
  end
  edge["edge/src/listings.mjs<br/>the Worker, on www"] --> idx & cells & ld
  blocks["blocks/writing-index, blocks/row-list<br/>the browser, on preview hosts"] --> idx & cells & ld
```

Rows are built as data first (a row is a list of cells, a cell a list of nodes). `rowsToHTML` turns them into markup for the Worker, `rowsToDOM` into elements for the browser. So the HTML a crawler reads and the page a person sees come from one implementation and can't disagree.

When the block runs in the browser, it checks whether the edge already did the work (`fillFromIndex` in `scripts/query-index.js`):

```mermaid
flowchart TD
  d["the block decorates in the browser"] --> q{"rows after<br/>the Source row?"}
  q -->|"yes: www"| s["keep them<br/>data-rendered = server"]
  q -->|"no: a preview host,<br/>or the edge gave up"| f["fetch the index, build the rows<br/>data-rendered = browser"]
  s --> dec["the same decoration either way:<br/>filters, gallery, anchors, the hidden Source row"]
  f --> dec
```

The Source row stays in the page, hidden, so Experience Workspace can still edit it.

| Where you look | Who fills the list |
|---|---|
| www.jackzhaojin.com | the Worker |
| `*.aem.page`, `*.aem.live`, a branch's preview host | the browser |
| `localhost:3000` (`aem up`) | the browser |
| `localhost:8788` (`node edge/scripts/preview-listing.mjs`) | the Worker's render, run on your machine over aem.page |
| archive.jackzhaojin.com | nobody: the snapshot was taken from www, already filled |

## Freshness

```mermaid
flowchart LR
  p["publish an article"] --> i["Edge Delivery adds it<br/>to /writing-index.json"]
  i --> g["the Cloudflare zone is purged<br/>(push invalidation)"]
  g --> n["the next request to /writing/<br/>reads the new index"]
  n --> l["the hub lists the article"]
```

The hub is never republished for this. If the purge doesn't reach the cached index, it expires on its own within 5 minutes. Unpublishing a page takes it out of its index, and so out of the list (while the index's definition still covers that path: [content/README.md](../content/README.md#listing-pages-authored-once-generated-from-the-index)).

## When things go wrong

The edge render is an improvement layered on a page that already works without it.

```mermaid
flowchart LR
  w["the Worker fills it"] -->|"index errors, is empty,<br/>or takes over 3 s"| b["the page goes out as authored,<br/>the browser fills it"]
  b -->|"index errors or<br/>takes over 5 s"| m["a message:<br/>temporarily unavailable"]
```

- Any error while filling a listing is caught and logged (`listing on /talks/ left to the browser: ...`), and the block goes out as authored. A hub then keeps the origin's validators (`etag`, `last-modified`), since its body is the origin's.
- People still see the list, a moment later. Crawlers that don't run JavaScript see an empty block until the index is back.
- If the Worker itself is removed (the rollback), www goes to GitHub Pages, and none of this applies.

## Limits worth knowing

- **Exact class match.** The Worker looks for the block's exact opening tag. Write the variants in the order shown (`Row list (talks, dynamic)`, not `(dynamic, talks)`), and if a dynamic block ever gets another variant, add its class string to `LISTINGS` too. Otherwise the browser still fills it, but crawlers get an empty block.
- **One listing per page.** The Worker fills one listing block per page. A second dynamic listing on the same page would be filled by the browser only.
- **The Markdown copy isn't rendered.** `<path>index.md` shows the Source row, not the list.
- **Text, not a DOM.** The Worker reads the page into memory and edits it as text with a few patterns. Pages are small (the talks hub is 3 KB as authored, 16 KB filled), and it keeps the render a pure function that runs in plain Node, which is how the tests and `preview-listing.mjs` run it. The cost: if Edge Delivery ever changed how it writes a block's opening tag, the edge render would quietly hand over to the browser. The `curl` check above catches that.
- **Rebuilt per request.** The finished page isn't cached; its two inputs are. Building the rows is quick next to the network.

## Changing it

To add a new dynamic listing:

1. **An index.** Add its definition to [`hlx-config/query.yaml`](../hlx-config/query.yaml) (an Admin API change, Jack's call), and publish the pages it should hold.
2. **A module in `scripts/`** that loads the index and turns records into rows and JSON-LD items. `scripts/talks-index.js` is the smallest example.
3. **The browser side.** An entry in `DYNAMIC` in `blocks/row-list/row-list.js`, or a block of its own that calls `fillFromIndex`.
4. **The edge side.** An entry in `LISTINGS` in `edge/src/listings.mjs`, with the block's exact opening tag.
5. **A test** in `edge/test/worker.test.mjs`, then `cd edge && npm test`.
6. **Look at it as www will serve it:**

   ```bash
   node edge/scripts/preview-listing.mjs
   ```

   Open `http://localhost:8788/<hub path>` and view the source: the rows are in the block and the graph is in the head. The `x-listing` response header says `filled` or `untouched`.
7. **Ship it.** The code change is a release, and the Worker goes out with `wrangler deploy` (Jack's call). Only then publish the hub with just its Source row: until the Worker knows the block, crawlers on www would get it empty.

## Further reading

- [edge/README.md](../edge/README.md#a-request-in-order-srcindexmjs), step 6: the operating notes
- [content/README.md](../content/README.md#listing-pages-authored-once-generated-from-the-index): how to author listing pages and Related lists
- [ai-docs/2026-10-26-writing-index/](../ai-docs/2026-10-26-writing-index/README.md): why it renders at the edge
- [ai-docs/2026-10-26-pages-indexes-library/](../ai-docs/2026-10-26-pages-indexes-library/README.md): v1.1.1, one page per talk and project and the hubs switched over
