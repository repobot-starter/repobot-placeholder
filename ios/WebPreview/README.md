# WebPreview — the kernel's SwiftUI browser preview renderer

Kernel iOS screens compile **unmodified** to WebAssembly and render in a
phone-framed browser page. Same source, two builds: Xcode compiles it
against real SwiftUI for device/TestFlight; this package compiles it with
the swift.org wasm SDK against shim modules literally named `SwiftUI`,
`Foundation`, and `CoreGraphics` (none of which exist on wasm, so there is
no collision — the Xcode build never sees this package).

- **Build + serve interface for the platform:** `BUILD-CONTRACT.md`
- **Dialect enforcement (CI):** `scripts/verify-ios-preview-dialect.mjs`
- **Phase 0/1 findings and measurements:** `repobot/docs/plans/swiftui-web-preview.md`

## Quick start

```sh
# toolchain: see BUILD-CONTRACT.md (swift.org 6.3.3 + wasm SDK; not Xcode's swift)
cd ios/WebPreview
swift build -c release --swift-sdk swift-6.3.3-RELEASE_wasm
swift package -c release --swift-sdk swift-6.3.3-RELEASE_wasm js
(cd web && npm install)
(cd .. && python3 -m http.server 9701)   # serve ios/
open "http://localhost:9701/WebPreview/web/index.html?screen=folio"   # or quiz, menu
```

Headless smoke test (screenshots into `shots/`):
`node web/test-preview.mjs` (needs Chrome + the server above).

## How it works

| Piece            | Where                                 | What it does                                                                                                                                                                 |
| ---------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout engine    | `Sources/SwiftUI/Layout.swift`        | SwiftUI's propose/respond sizing implemented in Swift; emits absolutely-positioned divs from computed frames (no CSS flexbox)                                                |
| Text measurement | `Sources/SwiftUI/Renderer.swift`      | hidden DOM node + `getBoundingClientRect`, cached per (text, style, width)                                                                                                   |
| State runtime    | `Sources/SwiftUI/State.swift`         | `@State`/`@StateObject` keyed by structural identity in a global store; `@Published` schedules re-renders; `@AppStorage` persists via the localStorage-backed `UserDefaults` |
| Environment      | `Sources/SwiftUI/Environment.swift`   | `@Environment`/`@EnvironmentObject`, renderer-consumed keys (font, foreground) plus kernel keys (`openURL`, `colorScheme`, `dismiss`)                                        |
| Foundation shim  | `Sources/Foundation/Foundation.swift` | re-exports FoundationEssentials + ICU-free replacements (see below)                                                                                                          |
| Kernel screens   | `Sources/PreviewApp/Kernel/`          | symlinks to real `ios/App/View` files — never copies                                                                                                                         |

## The dialect (what kernel iOS code may use)

The renderer supports the surveyed non-game surface: ~20 views (stacks,
`Text`, `ScrollView`, `Button`, `TextField`/`SecureField`/`TextEditor`,
`Toggle`, `Picker`, `Image` (SF Symbols subset)/`AsyncImage`, `LazyVGrid`,
`LazyVStack`, `GeometryReader`, `ScrollViewReader`, shapes, gradients,
`NavigationStack`, `ProgressView`, `Label`, `Link`, `ShareLink`) and ~60
modifiers (layout, decoration, effects, lifecycle, plus accepted-but-inert
ones like `animation`/`transition`/`buttonStyle`).

`scripts/verify-ios-preview-dialect.mjs` enforces this in CI **by parsing
this package's sources as the source of truth** — extend the shim and the
lint widens automatically. Screens that genuinely need device-only
frameworks (PhotosUI, AuthenticationServices) are excluded via the script's
`DEVICE_ONLY` list and don't render in the preview.

## The Foundation rule (binary size)

**Never let FoundationInternationalization into this build.** On wasm, the
real `Foundation` umbrella links ~34 MB of ICU data the moment any file
imports it — it took the Phase 0 probe from 8 MB to 46 MB raw. The shim
`Foundation` target keeps kernel `import Foundation` lines compiling against
FoundationEssentials (no ICU) plus small replacements implemented here:

| API                     | Replacement                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `UserDefaults`          | localStorage-backed, same shape                                                                          |
| `Scanner`               | hex scanning only (what `Color(hex:)` needs)                                                             |
| `CharacterSet`          | predicate-based subset (`alphanumerics`, `whitespaces`, `urlQueryAllowed`, `.inverted`)                  |
| `Calendar` / `TimeZone` | delegate to the browser's `Date` (Gregorian, local zone, Foundation weekday semantics)                   |
| `Locale`                | identifier-only stand-in; formatting is always en_US                                                     |
| `DateFormatter`         | fixed-format subset: parses `yyyy-MM-dd`, formats `.long`/`.medium`/`.short` with en_US month names, UTC |
| `String(format:)`       | mini printf: `%d`/`%i` (+ zero-pad widths), `%f`/`%.Nf`, `%@`, `%s`, `%x`, `%%`                          |
| `String` helpers        | `trimmingCharacters`, `replacingOccurrences`, `addingPercentEncoding`                                    |

Anything beyond this list (NumberFormatter, ISO8601DateFormatter,
`.formatted(...)` FormatStyle, Measurement, NSRegularExpression, …) is
forbidden in preview-eligible code and flagged by the dialect lint. If a
screen needs one, either extend the shim ICU-free or mark the screen
device-only — importing the real machinery is never the answer.

Result: **8.3 MB raw / 3.0 MB gzipped** for the full three-screen demo
(target was 10–12 MB / 3–4 MB).

## GraphQL (`GraphQLPreview/`)

A separate package (separate build tree on purpose: ApolloAPI requires the
real Foundation, i.e. ICU) providing what the `Apollo` package can't on wasm:

- `WasmGraphQLTransport` — POST over browser `fetch()` (JavaScriptKit),
  same-origin `/graphql`, optional Bearer token (sandbox dev JWT)
- `WasmGraphQLResponseMapper` — selection-metadata-driven JSON → generated
  Apollo models (fragments, enums, custom scalars, `@include`/`@skip`)
- `GraphQLPreviewCheck` — compiles the app's real `GraphQLClientProtocol`
  against a conforming `WasmGraphQLClient` and runs canned-response decode
  checks through the real generated models. Run on host: `swift run
GraphQLPreviewCheck`; in a browser: `node web/test-graphql-check.mjs`.

The generated `AppGraphqlApi` models are reused byte-for-byte.

## Known preview gaps (accepted, documented)

- Sheets/alerts don't present; `animation`/`transition` are inert.
- `ScrollViewProxy.scrollTo` is a no-op.
- Font metrics come from the bundled web fonts, so text can wrap a line
  earlier/later than device SF rendering when a width sits exactly at a
  proposal boundary.
- SF Symbols are a hand-drawn SVG subset covering the non-game surface's
  usage; new symbol names render as a placeholder square until added to
  `Sources/SwiftUI/Images.swift`.
