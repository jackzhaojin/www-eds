# Talks index research

Org `jackzhaojin`, site `www-eds`, ref `main`. Read-only inspection requested by Jack on
2026-10-26 while researching a dedicated talks index. Jack subsequently approved the index
configuration, validation, source records needed for that index, a dynamic draft, and a PR.
Merge/deployment and the production-content switch must wait for Jack and Claude's review.
No Cloudflare change is part of this work.

Skill: `hlx-admin-api-executor`. Authentication follows AGENTS.md: the valid da-auth cache
at `~/.aem/da-token.json`, sent as an Adobe IMS bearer token. The token is never printed or
stored here. The skill's browser-cookie authentication instructions do not apply to this site.

## Step 1: Read current index configuration - completed

- Objective: verify the live index definitions before recommending a change.
- Endpoint: `GET https://admin.hlx.page/config/jackzhaojin/sites/www-eds/content/query.yaml`
- Request body: none.
- Authentication: cached IMS bearer token, not recorded.
- Response: `execution-files/step-1.1-get-query-response.yaml`.
- Acceptance: HTTP 200; inspect index names, targets, inclusions and properties; compare with
  `hlx-config/query.yaml` without changing either configuration.

Result: HTTP 200 at 2026-10-26 18:56 ET. The live YAML matches the checked-out
`hlx-config/query.yaml` after trimming trailing whitespace. There is one index, `default`,
targeting `/query-index.json`, with title, description, image, template, published-time,
lastModified and robots. It excludes nav/footer fragments and `/drafts/**`. No talks index
or talk-specific field extraction is configured. Request status and UTC capture time are in
`execution-files/step-1.1-get-query-result.json`. No SET or reindex request was sent.

## Implementation authorization and execution

Jack's requested sequence: create the index with hlx Admin, validate, build/test a dynamic
talks listing in draft, open a PR, wait for Jack and Claude's review, then merge/deploy and
update production content. This explicit instruction authorizes steps 2-7 below. Operations
were executed sequentially; no token was printed or stored.

### Step 2: Fresh GET before - completed

`GET /config/jackzhaojin/sites/www-eds/content/query.yaml`: HTTP 200. Response:
`execution-files/step-2.1-get-query-before.yaml`. Verified default fields match the prior GET.
The empty records folder and unused draft path were checked before content creation.

### Step 3: SET merged index configuration - completed

`POST /config/jackzhaojin/sites/www-eds/content/query.yaml`, text/yaml: HTTP 204.
Payload: `execution-files/step-3.1-set-query-request.yaml`. Added `talks`, targeting
`/talks-index.json`, and `/talks/records/**` to default's exclusions. No default properties
were changed. The live mutation was authorized explicitly by Jack's step 1.

### Step 4: GET after - completed

HTTP 200. `execution-files/step-4.1-get-query-response.yaml` is semantically identical to
the submitted payload. Existing index fields were verified before and after the mutation.

### Step 5: Source records - completed

Each of nine new documents was uploaded to DA (PUT 201), previewed (POST 200), then published
(POST 200), one operation at a time. Definitions and responses: `execution-files/step-5-*`.
The records reproduce every talk's authored title, display date, kind, event, description,
status, links and old anchor aliases. Publishing is required for native index entries; these
records are noindex and excluded from the general index/sitemap.

### Step 6: Dynamic draft - previewed only

`/drafts/talks-index/index.html` was uploaded (201), then previewed (200). No live publish of
the draft or production talks document was performed. Definitions and responses:
`execution-files/step-6-*`.

### Step 7: Data validation - completed

The generated index returns HTTP 200 and nine records. Every field, URL, alias and ordering
value was checked against `execution-files/talks-expected.json`. The existing general index
and sitemap return 200 and contain no source-record paths. Captures: `execution-files/step-7-*`.
New records indexed through normal publication; no separate reindex mutation was needed.

### Step 8: PR review - pending

Build and test the dynamic block on the feature branch preview, open a PR, and wait for Jack
and Claude. Do not merge, deploy a release, or change production `/talks/` before that review.

## Future configuration changes

1. Agree on one document per talk and the record fields. Keep authored content in git.
2. Capture fresh query configuration after the ongoing main-branch SEO work has settled.
3. Prepare the complete merged query configuration, retaining the default index and sitemap
   source. Review the exact diff and payload with Jack before any SET.
4. Apply the reviewed configuration, then GET it again to verify persistence.
5. Preview/publish approved talk records and run the approved initial reindex as separate
   reviewed operations. Verify the resulting records and the existing default index.

Site configuration and content are shared across code branches; a worktree alone does not
isolate these actions. Use the configuration service, not retired root YAML configuration.
