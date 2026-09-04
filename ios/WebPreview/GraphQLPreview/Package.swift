// swift-tools-version: 6.1
// GraphQLPreview: the wasm GraphQL client for the browser preview.
//
// This is a SEPARATE build tree from the sibling WebPreview package on
// purpose: ApolloAPI and the generated AppGraphqlApi models require the real
// Foundation (NSNull/NSNumber/JSONSerialization), which links
// FoundationInternationalization's ICU data on wasm. Content-only previews
// build just WebPreview and stay ICU-free; full-stack previews add this
// package and accept the size cost.
//
// The generated Apollo models are reused UNCHANGED. What Apollo's `Apollo`
// package normally provides (network transport + response executor) cannot
// compile to wasm (URLSession), so this package supplies both:
//   WasmGraphQLTransport      — POST over browser fetch() via JavaScriptKit
//   WasmGraphQLResponseMapper — selection-driven JSON -> generated model
//
// GraphQLPreviewCheck compiles the app's real GraphQLClientProtocol.swift +
// Typedefs.swift (symlinked) against a conforming WasmGraphQLClient, and runs
// canned-response decode checks through the real generated models.
import PackageDescription

let package = Package(
  name: "GraphQLPreview",
  platforms: [.macOS(.v14)],
  dependencies: [
    .package(path: "../../ApolloGraphql/AppGraphqlApi"),
    .package(url: "https://github.com/swiftwasm/JavaScriptKit", from: "0.36.0"),
  ],
  targets: [
    .target(
      name: "GraphQLPreview",
      dependencies: [
        .product(name: "AppGraphqlApi", package: "AppGraphqlApi"),
        .product(name: "JavaScriptKit", package: "JavaScriptKit"),
        .product(name: "JavaScriptEventLoop", package: "JavaScriptKit"),
      ],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
    .executableTarget(
      name: "GraphQLPreviewCheck",
      dependencies: [
        "GraphQLPreview",
        .product(name: "AppGraphqlApi", package: "AppGraphqlApi"),
        .product(name: "JavaScriptKit", package: "JavaScriptKit"),
        .product(name: "JavaScriptEventLoop", package: "JavaScriptKit"),
      ],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
  ]
)
