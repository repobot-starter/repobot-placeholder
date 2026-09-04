import SwiftUI

/// Signed-in shell for the kernel Identity exemplar: binds the shell nav
/// config (mirroring the web `shellNavSections`) and the destination views
/// into the generic NavigationShellView. Products edit the nav data and the
/// content switch — not the shell chrome (see docs/shell.md).
struct KernelShellView: View {
  @EnvironmentObject private var appComponents: AppComponents
  @EnvironmentObject private var sessionStore: SessionStore

  @State private var selectedItemId = KernelNav.projectsId

  private enum KernelNav {
    static let projectsId = "/projects"
    static let usersId = "/users"
    static let settingsId = "/settings"

    static let sections: [ShellNavSection] = [
      ShellNavSection(
        id: "workspace",
        items: [
          ShellNavItem(id: projectsId, label: "Projects", systemImage: "folder", hotkey: "p"),
          ShellNavItem(id: usersId, label: "Users", systemImage: "person.2", hotkey: "u"),
        ]
      ),
      ShellNavSection(
        id: "account",
        items: [
          ShellNavItem(id: settingsId, label: "Settings", systemImage: "gearshape", hotkey: "s")
        ]
      ),
    ]
  }

  var body: some View {
    NavigationShellView(
      title: appConfig.appName,
      sections: KernelNav.sections,
      profile: profile,
      selectedItemId: $selectedItemId
    ) { itemId in
      switch itemId {
      case KernelNav.usersId:
        UsersListView()
      case KernelNav.settingsId:
        SettingsView()
      default:
        ProjectsListView()
      }
    }
  }

  private var profile: ShellProfile? {
    guard let user = sessionStore.state.hydratedUser else {
      return nil
    }
    return ShellProfile(
      label: user.displayName,
      sublabel: user.email,
      avatarURL: Self.avatarURL(avatarUploadId: user.avatarUploadId),
      items: [
        ShellProfileMenuItem(id: KernelNav.settingsId, label: "Account settings", systemImage: "gearshape") {
          selectedItemId = KernelNav.settingsId
        }
      ],
      onSignOut: {
        Task {
          await appComponents.auth.signOut()
        }
      }
    )
  }

  /// PUBLIC avatar uploads serve from the storage kernel's stable file URL
  /// (web twin: AppLayout's avatarUrl via buildPublicFileUrl).
  static func avatarURL(avatarUploadId: String?) -> URL? {
    guard
      let avatarUploadId,
      let endpoint = StorageUploadClient.endpoint(graphqlURL: appConfig.graphqlURL)
    else {
      return nil
    }
    return StorageUploadClient.publicFileURL(endpoint: endpoint, uploadId: avatarUploadId)
  }
}
