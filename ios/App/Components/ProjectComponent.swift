import Foundation
import AppGraphqlApi

/// Project mutations. Reads flow through ProjectsPageComponent's feed; this
/// component owns writes and cross-cutting side effects (refresh + alerts).
@MainActor
final class ProjectComponent {
  /// Returns true when the project was created (so sheets can dismiss).
  func createProject(name: String, description: String?) async -> Bool {
    let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedName.isEmpty else {
      reportError("Enter a project name.")
      return false
    }
    let trimmedDescription = description?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    do {
      _ = try await gql.createProject(
        input: CreateProjectInput(
          idempotencyKey: UUID().uuidString,
          fields: CreateProjectFields(
            name: trimmedName,
            description: trimmedDescription.isEmpty ? .none : .some(trimmedDescription)
          )
        )
      )
      await components.projectsPage.refresh(withLoading: false)
      reportSuccess("Project created.")
      return true
    } catch {
      reportError(error.localizedDescription)
      return false
    }
  }

  func archiveProject(projectId: String) async -> Bool {
    do {
      _ = try await gql.updateProject(
        input: UpdateProjectInput(
          objectId: projectId,
          idempotencyKey: UUID().uuidString,
          fields: UpdateProjectFields(doArchive: .some(true))
        )
      )
      await components.projectsPage.refresh(withLoading: false)
      reportSuccess("Project archived.")
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
      id: "project-error-\(trimmed)",
      message: trimmed,
      isError: true
    )
  }

  private func reportSuccess(_ message: String) {
    store.sessionStore.reportSuccess(message)
    store.appAlertStore.activeAlert = AppAlertStore.AlertMessage(
      id: "project-success-\(message)",
      message: message,
      isError: false
    )
  }
}
