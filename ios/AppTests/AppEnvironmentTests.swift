import XCTest
import SwiftUI
@testable import AppIOS

final class AppFlavorTests: XCTestCase {
  func testResolvesConfiguredFlavorFromInfoDictionary() {
    let resolved = AppFlavor.resolve(infoDictionary: ["Flavor": "prod"])
    XCTAssertEqual(resolved, .prod)
  }

  func testFallsBackToProdWhenConfigIsMissing() {
    let resolved = AppFlavor.resolve(infoDictionary: [:])
    XCTAssertEqual(resolved, .prod)
  }

  func testSandboxConfigParsesLocalAuthMode() throws {
    let sandbox = try ConfigLoader.parse(flavor: .sandbox, dictionary: [
      "GRAPHQL_URL": "http://127.0.0.1:5001/demo-repobot-base/us-central1/graphql__request__api",
      "AUTH_MODE": "local",
      "AUTH_REDIRECT_URL": "baseapp-sandbox://auth/callback",
      "LOCAL_AUTH_TOKEN": "dev-jwt",
    ])

    XCTAssertEqual(sandbox.authMode, .local)
    XCTAssertEqual(sandbox.localAuthToken, "dev-jwt")
    XCTAssertEqual(sandbox.redirectURL.scheme, "baseapp-sandbox")
    XCTAssertEqual(sandbox.appName, "App")
  }

  func testDeployedConfigParsesBuiltinModeAndDerivesAuthURL() throws {
    let dev = try ConfigLoader.parse(flavor: .dev, dictionary: [
      "APP_NAME": "My App",
      "GRAPHQL_URL": "https://example.com/prefix__graphql__request__api",
      "AUTH_MODE": "builtin",
      "AUTH_REDIRECT_URL": "baseapp-dev://auth/callback",
    ])

    XCTAssertEqual(dev.authMode, .builtin)
    XCTAssertEqual(dev.appName, "My App")
    // The auth URL is the GraphQL URL with the function name swapped.
    XCTAssertEqual(dev.authURL?.absoluteString, "https://example.com/prefix__auth__request__api")

    // A GraphQL URL without the well-known function name yields no auth URL.
    let opaque = try ConfigLoader.parse(flavor: .dev, dictionary: [
      "GRAPHQL_URL": "https://example.com/graphql",
      "AUTH_MODE": "builtin",
      "AUTH_REDIRECT_URL": "baseapp-dev://auth/callback",
    ])
    XCTAssertNil(opaque.authURL)
  }

  func testClientOnlyBuildBootsOnPlaceholderWhenBackendConfigIsEmpty() throws {
    // Client-only packs (blank, pong) build with empty backend values: the
    // app must still boot (local-mode placeholder) instead of failing closed.
    let emptyDevConfig: [String: Any] = [
      "APP_NAME": "",
      "GRAPHQL_URL": "",
      "AUTH_MODE": "builtin",
      "AUTH_REDIRECT_URL": "baseapp-dev://auth/callback",
    ]

    let config = try ConfigLoader.parse(flavor: .dev, dictionary: emptyDevConfig, isClientOnly: true)
    XCTAssertEqual(config.authMode, .local)
    XCTAssertEqual(config.redirectURL.scheme, "baseapp-dev")

    // Backend packs keep failing closed on the same empty config.
    XCTAssertThrowsError(
      try ConfigLoader.parse(flavor: .dev, dictionary: emptyDevConfig, isClientOnly: false)
    )
  }

  func testClientOnlyFallbackYieldsToRealConfigWhenValuesAreStamped() throws {
    // An agent can upgrade a client-only project to a backend pack; once real
    // values are stamped the strict parse wins even for a client-only key.
    let config = try ConfigLoader.parse(
      flavor: .dev,
      dictionary: [
        "APP_NAME": "Upgraded App",
        "GRAPHQL_URL": "https://example.com/prefix__graphql__request__api",
        "AUTH_MODE": "builtin",
        "AUTH_REDIRECT_URL": "baseapp-dev://auth/callback",
      ],
      isClientOnly: true
    )
    XCTAssertEqual(config.authMode, .builtin)
    XCTAssertEqual(config.authURL?.absoluteString, "https://example.com/prefix__auth__request__api")
  }

  func testThemeResolverMapsThemePreferencesToModes() {
    XCTAssertEqual(ThemeResolver.resolveMode(preference: .dark, systemColorScheme: .light), .dark)
    XCTAssertEqual(ThemeResolver.resolveMode(preference: .light, systemColorScheme: .dark), .light)
    XCTAssertEqual(ThemeResolver.resolveMode(preference: .system, systemColorScheme: .dark), .dark)
    XCTAssertEqual(ThemeResolver.resolveMode(preference: .system, systemColorScheme: .light), .light)
  }

  func testThemeCatalogMatchesWebDarkAndLightAnchorValues() {
    let dark = ThemeCatalog.uiTokens(mode: .dark)
    let light = ThemeCatalog.uiTokens(mode: .light)

    XCTAssertEqual(dark.spacing.xl, 24)
    XCTAssertEqual(dark.radius.md, 10)

    XCTAssertEqual(light.mode, .light)
    XCTAssertEqual(dark.colors.accent, Color(hex: "#6a63ff"))
    XCTAssertEqual(light.colors.accent, Color(hex: "#5f59ff"))

    // Guards drift between the platforms' palettes.
    XCTAssertEqual(dark.colors.appBg, Color(hex: "#080b14"))
    XCTAssertEqual(light.colors.appBg, Color(hex: "#ffffff"))
    XCTAssertEqual(light.colors.textPrimary, Color(hex: "#171717"))
  }
}
