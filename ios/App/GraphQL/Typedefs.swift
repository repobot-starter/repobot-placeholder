import AppGraphqlApi
import Foundation

// Keep generated GraphQL selection types behind local aliases so feature code
// does not depend directly on generated module paths.
typealias CurrentUserData = GetCurrentUserQuery.Data.CurrentUser
typealias UsersConnectionData = GetUsersQuery.Data.Users
typealias UserRowData = GetUsersQuery.Data.Users.Node
typealias ProjectsConnectionData = GetProjectsQuery.Data.Projects
typealias ProjectRowData = GetProjectsQuery.Data.Projects.Node
typealias CreatedProjectData = CreateProjectMutation.Data.CreateProject
typealias UpdatedProjectData = UpdateProjectMutation.Data.UpdateProject
typealias AiVoiceSessionData = CreateAiVoiceSessionMutation.Data.CreateAiVoiceSession
typealias ProjectStatusValue = AppGraphqlApi.ProjectStatus
typealias UserStatusValue = AppGraphqlApi.UserStatus

extension CurrentUserData {
  var stringId: String { String(id) }
}
