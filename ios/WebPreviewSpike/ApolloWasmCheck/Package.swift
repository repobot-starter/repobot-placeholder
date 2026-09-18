// swift-tools-version: 6.1
// Phase 0 check: does ApolloAPI + the generated AppGraphqlApi package compile
// under the wasm SDK? (No networking — Apollo's transport never compiles to
// wasm; only the models/operations layer matters here.)
import PackageDescription

let package = Package(
  name: "ApolloWasmCheck",
  platforms: [.macOS(.v14)],
  dependencies: [
    .package(path: "../../ApolloGraphql/AppGraphqlApi")
  ],
  targets: [
    .executableTarget(
      name: "ApolloWasmCheck",
      dependencies: [
        .product(name: "AppGraphqlApi", package: "AppGraphqlApi")
      ]
    )
  ]
)
