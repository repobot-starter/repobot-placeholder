// swift-tools-version: 6.1
// Phase 0 spike: compile the kernel's real Folio SwiftUI files to WebAssembly
// against a shim SPM target literally named `SwiftUI`. Build ONLY with the
// wasm SDK (`swift build --swift-sdk swift-6.3.3-RELEASE_wasm`); never for
// host/device — the Xcode app never sees this package.
import CompilerPluginSupport
import PackageDescription

let package = Package(
  name: "WebPreviewSpike",
  platforms: [.macOS(.v14)],
  dependencies: [
    .package(url: "https://github.com/swiftwasm/JavaScriptKit", from: "0.36.0"),
    .package(url: "https://github.com/swiftlang/swift-syntax", "602.0.0"..<"604.0.0"),
  ],
  targets: [
    // GeneratedTheme.swift does `import CoreGraphics`, which doesn't exist on
    // wasm. This shim re-exports the CG geometry types Foundation provides on
    // non-Darwin platforms under the module name the kernel file expects.
    .target(name: "CoreGraphics"),
    // No-op #Preview macro so kernel files using the Xcode preview macro
    // compile unmodified. Macros run on the host, so swift-syntax never has
    // to build for wasm.
    .macro(
      name: "SwiftUIShimMacros",
      dependencies: [
        .product(name: "SwiftSyntaxMacros", package: "swift-syntax"),
        .product(name: "SwiftCompilerPlugin", package: "swift-syntax"),
      ]
    ),
    .target(
      name: "SwiftUI",
      dependencies: [
        "CoreGraphics",
        "SwiftUIShimMacros",
        .product(name: "JavaScriptKit", package: "JavaScriptKit"),
      ],
      // wasm is single-threaded; the spike's global render state is fine.
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
    .executableTarget(
      name: "FolioDemo",
      dependencies: ["SwiftUI"],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
  ]
)
