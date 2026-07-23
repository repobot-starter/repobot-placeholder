import SwiftUI

/// Signed-in shell. Tabs mirror the web kernel's exemplar routes: /projects,
/// /users, plus an account tab for the current session.
struct MainTabView: View {
  @Environment(\.uiThemeTokens) private var theme

  var body: some View {
    TabView {
      NavigationStack {
        ProjectsListView()
          .navigationTitle("Projects")
      }
      .tabItem {
        Label("Projects", systemImage: "folder")
      }

      NavigationStack {
        UsersListView()
          .navigationTitle("Users")
      }
      .tabItem {
        Label("Users", systemImage: "person.2")
      }

      NavigationStack {
        AccountView()
          .navigationTitle("Account")
      }
      .tabItem {
        Label("Account", systemImage: "person.crop.circle")
      }
    }
    .tint(theme.colors.accent)
  }
}

private struct AccountView: View {
  @EnvironmentObject private var appComponents: AppComponents
  @EnvironmentObject private var sessionStore: SessionStore
  @Environment(\.uiThemeTokens) private var theme

  var body: some View {
    List {
      if let user = sessionStore.state.hydratedUser {
        Section("Signed in as") {
          VStack(alignment: .leading, spacing: 4) {
            Text(user.displayName)
              .font(.system(size: theme.typography.sizes.md, weight: .semibold))
            Text(user.email)
              .font(.system(size: theme.typography.sizes.sm))
              .foregroundStyle(theme.colors.textSecondary)
          }
          .padding(.vertical, 2)

          if let account = user.account {
            LabeledContent("Account", value: account.name)
          }
        }
      }

      Section {
        Button("Sign out", role: .destructive) {
          Task {
            await appComponents.auth.signOut()
          }
        }
      }
    }
  }
}
