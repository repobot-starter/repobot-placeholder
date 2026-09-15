import SwiftUI

/// The application shell: a top bar with a menu button plus a slide-over
/// sidebar drawer over the content — the native twin of the web
/// design-system AppShell (see docs/shell.md). Generic over the shell nav
/// schema (ShellNavModels.swift); apps bind it with their nav config and a
/// content host, like KernelShellView does for the Identity exemplar.
struct NavigationShellView<Content: View>: View {
  @Environment(\.uiThemeTokens) private var theme

  let title: String
  let sections: [ShellNavSection]
  var drillUp: ShellDrillUp? = nil
  var profile: ShellProfile? = nil
  @Binding var selectedItemId: String
  @ViewBuilder let content: (String) -> Content

  @State private var isSidebarOpen = false

  private static var drawerWidth: CGFloat { 300 }

  var body: some View {
    ZStack(alignment: .leading) {
      VStack(spacing: 0) {
        topBar
        content(selectedItemId)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
      .background(theme.colors.appBg)

      if isSidebarOpen {
        theme.colors.overlayBackdrop
          .ignoresSafeArea()
          .onTapGesture { closeSidebar() }
          .transition(.opacity)
      }

      SidebarMenuView(
        title: title,
        sections: sections,
        drillUp: drillUp.map { drillUp in
          ShellDrillUp(label: drillUp.label) {
            closeSidebar()
            drillUp.action()
          }
        },
        profile: profile.map { profile in
          // Menu-item actions typically navigate, so close the drawer first.
          var wrapped = profile
          wrapped.items = profile.items.map { item in
            ShellProfileMenuItem(id: item.id, label: item.label, systemImage: item.systemImage) {
              closeSidebar()
              item.action()
            }
          }
          return wrapped
        },
        selectedItemId: selectedItemId,
        onSelect: { item in
          selectedItemId = item.id
          closeSidebar()
        }
      )
      .frame(width: Self.drawerWidth)
      .offset(x: isSidebarOpen ? 0 : -(Self.drawerWidth + 24))
      .ignoresSafeArea(edges: .bottom)
    }
    .animation(.easeInOut(duration: 0.2), value: isSidebarOpen)
    .background(hotkeyHandlers)
  }

  private var topBar: some View {
    HStack(spacing: theme.spacing.md) {
      Button {
        withAnimation(.easeInOut(duration: 0.2)) {
          isSidebarOpen.toggle()
        }
      } label: {
        Image(systemName: "line.3.horizontal")
          .font(.system(size: theme.typography.sizes.lg, weight: .medium))
          .foregroundStyle(theme.colors.textPrimary)
          .frame(width: 36, height: 36)
          .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
      .accessibilityLabel("Open navigation")

      Text(activeItemLabel)
        .font(theme.typography.font(size: theme.typography.sizes.md, weight: .semibold))
        .foregroundStyle(theme.colors.textPrimary)
        .lineLimit(1)

      Spacer(minLength: 0)
    }
    .padding(.horizontal, theme.spacing.sm)
    .frame(height: 48)
    .background(theme.colors.surface)
    .overlay(alignment: .bottom) {
      Rectangle()
        .fill(theme.colors.border)
        .frame(height: 1)
    }
  }

  private var activeItemLabel: String {
    ShellNavigation.flattenItems(sections)
      .first { $0.id == selectedItemId }?
      .label ?? title
  }

  /// Cmd+Shift+<key> shortcuts from the nav schema, for hardware keyboards.
  @ViewBuilder
  private var hotkeyHandlers: some View {
    ForEach(Array(ShellNavigation.hotkeyMap(sections)), id: \.key) { key, itemId in
      if let character = key.first {
        Button("") {
          selectedItemId = itemId
          closeSidebar()
        }
        .keyboardShortcut(KeyEquivalent(character), modifiers: [.command, .shift])
        .hidden()
      }
    }
  }

  private func closeSidebar() {
    withAnimation(.easeInOut(duration: 0.2)) {
      isSidebarOpen = false
    }
  }
}
