# EXECUTION: push invalidation for www.jackzhaojin.com (2026-10-26)

Org `jackzhaojin`, site `www-eds`, base `https://admin.hlx.page`, following [Adobe's Cloudflare worker setup](https://www.aem.live/docs/byo-cdn-cloudflare-worker-setup), "Setup push invalidation". Auth for the Admin API: the da-auth IMS token as `Authorization: Bearer` (never printed or saved). Requested by Jack after a publish didn't show on www for him: every response carries `cache-control: max-age=7200`, and nothing purges Cloudflare on publish yet. His words: "follow through https://www.aem.live/docs/byo-cdn-cloudflare-worker-setup with our da.live token ... feel free to use attached browser, i logged into cloudflare already". Cloudflare config isn't a code release (AGENTS.md).

**The token never passes through Claude.** Claude fills in the token form in the built-in browser; Jack clicks Create and copies the value. Jack pastes it into a hidden prompt in his own terminal. A prepared command checks it with Cloudflare and posts it to the Admin API, printing only status lines. No file here holds it.

The zone is on Cloudflare's **free** plan, so Adobe purges the whole zone on each publish ("Purge All"); only enterprise zones are purged by URL and cache tag.

## Step 1: GET the CDN config (before) ✅ COMPLETED

`GET /config/jackzhaojin/sites/www-eds/cdn.json` and `.../cdn/prod.json`: `step-1.1-*.json`.

**Result:** 200. `{"prod":{"host":"www.jackzhaojin.com"}}`, site config version 8: only the production host, set on 2026-10-25 ([../2026-10-25-seo-config/EXECUTION.md](../2026-10-25-seo-config/EXECUTION.md)).

## Step 2: create the Cloudflare Cache Purge token ✅ COMPLETED

In the dashboard (My Profile > API Tokens > Create Token > Create Custom Token):
- name: "www-eds AEM push invalidation (Cache Purge)";
- permission: Zone > Cache Purge > Purge;
- zone resources: Include > Specific zone > jackzhaojin.com;
- no expiry, no IP filtering.

Claude filled in the form; Jack created the token. He first pasted it into the chat by mistake, so he **rolled it** in Cloudflare (which made that value useless) and used the new one in step 3.

## Step 3: SET the CDN config with the token ✅ COMPLETED

`POST /config/jackzhaojin/sites/www-eds/cdn/prod.json`, `Content-Type: application/json`, with `{"host": "www.jackzhaojin.com", "type": "cloudflare", "plan": "free", "zoneId": "fdf0c615f7429cee464f8f9ca834852c", "apiToken": <the token>}`. The shape without the token: `execution-files/step-3.1-set-cdn-prod-request.json`. Jack runs it from his terminal (`set-cdn-token.sh`); the response isn't kept, because it may echo the token.

**Result:** `Cloudflare token check: active`, then `Admin API cdn/prod.json update: HTTP 200`.

## Step 4: GET the CDN config (after) ✅ COMPLETED

The same GET as step 1, recording only which keys are present and that `apiToken` exists, never its value.

**Result:** 200, site config version 9: `host`, `type: cloudflare`, `plan: free`, `zoneId`, and `apiToken` set (53 characters). `step-4.1-get-cdn-prod-response.json` holds a marker in place of the value.

## Step 5: Cloudflare caching settings, per the guide ✅ COMPLETED

Caching > Configuration: Caching Level "Standard", Browser Cache TTL "Respect Existing Headers". Caching > Cache Rules: a rule for the zone's hostnames, "Eligible for cache", with Browser TTL "Respect origin TTL". Check what's there; change only what differs, with Jack saving.

**Result:** Caching Level was already Standard, and Browser Cache TTL already "Respect Existing Headers": nothing to change. There were no cache rules, and **the guide's rule was left out on purpose.** For the EDS pages, Adobe's worker code already makes responses cacheable (`cacheEverything`), so the rule's job is done. The rule would also start caching the HTML of the GitHub Pages project sites and of gh, and on a free plan every publish would then purge those too. It's a one-click addition if that's ever wanted.

## Step 6: the Worker ✅ COMPLETED

Remove `PUSH_INVALIDATION = "disabled"` from `edge/wrangler.toml` (production then defaults to enabled, as the guide says), then redeploy the top level (`npx wrangler deploy --env=""`). Staging and gh stay as they are.

**Result:**
- The dry run carried no `PUSH_INVALIDATION` var, and the 12 tests passed.
- Deployed `www-eds-edge` version `9cf85aef-82b8-470c-b642-136c89ff9a18`, replacing `fa323e37`, the rollback target.
- www now answers `cdn-cache-control: max-age=172800`: two days at the edge, purged on publish. Before, it was `max-age=300`, re-checked every 5 minutes, because nothing purged.
- Browsers are still told `cache-control: max-age=7200`, as aem.live sends it.
- `check-host.mjs` passes on www, eds and gh.

## Step 7: verify ✅ COMPLETED

Publish a page, then check that www serves the new version right away (Cloudflare purged). Also record the cache headers aem.live sends now that push invalidation is enabled.

**Result:**
- Before the publish, `/privacy/` on www was a Cloudflare HIT four times in a row.
- After `POST /live/jackzhaojin/www-eds/main/privacy/` (200, `step-7.1-live-privacy-response.json`), the next requests were a **MISS** within 3 seconds: the zone had been purged.
- From about 12 seconds on it was a HIT again, cached for two days until the next publish.

**What it doesn't change:** a browser that loaded a page in the last two hours keeps its copy (`max-age=7200`), so the author sees an update after a hard reload. Shortening that would take the Worker setting its own `cache-control` for pages. That's a code change in `edge/src` (a release) and Jack's call.
