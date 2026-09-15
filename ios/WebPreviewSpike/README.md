# WebPreviewSpike — Phase 0: real SwiftUI kernel code → wasm → browser

De-risk spike for the iOS Renderer MVP. The kernel's real Folio screen
(`ios/App/View/Folio/FolioView.swift` + `FolioContent.swift` +
`Theme/GeneratedTheme.swift` + `Theme/Color.swift`) compiles **unmodified**
(symlinked into `Sources/FolioDemo/Kernel/`) against a shim SPM target
literally named `SwiftUI`, cross-compiled to WebAssembly with the official
swift.org Wasm SDK, and rendered into a DOM phone frame via JavaScriptKit.
`@State` + Button-tap re-render works (the tag filter chips).

Findings, measurements, and the GO/NO-GO write-up live in
`repobot/docs/plans/swiftui-web-preview.md` ("Phase 0 findings").

## Toolchain (macOS; the pod will need the Linux equivalents)

```sh
# 1. swiftly (Xcode's swift cannot target wasm)
curl -sL -o /tmp/swiftly.pkg https://download.swift.org/swiftly/darwin/swiftly.pkg
installer -pkg /tmp/swiftly.pkg -target CurrentUserHomeDirectory
~/.swiftly/bin/swiftly init --assume-yes --quiet-shell-followup --skip-install
. ~/.swiftly/env.sh

# 2. Swift 6.3.3 toolchain (~1.4 GB download, ~4.6 GB installed)
swiftly install 6.3.3 --use --assume-yes

# 3. Matching Wasm SDK artifactbundle (IDs: swift-6.3.3-RELEASE_wasm[-embedded])
swift sdk install \
  https://download.swift.org/swift-6.3.3-release/wasm-sdk/swift-6.3.3-RELEASE/swift-6.3.3-RELEASE_wasm.artifactbundle.tar.gz \
  --checksum cabfa08b73bb8ac783927ecd15fa386e99d0c139c5f232445067bcf58379cae7

# Optional, for binary size work:
brew install binaryen   # wasm-opt
```

Toolchain and SDK versions must match exactly. Budget ~10 GB of free disk.

## Build + run the demo

```sh
cd ios/WebPreviewSpike

# Build wasm + generate the JS loader bundle (JavaScriptKit PackageToJS plugin)
swift build -c release --swift-sdk swift-6.3.3-RELEASE_wasm
swift package -c release --swift-sdk swift-6.3.3-RELEASE_wasm js

# Optional: strip/optimize (62 MB -> 46 MB; ~18 MB gzipped)
wasm-opt -Os --strip-debug --strip-producers \
  .build/release/FolioDemo.wasm \
  -o .build/plugins/PackageToJS/outputs/Package/FolioDemo.wasm \
  --enable-bulk-memory --enable-sign-ext \
  --enable-nontrapping-float-to-int --enable-reference-types

# Host page deps (the generated loader imports @bjorn3/browser_wasi_shim)
(cd web && npm install)

# Serve the package directory and open the phone frame
python3 -m http.server 9700
open http://localhost:9700/web/index.html
```

The stats line under the phone shows cold start, render count, and last
render duration. Tap the filter chips to exercise the @State loop.

## Layout of this package

- `Sources/SwiftUI/` — the shim: `View`/`@ViewBuilder`, 15 views, ~17
  modifiers, `@State`/`@Binding`/`@Environment(\.openURL)`, `Font`, a no-op
  `#Preview` macro, and a JavaScriptKit DOM renderer (naive flex/grid layout,
  full re-render per state change — Phase 1 replaces both).
- `Sources/CoreGraphics/` — re-exports Foundation's CG geometry types so
  `import CoreGraphics` in `GeneratedTheme.swift` resolves on wasm.
- `Sources/FolioDemo/Kernel/` — symlinks to the real kernel files. Nothing
  is copied or edited.
- `ApolloWasmCheck/` — proves `ApolloAPI` + generated `AppGraphqlApi`
  compile to wasm (run it: `wasmkit run .build/debug/ApolloWasmCheck.wasm`).
- `web/` — static host page (phone frame + import map + metrics hooks).
- `shots/` — headless-Chrome captures of the working demo.
