#!/usr/bin/env bash
# Step 3: registers the Cloudflare Cache Purge token in the site's CDN config (push invalidation).
# Run it yourself, in your own terminal: it asks for the token at a hidden prompt, checks it with
# Cloudflare, and posts it to the Admin API. It prints only status lines; the token isn't echoed,
# logged or written anywhere, and the Admin API's response (which may echo it) is discarded.
# Admin API auth: the da-auth token cache (~/.aem/da-token.json), never printed.
set -euo pipefail

ZONE_ID="fdf0c615f7429cee464f8f9ca834852c"   # jackzhaojin.com, not a secret
CONFIG_URL="https://admin.hlx.page/config/jackzhaojin/sites/www-eds/cdn/prod.json"

printf 'Paste the Cloudflare Cache Purge token (hidden), then Enter: '
read -rs CF_TOKEN
echo
[ -n "$CF_TOKEN" ] || { echo "No token entered; nothing sent."; exit 1; }

status=$(curl -s -H "Authorization: Bearer $CF_TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify | jq -r '.result.status // "invalid"')
echo "Cloudflare token check: $status"
[ "$status" = "active" ] || { unset CF_TOKEN; echo "Not active; nothing sent to the Admin API."; exit 1; }

DA_TOKEN=$(node -e "const t=require(process.env.HOME+'/.aem/da-token.json');if(t.expires_at>Date.now()+60000)process.stdout.write(t.access_token)")
[ -n "$DA_TOKEN" ] || { unset CF_TOKEN; echo "The da-auth token has expired: run da-auth-helper first."; exit 1; }

jq -n --arg t "$CF_TOKEN" --arg z "$ZONE_ID" \
  '{host: "www.jackzhaojin.com", type: "cloudflare", plan: "free", zoneId: $z, apiToken: $t}' \
  | curl -s -X POST -H "Authorization: Bearer $DA_TOKEN" -H 'Content-Type: application/json' --data @- \
      -o /dev/null -w 'Admin API cdn/prod.json update: HTTP %{http_code}\n' "$CONFIG_URL"
unset CF_TOKEN DA_TOKEN
echo "Done. Claude checks the result with a GET that records only which keys are set."
