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
  func updateUser(input: UpdateUserInput) async throws -> UpdatedUserData

  // Project
  func fetchProjects(input: ProjectConnectionInput) async throws -> ProjectsConnectionData
  func createProject(input: CreateProjectInput) async throws -> CreatedProjectData
  func updateProject(input: UpdateProjectInput) async throws -> UpdatedProjectData

  // Ai (anonymous: the talk surface works without sign-in)
  func createAiVoiceSession() async throws -> AiVoiceSessionData

  // Payments kernel (authenticated: subscriptions are never anonymous)
  func fetchMySubscription(productKey: String?) async throws -> PaymentSubscriptionData?
  func createBillingPortalSession(input: CreateBillingPortalSessionInput) async throws -> BillingPortalSessionData

  // Saas (the subscription checkout exemplar over the payments kernel)
  func createSubscriptionCheckoutSession(
    input: CreateSubscriptionCheckoutSessionInput
  ) async throws -> SubscriptionCheckoutSessionData

  // Storage kernel (authenticated: files always have an accountable owner)
  func createUpload(input: CreateUploadInput) async throws -> UploadSlotData
  func finalizeUpload(input: FinalizeUploadInput) async throws -> FinalizedUploadData
  func deleteUpload(input: DeleteUploadInput) async throws -> Bool

  // Push kernel (authenticated: a registration always belongs to an app user)
  func registerPushDevice(input: RegisterPushDeviceInput) async throws -> PushDeviceData
  func unregisterPushDevice(input: UnregisterPushDeviceInput) async throws -> Bool
}
