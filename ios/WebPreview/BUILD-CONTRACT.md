# WebPreview build-loop contract

The stable interface between this renderer package and the platform's
preview infrastructure (pod Dockerfile, file watcher, preview iframe).
Everything the platform needs to build, serve, and rebuild the iOS browser
preview is specified here; nothing else in `.build/` is contract.

## Toolchain

- swift.org toolchain **6.3.3** (NOT Xcode's swift — it cannot target wasm)
  plus the wasm SDK `swift-6.3.3-RELEASE_wasm`:

    ```sh
    # macOS (dev machines): via swiftly
    swiftly install 6.3.3 --use --assume-yes
    swift sdk install \
      https://download.swift.org/swift-6.3.3-release/wasm-sdk/swift-6.3.3-RELEASE/swift-6.3.3-RELEASE_wasm.artifactbundle.tar.gz \
      --checksum cabfa08b73bb8ac783927ecd15fa386e99d0c139c5f232445067bcf58379cae7

    # Linux (pod image): install the swift.org 6.3.3 toolchain for the distro,
    # then the same `swift sdk install` command — the wasm artifactbundle is
    # host-independent.
    ```

- `wasm-opt` (binaryen) for the post-build size pass. Optional but expected
  in the pod image; skipping it costs ~0.5 MB gzipped.

## Rebuild invocation

Run from `ios/WebPreview/`:

```sh
swift package -c release --swift-sdk swift-6.3.3-RELEASE_wasm js
wasm-opt -Os --strip-debug --strip-producers \
  --enable-bulk-memory --enable-sign-ext --enable-nontrapping-float-to-int \
  --enable-exception-handling --enable-reference-types \
  .build/plugins/PackageToJS/outputs/Package/PreviewApp.wasm \
  -o .build/plugins/PackageToJS/outputs/Package/PreviewApp.wasm
```

Do NOT run a standalone `swift build` first: the PackageToJS plugin runs the
full build itself, so a separate build step is pure duplication (measured
in-image by the Phase 2 integration: ~2m10s doubled vs ~50s single-step
incremental — 44s plugin + 5s wasm-opt on a Linux pod image; M-series
laptops land in the same range).

### Watch scope

Rebuild when any of these change:

- `ios/App/View/**/*.swift` (kernel screens — symlinked into the package)
- `ios/App/Theme` generated theme (`GeneratedTheme.swift`)
- `ios/WebPreview/Sources/**` (the renderer itself)

## Bundle output path

`ios/WebPreview/.build/plugins/PackageToJS/outputs/Package/`

| File                                         | Role                                                             |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `PreviewApp.wasm`                            | the app (~8.4 MB raw, ~3.0 MB gzip — serve gzipped)              |
| `index.js`                                   | entry point: `import { init } from ".../index.js"; await init()` |
| `instantiate.js`, `runtime.js`, `platforms/` | JavaScriptKit support (loaded by `index.js`)                     |

The host page is `ios/WebPreview/web/index.html` (phone frame, tabs, fonts,
loader). Serve the whole `ios/` directory so the page can reach both the
bundle (relative `../.build/...`) and the fonts (`../../App/Fonts/*.ttf`).

## Import-map requirement

The generated loader imports the bare specifier `@bjorn3/browser_wasi_shim`.
The host page MUST provide it via an import map (see `web/index.html`):

```html
<script type="importmap">
    { "imports": { "@bjorn3/browser_wasi_shim": "./node_modules/@bjorn3/browser_wasi_shim/dist/index.js" } }
</script>
```

`npm install` in `ios/WebPreview/web/` provides the package (pinned 0.3.0).
No other JS dependencies exist at runtime.

## Screen selection

`index.html?screen=<name>` — the wasm entry point reads `location.search`
and mounts the matching kernel view (`folio`, `quiz`, `menu` today; the
switch lives in `Sources/PreviewApp/main.swift`). Unknown names fall back to
`folio`. Adding a screen = adding a symlink under `Sources/PreviewApp/Kernel/`
plus one case in `main.swift`.

## Rebuild signaling

- The `swift package … js` exit code is the build verdict; stderr carries
  diagnostics in standard `file:line:col: error:` format, suitable for
  surfacing in the preview UI. Caveat: swiftpm's plugin path colors those
  lines with ANSI escapes even when piped — run with `NO_COLOR=1` and/or
  strip escapes before parsing (the platform watcher does both).
- On success the wasm file's mtime changes; the page has no hot-reload —
  the watcher should reload the iframe after a successful rebuild.
- `window.__previewFirstRender` is called by the host page once the first
  frame is in the DOM (used for cold-start measurement; also a readiness
  signal for screenshotting).

## GraphQL (full-stack previews)

`GraphQLPreview/` is a sibling package with the same build/packaging steps
(product: `GraphQLPreviewCheck`). It requires the REAL Foundation, so its
bundle carries ICU (~13 MB gzip) — build it only for previews that need live
data. The transport POSTs to same-origin `/graphql`; the pod must proxy that
route to the backend. Sandbox dev-JWT auth = constructing the client with
`WasmGraphQLClient(authToken: { devJWT })`.

## Dialect enforcement

`node scripts/verify-ios-preview-dialect.mjs` (wired into
`scripts/check-all.sh`) keeps non-game `ios/App/View` source inside the
renderer's supported surface, so a green check means this package can compile
every preview-eligible screen. The supported surface is parsed from this
package's sources at lint time — extending the shim widens the contract
automatically.
