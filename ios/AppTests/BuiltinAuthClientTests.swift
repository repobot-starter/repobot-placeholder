import XCTest
@testable import AppIOS

@MainActor
final class BuiltinAuthClientTests: XCTestCase {
  override func tearDown() {
    super.tearDown()
    AuthURLProtocol.stub = nil
  }

  func testSendEmailCodeSurfacesErrorMessage() async throws {
    AuthURLProtocol.stub = .init(
      statusCode: 409,
      body: """
      { "error": { "code": "RESOURCE_EXHAUSTED", "message": "A code was just sent. Wait a minute before requesting another." } }
      """
    )
    let client = makeClient()

    do {
      try await client.sendEmailCode(email: "person@example.com")
      XCTFail("Expected send to throw.")
    } catch let error as BuiltinAuthClientError {
      guard case let .requestFailedWithMessage(statusCode, message) = error else {
        return XCTFail("Expected requestFailedWithMessage.")
      }
      XCTAssertEqual(statusCode, 409)
      XCTAssertEqual(message, "A code was just sent. Wait a minute before requesting another.")
    } catch {
      XCTFail("Unexpected error type: \(error)")
    }
  }

  func testSendEmailCodeRejectsInvalidEmail() async {
    let client = makeClient()

    do {
      try await client.sendEmailCode(email: "not-an-email")
      XCTFail("Expected send to throw.")
    } catch let error as BuiltinAuthClientError {
      guard case .invalidEmail = error else {
        return XCTFail("Expected invalidEmail.")
      }
    } catch {
      XCTFail("Unexpected error type: \(error)")
    }
  }

  func testVerifyEmailCodePersistsSession() async throws {
    AuthURLProtocol.stub = .init(
      statusCode: 200,
      body: """
      {
        "access_token": "access-1",
        "refresh_token": "refresh-1",
        "expires_in": 3600,
        "email": "person@example.com"
      }
      """
    )
    let storage = InMemorySessionStorage()
    let client = makeClient(storage: storage)

    let session = try await client.verifyEmailCode(email: "person@example.com", code: "123456")

    XCTAssertEqual(session.accessToken, "access-1")
    XCTAssertEqual(session.refreshToken, "refresh-1")
    XCTAssertEqual(session.email, "person@example.com")
    XCTAssertEqual(storage.loadSession()?.accessToken, "access-1")
  }

  func testVerifyEmailCodeSurfacesErrorMessage() async throws {
    AuthURLProtocol.stub = .init(
      statusCode: 401,
      body: """
      { "error": { "code": "UNAUTHENTICATED", "message": "Invalid or expired code." } }
      """
    )
    let client = makeClient()

    do {
      _ = try await client.verifyEmailCode(email: "person@example.com", code: "000000")
      XCTFail("Expected verify to throw.")
    } catch let error as BuiltinAuthClientError {
      guard case let .requestFailedWithMessage(statusCode, message) = error else {
        return XCTFail("Expected requestFailedWithMessage.")
      }
      XCTAssertEqual(statusCode, 401)
      XCTAssertEqual(message, "Invalid or expired code.")
    } catch {
      XCTFail("Unexpected error type: \(error)")
    }
  }

  func testCompletePasswordResetPersistsSession() async throws {
    // The stub answers both the recovery verify and the password update; the
    // session body on the second POST is simply ignored.
    AuthURLProtocol.stub = .init(
      statusCode: 200,
      body: """
      {
        "access_token": "access-2",
        "refresh_token": "refresh-2",
        "expires_in": 3600,
        "email": "person@example.com"
      }
      """
    )
    let storage = InMemorySessionStorage()
    let client = makeClient(storage: storage)

    let session = try await client.completePasswordReset(
      email: "person@example.com",
      code: "123456",
      newPassword: "brand-new-password"
    )

    XCTAssertEqual(session.accessToken, "access-2")
    XCTAssertEqual(session.email, "person@example.com")
    XCTAssertEqual(storage.loadSession()?.accessToken, "access-2")
  }

  func testCompletePasswordResetRejectsEmptyCode() async {
    let client = makeClient()

    do {
      _ = try await client.completePasswordReset(email: "person@example.com", code: "  ", newPassword: "password123")
      XCTFail("Expected reset completion to throw.")
    } catch let error as BuiltinAuthClientError {
      guard case .invalidCode = error else {
        return XCTFail("Expected invalidCode.")
      }
    } catch {
      XCTFail("Unexpected error type: \(error)")
    }
  }

  func testSignUpReturnsNilWhenConfirmationIsRequired() async throws {
    AuthURLProtocol.stub = .init(
      statusCode: 200,
      body: """
      { "requires_confirmation": true }
      """
    )
    let storage = InMemorySessionStorage()
    let client = makeClient(storage: storage)

    let session = try await client.signUpWithPassword(email: "person@example.com", password: "password123")

    XCTAssertNil(session)
    XCTAssertNil(storage.loadSession())
  }

  func testOAuthAuthorizeURLPointsAtGoogleStart() {
    let client = makeClient()

    let url = client.oauthAuthorizeURL(provider: .google)

    XCTAssertEqual(url?.path(), "/auth__request__api/google/start")
    XCTAssertEqual(
      URLComponents(url: url!, resolvingAgainstBaseURL: false)?
        .queryItems?.first(where: { $0.name == "redirect_to" })?.value,
      "baseapp-dev://auth/callback"
    )
    XCTAssertNil(client.oauthAuthorizeURL(provider: .password))
  }

  func testHandleIncomingURLParsesSessionFragment() async {
    let storage = InMemorySessionStorage()
    let client = makeClient(storage: storage)
    let callback = URL(string: "baseapp-dev://auth/callback#access_token=frag-token&refresh_token=frag-refresh&expires_in=3600")!

    let session = await client.handleIncomingURL(callback)

    XCTAssertEqual(session?.accessToken, "frag-token")
    XCTAssertEqual(storage.loadSession()?.accessToken, "frag-token")
  }

  func testHandleIncomingURLIgnoresUnrelatedURLs() async {
    let client = makeClient()

    let session = await client.handleIncomingURL(URL(string: "https://example.com/whatever")!)

    XCTAssertNil(session)
  }

  private func makeClient(storage: SessionStorage = InMemorySessionStorage()) -> BuiltinAuthClient {
    BuiltinAuthClient(
      authURL: URL(string: "https://example.com/auth__request__api")!,
      redirectURL: URL(string: "baseapp-dev://auth/callback")!,
      sessionStorage: storage,
      urlSession: makeURLSession()
    )
  }

  private func makeURLSession() -> URLSession {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [AuthURLProtocol.self]
    return URLSession(configuration: configuration)
  }
}

private final class InMemorySessionStorage: SessionStorage {
  private var session: AuthSession?

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

private final class AuthURLProtocol: URLProtocol {
  struct StubResponse {
    let statusCode: Int
    let body: String
  }

  static var stub: StubResponse?

  override class func canInit(with request: URLRequest) -> Bool {
    true
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    request
  }

  override func startLoading() {
    guard let stub = Self.stub else {
      let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
      client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
      client?.urlProtocol(self, didLoad: Data("{}".utf8))
      client?.urlProtocolDidFinishLoading(self)
      return
    }

    let response = HTTPURLResponse(url: request.url!, statusCode: stub.statusCode, httpVersion: nil, headerFields: nil)!
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
    client?.urlProtocol(self, didLoad: Data(stub.body.utf8))
    client?.urlProtocolDidFinishLoading(self)
  }

  override func stopLoading() {}
}
