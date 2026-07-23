import Apollo
import ApolloAPI
import Foundation
import AppGraphqlApi

struct GraphQLClient: GraphQLClientProtocol {
  private let apolloClient: ApolloClient
  /// A second transport without the authorization interceptor, for the few
  /// public operations (see publicOperationRootFields in the backend's
  /// GraphqlServer.ts) that must work with no session at all.
  private let anonymousApolloClient: ApolloClient

  init(
    config: AppConfig,
    sessionStorage: SessionStorage = UserDefaultsSessionStorage(),
    urlSession: URLSession = .shared,
    apolloClient: ApolloClient? = nil,
    sessionProvider: SessionProviding? = nil
  ) {
    self.apolloClient = apolloClient ?? Self.makeApolloClient(
      config: config,
      sessionProvider: sessionProvider ?? StoredSessionProvider(sessionStorage: sessionStorage),
      urlSession: urlSession
    )
    self.anonymousApolloClient = apolloClient ?? Self.makeAnonymousApolloClient(
      config: config,
      urlSession: urlSession
    )
  }

  // MARK: Identity

  func fetchCurrentUser() async throws -> CurrentUserData {
    let data = try await fetchQuery(GetCurrentUserQuery())
    return data.currentUser
  }

  func fetchUsers(input: UserConnectionInput) async throws -> UsersConnectionData {
    let data = try await fetchQuery(GetUsersQuery(input: input))
    return data.users
  }

  // MARK: Project

  func fetchProjects(input: ProjectConnectionInput) async throws -> ProjectsConnectionData {
    let data = try await fetchQuery(GetProjectsQuery(input: input))
    return data.projects
  }

  func createProject(input: CreateProjectInput) async throws -> CreatedProjectData {
    let data = try await performMutation(CreateProjectMutation(input: input))
    return data.createProject
  }

  func updateProject(input: UpdateProjectInput) async throws -> UpdatedProjectData {
    let data = try await performMutation(UpdateProjectMutation(input: input))
    return data.updateProject
  }

  // MARK: Ai

  func createAiVoiceSession() async throws -> AiVoiceSessionData {
    let data = try await performMutation(CreateAiVoiceSessionMutation(), on: anonymousApolloClient)
    return data.createAiVoiceSession
  }

  // MARK: - Request machinery

  private func fetchQuery<Query: GraphQLQuery>(_ query: Query) async throws -> Query.Data {
    try await withCheckedThrowingContinuation { continuation in
      apolloClient.fetch(
        query: query,
        cachePolicy: .fetchIgnoringCacheData,
        queue: .main
      ) { result in
        switch result {
        case let .success(graphQLResult):
          if let errorMessage = graphQLResult.errors?.first?.message {
            continuation.resume(throwing: GraphQLClientError.upstream(errorMessage))
            return
          }
          guard let data = graphQLResult.data else {
            continuation.resume(throwing: GraphQLClientError.invalidResponse)
            return
          }
          continuation.resume(returning: data)
        case let .failure(error):
          continuation.resume(throwing: Self.mapTransportError(error))
        }
      }
    }
  }

  private func performMutation<Mutation: GraphQLMutation>(
    _ mutation: Mutation,
    on client: ApolloClient? = nil
  ) async throws -> Mutation.Data {
    try await withCheckedThrowingContinuation { continuation in
      (client ?? apolloClient).perform(
        mutation: mutation,
        queue: .main
      ) { result in
        switch result {
        case let .success(graphQLResult):
          if let errorMessage = graphQLResult.errors?.first?.message {
            continuation.resume(throwing: GraphQLClientError.upstream(errorMessage))
            return
          }
          guard let data = graphQLResult.data else {
            continuation.resume(throwing: GraphQLClientError.invalidResponse)
            return
          }
          continuation.resume(returning: data)
        case let .failure(error):
          continuation.resume(throwing: Self.mapTransportError(error))
        }
      }
    }
  }

  /// Preserves the HTTP status code for non-2xx responses so callers can
  /// distinguish auth failures (401/403) from transient server errors.
  private static func mapTransportError(_ error: Error) -> GraphQLClientError {
    if let gqlError = error as? GraphQLClientError {
      return gqlError
    }
    if case let ResponseCodeInterceptor.ResponseCodeError.invalidResponseCode(response, rawData) = error {
      let details = rawData.flatMap { String(data: $0, encoding: .utf8) }
      return .httpFailure(statusCode: response?.statusCode ?? -1, details: details)
    }
    if let urlError = error as? URLError {
      return .networkFailure(urlError.localizedDescription)
    }
    return .upstream(error.localizedDescription)
  }

  private static func makeApolloClient(
    config: AppConfig,
    sessionProvider: SessionProviding,
    urlSession: URLSession
  ) -> ApolloClient {
    let cache = InMemoryNormalizedCache()
    let store = ApolloStore(cache: cache)
    let interceptorProvider = AppInterceptorProvider(
      store: store,
      client: URLSessionClient(
        sessionConfiguration: urlSession.configuration,
        callbackQueue: .main
      ),
      sessionProvider: sessionProvider
    )
    let transport = RequestChainNetworkTransport(
      interceptorProvider: interceptorProvider,
      endpointURL: config.graphqlURL
    )
    return ApolloClient(networkTransport: transport, store: store)
  }

  private static func makeAnonymousApolloClient(
    config: AppConfig,
    urlSession: URLSession
  ) -> ApolloClient {
    let cache = InMemoryNormalizedCache()
    let store = ApolloStore(cache: cache)
    let interceptorProvider = DefaultInterceptorProvider(
      client: URLSessionClient(
        sessionConfiguration: urlSession.configuration,
        callbackQueue: .main
      ),
      store: store
    )
    let transport = RequestChainNetworkTransport(
      interceptorProvider: interceptorProvider,
      endpointURL: config.graphqlURL
    )
    return ApolloClient(networkTransport: transport, store: store)
  }
}

private final class AppInterceptorProvider: DefaultInterceptorProvider {
  private let sessionProvider: SessionProviding

  init(store: ApolloStore, client: URLSessionClient, sessionProvider: SessionProviding) {
    self.sessionProvider = sessionProvider
    super.init(client: client, store: store)
  }

  override func interceptors<Operation: GraphQLOperation>(for operation: Operation) -> [ApolloInterceptor] {
    var interceptors = super.interceptors(for: operation)
    interceptors.insert(
      AuthorizationInterceptor(sessionProvider: sessionProvider),
      at: 0
    )
    return interceptors
  }
}

private struct AuthorizationInterceptor: ApolloInterceptor {
  let id = UUID().uuidString
  private let sessionProvider: SessionProviding

  init(sessionProvider: SessionProviding) {
    self.sessionProvider = sessionProvider
  }

  func interceptAsync<Operation: GraphQLOperation>(
    chain: RequestChain,
    request: HTTPRequest<Operation>,
    response: HTTPResponse<Operation>?,
    completion: @escaping (Result<GraphQLResult<Operation.Data>, Error>) -> Void
  ) {
    Task {
      guard let session = await sessionProvider.validSession() else {
        chain.handleErrorAsync(
          GraphQLClientError.unauthenticated,
          request: request,
          response: response,
          completion: completion
        )
        return
      }

      request.addHeader(name: "Authorization", value: "Bearer \(session.accessToken)")
      request.addHeader(name: "Accept", value: "application/json")
      request.addHeader(name: "Content-Type", value: "application/json")
      chain.proceedAsync(request: request, response: response, interceptor: self, completion: completion)
    }
  }
}
