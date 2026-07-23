# Android App

Location: `android/`. Kotlin + Jetpack Compose + Apollo Kotlin 4.x (Gradle) against the same GraphQL API as the web app. Architecture is Store → Component → View — read `android/app/KOTLIN_ANDROID_STORE_COMPONENT_PATTERN.md` before writing Kotlin. Exemplar screens mirror the kernel domains: sign-in (Identity), Projects list + create, Users list.

## Structure

- `android/app/src/<flavor>/assets/config.properties` — three flavors mirroring the iOS schemes: `sandbox` (local emulators, `AUTH_MODE=local`), `development` and `production` (`AUTH_MODE=builtin`; `GRAPHQL_URL` is stamped at build time by the Android build pipeline — keep it empty in git; the auth endpoint is derived from it at runtime).
- `android/app/src/main/kotlin/com/baseapp/android/config/` — `AppConfig` + `ConfigLoader` (fails closed on empty values; rewrites localhost to `10.0.2.2` on emulators and to the stamped LAN IP on devices for sandbox builds).
- `.../auth/` — `AuthClient` interface with `LocalAuthClient` (sandbox dev JWT) and `BuiltinAuthClient` (email OTP + magic link via intent-filter deep links).
- `.../graphql/` — `GraphQLClient` (Apollo wrapper adding the bearer token per request), `Typedefs.kt` (aliases for generated types), `operations/` (thin per-domain wrappers... see feeds under `components/feeds/`).
- `.../store/` — `AppStore` root; leaf stores `SessionStore`, `AppAlertStore`, `ListPaginationStore`. State only (StateFlow).
- `.../components/` — behavior: `AuthComponent`, `ProjectComponent`, page components, feed services. Global composition lives in `components/AppComponents.kt`.
- `.../view/` — Compose screens; theme tokens in `view/theme/Theme.kt`; shared controls in `view/kit/`.
- `android/app/src/main/graphql/**/*.graphql` — the ONLY place Android GraphQL operations live (schema at `schema.graphqls` is composed, never hand-edited).

## Recipe: the schema changed (or you added an operation)

1. If you changed the backend, finish the backend work first (`Graphql/**/*.gql`, migrations, resolvers, `npm run codegen`).
2. Add/adjust operations in `android/app/src/main/graphql/<Domain>/*.graphql` (fragments + queries/mutations, mirroring the web and iOS operations).
3. Run `npm run graphql:android:prebuild` — composes the schema from `Graphql/**/*.gql`. Kotlin types are generated during the Gradle build (Apollo Kotlin plugin); nothing generated is committed.
4. Surface new types via `.../graphql/Typedefs.kt` and extend `GraphQLApi` + `GraphQLClient`.

## Recipe: add a screen

1. Operations first (recipe above), then a feed service or component method that calls `GraphQLClient`.
2. Page component in `.../components/pages/` owning load/search/paginate state transitions (copy `ProjectsPageComponent`).
3. Composable in `.../view/<domain>/` observing the page component; register it in `MainTabView` (or navigate to it from an existing screen).
4. Gradle picks up new Kotlin files automatically — no project-file editing.

## Feature parity

Packs with the `ANDROID` capability keep web and Android in parity: when you add a user-facing feature to `web/app`, add the Android counterpart (same operations, same domain flow) or say explicitly why it is web-only.

## Building and testing

```bash
npm run graphql:android:prebuild   # recompose schema after backend schema changes
npm run check:android              # sandbox debug build + JVM unit tests
```

Requires an Android SDK (`ANDROID_HOME` or `android/local.properties` with `sdk.dir=`); JDK 17+. Unit tests (`android/app/src/test/`) are plain JVM tests — no emulator needed.

Local device/emulator runs against the sandbox backend need `npm run dev:up` and `npm run bootstrap:env` first; the `stampSandboxConfig` Gradle task copies the local dev JWT and records your LAN IP so physical devices can reach the emulators (Android emulators use `10.0.2.2` automatically).

CI builds run in `.github/workflows/android-build.yml` (dispatched by the Repobot platform for emulator previews and signed-APK device installs). Device builds are signed with a platform-managed per-project keystore and uploaded to platform storage via a signed URL — there is no Google account to connect.

## Never

- No GraphQL documents outside `android/app/src/main/graphql/`.
- No network calls or Apollo usage in stores or composables (components only).
- No secrets or real endpoint values committed in the dev/prod config.properties.
- Never hand-edit `android/app/src/main/graphql/schema.graphqls` (composed) or anything under `android/app/build/` (generated).
