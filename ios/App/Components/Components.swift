import Foundation
import SwiftUI

var gql: GraphQLClientProtocol { _gql! }
private var _gql: GraphQLClientProtocol?

var appAuthClient: AuthClient { _appAuthClient! }
private var _appAuthClient: AuthClient?

var appConfig: AppConfig { _appConfig! }
private var _appConfig: AppConfig?

var store: AppStore { _store! }
private var _store: AppStore?

var components: AppComponents { _components! }
private var _components: AppComponents?

@MainActor
final class AppComponents: ObservableObject {
  let auth: AuthComponent
  let project: ProjectComponent
  let projectsPage: ProjectsPageComponent
  let usersPage: UsersPageComponent
  let aiChat: AiChatComponent
  let aiVoice: AiVoiceComponent

  init() {
    self.auth = AuthComponent()
    self.project = ProjectComponent()
    self.projectsPage = ProjectsPageComponent()
    self.usersPage = UsersPageComponent()
    self.aiChat = AiChatComponent()
    self.aiVoice = AiVoiceComponent()
  }

  static func initialize(
    config: AppConfig,
    authClient: AuthClient,
    graphQLClient: GraphQLClientProtocol
  ) {
    if _components != nil {
      assertionFailure("AppComponents.initialize(...) called more than once.")
      return
    }
    _appConfig = config
    _appAuthClient = authClient
    _gql = graphQLClient
    _store = AppStore()
    _components = AppComponents()
  }
}
