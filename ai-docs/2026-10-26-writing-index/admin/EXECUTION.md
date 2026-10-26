# Writing index execution

Jack requested another native index and dynamic block for writing, extending the existing
draft PR before review. The production writing and talks hubs must remain static until
Jack and Claude approve the content switch. No Cloudflare or Experience Workspace config
change is part of this work.

Authentication uses the valid `~/.aem/da-token.json` cache as an IMS bearer token. No token
is printed or recorded. Operations run sequentially through `execute.mjs`; all mutation
request body paths, hashes, statuses and complete responses are in
`execution-files/operations.jsonl`. Source GET bodies are byte-identical to the referenced
git objects at `4af175a`; their SHA-256 hashes and git references retain that evidence without
duplicating every article body in this log.

## 1. Read and compare

The live query configuration was captured as `execution-files/query-before.yaml`. All 29 DA
article sources returned 200 and exactly matched git before editing. The draft path returned
404. The published writing hub and a representative article were captured as plain HTML.
All 29 published card cover URLs returned 200.

## 2. Prepare source metadata and configuration

Added namespaced listing metadata for the existing card summary, image, topics, reading and
video times, related talk link/note, watch link, keywords and title keep-together hints. The
h1 and published-time already supply the title and date. Existing article bodies and every
previous metadata field are byte-preserved; proof is `execution-files/metadata-only-proof.json`.

Added the `writing` index at `/writing-index.json`, including article paths under `/writing/`
and excluding the hub and nav/footer fragments. The default and talks definitions are
semantically unchanged. Full payload: `execution-files/query-request.yaml`.

## 3. Apply and verify

Fresh GET verified the configuration had not changed. POST returned 204; GET after returned
200 and was semantically identical to the submitted payload (`execution-files/query-after.yaml`).
Each source article was uploaded, previewed, then published sequentially; all returned 200.
Publishing populated the new index without a manual JSON export or extra reindex request.

The new `/drafts/writing-index/` page was uploaded (201) and previewed (200), with no live
publish. It contains one Writing index Source row, no static article rows, and no static
ItemList. It is noindex and canonicalizes to the production writing hub.

## 4. Validate

The native API returns 29 articles. All card fields match the original authored listing:
`../validation/api.json`. The h1/body and existing SEO metadata of each source article are
unchanged. Browser/filter/schema checks and fidelity results are recorded in `../validation/`.

## 5. Review boundary

Extend https://github.com/jackzhaojin/www-eds/pull/2 with the writing implementation and wait
for Jack and Claude. Merge, release deployment and the two production hub switches remain
separate later steps. The index and source metadata needed to exercise the draft are live;
neither production hub has been converted to the dynamic blocks.
