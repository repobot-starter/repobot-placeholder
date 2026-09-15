# Analytics

Analytics is a modular kernel capability with the same config-shaped design
as jobs (`docs/jobs.md`) and storage (`docs/storage.md`): first-party,
cookieless pageview counting for the deployed app. The defining design
choice is that **privacy is enforced at the write, not by a later cleanup**
— no cookies, no client-side storage, no fingerprinting, and no raw IP or
user agent ever reaches a table. The visitor identity is a daily-salted
hash computed server-side and discarded with the raw events.

| Layer   | Where                                                           | What it owns                                                                                                              |
| ------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Data    | `firebase/functions/src/Data/Analytics/`                        | `analytics_events` (raw pings: day, path, visitor hash) and the `analytics_daily` / `analytics_page_daily` rollup tables. |
| Config  | `firebase/functions/src/Services/Analytics/AnalyticsConfig.ts`  | The one tuning surface: retention windows, rollup window, path length cap.                                                |
| Service | `firebase/functions/src/Services/Analytics/AnalyticsService.ts` | Bot filtering, path normalization, visitor hashing, the convergent rollup + retention pruning.                            |
| HTTP    | `firebase/functions/src/CloudFunctions/Analytics.ts`            | `analytics__request__api`: the public `POST /pageview` beacon endpoint.                                                   |
| Client  | `web/core/src/Analytics/AnalyticsBeacon.ts`                     | Endpoint derivation from the GraphQL URL and the fire-and-forget `sendPageview` ping.                                     |
| App     | `web/app/src/Config/PageviewBeacon.tsx`                         | One ping per route change, mounted once in `App.tsx`. Renders nothing; swallows every failure.                            |

## The beacon

`POST /pageview` on `analytics__request__api` takes `{ path }` and answers 204. It is deliberately public (a pageview ping precedes any sign-in) and
deliberately boring: a 4 KB body cap, a fire-and-forget response, and a
swallow-everything error path — analytics must never break or slow the app
it measures. The client half (`sendPageview`) uses `fetch` with
`keepalive` so pings survive navigation away, and swallows all failures
(ad blockers, offline tabs).

The endpoint URL is derived from the GraphQL URL by swapping the trailing
function name (`deriveAnalyticsEndpoint`), the same way the storage and
documents kernels derive theirs — no extra env var.

## The visitor identity (cookieless uniques)

`visitorHashFor` is sha256 of the visitor's IP + user agent, salted with
an HMAC of the UTC day under the environment's existing secret
(`AUTH_JWT_SECRET`, falling back to `LOCAL_AUTH_SECRET`, else a random
per-process seed in bare sandboxes). Consequences, all load-bearing:

- The same visitor counts once per day (approximate uniques), with no
  cookie and no client-side identifier.
- The salt rotates every UTC day, so hashes are unlinkable across days —
  no long-term profile can be reconstructed even from the raw table.
- Neither the IP nor the user agent is ever stored; they exist only as
  hash input inside the request handler.

Self-declared bots (crawler user agents, empty user agents) are dropped at
the write. Sophisticated bots are indistinguishable without fingerprinting,
which this kernel refuses to do — approximate numbers are the accepted
trade-off.

## Rollups and retention

The `analytics-rollup` job (a jobs-kernel consumer, `docs/jobs.md`) runs
hourly at :10. Each run convergently recomputes today and yesterday (UTC)
from raw events — delete-then-insert per day, so shrunken or expired days
converge instead of keeping stale rows — then prunes raw events older than
7 days and rollup rows older than 90 days (both windows live in
`AnalyticsConfig.ts`).

The dashboard never reads raw events. The platform reads the
`analytics_daily` and `analytics_page_daily` tables directly through its
environment database passthrough (the same shape as the Files/Users/Jobs
operate pages), so a deployed app does nothing beyond keeping the beacon
mounted.

## Invariants

- Pageview tracking is never hand-built: the beacon + rollup kernel is the
  one way an app counts visits — never a third-party script, never cookies,
  never client-side identifiers.
- Raw IPs and user agents are never stored; only the daily-salted hash is,
  and raw events expire after 7 days.
- `AnalyticsConfig.ts` is the single tuning surface (retention, rollup
  window, path cap); consuming features never reimplement the policy.
- The beacon never breaks the page: every client failure is swallowed and
  every server failure still answers 204.

## Testing

`firebase/functions/test/Analytics/AnalyticsTest.ts` pins the kernel
blackbox: path normalization, bot filtering, hash stability within a day
and unlinkability across days, the beacon HTTP surface (record, bot drop,
malformed ping), and the convergent rollup + retention pruning.
