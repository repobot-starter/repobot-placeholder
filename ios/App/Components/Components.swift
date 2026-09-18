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
  let user: UserComponent
  let project: ProjectComponent
  let projectsPage: ProjectsPageComponent
  let usersPage: UsersPageComponent
  let aiChat: AiChatComponent
  let aiVoice: AiVoiceComponent
  let billing: BillingComponent
  let avatarUpload: AvatarUploadComponent
  let push: PushComponent

  init() {
    self.auth = AuthComponent()
    self.user = UserComponent()
    self.project = ProjectComponent()
    self.projectsPage = ProjectsPageComponent()
    self.usersPage = UsersPageComponent()
    self.aiChat = AiChatComponent()
    self.aiVoice = AiVoiceComponent()
    self.billing = BillingComponent(
      billingStore: store.billingStore,
      api: GraphQLBillingApi(),
      webOrigin: { appConfig.resolvedWebOrigin }
    )
    self.avatarUpload = AvatarUploadComponent(
      avatarStore: store.avatarStore,
      api: GraphQLAvatarApi(),
      refreshUser: { await components.auth.refreshHydratedUser() }
    )
    self.push = PushComponent()
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
