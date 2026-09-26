// swift-tools-version:5.9

import PackageDescription

let package = Package(
  name: "AppGraphqlApi",
  platforms: [
    .iOS(.v12),
    .macOS(.v10_14),
    .tvOS(.v12),
    .watchOS(.v5),
  ],
  products: [
    .library(name: "AppGraphqlApi", targets: ["AppGraphqlApi"]),
  ],
  dependencies: [
    .package(url: "https://github.com/apollographql/apollo-ios", exact: "1.25.5"),
  ],
  targets: [
    .target(
      name: "AppGraphqlApi",
      dependencies: [
        .product(name: "ApolloAPI", package: "apollo-ios"),
      ],
      path: "./Sources"
    ),
  ]
)
