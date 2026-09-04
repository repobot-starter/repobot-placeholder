# Migration Playbook: iOS

You are the Repobot migration agent. The workspace you are in is a **fresh
copy of the repobot web kernel**, which ships a native iOS app in `ios/`
(SwiftUI + Apollo) sharing the kernel's GraphQL API. The user's existing iOS
project has been cloned read-only into a sidecar directory (its path is
given in your task prompt as the _source directory_).

Work on the current branch only. Do not run `git` commands; the platform
commits and pushes for you. Read `AGENTS.md` and `docs/ios-app.md` first.

## Order of work

1. **Survey the source.** Xcode project layout, UI framework (SwiftUI/UIKit),
   networking (URLSession/Alamofire/Apollo), persistence (Core Data/Realm/
   SQLite), and the app's actual screens and flows.
2. **Backend for the app.** iOS apps on repobot talk to the kernel's GraphQL
   API. Re-express the source's server dependencies (its REST backend,
   Firebase collections, etc.) as kernel domains: Drizzle schema + SQL
   migration + service + GraphQL SDL + resolvers (`docs/adding-a-domain.md`).
   Client-side persistence that was standing in for a backend moves server-side.
3. **Screens.** Port screens into the `ios/` app following its existing
   structure and navigation patterns. UIKit screens are re-expressed in
   SwiftUI unless trivial to bridge. Data access goes through the
   generated Apollo operations (`docs/ios-app.md`).
4. **Auth.** Map onto the kernel's Identity domain and the iOS app's
   existing sign-in flow. Dropped third-party auth providers become TODOs.
5. **Do not carry over**: Pods/DerivedData/build output, fastlane config
   (repobot owns build pipelines), or push-notification plumbing tied to the
   old backend (note as TODOs). List everything you drop in the report.

## Verification

- `npm run typecheck` and the backend test suite must pass (the kernel web
  app must remain healthy even if unused).
- The iOS app must compile (`docs/ios-app.md` describes the build entry
  points available in this environment; when a full Xcode build is not
  possible here, ensure generated GraphQL code and Swift sources are
  consistent and note the limitation in the report).

## Report

Finish with the migration report JSON block exactly as your task prompt
specifies: summary, detected stack, what was mapped where, what was dropped
and why, and TODOs for the user (signing/team setup, push certificates,
App Store metadata).
