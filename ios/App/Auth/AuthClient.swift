import Foundation

/// Auth abstraction consumed by AuthComponent and the sign-in screen. Two
/// implementations exist, mirroring web/core's AuthClient:
/// - LocalAuthClient: sandbox flavor; signs in with the bootstrap-generated
///   dev JWT stamped into Config.sandbox.plist.
/// - BuiltinAuthClient: deployed flavors; every method the sign-in surface
///   can render (see AuthMethods.swift) has a client call here. Modes that
///   don't support a method throw a descriptive error instead of failing
///   silently.
protocol AuthClient: AnyObject {
  func restoreSession() async -> AuthSession?
  /// Local mode only: sign in as the local dev principal.
  func signInLocal() async throws -> AuthSession
  /// Builtin mode only: email a one-time sign-in code (also carries a magic link).
  func sendEmailCode(email: String) async throws
  /// Builtin mode only: verify the emailed code and sign in.
  func verifyEmailCode(email: String, code: String) async throws -> AuthSession
  /// Builtin mode only: email + password sign-in.
  func signInWithPassword(email: String, password: String) async throws -> AuthSession
  /// Builtin mode only: create an email + password account. Returns the new
  /// session when the environment auto-confirms; nil when a confirmation
  /// email was sent instead.
  func signUpWithPassword(email: String, password: String) async throws -> AuthSession?
  /// Builtin mode only: email a password-recovery code (also carries a link).
  func requestPasswordReset(email: String) async throws
  /// Builtin mode only: verify the emailed recovery code and set a new
  /// password, leaving the user signed in with the fresh session.
  func completePasswordReset(email: String, code: String, newPassword: String) async throws -> AuthSession
  /// Builtin mode only: sign in as an anonymous guest user.
  func signInAnonymously() async throws -> AuthSession
  /// Builtin mode only: URL that starts the OAuth redirect flow in the
  /// system browser for .google. The provider redirects back to
  /// AUTH_REDIRECT_URL, which handleIncomingURL completes. Nil in local mode
  /// or for non-OAuth methods.
  func oauthAuthorizeURL(provider: AuthMethod) -> URL?
  /// Builtin mode only: complete an auth deep link (magic link or OAuth
  /// callback). Returns nil when the URL is not an auth callback.
  func handleIncomingURL(_ url: URL) async -> AuthSession?
  func signOut() async
}
