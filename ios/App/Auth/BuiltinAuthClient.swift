import Foundation

enum BuiltinAuthClientError: Error, LocalizedError {
  case invalidEmail
  case invalidCode
  case requestFailed(Int)
  case requestFailedWithMessage(Int, String)
  case invalidResponsePayload

  var errorDescription: String? {
    switch self {
    case .invalidEmail:
      return "Enter a valid email address."
    case .invalidCode:
      return "Enter the 6-digit code from your email."
    case let .requestFailed(statusCode):
      return "Authentication request failed (\(statusCode))."
    case let .requestFailedWithMessage(statusCode, message):
      return "Authentication request failed (\(statusCode)): \(message)"
    case .invalidResponsePayload:
      return "Authentication response could not be parsed."
    }
  }
}

/// Auth client for deployed flavors, mirroring web/core's BuiltinAuthClient:
/// talks to the kernel's own auth__request__api function (email one-time
/// codes, email + password, Google OAuth via the system browser, anonymous
/// guests). Plain URLSession — the app's only SPM dependency stays Apollo.
@MainActor
final class BuiltinAuthClient: AuthClient {
  private let authURL: URL
  private let redirectURL: URL
  private let sessionStorage: SessionStorage
  private let urlSession: URLSession

  /// Shared with the GraphQL client so every request goes out with a
  /// fresh (refreshed-if-needed) access token.
  let sessionRefresher: BuiltinSessionRefresher

  init(
    authURL: URL,
    redirectURL: URL,
    sessionStorage: SessionStorage = UserDefaultsSessionStorage(),
    urlSession: URLSession = .shared
  ) {
    self.authURL = authURL
    self.redirectURL = redirectURL
    self.sessionStorage = sessionStorage
    self.urlSession = urlSession
    self.sessionRefresher = BuiltinSessionRefresher(
      authURL: authURL,
      sessionStorage: sessionStorage,
      urlSession: urlSession
    )
  }

  func restoreSession() async -> AuthSession? {
    await sessionRefresher.validSession()
  }

  func signInLocal() async throws -> AuthSession {
    throw LocalAuthClientError.notAvailable
  }

  func sendEmailCode(email: String) async throws {
    let trimmedEmail = try validatedEmail(email)
    _ = try await postJson(path: "otp", body: EmailRequest(email: trimmedEmail))
  }

  func verifyEmailCode(email: String, code: String) async throws -> AuthSession {
    let trimmedEmail = try validatedEmail(email)
    let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedCode.isEmpty else {
      throw BuiltinAuthClientError.invalidCode
    }
    let data = try await postJson(
      path: "verify",
      body: VerifyRequest(email: trimmedEmail, code: trimmedCode, type: "email")
    )
    return try persistSession(fromTokenData: data, fallbackEmail: trimmedEmail)
  }

  func signInWithPassword(email: String, password: String) async throws -> AuthSession {
    let trimmedEmail = try validatedEmail(email)
    let data = try await postJson(
      path: "token",
      body: PasswordGrantRequest(grantType: "password", email: trimmedEmail, password: password)
    )
    return try persistSession(fromTokenData: data, fallbackEmail: trimmedEmail)
  }

  func signUpWithPassword(email: String, password: String) async throws -> AuthSession? {
    let trimmedEmail = try validatedEmail(email)
    let data = try await postJson(
      path: "signup",
      body: SignUpRequest(email: trimmedEmail, password: password)
    )
    // With email delivery configured, signup returns requires_confirmation
    // and no session: that's success — the user confirms with the code.
    guard let payload = try? JSONDecoder().decode(TokenResponsePayload.self, from: data),
          let accessToken = payload.accessToken,
          !accessToken.isEmpty
    else {
      return nil
    }
    let session = AuthSession(
      accessToken: accessToken,
      refreshToken: payload.refreshToken,
      expiresAt: payload.expiresIn.map { Date().addingTimeInterval(TimeInterval($0)) },
      email: payload.email ?? trimmedEmail
    )
    sessionStorage.persistSession(session)
    return session
  }

  func requestPasswordReset(email: String) async throws {
    let trimmedEmail = try validatedEmail(email)
    _ = try await postJson(path: "recover", body: EmailRequest(email: trimmedEmail))
  }

  func completePasswordReset(email: String, code: String, newPassword: String) async throws -> AuthSession {
    let trimmedEmail = try validatedEmail(email)
    let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedCode.isEmpty else {
      throw BuiltinAuthClientError.invalidCode
    }

    // Verify the recovery code first; success hands back a fresh session for
    // the account being recovered.
    let data = try await postJson(
      path: "verify",
      body: VerifyRequest(email: trimmedEmail, code: trimmedCode, type: "recovery")
    )
    let session = try persistSession(fromTokenData: data, fallbackEmail: trimmedEmail)

    // Then set the new password with the fresh access token; the user stays
    // signed in with the session from the verify step.
    _ = try await postJson(
      path: "password",
      body: UpdatePasswordRequest(password: newPassword),
      bearerToken: session.accessToken
    )
    return session
  }

  func signInAnonymously() async throws -> AuthSession {
    let data = try await postJson(path: "anonymous", body: EmptyRequest())
    return try persistSession(fromTokenData: data, fallbackEmail: nil)
  }

  func oauthAuthorizeURL(provider: AuthMethod) -> URL? {
    guard provider == .google else {
      return nil
    }
    guard var components = URLComponents(
      url: authURL.appending(path: "google/start"),
      resolvingAgainstBaseURL: false
    ) else {
      return nil
    }
    components.queryItems = [
      URLQueryItem(name: "redirect_to", value: redirectURL.absoluteString)
    ]
    return components.url
  }

