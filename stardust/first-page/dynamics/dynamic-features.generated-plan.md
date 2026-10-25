<!-- stardust provenance: skill=stardust:dynamics · phase=plan draft · 2026-10-25T13:39:48.469Z · input stardust/first-page/current/_dynamics.json (1 pages, 5 findings) · target probe main--www-eds--jackzhaojin.aem.live -->
# Dynamic features — draft inventory (curate into `stardust/dynamic-features.md`)

One row per detected finding. Merge duplicates, drop noise, keep every axis honest. Columns: disposition = what we do · target = the delivery form (widget where no authored rows remain) · reproducibility = what it needs · status = where it stands (reference/triage.md).

| # | id | class | feature | pages | disposition | target | reproducibility | status | pattern | decision needed | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | a-cms-app-settings-object-datalayer | A | CMS / app settings object dataLayer | 1/1 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 2 | i18n-locale-variants-in | I18N | locale variants in | 1/1 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 3 | t-unknown-third-party-host-static-cloudflareinsights-com | T | unknown third-party host static.cloudflareinsights.com | 1/1 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 4 | t-tag-manager-google-tag-manager | T | tag manager: Google Tag Manager | 1/1 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 5 | t-analytics-google-analytics-ads | T | analytics: Google Analytics / Ads | 1/1 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |

## Triage

- **Ships autonomously (reproducibility `self`):** 1 row(s) — read-settings.
- **One owner decision batch:** 4 row(s) — scope of the locale trees · which tags run on the new host; property ids.
- **Already delivered by the capture pipeline:** 0 row(s) — no work.
- **Host-bound on the target:** 0 of 0 probed API paths — the off-origin data work.

## Phases

- **tags** — 3
- **detect** — 1
- **locale wave** — 1
