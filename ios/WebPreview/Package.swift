// swift-tools-version: 6.1
// WebPreview: the browser preview renderer for the kernel's iOS dialect.
//
// Kernel view code compiles UNMODIFIED against three shim targets that
// shadow system modules (none of which exist — or are wanted — on wasm):
//
//   SwiftUI      — the renderer: propose/respond layout engine + DOM emit
//   CoreGraphics — geometry types (CGFloat/CGSize/CGPoint/CGRect)
//   Foundation   — FoundationEssentials re-export + small replacements.
//                  This is the binary-size lever: the real Foundation
//                  umbrella on wasm links ~34 MB of ICU data the moment any
//                  file imports it. Shadowing keeps the preview dialect on
//                  FoundationEssentials (no ICU) while kernel files keep
//                  their `import Foundation` lines byte-for-byte.
//
// Build ONLY with the wasm SDK; the Xcode/device build never sees this
// package. GraphQL preview support lives in the sibling GraphQLPreview
// package (separate build tree: ApolloAPI requires the real Foundation).
import CompilerPluginSupport
import PackageDescription

let shimSettings: [SwiftSetting] = [.swiftLanguageMode(.v5)]

let package = Package(
  name: "WebPreview",
  platforms: [.macOS(.v14)],
  dependencies: [
    .package(url: "https://github.com/swiftwasm/JavaScriptKit", from: "0.36.0"),
    .package(url: "https://github.com/swiftlang/swift-syntax", "602.0.0"..<"604.0.0"),
  ],
  targets: [
    .target(
      name: "Foundation",
      dependencies: [.product(name: "JavaScriptKit", package: "JavaScriptKit")],
      swiftSettings: shimSettings
    ),
    .target(name: "CoreGraphics", swiftSettings: shimSettings),
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
        "Foundation",
        "CoreGraphics",
        "SwiftUIShimMacros",
        .product(name: "JavaScriptKit", package: "JavaScriptKit"),
      ],
      swiftSettings: shimSettings
    ),
    .executableTarget(
      name: "PreviewApp",
      dependencies: ["SwiftUI", "Foundation", "CoreGraphics"],
      swiftSettings: shimSettings
    ),
  ]
)
