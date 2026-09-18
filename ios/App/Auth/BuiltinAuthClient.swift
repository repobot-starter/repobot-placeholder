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
/// codes, email + password, Google OAuth via the system browser, native
/// Sign in with Apple, anonymous guests). Plain URLSession — the app's only
/// SPM dependency stays Apollo.
@MainActor
final class BuiltinAuthClient: AuthClient {
  private let authURL: URL
  private let redirectURL: URL
  private let sessionStorage: SessionStorage
  private let urlSession: URLSession
  /// Set while a sign-in yielded an MFA challenge; verifyMfaCode consumes it.
  private var pendingMfaChallenge: String?
  /// A reset flow's new password, applied once its MFA challenge is answered.
  private var pendingPasswordReset: String?

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
    return try adoptSignInResponse(data, fallbackEmail: trimmedEmail)
  }

  func signInWithPassword(email: String, password: String) async throws -> AuthSession {
    let trimmedEmail = try validatedEmail(email)
    let data = try await postJson(
      path: "token",
      body: PasswordGrantRequest(grantType: "password", email: trimmedEmail, password: password)
    )
    return try adoptSignInResponse(data, fallbackEmail: trimmedEmail)
  }

  func signUpWithPassword(email: String, password: String) async throws -> AuthSession? {
    let trimmedEmail = try validatedEmail(email)
    let data = try await postJson(
      path: "signup",
      body: SignUpRequest(email: trimmedEmail, password: password)
    )
    // An existing identity with MFA enabled is challenged even on signup.
    try interceptMfaChallenge(in: data)
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
    // the account being recovered. With MFA enabled the verify yields a
    // challenge instead: hold the new password and apply it right after
    // verifyMfaCode succeeds (mirrors web/core's BuiltinAuthClient).
    let data = try await postJson(
      path: "verify",
      body: VerifyRequest(email: trimmedEmail, code: trimmedCode, type: "recovery")
    )
    if let challenge = decodeMfaChallenge(from: data) {
      pendingMfaChallenge = challenge
      pendingPasswordReset = newPassword
      throw MfaRequiredError()
    }
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

  func signInWithApple(identityToken: String, fullName: String?) async throws -> AuthSession {
    let data = try await postJson(
      path: "apple/native",
      body: AppleNativeRequest(identityToken: identityToken, fullName: fullName)
    )
    return try adoptSignInResponse(data, fallbackEmail: nil)
  }

  func oauthAuthorizeURL(provider: AuthMethod) -> URL? {
    // Apple signs in natively (signInWithApple); every other OAuth provider
    // rides the system-browser redirect flow on iOS.
    guard provider.isOAuthProvider, provider != .apple else {
      return nil
    }
    guard var components = URLComponents(
      url: authURL.appending(path: "\(provider.rawValue)/start"),
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
    guard isExpectedAuthRedirect(url) else {
      return nil
    }
    // With MFA enabled the callback fragment carries a challenge instead of
    // tokens; the caller checks hasPendingMfaChallenge when no session came.
    if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
       let challenge = queryValueMap(from: components.fragment)["mfa_challenge"],
       !challenge.isEmpty
    {
      pendingMfaChallenge = challenge
      return nil
    }
    guard let session = parseSession(from: url) else {
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

  func fetchRuntimeAuthMethods() async -> [AuthMethod]? {
    // Fail-safe: the sign-in surface already rendered its build-time
    // methods; a missing or malformed runtime config must never blank it.
    struct RuntimeConfigResponse: Decodable {
      let methods: [String]?
    }
    do {
      let (data, response) = try await urlSession.data(from: authURL.appending(path: "config"))
      guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
        return nil
      }
      guard let names = try JSONDecoder().decode(RuntimeConfigResponse.self, from: data).methods else {
        return nil
      }
      var methods: [AuthMethod] = []
      for name in names {
        if let method = AuthMethod(rawValue: name), !methods.contains(method) {
          methods.append(method)
        }
      }
      return methods.isEmpty ? nil : methods
    } catch {
      return nil
    }
  }

  // MARK: - Two-factor authentication

  var hasPendingMfaChallenge: Bool {
    pendingMfaChallenge != nil
  }

  func verifyMfaCode(_ code: String) async throws -> AuthSession {
    guard let challengeToken = pendingMfaChallenge else {
      throw BuiltinAuthClientError.requestFailedWithMessage(
        400, "No sign-in is awaiting a code. Start over from the sign-in screen."
      )
    }
    let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedCode.isEmpty else {
      throw BuiltinAuthClientError.invalidCode
    }
    let data = try await postJson(
      path: "mfa/verify",
      body: MfaVerifyRequest(challengeToken: challengeToken, code: trimmedCode)
    )
    let session = try persistSession(fromTokenData: data, fallbackEmail: nil)
    pendingMfaChallenge = nil
    if let newPassword = pendingPasswordReset {
      pendingPasswordReset = nil
      _ = try await postJson(
        path: "password",
        body: UpdatePasswordRequest(password: newPassword),
        bearerToken: session.accessToken
      )
    }
    return session
  }

  func enrollMfa() async throws -> MfaEnrollment {
    let data = try await postJson(
      path: "mfa/enroll",
      body: EmptyRequest(),
      bearerToken: try await requireAccessToken()
    )
    guard let payload = try? JSONDecoder().decode(MfaEnrollmentPayload.self, from: data) else {
      throw BuiltinAuthClientError.invalidResponsePayload
    }
    return MfaEnrollment(secret: payload.secret, otpauthUri: payload.otpauthUri)
  }

  func confirmMfa(code: String) async throws -> [String] {
    let data = try await postJson(
      path: "mfa/confirm",
      body: MfaCodeRequest(code: code),
      bearerToken: try await requireAccessToken()
    )
    guard let payload = try? JSONDecoder().decode(MfaRecoveryCodesPayload.self, from: data) else {
      throw BuiltinAuthClientError.invalidResponsePayload
    }
    return payload.recoveryCodes
  }

  func disableMfa(code: String) async throws {
    _ = try await postJson(
      path: "mfa/disable",
      body: MfaCodeRequest(code: code),
      bearerToken: try await requireAccessToken()
    )
  }

  func fetchMfaEnabled() async -> Bool {
    // Fail-safe like fetchRuntimeAuthMethods: the Settings surface must
    // render even when the status endpoint is unreachable.
    struct MfaStatusResponse: Decodable {
      let enabled: Bool?
    }
    do {
      var request = URLRequest(url: authURL.appending(path: "mfa/status"))
      request.setValue("Bearer \(try await requireAccessToken())", forHTTPHeaderField: "Authorization")
      let (data, response) = try await urlSession.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
        return false
      }
      return (try JSONDecoder().decode(MfaStatusResponse.self, from: data)).enabled == true
    } catch {
      return false
    }
  }

  private func requireAccessToken() async throws -> String {
    guard let session = await sessionRefresher.validSession() else {
      throw BuiltinAuthClientError.requestFailedWithMessage(
        401, "You must be signed in to manage two-factor authentication."
      )
    }
    return session.accessToken
  }

  /// Adopts a sign-in response: persists the session, or — when the backend
  /// answered with an MFA challenge — holds the challenge token and throws
  /// MfaRequiredError so the surface can switch to its challenge view.
  private func adoptSignInResponse(_ data: Data, fallbackEmail: String?) throws -> AuthSession {
    try interceptMfaChallenge(in: data)
    return try persistSession(fromTokenData: data, fallbackEmail: fallbackEmail)
  }

  private func interceptMfaChallenge(in data: Data) throws {
    if let challenge = decodeMfaChallenge(from: data) {
      pendingMfaChallenge = challenge
      throw MfaRequiredError()
    }
  }

  private func decodeMfaChallenge(from data: Data) -> String? {
    guard let payload = try? JSONDecoder().decode(MfaChallengePayload.self, from: data),
          payload.mfaRequired == true,
          let challengeToken = payload.challengeToken,
          !challengeToken.isEmpty
    else {
      return nil
    }
    return challengeToken
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

  private struct AppleNativeRequest: Encodable {
    let identityToken: String
    let fullName: String?

    enum CodingKeys: String, CodingKey {
      case identityToken = "identity_token"
      case fullName = "full_name"
    }
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

  private struct MfaVerifyRequest: Encodable {
    let challengeToken: String
    let code: String

    enum CodingKeys: String, CodingKey {
      case challengeToken = "challenge_token"
      case code
    }
  }

  private struct MfaCodeRequest: Encodable {
    let code: String
  }

  private struct MfaChallengePayload: Decodable {
    let mfaRequired: Bool?
    let challengeToken: String?

    enum CodingKeys: String, CodingKey {
      case mfaRequired = "mfa_required"
      case challengeToken = "challenge_token"
    }
  }

  private struct MfaEnrollmentPayload: Decodable {
    let secret: String
    let otpauthUri: String

    enum CodingKeys: String, CodingKey {
      case secret
      case otpauthUri = "otpauth_uri"
    }
  }

  private struct MfaRecoveryCodesPayload: Decodable {
    let recoveryCodes: [String]

    enum CodingKeys: String, CodingKey {
      case recoveryCodes = "recovery_codes"
    }
  }

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
