import Foundation
import AppGraphqlApi

/// Identity mutations for the signed-in user. Reads flow through the session
/// store's hydrated user; this component owns writes and the follow-up
/// rehydration + alerts (Store -> Component -> View pattern).
@MainActor
final class UserComponent {
  /// Returns true when the profile was saved (so editors can dismiss).
  func updateDisplayName(userId: String, displayName: String) async -> Bool {
    let trimmed = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      reportError("Enter a display name.")
      return false
    }
    do {
      _ = try await gql.updateUser(
        input: UpdateUserInput(
          objectId: userId,
          idempotencyKey: UUID().uuidString,
          fields: UpdateUserFields(displayName: .some(trimmed))
        )
      )
      // The settings screen renders the hydrated user; refresh it so the
      // change is visible everywhere (shell profile, settings, users list).
      await components.auth.refreshHydratedUser()
      reportSuccess("Profile updated.")
      return true
    } catch {
      reportError(error.localizedDescription)
      return false
    }
  }

  private func reportError(_ message: String) {
    let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    store.sessionStore.reportError(trimmed)
    store.appAlertStore.activeAlert = AppAlertStore.AlertMessage(
      id: "user-error-\(trimmed)",
      message: trimmed,
      isError: true
    )
  }

  private func reportSuccess(_ message: String) {
    store.sessionStore.reportSuccess(message)
    store.appAlertStore.activeAlert = AppAlertStore.AlertMessage(
      id: "user-success-\(message)",
      message: message,
      isError: false
    )
  }
}
