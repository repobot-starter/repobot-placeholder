import XCTest
@testable import AppIOS

final class SessionRefresherTests: XCTestCase {
  override func tearDown() {
    super.tearDown()
    RefreshURLProtocol.reset()
  }

  func testReturnsSessionUntouchedWhenNotNearExpiry() async {
    let session = makeSession(expiresIn: 3600)
    let storage = InMemorySessionStorage(session: session)
    let refresher = makeRefresher(storage: storage)

    let result = await refresher.validSession()

    XCTAssertEqual(result, session)
    XCTAssertEqual(RefreshURLProtocol.requestCount, 0)
  }

  func testRefreshesExpiredSessionAndPersistsResult() async {
    RefreshURLProtocol.stub = .init(
      statusCode: 200,
      body: """
      {
        "access_token": "new-access",
        "refresh_token": "new-refresh",
        "expires_in": 3600,
        "email": "person@example.com"
      }
      """
    )
    let storage = InMemorySessionStorage(session: makeSession(expiresIn: -60))
    let refresher = makeRefresher(storage: storage)

    let result = await refresher.validSession()

    XCTAssertEqual(result?.accessToken, "new-access")
    XCTAssertEqual(result?.refreshToken, "new-refresh")
    XCTAssertEqual(storage.loadSession()?.accessToken, "new-access")
    XCTAssertNotNil(result?.expiresAt)
    XCTAssertEqual(RefreshURLProtocol.requestCount, 1)
  }

  func testClearsSessionWhenRefreshTokenIsRejected() async {
    RefreshURLProtocol.stub = .init(
      statusCode: 401,
      body: """
      { "error": { "code": "UNAUTHENTICATED", "message": "Invalid or expired refresh token." } }
      """
    )
    let storage = InMemorySessionStorage(session: makeSession(expiresIn: -60))
    let refresher = makeRefresher(storage: storage)

    let result = await refresher.validSession()

    XCTAssertNil(result)
    XCTAssertNil(storage.loadSession())
  }

  func testKeepsStaleSessionOnServerError() async {
    RefreshURLProtocol.stub = .init(statusCode: 503, body: "{}")
    let staleSession = makeSession(expiresIn: -60)
    let storage = InMemorySessionStorage(session: staleSession)
    let refresher = makeRefresher(storage: storage)

    let result = await refresher.validSession()

    XCTAssertEqual(result, staleSession)
    XCTAssertEqual(storage.loadSession(), staleSession)
  }

  func testKeepsStaleSessionOnNetworkFailure() async {
    RefreshURLProtocol.failWithError = URLError(.notConnectedToInternet)
    let staleSession = makeSession(expiresIn: -60)
    let storage = InMemorySessionStorage(session: staleSession)
    let refresher = makeRefresher(storage: storage)

    let result = await refresher.validSession()

    XCTAssertEqual(result, staleSession)
    XCTAssertEqual(storage.loadSession(), staleSession)
  }

  func testConcurrentCallersShareOneRefresh() async {
    RefreshURLProtocol.stub = .init(
      statusCode: 200,
      body: """
      { "access_token": "new-access", "refresh_token": "new-refresh", "expires_in": 3600 }
      """
    )
    let storage = InMemorySessionStorage(session: makeSession(expiresIn: -60))
    let refresher = makeRefresher(storage: storage)

    async let first = refresher.validSession()
    async let second = refresher.validSession()
    async let third = refresher.validSession()
    let results = await [first, second, third]

    XCTAssertEqual(RefreshURLProtocol.requestCount, 1)
    for result in results {
      XCTAssertEqual(result?.accessToken, "new-access")
    }
  }

  func testSessionWithoutRefreshTokenIsReturnedAsIs() async {
    let session = AuthSession(
      accessToken: "orphan",
      refreshToken: nil,
      expiresAt: Date().addingTimeInterval(-60),
      email: nil
    )
    let storage = InMemorySessionStorage(session: session)
    let refresher = makeRefresher(storage: storage)

    let result = await refresher.validSession()

    XCTAssertEqual(result, session)
    XCTAssertEqual(RefreshURLProtocol.requestCount, 0)
  }

  private func makeSession(expiresIn: TimeInterval) -> AuthSession {
    AuthSession(
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: Date().addingTimeInterval(expiresIn),
      email: "person@example.com"
    )
  }

  private func makeRefresher(storage: SessionStorage) -> BuiltinSessionRefresher {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [RefreshURLProtocol.self]
    return BuiltinSessionRefresher(
      authURL: URL(string: "https://example.com/auth__request__api")!,
      sessionStorage: storage,
      urlSession: URLSession(configuration: configuration)
    )
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

private final class RefreshURLProtocol: URLProtocol {
  struct StubResponse {
    let statusCode: Int
    let body: String
  }

  private static let lock = NSLock()
  private static var _stub: StubResponse?
  private static var _failWithError: Error?
  private static var _requestCount = 0

  static var stub: StubResponse? {
    get { lock.withLock { _stub } }
    set { lock.withLock { _stub = newValue } }
  }

  static var failWithError: Error? {
    get { lock.withLock { _failWithError } }
    set { lock.withLock { _failWithError = newValue } }
  }

  static var requestCount: Int {
    lock.withLock { _requestCount }
  }

  static func reset() {
    lock.withLock {
      _stub = nil
      _failWithError = nil
      _requestCount = 0
    }
  }

  override class func canInit(with request: URLRequest) -> Bool {
    true
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    request
  }

  override func startLoading() {
    Self.lock.withLock { Self._requestCount += 1 }

    if let error = Self.failWithError {
      client?.urlProtocol(self, didFailWithError: error)
      return
    }

    let stub = Self.stub ?? StubResponse(statusCode: 500, body: "{}")
    let response = HTTPURLResponse(
      url: request.url!,
      statusCode: stub.statusCode,
      httpVersion: nil,
      headerFields: nil
    )!
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
    client?.urlProtocol(self, didLoad: Data(stub.body.utf8))
    client?.urlProtocolDidFinishLoading(self)
  }

  override func stopLoading() {}
}
