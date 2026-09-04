# Push

The push kernel: notifications as **template key + variables**, fanned out to
every device the user registered, over the shared push transport. Domains
that need to notify an app user compose this service — the scheduled activity
digest is the exemplar — and never touch Web Push, VAPID keys, subscription
JSON, or per-channel plumbing. Composed like mail (docs/mail.md), verbatim.

## The shape of the kernel

| Piece             | Where                                                       | What it is                                                                  |
| ----------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| Service           | `firebase/functions/src/Services/Push/PushService.ts`       | `sendPush({ toAppUserId, templateKey, variables })` + device registration   |
| Templates         | `firebase/functions/src/Services/Push/PushTemplates.ts`     | The registry: title + body with `{{variable}}` placeholders                 |
| Transport         | `firebase/functions/src/DependencyWrappers/PushWrapper`     | Real Web Push (VAPID) when deployed; an in-memory fake in tests/emulator    |
| Device registry   | `firebase/functions/src/Data/Push/PushDevice.ts`            | `push_devices`: one row per enabled destination, upsert keyed on endpoint   |
| Registration API  | `Graphql/Core/Push/Push.gql`                                | `registerPushDevice` / `unregisterPushDevice` (authenticated app user only) |
| Web client        | `web/app/public/push-service-worker.js` + Settings          | The service worker + the "Notifications" preference (`SettingsPage.tsx`)    |
| Consumer exemplar | `firebase/functions/src/Services/Push/PushDigestService.ts` | A daily digest job (`push-activity-digest` in the jobs registry)            |

**Notifications are never hand-built.** A new push is a new entry in
`pushTemplates` plus a `sendPush` call — not new rendering, new transport
code, or ad-hoc strings in a service.

## Rendering rules

- Templates use `{{variable}}` placeholders in both title and body.
- Values are substituted **verbatim** — notifications are plain text rendered
  by the OS/browser, so there is no HTML escaping (unlike mail).
- A missing variable throws `INTERNAL` — a broken template is a programming
  error caught in tests, never a half-rendered notification on a lock screen.

## Channels, modes, and degraded behavior

A device row carries its platform (`WEB` / `IOS` / `ANDROID`); the wrapper's
`isConfigured(channel)` is **per-channel**, and `sendPush` skips (and logs)
devices whose channel has no delivery route — the same posture as mail with
empty `SMTP_HOST`, never an error in the calling flow.

- **Tests and the emulator** — `FakePushWrapper` records notifications in
  memory (and logs them under the emulator, which is the sandbox preview).
  Assert with `setPushWrapperForTests(new FakePushWrapper())` and
  `lastNotificationTo(endpoint)`. Every channel reports configured.
- **Deployed with push provisioned** — `PUSH_MODE=live` plus the
  platform-minted VAPID keypair (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`,
  see `env.manifest.json`): the WEB channel delivers over Web Push.
- **Deployed without it** — `PUSH_MODE=local` or an empty keypair: every
  channel reports not-configured and `sendPush` degrades to a log line and
  returns `false`. Push is **best-effort by design**; a send failure must
  never fail the flow it rides on. `PUSH_MODE=local` on a deploy is a legal
  (degraded) state, deliberately not a boot refusal.
- **IOS (APNs)** — token-based auth over the customer's Apple push key,
  staged by the platform as `APNS_TEAM_ID` / `APNS_KEY_ID` /
  `APNS_PRIVATE_KEY` (the .p8, base64) / `APNS_BUNDLE_ID`
  (+ `APNS_ENVIRONMENT` for development builds). Any of them empty = the
  channel reports not-configured and its devices are skipped.
- **ANDROID (FCM)** — the HTTP v1 API over the customer's Firebase service
  account, staged as `FCM_SERVICE_ACCOUNT` (the service-account JSON,
  base64). Same degrade posture.
- Native device rows carry the APNs/FCM **device token in the endpoint
  column** (no subscription JSON); the iOS/Android twins post their tokens
  through the same `registerPushDevice` mutation the web client uses.

Subscriptions the push service reports gone (HTTP 404/410 — the browser
unsubscribed or the registration expired) and native tokens it reports
unregistered are pruned by `sendPush`, so the registry converges on reality
without a sweeper job.

## Device registration

`push_devices` (app user id, platform, endpoint, subscription JSON, rotation
timestamps) is written only through the kernel GraphQL:

- `registerPushDevice(platform, endpoint, subscriptionJson)` — authenticated
  app users only; **upsert keyed on the endpoint**. Re-registering refreshes
  the subscription JSON, moves the row to whoever is signed in on that
  browser, and bumps `rotatedTime`. Naturally idempotent, so it carries no
  idempotency key.
- `unregisterPushDevice(endpoint)` — owner-scoped delete; returns whether a
  registration was removed.

## The web client

The kernel web app's Settings page has a "Notifications" preference
(`NotificationsCard` in `web/app/src/View/Settings/SettingsPage.tsx`):

- **Enabling** registers `public/push-service-worker.js`, requests
  notification permission (**only on explicit enable — never on page load**),
  subscribes with the environment's VAPID public key, and calls
  `registerPushDevice`.
- **Permission denied** shows a "Blocked" state with instructions; the enable
  button stays live so fixing the browser setting and retrying just works.
- **Disabling** deletes the registration server-side first, then unsubscribes
  the browser, so the backend never keeps a destination the user turned off.
- The VAPID public key reaches the client as `VITE_VAPID_PUBLIC_KEY` — the
  same platform-staged env route as `VITE_GRAPHQL_URL` and the auth config.
  Empty = the preference shows push as unavailable.

To exercise the browser flow in a local sandbox, mint a keypair
(`npx web-push generate-vapid-keys`) and paste it into the functions
package's `.env.local` (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`) and the
web app's (`VITE_VAPID_PUBLIC_KEY`); the emulator's transport is still the
fake, which logs what would have been delivered.

## The digest exemplar

`push-activity-digest` (jobs registry, daily 14:00 UTC) calls
`pushDigestService.sendActivityDigest()`: the recent pageview count from the
analytics kernel, pushed to every app user with a registered device. It
demonstrates the JOBS + PUSH composition — soft dependency only: push works
without jobs; the digest doesn't. It is an exemplar, not a product; packs
replace the content, not the shape.

## Growing it

- **A new notification** (order shipped, task assigned): add a template to
  `pushTemplates`, call `sendPush` from the owning domain's service, and test
  it through `FakePushWrapper`.
- **Recipients are app user ids from real flows** — the service resolves the
  devices; callers never handle endpoints or tokens.
- **Scheduled pushes** register a job in the jobs registry (docs/jobs.md),
  exactly like the digest exemplar.
- **Native channels are live**: APNs/FCM sends ride the `PushWrapper`
  channel seams (`ApnsTransport.ts` / `FcmTransport.ts`, no third-party
  SDKs), lit by the platform-staged `APNS_*` / `FCM_SERVICE_ACCOUNT`
  credentials. The iOS/Android twins post their device tokens through the
  same `registerPushDevice` mutation (token as the endpoint). The kernel's
  contract is unchanged: template key + variables in, per-channel fan-out.

## Testing

`firebase/functions/test/Push/PushTest.ts` pins the kernel: template
rendering (and the missing-variable throw), fan-out to the fake wrapper,
degrade-when-unconfigured, gone-subscription and gone-token pruning, the
registration mutations' auth and upsert-on-endpoint semantics, and the real
wrapper's per-channel `isConfigured` (PUSH_MODE plus each channel's staged
credentials).