  func handleIncomingURL(_ url: URL) async -> AuthSession? {
    guard isExpectedAuthRedirect(url), let session = parseSession(from: url) else {
      return nil
    }
    sessionStorage.persistSession(session)
    return session
  }

  func signOut() async {
    if let refreshToken = sessionStorage.loadSession()?.refreshToken {
      // Best effort: local sign-out proceeds even if revocation fails.
      _ = try? await postJson(path: "signout", body: SignOutRequest(refreshToken: refreshToken))
    }
    sessionStorage.clearSession()
  }

  // MARK: - URL callback parsing

  private func isExpectedAuthRedirect(_ url: URL) -> Bool {
    guard url.scheme == redirectURL.scheme else {
      return false
    }
    if let callbackHost = redirectURL.host {
      guard url.host == callbackHost else {
        return false
      }
    }
    return url.path == redirectURL.path
  }

  /// Auth callbacks carry the session in the URL fragment.
  private func parseSession(from url: URL) -> AuthSession? {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return nil
    }
    let fragmentValues = queryValueMap(from: components.fragment)
    let queryValues = Dictionary(uniqueKeysWithValues: (components.queryItems ?? []).map { ($0.name, $0.value ?? "") })
    guard let accessToken = fragmentValues["access_token"] ?? queryValues["access_token"], !accessToken.isEmpty else {
      return nil
    }

    let expiresAt: Date?
    if let expiresInRaw = fragmentValues["expires_in"] ?? queryValues["expires_in"], let expiresIn = Double(expiresInRaw) {
      expiresAt = Date().addingTimeInterval(expiresIn)
    } else {
      expiresAt = nil
    }

    return AuthSession(
      accessToken: accessToken,
      refreshToken: fragmentValues["refresh_token"] ?? queryValues["refresh_token"],
      expiresAt: expiresAt,
      email: queryValues["email"] ?? fragmentValues["email"]
    )
  }

  private func queryValueMap(from fragment: String?) -> [String: String] {
    guard let fragment else {
      return [:]
    }

    return Dictionary(
      uniqueKeysWithValues:
        fragment
        .split(separator: "&")
        .compactMap { pair -> (String, String)? in
          let pieces = pair.split(separator: "=", maxSplits: 1)
          guard pieces.count == 2 else { return nil }
          let key = String(pieces[0])
          let value = String(pieces[1])
            .replacingOccurrences(of: "+", with: " ")
            .removingPercentEncoding ?? ""
          return (key, value)
        }
    )
  }

  // MARK: - Transport

  private func postJson(path: String, body: some Encodable, bearerToken: String? = nil) async throws -> Data {
    var request = URLRequest(url: authURL.appending(path: path))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    if let bearerToken {
      request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
    }
    request.httpBody = try JSONEncoder().encode(body)

    let (data, response) = try await urlSession.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse else {
      throw BuiltinAuthClientError.requestFailed(-1)
    }
    guard 200..<300 ~= httpResponse.statusCode else {
      if let message = parseErrorMessage(data: data) {
        throw BuiltinAuthClientError.requestFailedWithMessage(httpResponse.statusCode, message)
      }
      throw BuiltinAuthClientError.requestFailed(httpResponse.statusCode)
    }
    return data
  }

  private func parseErrorMessage(data: Data) -> String? {
    guard !data.isEmpty else {
      return nil
    }
    guard let payload = try? JSONDecoder().decode(ErrorPayload.self, from: data) else {
      return nil
    }
    let trimmed = payload.error?.message?.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed?.isEmpty == false ? trimmed : nil
  }

  private func persistSession(fromTokenData data: Data, fallbackEmail: String?) throws -> AuthSession {
    guard let payload = try? JSONDecoder().decode(TokenResponsePayload.self, from: data),
          let accessToken = payload.accessToken,
          !accessToken.isEmpty
    else {
      throw BuiltinAuthClientError.invalidResponsePayload
    }
    let session = AuthSession(
      accessToken: accessToken,
      refreshToken: payload.refreshToken,
      expiresAt: payload.expiresIn.map { Date().addingTimeInterval(TimeInterval($0)) },
      email: payload.email ?? fallbackEmail
    )
    sessionStorage.persistSession(session)
    return session
  }

  private func validatedEmail(_ email: String) throws -> String {
    let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
    guard (try? Self.emailRegex.wholeMatch(in: trimmedEmail)) != nil else {
      throw BuiltinAuthClientError.invalidEmail
    }
    return trimmedEmail
  }

  // MARK: - Payloads

  private struct EmailRequest: Encodable {
    let email: String
  }

  private struct VerifyRequest: Encodable {
    let email: String
    let code: String
    let type: String
  }

  private struct PasswordGrantRequest: Encodable {
    let grantType: String
    let email: String
    let password: String

    enum CodingKeys: String, CodingKey {
      case grantType = "grant_type"
      case email
      case password
    }
  }

  private struct SignUpRequest: Encodable {
    let email: String
    let password: String
  }

  private struct UpdatePasswordRequest: Encodable {
    let password: String
  }

  private struct SignOutRequest: Encodable {
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
      case refreshToken = "refresh_token"
    }
  }

  private struct EmptyRequest: Encodable {}

  private struct TokenResponsePayload: Decodable {
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

  private struct ErrorPayload: Decodable {
    struct ErrorBody: Decodable {
      let code: String?
      let message: String?
    }

    let error: ErrorBody?
  }

  private static let emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/
}
