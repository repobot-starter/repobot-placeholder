# iOS App

Location: `ios/`. SwiftUI + Apollo iOS 1.x (SPM) against the same GraphQL API as the web app. Architecture is Store → Component → View — read `ios/App/SWIFT_IOS_STORE_COMPONENT_PATTERN.md` before writing Swift. Exemplar screens mirror the kernel domains: sign-in (Identity), Projects list + create, Users list.

## Structure

- `ios/App/Config/` — `AppConfig` + three plist flavors: `Config.sandbox.plist` (local emulators, `AUTH_MODE=local`), `Config.dev.plist` and `Config.prod.plist` (`AUTH_MODE=builtin`; `GRAPHQL_URL` is stamped at build time by the iOS build pipeline — keep it empty in git; the auth endpoint is derived from it at runtime).
- `ios/App/Auth/` — `AuthClient` protocol with `LocalAuthClient` (sandbox dev JWT) and `BuiltinAuthClient` (email OTP + magic link against the kernel's auth service).
- `ios/App/GraphQL/` — `GraphQLClient` (Apollo wrapper with the auth interceptor), `Typedefs.swift` (aliases for generated types), `Operations/` (thin per-domain wrappers).
- `ios/App/Store/` — `AppStore` root; leaf stores `SessionStore`, `AppAlertStore`. State only.
- `ios/App/Components/` — behavior: `AuthComponent`, `ProjectComponent`, page components, feed services.
- `ios/App/View/` — SwiftUI views, theme tokens in `View/Theme/`.
- `ios/ApolloGraphql/Operations/**/*.graphql` — the ONLY place iOS GraphQL operations live.
- `ios/ApolloGraphql/AppGraphqlApi/` — generated Swift package; never edit by hand.

## Recipe: the schema changed (or you added an operation)

1. If you changed the backend, finish the backend work first (`Graphql/**/*.gql`, migrations, resolvers, `npm run codegen`).
2. Add/adjust operations in `ios/ApolloGraphql/Operations/<Domain>/*.graphql` (fragments + queries/mutations, mirroring the web operations).
3. Run `npm run graphql:ios:prebuild` — composes the schema from `Graphql/**/*.gql` and regenerates `AppGraphqlApi`. Commit the generated changes.
4. Surface new types via `ios/App/GraphQL/Typedefs.swift` and a wrapper in `ios/App/GraphQL/Operations/`.

## Recipe: add a screen

1. Operations first (recipe above), then a feed service or component method that calls `GraphQLClient`.
2. Page component in `ios/App/Components/Pages/` owning load/search/paginate state transitions (copy `ProjectsPageComponent`).
3. SwiftUI view in `ios/App/View/<Domain>/` observing the page component; register it in the shell nav config (`KernelShellView.swift` — see `docs/shell.md`) or push it from an existing screen.
4. The Xcode project uses file-system-synchronized groups: new files under `ios/App/` are picked up automatically — no pbxproj editing.

## Feature parity

Packs with the `IOS` capability keep web and iOS in parity: when you add a user-facing feature to `web/app`, add the iOS counterpart (same operations, same domain flow) or say explicitly why it is web-only.

The kernel's user-facing surfaces already have twins — compose them, never rebuild:

- **Settings Billing card + Billing Portal** (payments kernel): `SettingsView`'s billing section over `BillingComponent`/`BillingStore` mirrors the web `BillingCard` (`mySubscription`, status badge, `createBillingPortalSession`). Checkout/portal URLs open in the system browser via the `openURL` environment action — the same pattern the sign-in screen uses for OAuth — and the subscription reloads when the app foregrounds.
- **Subscribe flow** (saas exemplar): `View/Billing/SubscribeView.swift` is the twin of web's `/subscribe` — it starts `createSubscriptionCheckoutSession` on appear and opens the session's `checkoutUrl`. Present it from a pricing CTA; the Settings billing section offers it when the account has never subscribed (iOS has no marketing pricing route, so settings owns that CTA — on web the pricing page does).
- **Avatar upload** (storage kernel): `AvatarUploadComponent` runs the kernel lifecycle (`createUpload` → byte PUT via `StorageUploadClient` → `finalizeUpload` → `avatarUploadId` on the user), downscaling/JPEG-compressing picked photos (`AvatarImageProcessing`). The shell (`ShellProfile.avatarURL`) and settings render the PUBLIC `/file/<id>` serving URL.

Non-GraphQL endpoints are always derived from `GRAPHQL_URL` by swapping the trailing function name (`AppConfig.authURL`, `AiChatStreamClient.endpoint`, `StorageUploadClient.endpoint`) — never configured separately. The one extra config value is `WEB_ORIGIN` (the web twin's `window.location.origin`, which the payments kernel builds redirect URLs from): the sandbox plist points it at the Vite dev server and the runtime aligns its host with `GRAPHQL_URL`'s stamped LAN IP; deployed plists carry it stamped at build time, and an empty value disables the billing surfaces rather than failing the boot.

## Device capabilities

Users run this app on real hardware (TestFlight installs), so features that would use the phone's hardware should. The rails live in `ios/App/Capabilities/` — lifted from a production field-scanning app, composable, and already wired for permissions:

- **`Haptics`** — the app's haptic vocabulary (`success`/`error`/`warning`/`impact`/`selection`). Fire at moments of physical consequence, not on every tap.
- **`CameraPermission`** — explicit camera permission: check `state` before presenting any camera surface, `request()` on the user's first camera action, `openSystemSettings()` on denial. Never let a denied camera render as a silent black view.
- **`ArCameraView` + `ArFrameDelegate`** (`Capabilities/ArCamera/`) — the shared camera shell: an ARKit world-tracking session streaming frames to your camera component at ~60fps. A camera surface is always: create a component, embed `ArCameraView(arFrameDelegate: component)`, observe the component. `ARCamera` is the base class when you need tracking-state gating and AR anchor placement (`AugmentedReality`: raycasts, anchored checkmark badges).
- **`QrScannerCamera`** — QR scanning with an AR checkmark pinned on each scanned code (with the success haptic). `scannedValues` accumulates distinct payloads; `onScan` fires per code.
- **`PhotoCaptureCamera`** — square photo capture (`snapPhoto()` → observe `image`). Upload results through the storage kernel (`StorageUploadClient`), the same lifecycle as the avatar upload.
- **`ObjectDetector`** — generic CoreML detection over camera frames: drop a detection `.mlpackage` into the Xcode project, inject it in the initializer, call `detect`/`detectCenterObject` per frame (gated, like `QrScannerCamera` gates).
- **`PushComponent`** (`Components/`) — APNs registration end to end: the Settings "Notifications" card requests permission on explicit enable and registers the device token via `registerPushDevice`. Send through the backend push kernel; never invent a parallel channel.

The camera usage string lives in `App/Info.plist` (`NSCameraUsageDescription`) — keep it honest about what the app actually uses the camera for.

## Building and testing

```bash
npm run graphql:ios:prebuild   # regenerate AppGraphqlApi after schema/operation changes
npm run check:ios              # sandbox-flavor simulator build (no signing)
```

Unit tests (`ios/AppTests/`) run via the Sandbox scheme:

```bash
xcodebuild -project ios/App.xcodeproj -scheme Sandbox \
  -destination 'platform=iOS Simulator,name=iPhone 16' CODE_SIGNING_ALLOWED=NO test
```

Local device/simulator runs against the sandbox backend need `npm run dev:up` and `npm run bootstrap:env` first; the `Stamp Sandbox Config` build phase copies the local dev JWT and rewrites localhost to your LAN IP.

CI builds run in `.github/workflows/ios-build.yml` (dispatched by the Repobot platform for simulator previews and TestFlight deploys).

TestFlight deploys run the `testflight_deploy` lane in `ios/fastlane/Fastfile`: automatic cloud signing with the account's App Store Connect API key (injected as `ASC_*` repo secrets by the platform), bundle id derived from the environment's deploy slug, and a "Repobot Testers" beta group whose public link is the install link users receive. Everything is env-driven — never hardcode key ids, team ids, or bundle ids in the Fastfile.

## Never

- No GraphQL documents outside `ios/ApolloGraphql/Operations/`.
- No network calls or Apollo usage in stores or views (components only).
- No secrets or real endpoint values committed in the dev/prod plists.
- Never edit `ios/ApolloGraphql/AppGraphqlApi/` or `ios/ApolloGraphql/Generated/` by hand.
