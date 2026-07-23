# Agent Guide

## Active pack: blank

This checkout was composed with the **blank** pack (`packs/active.json`). The home surface the user sees at `/` is `web/app/src/View/Blank/` — see `packs/blank/PACK.md`.

When the user asks to change, restyle, or redesign "the page" or
"the app", they mean that view. Do NOT edit `web/app/src/View/Blank/` unless the blank pack is the active pack.

This repository is a domain-oriented full-stack starter: Firebase Functions + Apollo GraphQL + Drizzle/Postgres backend, React + Vite web app, backend-driven forms, pubsub events, and a blackbox test harness. Two exemplar domains — **Identity** (Account, User) and **Project** — demonstrate every pattern. When in doubt, imitate them.

## Repo map

| Path                             | What it is                                                                  |
| -------------------------------- | --------------------------------------------------------------------------- |
| `Graphql/`                       | GraphQL SDL — the API source of truth                                       |
| `protobufs/`                     | Protobuf event schemas (pubsub topics = message type names)                 |
| `firebase/functions/`            | Backend: `src/Data` → `src/Services` → `src/Graphql` → `src/CloudFunctions` |
| `firebase/functions/migrations/` | SQL-first migrations (ordered, forward-only)                                |
| `firebase/functions/test/`       | Blackbox test harness (GraphQL in-process, transaction-per-test)            |
| `web/core/`                      | Client runtime: Apollo client, auth, store                                  |
| `web/design-system/`             | Tokens, Radix primitives, components, SchemaForm renderer, Storybook        |
| `web/app/`                       | The product app: routes, pages, GraphQL operations                          |
| `ios/`                           | Native iOS app (SwiftUI + Apollo) sharing the same GraphQL API              |
| `android/`                       | Native Android app (Compose + Apollo Kotlin) sharing the same GraphQL API   |
| `packs/`                         | Vertical starters; `packs/active.json` names the pack that owns `/`         |
| `scripts/`                       | All operational scripts (invoke via root `npm run`)                         |
| `env.manifest.json`              | Source of truth for every environment variable                              |
| `docs/`                          | Per-layer recipe guides (start with `docs/adding-a-domain.md`)              |

## Theming and restyling

`repobot.theme.json` (repo root) is the project's theme contract: brand accent
colors, corner radius, density, font, and default light/dark mode. The design
system derives all its tokens from it, so **edit that file first** for any
"change the colors / make it feel more X" request — the whole app (and the
`/theme` style-guide page) re-skins from one edit. Escalate only when tokens
can't express the ask: component props/slots next, then eject the component —
copy it into `web/app/src/Theme/overrides/` and re-point its export in
`web/app/src/Theme/ui.ts` (the `@ui` registry every page imports from).
**Never edit `web/design-system/` itself** — it must stay pristine
(`scripts/verify-ds-pristine.mjs` enforces this) so platform design-system
updates can land without clobbering your work. Full recipes:
`docs/design-system.md`.

## Packs and the home page

The home route (`/`) is owned by whichever pack `packs/active.json` names:
`App.tsx` maps the active pack key to its view (see `homePageByPack`). Before
changing "the page" or "the app" the user is looking at, read
`packs/active.json` and `packs/<key>/PACK.md` to find the view that actually
renders — `web/app/src/View/Blank/` is only the home surface when the blank
pack is active.

## Live sandbox rules (Repobot workspace)

When this repo runs inside a Repobot workspace (streamed browser next to chat):

- The dev stack is **already running** with hot reload; edits appear in the
  user's preview automatically. Do not start/stop servers, run builds, or
  `npm install` unless explicitly asked.
- Never run `git` commands; the platform commits and pushes automatically
  after each request.
