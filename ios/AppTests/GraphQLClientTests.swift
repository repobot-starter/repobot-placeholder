import XCTest
import ApolloAPI
import AppGraphqlApi
@testable import AppIOS

final class GraphQLClientTests: XCTestCase {
  override func tearDown() {
    super.tearDown()
    RequestCaptureURLProtocol.lastRequest = nil
  }

  func testInjectsAuthorizationHeader() async throws {
    let client = makeClient(accessToken: "abc123")

    let currentUser = try await client.fetchCurrentUser()

    XCTAssertEqual(RequestCaptureURLProtocol.lastRequest?.value(forHTTPHeaderField: "Authorization"), "Bearer abc123")
    XCTAssertEqual(currentUser.id, "user_1")
    XCTAssertEqual(currentUser.email, "person@example.com")
  }

  func testCreateProjectReturnsCreatedProject() async throws {
    let client = makeClient(accessToken: "abc123")
    let input = CreateProjectInput(
      idempotencyKey: "idem-123",
      fields: CreateProjectFields(name: "New Project")
    )

    let created = try await client.createProject(input: input)

    XCTAssertEqual(created.id, "project_1")
    XCTAssertEqual(created.name, "New Project")
  }

  func testFetchProjectsReturnsConnection() async throws {
    let client = makeClient(accessToken: "abc123")
    let input = ProjectConnectionInput(
      connection: ConnectionInput(
        pagination: PaginationInput(first: 10),
        sort: [SortOrderInput(fieldName: "name", direction: GraphQLEnum(.asc))]
      )
    )

    let connection = try await client.fetchProjects(input: input)

    XCTAssertEqual(connection.nodes.count, 1)
    XCTAssertEqual(connection.nodes.first??.name, "New Project")
    XCTAssertFalse(connection.pageInfo.hasNextPage)
  }

  private func makeClient(accessToken: String) -> GraphQLClient {
    let config = AppConfig(
      flavor: .dev,
      appName: "App",
      graphqlURL: URL(string: "https://example.com/graphql")!,
      authMode: .builtin,
      authMethods: [.emailCode],
      redirectURL: URL(string: "baseapp-dev://auth/callback")!,
      localAuthToken: nil
    )
    let storage = InMemorySessionStorage(
      session: AuthSession(accessToken: accessToken, refreshToken: nil, expiresAt: nil, email: nil)
    )
    return GraphQLClient(
      config: config,
      sessionStorage: storage,
      urlSession: Self.makeSession()
    )
  }

  private static func makeSession() -> URLSession {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [RequestCaptureURLProtocol.self]
    return URLSession(configuration: configuration)
  }
}

private final class InMemorySessionStorage: SessionStorage {
  private var session: AuthSession?

  init(session: AuthSession?) {
    self.session = session
  }

  func loadSession() -> AuthSession? {
    session
  }

  func persistSession(_ session: AuthSession) {
    self.session = session
  }

  func clearSession() {
    session = nil
  }
}

private final class RequestCaptureURLProtocol: URLProtocol {
  static var lastRequest: URLRequest?

  override class func canInit(with request: URLRequest) -> Bool {
    true
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    request
  }

  override func startLoading() {
    Self.lastRequest = request
    let body = String(data: Self.readBody(from: request), encoding: .utf8) ?? ""
    let projectJson = """
    {
      "__typename":"Project",
      "id":"project_1",
      "name":"New Project",
      "description":null,
      "status":"ACTIVE",
      "createdTime":"2026-07-18T00:00:00.000Z",
      "archivedAt":null,
      "createdBy":{ "__typename":"User", "id":"user_1", "displayName":"Person User" }
    }
    """
    let payload: String
    if body.contains("createProject(") {
      payload = """
      { "data": { "createProject": \(projectJson) } }
      """
    } else if body.contains("projects(") {
      payload = """
      {
        "data": {
          "projects": {
            "__typename":"ProjectConnection",
            "nodes":[\(projectJson)],
            "pageInfo":{ "__typename":"PageInfo", "hasNextPage":false, "endCursor":null }
          }
        }
      }
      """
    } else {
      payload = """
      {
        "data": {
          "currentUser": {
            "__typename":"User",
            "id":"user_1",
            "email":"person@example.com",
            "displayName":"Person User",
            "status":"ACTIVE",
            "createdTime":"2026-07-18T00:00:00.000Z",
            "account":null
          }
        }
      }
      """
    }
    let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
    client?.urlProtocol(self, didLoad: Data(payload.utf8))
    client?.urlProtocolDidFinishLoading(self)
  }

  override func stopLoading() {}

  /// URLSession exposes streamed bodies (Apollo's default) only through
  /// httpBodyStream inside URLProtocol, so drain the stream when httpBody is
  /// nil.
  private static func readBody(from request: URLRequest) -> Data {
    if let body = request.httpBody {
      return body
    }
    guard let stream = request.httpBodyStream else {
      return Data()
    }
    stream.open()
    defer { stream.close() }
    var data = Data()
    let bufferSize = 4096
    let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
    defer { buffer.deallocate() }
    while stream.hasBytesAvailable {
      let read = stream.read(buffer, maxLength: bufferSize)
      guard read > 0 else {
        break
      }
      data.append(buffer, count: read)
    }
    return data
  }
}
