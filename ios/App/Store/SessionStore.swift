import SwiftUI

@MainActor
final class SessionStore: ObservableObject {
  @Published private(set) var state = AuthState(
    session: nil,
    hydratedUser: nil,
    isHydratingUser: false,
    isSigningIn: false,
    lastError: nil,
    successMessage: nil
  )

  init() {}

  var isAuthenticated: Bool {
    state.session != nil
  }

  var hasHydratedUser: Bool {
    state.hydratedUser != nil
  }

  var session: AuthSession? {
    state.session
  }

  func reportError(_ message: String) {
    state.lastError = message
    state.successMessage = nil
  }

  func reportSuccess(_ message: String) {
    state.lastError = nil
    state.successMessage = message
  }

  func clearStatusMessages() {
    state.lastError = nil
    state.successMessage = nil
  }

  // MARK: - State mutators used by components

  func setSession(_ session: AuthSession?) {
    state.session = session
  }

  func setHydratedUser(_ user: CurrentUserData?) {
    state.hydratedUser = user
  }

  func setHydratingUser(_ isHydrating: Bool) {
    state.isHydratingUser = isHydrating
  }

  func setSigningIn(_ isSigningIn: Bool) {
    state.isSigningIn = isSigningIn
  }

  func resetForSignOut() {
    state.session = nil
    state.hydratedUser = nil
    state.isHydratingUser = false
    state.isSigningIn = false
    clearStatusMessages()
  }
}
