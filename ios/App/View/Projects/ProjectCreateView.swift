import SwiftUI

struct ProjectCreateView: View {
  @EnvironmentObject private var appComponents: AppComponents
  @Environment(\.uiThemeTokens) private var theme
  let onCreated: (() -> Void)?

  @State private var name = ""
  @State private var descriptionText = ""
  @State private var isSubmitting = false

  init(onCreated: (() -> Void)? = nil) {
    self.onCreated = onCreated
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 20) {
      VStack(alignment: .leading, spacing: 4) {
        Text("Create a project")
          .font(.system(size: theme.typography.sizes.xl, weight: .bold))
          .foregroundStyle(theme.colors.textPrimary)
        Text("Projects organize your team's work.")
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.textSecondary)
      }

      LabeledTextField(
        title: "Project name",
        placeholder: "Enter project name",
        text: $name,
        capitalization: .words,
        isRequired: true
      )

      LabeledTextField(
        title: "Description",
        placeholder: "What is this project about?",
        text: $descriptionText,
        capitalization: .sentences,
        disableAutocorrection: false
      )

      PrimaryActionButton(
        title: "Create project",
        loadingTitle: "Creating...",
        isLoading: isSubmitting,
        isEnabled: canSubmit
      ) {
        Task { await submit() }
      }

      Spacer(minLength: 0)
    }
    .padding(24)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(theme.colors.appBg)
  }

  private var canSubmit: Bool {
    !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }

  private func submit() async {
    guard !isSubmitting else { return }
    isSubmitting = true
    defer { isSubmitting = false }
    let didCreate = await appComponents.project.createProject(
      name: name,
      description: descriptionText.isEmpty ? nil : descriptionText
    )
    if didCreate {
      onCreated?()
    }
  }
}