- Keep final summaries to one or two sentences.
- Write progress updates and summaries for the app's owner, not for an
  engineer — they are often non-technical (sometimes a kid building a game).
  Describe what is changing in their app in plain words ("Making the race
  track scroll", "Fixing the countdown"), never internal mechanics like
  tests, APIs, refactors, test hooks, or file names. If the user talks shop,
  you can match them.
- You can create images with your image generation tool (logos, icons,
  sprites, backgrounds, illustrations). When the user asks for an image —
  for the app or just for themselves — generate it and save it inside the
  project (e.g. `web/app/public/`) with a descriptive filename. The platform
  attaches images you create to your chat reply automatically, so don't
  apologize about not being able to show them.

## Invariants (never break these)

- Resolvers never touch the database; they call services and dataloaders.
- Schema changes are SQL migrations first; Drizzle TS tables mirror the SQL, never drive it.
- Entity CRUD forms are backend-driven SchemaForms; never hand-build them in the web app.
- `gql` documents live only in `web/app/src/Graphql/Operations/Gql/`.
- Design system stays domain-agnostic; styling is vanilla-extract from theme tokens only.
- Secrets never enter git or `VITE_` variables; env vars go through `env.manifest.json`.
- Throw `RpcError`, not `Error`, in backend code.
- Authorization is two-layer: the Apollo gate authenticates every operation; per-resource role checks live in services, never resolvers (`docs/authorization.md`).
- Sign-in surfaces are never hand-built: any feature needing auth gates routes with `ProtectedRoutes` (web) and renders the kernel auth component — `AuthCard`/`AuthScreen` on web, the `SignInView` twins on iOS/Android. Methods are config (`VITE_AUTH_METHODS` / `AUTH_METHODS`), branding goes through the card's props and theme tokens (`docs/auth.md`).
- AI surfaces are never hand-built either: features needing an assistant render the kernel chat component (`AiChatThread` on web, the `AiChatStore`/`AiChatComponent` twins on iOS) over the kernel's streaming client and Ai service. Customization is the system prompt and domain tools in `AiChatTools.ts`, not new plumbing (`docs/ai.md`).
- Tests are blackbox through GraphQL, using the Mocha context helpers.
- iOS follows Store → Component → View (`ios/App/SWIFT_IOS_STORE_COMPONENT_PATTERN.md`); iOS GraphQL operations live only in `ios/ApolloGraphql/Operations/`, and `AppGraphqlApi` is regenerated (`npm run graphql:ios:prebuild`), never hand-edited.
- Android follows the same Store → Component → View pattern (`android/app/KOTLIN_ANDROID_STORE_COMPONENT_PATTERN.md`); Android GraphQL operations live only in `android/app/src/main/graphql/`, and the schema is recomposed (`npm run graphql:android:prebuild`), never hand-edited.

## Mobile parity

If this project has the `IOS` capability (see `repobot.deploy.json`), user-facing
features should land on both web and iOS. After backend schema changes, run
`npm run graphql:ios:prebuild` to regenerate the Swift API; after iOS-touching
changes, `npm run check:ios` must pass (macOS only — skip on Linux workspaces,
where the platform builds iOS remotely). Full recipes: `docs/ios-app.md`.

If this project has the `ANDROID` capability, the same applies to Android:
after backend schema changes, run `npm run graphql:android:prebuild` to
recompose the schema; after Android-touching changes, `npm run check:android`
must pass (needs an Android SDK — skip where unavailable, the platform builds
Android remotely). Full recipes: `docs/android-app.md`.

## Quality gates

Run before declaring any task done:

```bash
npm run check:all   # codegen + lint + build + web tests + prettier
npm test            # backend blackbox tests (needs: npm run dev:db:test && npm run migrate:test)
npm run test:web    # web component tests (vitest; no database needed)
```

## Operations (always via npm scripts)

`npm run dev:up` (full local stack) · `dev:status` · `dev:down` · `dev:db` / `dev:db:test` / `dev:db:reset` · `migrate` / `migrate:test` · `codegen` (after editing `.gql`/`.proto`) · `bootstrap:env` · `storybook` · `deploy:dev` / `deploy:prod`.

## Task routing

| If the task involves...                | Read...                            |
| -------------------------------------- | ---------------------------------- |
| A new domain or entity                 | `docs/adding-a-domain.md`          |
| Tables, queries, ids                   | `docs/data-layer.md`               |
| Schema changes / migrations            | `docs/migrations-and-db.md`        |
| Business logic / services              | `docs/services.md`                 |
| GraphQL schema, resolvers, dataloaders | `docs/graphql.md`                  |
| Auth checks, roles, permissions        | `docs/authorization.md`            |
| Sign-in surface, auth methods, reuse   | `docs/auth.md`                     |
| Customize sign-in / auth emails        | `docs/auth-emails.md`              |
| Checkout, Stripe, selling things       | `docs/payments.md`                 |
| AI assistant, chat, voice, model tools | `docs/ai.md`                       |
| Create/edit forms                      | `docs/forms.md`                    |
| Events, pubsub, dead-lettering         | `docs/pubsub-events.md`            |
| Writing or fixing tests                | `docs/testing.md`                  |
| UI components / styling                | `docs/design-system.md`            |
| Colors, branding, theme, dark mode     | `docs/design-system.md` (Theming)  |
| Pages, routing, data fetching          | `docs/web-app.md`                  |
| The iOS app (screens, Swift codegen)   | `docs/ios-app.md`                  |
| The Android app (screens, Kotlin)      | `docs/android-app.md`              |
| Env vars, secrets, auth modes          | `docs/environments-and-secrets.md` |
| Running things locally                 | `docs/local-development.md`        |
