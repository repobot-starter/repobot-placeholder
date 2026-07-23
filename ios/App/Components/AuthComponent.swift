import Foundation

@MainActor
final class AuthComponent {
  private var sessionStore: SessionStore {
    store.sessionStore
  }

  private var appAlertStore: AppAlertStore {
    store.appAlertStore
  }

  func restoreSessionAndHydrateUser() async {
    sessionStore.setSession(await appAuthClient.restoreSession())
    guard sessionStore.session != nil else {
      return
    }
    await hydrateAuthenticatedUser()
  }

  func refreshHydratedUser() async {
    guard sessionStore.session != nil else {
      return
    }
    await hydrateAuthenticatedUser()
  }

  /// Sandbox flavor: sign in as the bootstrap-generated local dev principal.
  func signInLocal() async {
    guard !sessionStore.state.isSigningIn else {
      return
    }
    sessionStore.clearStatusMessages()
    sessionStore.setSigningIn(true)
    do {
      let session = try await appAuthClient.signInLocal()
      await completeAuthenticatedSignIn(session: session)
    } catch {
      reportError(error.localizedDescription)
    }
    sessionStore.setSigningIn(false)
  }

  /// Deployed flavors: email a one-time sign-in code. Returns true when the
  /// email was sent so the view can advance to code entry.
  func sendEmailCode(email: String) async -> Bool {
    guard !sessionStore.state.isSigningIn else {
      return false
    }
    sessionStore.clearStatusMessages()
    sessionStore.setSigningIn(true)
    defer {
      sessionStore.setSigningIn(false)
    }
    do {
      try await appAuthClient.sendEmailCode(email: email)
      reportSuccess("Check your email for a sign-in code.")
      return true
    } catch {
      reportError(error.localizedDescription)
      return false
    }
  }

  func verifyEmailCode(email: String, code: String) async {
    guard !sessionStore.state.isSigningIn else {
      return
    }
    sessionStore.clearStatusMessages()
    sessionStore.setSigningIn(true)
    do {
      let session = try await appAuthClient.verifyEmailCode(email: email, code: code)
      await completeAuthenticatedSignIn(session: session)
    } catch {
      reportError(error.localizedDescription)
    }
    sessionStore.setSigningIn(false)
  }

  func signInWithPassword(email: String, password: String) async {
    guard !sessionStore.state.isSigningIn else {
      return
    }
    sessionStore.clearStatusMessages()
    sessionStore.setSigningIn(true)
    do {
      let session = try await appAuthClient.signInWithPassword(email: email, password: password)
      await completeAuthenticatedSignIn(session: session)
    } catch {
      reportError(error.localizedDescription)
    }
    sessionStore.setSigningIn(false)
  }

  /// Create an email + password account. Auto-confirming projects return a
  /// session and sign straight in; otherwise a confirmation email is sent.
  func signUpWithPassword(email: String, password: String) async {
    guard !sessionStore.state.isSigningIn else {
      return
    }
    sessionStore.clearStatusMessages()
    sessionStore.setSigningIn(true)
    do {
      if let session = try await appAuthClient.signUpWithPassword(email: email, password: password) {
        await completeAuthenticatedSignIn(session: session)
      } else {
        reportSuccess("Account created — check your inbox to confirm your email.")
      }
    } catch {
      reportError(error.localizedDescription)
    }
    sessionStore.setSigningIn(false)
  }

  /// Email a password-reset code. Returns true when the email was sent so
  /// the view can advance to code + new-password entry.
  func requestPasswordReset(email: String) async -> Bool {
    guard !sessionStore.state.isSigningIn else {
      return false
    }
    sessionStore.clearStatusMessages()
    sessionStore.setSigningIn(true)
    defer {
      sessionStore.setSigningIn(false)
    }
    do {
      try await appAuthClient.requestPasswordReset(email: email)
      reportSuccess("Reset code sent — check your inbox.")
      return true
    } catch {
      reportError(error.localizedDescription)
      return false
    }
  }

  /// Verify the emailed reset code and set the new password; success leaves
  /// the user signed in with the fresh session.
  func completePasswordReset(email: String, code: String, newPassword: String) async {
    guard !sessionStore.state.isSigningIn else {
      return
    }
    sessionStore.clearStatusMessages()
    sessionStore.setSigningIn(true)
    do {
      let session = try await appAuthClient.completePasswordReset(
        email: email,
        code: code,
        newPassword: newPassword
      )
      await completeAuthenticatedSignIn(session: session)
    } catch {
      reportError(error.localizedDescription)
    }
    sessionStore.setSigningIn(false)
  }

  func signInAnonymously() async {
    guard !sessionStore.state.isSigningIn else {
      return
    }
    sessionStore.clearStatusMessages()
    sessionStore.setSigningIn(true)
    do {
      let session = try await appAuthClient.signInAnonymously()
      await completeAuthenticatedSignIn(session: session)
    } catch {
      reportError(error.localizedDescription)
    }
    sessionStore.setSigningIn(false)
  }

  /// Magic-link deep link back into the app. Returns true when handled.
  @discardableResult
  func handleIncomingURL(_ url: URL) async -> Bool {
    guard let session = await appAuthClient.handleIncomingURL(url) else {
      return false
    }
    sessionStore.clearStatusMessages()
    await completeAuthenticatedSignIn(session: session)
    return true
  }

  func signOut() async {
    await appAuthClient.signOut()
    sessionStore.resetForSignOut()
  }

  private func completeAuthenticatedSignIn(session: AuthSession) async {
    sessionStore.setSession(session)
    await hydrateAuthenticatedUser()
  }

  private func hydrateAuthenticatedUser() async {
    sessionStore.setHydratingUser(true)
    defer {
      sessionStore.setHydratingUser(false)
    }
    do {
      let hydrated = try await gql.fetchCurrentUser()
      sessionStore.setHydratedUser(hydrated)
      sessionStore.clearStatusMessages()
      appAlertStore.activeAlert = nil
    } catch {
      guard Self.isAuthFailure(error) else {
        // Transient problem (offline, server hiccup): keep the session so the
        // user isn't signed out over a network blip. The next refresh retries.
        reportError("Could not load your account. Check your connection and try again.")
        return
      }
      sessionStore.setHydratedUser(nil)
      sessionStore.setSession(nil)
      reportError("Your session has expired. Please sign in again.")
      await appAuthClient.signOut()
    }
  }

  /// Only these errors mean the credentials themselves are bad. Anything else
  /// (timeouts, DNS failures, 5xx) should never destroy the local session.
  private static func isAuthFailure(_ error: Error) -> Bool {
    guard let gqlError = error as? GraphQLClientError else {
      return false
    }
    switch gqlError {
    case .unauthenticated:
      return true
    case let .httpFailure(statusCode, _):
      return statusCode == 401 || statusCode == 403
    case let .upstream(message):
      return message.localizedCaseInsensitiveContains("unauthenticated")
        || message.localizedCaseInsensitiveContains("unauthorized")
    case .invalidResponse, .networkFailure:
      return false
    }
  }

  private func reportError(_ message: String) {
    sessionStore.reportError(message)
    let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    appAlertStore.activeAlert = AppAlertStore.AlertMessage(
      id: "error-\(trimmed)",
      message: trimmed,
      isError: true
    )
  }

  private func reportSuccess(_ message: String) {
    sessionStore.reportSuccess(message)
    let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    appAlertStore.activeAlert = AppAlertStore.AlertMessage(
      id: "success-\(trimmed)",
      message: trimmed,
      isError: false
    )
  }
}
