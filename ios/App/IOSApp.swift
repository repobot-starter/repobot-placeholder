import SwiftUI

@main
struct IOSApp: App {
  init() {
    let flavor = AppFlavor.resolve()
    let safeConfig: AppConfig
    do {
      safeConfig = try ConfigLoader.load(flavor: flavor)
    } catch {
      fatalError("Failed to load app config for \(flavor.rawValue): \(error.localizedDescription)")
    }

    let authClient: AuthClient
    let sessionProvider: SessionProviding?
    if safeConfig.authMode == .local {
      authClient = LocalAuthClient(config: safeConfig)
      // Local dev tokens never expire server-side; no refresh needed.
      sessionProvider = nil
    } else if let authURL = safeConfig.authURL {
      let builtinAuthClient = BuiltinAuthClient(
        authURL: authURL,
        redirectURL: safeConfig.redirectURL
      )
      authClient = builtinAuthClient
      sessionProvider = builtinAuthClient.sessionRefresher
    } else {
      fatalError("AUTH_MODE=builtin requires a GRAPHQL_URL ending in graphql__request__api.")
    }

    AppComponents.initialize(
      config: safeConfig,
      authClient: authClient,
      graphQLClient: GraphQLClient(config: safeConfig, sessionProvider: sessionProvider)
    )
  }

  var body: some Scene {
    WindowGroup {
      RootView()
        .environmentObject(store.sessionStore)
        .environmentObject(store.appAlertStore)
        .environmentObject(components)
        .environmentObject(components.projectsPage)
        .environmentObject(components.usersPage)
        .task {
          // Client-only packs (blank, pong) may have no backend deployed, so
          // never hit the GraphQL API at launch for them. Config load and
          // component init above stay intact so the kernel exemplars keep
          // working if an agent later upgrades the project to a backend pack.
          guard ActivePack.key != "blank", ActivePack.key != "pong" else { return }
          await components.auth.restoreSessionAndHydrateUser()
        }
        .onOpenURL { incomingURL in
          Task {
            _ = await components.auth.handleIncomingURL(incomingURL)
          }
        }
    }
  }
}
