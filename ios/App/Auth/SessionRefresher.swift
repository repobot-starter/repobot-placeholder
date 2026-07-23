import Foundation

/// Hands out a session suitable for authenticating a request right now,
/// refreshing it first when it is expired or about to expire.
protocol SessionProviding {
  func validSession() async -> AuthSession?
}

/// Returns whatever is in storage without refreshing. Used for the sandbox
/// flavor, whose local dev tokens never expire server-side.
struct StoredSessionProvider: SessionProviding {
  let sessionStorage: SessionStorage

  func validSession() async -> AuthSession? {
    sessionStorage.loadSession()
  }
}

/// Proactively redeems the refresh token when the access token is near
/// expiry. The built-in auth service rotates refresh tokens (each one is
/// single-use), so concurrent callers are funneled into one in-flight
/// refresh.
actor BuiltinSessionRefresher: SessionProviding {
  /// Refresh this long before the access token actually expires so a request
  /// never leaves the device with a token that dies mid-flight.
  private static let refreshMargin: TimeInterval = 120

  private let authURL: URL
  private let sessionStorage: SessionStorage
  private let urlSession: URLSession
  private var inFlightRefresh: Task<AuthSession?, Never>?

  init(authURL: URL, sessionStorage: SessionStorage, urlSession: URLSession = .shared) {
    self.authURL = authURL
    self.sessionStorage = sessionStorage
    self.urlSession = urlSession
  }

  func validSession() async -> AuthSession? {
    guard let session = sessionStorage.loadSession() else {
      return nil
    }
    guard Self.needsRefresh(session), session.refreshToken != nil else {
      return session
    }

    if let inFlightRefresh {
      return await inFlightRefresh.value
    }
    let refresh = Task { await performRefresh(current: session) }
    inFlightRefresh = refresh
    let refreshed = await refresh.value
    inFlightRefresh = nil
    return refreshed
  }

  static func needsRefresh(_ session: AuthSession, now: Date = Date()) -> Bool {
    guard let expiresAt = session.expiresAt else {
      // No expiry recorded (e.g. an old persisted session); optimistically use
      // it as-is rather than burning the single-use refresh token every call.
      return false
    }
    return expiresAt.timeIntervalSince(now) < refreshMargin
  }

  private func performRefresh(current: AuthSession) async -> AuthSession? {
    guard let refreshToken = current.refreshToken else {
      return current
    }

    let data: Data
    let statusCode: Int
    do {
      (data, statusCode) = try await postRefreshRequest(refreshToken: refreshToken)
    } catch {
      // Network failure: the token may still be fine; keep the session and let
      // the caller's request surface its own error instead of logging out.
      return current
    }

    guard 200..<300 ~= statusCode else {
      if statusCode == 400 || statusCode == 401 || statusCode == 403 {
        // The refresh token was definitively rejected (revoked or already
        // rotated away). The session is unrecoverable.
        sessionStorage.clearSession()
        return nil
      }
      return current
    }

    guard
      let payload = try? JSONDecoder().decode(RefreshResponsePayload.self, from: data),
      let accessToken = payload.accessToken,
      !accessToken.isEmpty
    else {
      return current
    }

    let refreshed = AuthSession(
      accessToken: accessToken,
      refreshToken: payload.refreshToken ?? refreshToken,
      expiresAt: payload.expiresIn.map { Date().addingTimeInterval(TimeInterval($0)) },
      email: payload.email ?? current.email
    )
    sessionStorage.persistSession(refreshed)
    return refreshed
  }

  private func postRefreshRequest(refreshToken: String) async throws -> (Data, Int) {
    var request = URLRequest(url: authURL.appending(path: "token"))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(RefreshRequestBody(refreshToken: refreshToken))

    let (data, response) = try await urlSession.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse else {
      throw URLError(.badServerResponse)
    }
    return (data, httpResponse.statusCode)
  }

  private struct RefreshRequestBody: Encodable {
    let grantType = "refresh_token"
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
      case grantType = "grant_type"
      case refreshToken = "refresh_token"
    }
  }

  private struct RefreshResponsePayload: Decodable {
    let accessToken: String?
    let refreshToken: String?
    let expiresIn: Int?
    let email: String?

    enum CodingKeys: String, CodingKey {
      case accessToken = "access_token"
      case refreshToken = "refresh_token"
      case expiresIn = "expires_in"
      case email
    }
  }
}
