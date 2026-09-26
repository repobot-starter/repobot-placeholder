import AppGraphqlApi
import Foundation
import GraphQLPreview

#if arch(wasm32)

/// The browser-preview implementation of the app's GraphQLClientProtocol.
/// One method per operation, same as the device GraphQLClient, but executed
/// over WasmGraphQLTransport (browser fetch) instead of Apollo's URLSession
/// request chain. The generated operation and model types are identical.
struct WasmGraphQLClient: GraphQLClientProtocol {
  private let transport: WasmGraphQLTransport
  /// The device client routes a few public operations through a transport
  /// without auth; here that just means omitting the Authorization header.
  private let anonymousTransport: WasmGraphQLTransport

  init(endpoint: String = "/graphql", authToken: @escaping () -> String? = { nil }) {
    transport = WasmGraphQLTransport(endpoint: endpoint, authToken: authToken)
    anonymousTransport = WasmGraphQLTransport(endpoint: endpoint)
  }

  // MARK: Identity

  func fetchCurrentUser() async throws -> CurrentUserData {
    try await execute(GetCurrentUserQuery()).currentUser
  }

  func fetchUsers(input: UserConnectionInput) async throws -> UsersConnectionData {
    try await execute(GetUsersQuery(input: input)).users
  }

  func updateUser(input: UpdateUserInput) async throws -> UpdatedUserData {
    try await execute(UpdateUserMutation(input: input)).updateUser
  }

  // MARK: Project

  func fetchProjects(input: ProjectConnectionInput) async throws -> ProjectsConnectionData {
    try await execute(GetProjectsQuery(input: input)).projects
  }

  func createProject(input: CreateProjectInput) async throws -> CreatedProjectData {
    try await execute(CreateProjectMutation(input: input)).createProject
  }

  func updateProject(input: UpdateProjectInput) async throws -> UpdatedProjectData {
    try await execute(UpdateProjectMutation(input: input)).updateProject
  }

  // MARK: Ai

  func createAiVoiceSession() async throws -> AiVoiceSessionData {
    try await execute(CreateAiVoiceSessionMutation(), on: anonymousTransport).createAiVoiceSession
  }

  // MARK: Payments

  func fetchMySubscription(productKey: String?) async throws -> PaymentSubscriptionData? {
    try await execute(
      MySubscriptionQuery(productKey: productKey.map { GraphQLNullable.some($0) } ?? .none)
    ).mySubscription
  }

  func createBillingPortalSession(
    input: CreateBillingPortalSessionInput
  ) async throws -> BillingPortalSessionData {
    try await execute(CreateBillingPortalSessionMutation(input: input)).createBillingPortalSession
  }

  // MARK: Saas

  func createSubscriptionCheckoutSession(
    input: CreateSubscriptionCheckoutSessionInput
  ) async throws -> SubscriptionCheckoutSessionData {
    try await execute(CreateSubscriptionCheckoutSessionMutation(input: input))
      .createSubscriptionCheckoutSession
  }

  // MARK: Storage

  func createUpload(input: CreateUploadInput) async throws -> UploadSlotData {
    try await execute(CreateUploadMutation(input: input)).createUpload
  }

  func finalizeUpload(input: FinalizeUploadInput) async throws -> FinalizedUploadData {
    try await execute(FinalizeUploadMutation(input: input)).finalizeUpload
  }

  func deleteUpload(input: DeleteUploadInput) async throws -> Bool {
    try await execute(DeleteUploadMutation(input: input)).deleteUpload
  }

  // MARK: Push

  func registerPushDevice(input: RegisterPushDeviceInput) async throws -> PushDeviceData {
    try await execute(RegisterPushDeviceMutation(input: input)).registerPushDevice
  }

  func unregisterPushDevice(input: UnregisterPushDeviceInput) async throws -> Bool {
    try await execute(UnregisterPushDeviceMutation(input: input)).unregisterPushDevice
  }

  // MARK: - Request machinery

  private func execute<Operation: GraphQLOperation>(
    _ operation: Operation,
    on transport: WasmGraphQLTransport? = nil
  ) async throws -> Operation.Data {
    do {
      return try await (transport ?? self.transport).execute(operation)
    } catch let error as WasmGraphQLError {
      throw error.asClientError
    }
  }
}

extension WasmGraphQLError {
  /// Maps transport errors onto the app's GraphQLClientError so feature code
  /// sees the same error shapes as on device.
  var asClientError: GraphQLClientError {
    switch self {
    case .missingOperationDefinition, .invalidResponse:
      return .invalidResponse
    case let .httpFailure(statusCode, details):
      return .httpFailure(statusCode: statusCode, details: details)
    case let .networkFailure(message):
      return .networkFailure(message)
    case let .upstream(message):
      return .upstream(message)
    case let .decoding(message):
      return .upstream(message)
    }
  }
}

#endif
