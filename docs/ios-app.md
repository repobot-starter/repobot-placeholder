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
3. SwiftUI view in `ios/App/View/<Domain>/` observing the page component; register it in `MainTabView` (or push it from an existing screen).
4. The Xcode project uses file-system-synchronized groups: new files under `ios/App/` are picked up automatically — no pbxproj editing.

## Feature parity

Packs with the `IOS` capability keep web and iOS in parity: when you add a user-facing feature to `web/app`, add the iOS counterpart (same operations, same domain flow) or say explicitly why it is web-only.

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
