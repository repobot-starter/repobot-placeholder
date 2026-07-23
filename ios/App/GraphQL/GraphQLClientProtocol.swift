import Foundation
import AppGraphqlApi

enum GraphQLClientError: Error, LocalizedError {
  case unauthenticated
  case invalidResponse
  case httpFailure(statusCode: Int, details: String?)
  case networkFailure(String)
  case upstream(String)

  var errorDescription: String? {
    switch self {
    case .unauthenticated:
      return "You must be signed in."
    case .invalidResponse:
      return "Invalid response from GraphQL API."
    case let .httpFailure(statusCode, details):
      if let details, !details.isEmpty {
        return "GraphQL request failed (\(statusCode)): \(details)"
      }
      return "GraphQL request failed (\(statusCode))."
    case let .networkFailure(message):
      return message
    case let .upstream(message):
      return message
    }
  }
}

/// One method per operation, mirroring the exemplar Identity and Project
/// domains. When you add a domain, extend this protocol alongside a new
/// operations wrapper in GraphQL/Operations/ (see docs/ios.md).
protocol GraphQLClientProtocol {
  // Identity
  func fetchCurrentUser() async throws -> CurrentUserData
  func fetchUsers(input: UserConnectionInput) async throws -> UsersConnectionData

  // Project
  func fetchProjects(input: ProjectConnectionInput) async throws -> ProjectsConnectionData
  func createProject(input: CreateProjectInput) async throws -> CreatedProjectData
  func updateProject(input: UpdateProjectInput) async throws -> UpdatedProjectData

  // Ai (anonymous: the talk surface works without sign-in)
  func createAiVoiceSession() async throws -> AiVoiceSessionData
}
