import SwiftUI

/// Drill-up affordance rendered above the nav when a hierarchical app is
/// inside a child nav level (see ShellNavLevel).
struct ShellDrillUp {
  let label: String
  let action: () -> Void
}

/// An app-supplied entry in the account menu (e.g. "Account settings").
struct ShellProfileMenuItem: Identifiable {
  let id: String
  let label: String
  var systemImage: String? = nil
  let action: () -> Void
}

/// The signed-in account shown in the drawer footer.
struct ShellProfile {
  let label: String
  var sublabel: String? = nil
  /// Avatar image URL; the label's initials render when nil (web twin:
  /// AppShellProfile.avatarUrl).
  var avatarURL: URL? = nil
  /// Rendered above the built-in theme toggle + sign out rows; what the
  /// items do is the binder's concern (the shell stays domain-agnostic).
  var items: [ShellProfileMenuItem] = []
  var onSignOut: (() -> Void)? = nil
}

/// The sidebar drawer: brand row, sectioned nav (badges, expandable
/// children, drill-up), and the account footer with theme + sign out —
/// the native twin of the web design-system AppShell sidebar. Purely
/// presentational; nav data and handlers are injected.
struct SidebarMenuView: View {
  @Environment(\.uiThemeTokens) private var theme
  @AppStorage("base.themeMode") private var themeModeSetting = "system"

  let title: String
  let sections: [ShellNavSection]
  var drillUp: ShellDrillUp? = nil
  var profile: ShellProfile? = nil
  let selectedItemId: String
  let onSelect: (ShellNavItem) -> Void

  @State private var expandedGroupIds: Set<String> = []
  @State private var isAccountMenuOpen = false

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      brandRow

      ScrollView {
        VStack(alignment: .leading, spacing: theme.spacing.md) {
          if let drillUp {
            drillUpRow(drillUp)
          }
          ForEach(Array(sections.enumerated()), id: \.element.id) { index, section in
            sectionView(section, isFirst: index == 0)
          }
        }
        .padding(.horizontal, theme.spacing.sm)
        .padding(.vertical, theme.spacing.sm)
      }

      if let profile {
        accountFooter(profile)
      }
    }
    .frame(maxHeight: .infinity, alignment: .top)
    .background(theme.colors.surface)
    .overlay(alignment: .trailing) {
      Rectangle()
        .fill(theme.colors.border)
        .frame(width: 1)
    }
    .onAppear {
      expandGroupContainingSelection()
    }
    .onChange(of: selectedItemId) {
      expandGroupContainingSelection()
    }
  }

  private var brandRow: some View {
    HStack(spacing: theme.spacing.sm) {
      Text(title)
        .font(theme.typography.font(size: theme.typography.sizes.lg, weight: .bold))
        .foregroundStyle(theme.colors.textPrimary)
        .lineLimit(1)
      Spacer(minLength: 0)
    }
    .padding(.horizontal, theme.spacing.md)
    .padding(.vertical, theme.spacing.md)
  }

  private func drillUpRow(_ drillUp: ShellDrillUp) -> some View {
    Button(action: drillUp.action) {
      HStack(spacing: theme.spacing.sm) {
        Image(systemName: "chevron.backward")
          .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
        Text(drillUp.label)
          .font(theme.typography.font(size: theme.typography.sizes.sm, weight: .semibold))
        Spacer(minLength: 0)
      }
      .foregroundStyle(theme.colors.textSecondary)
      .padding(.horizontal, theme.spacing.sm)
      .padding(.vertical, theme.spacing.xs)
    }
    .buttonStyle(.plain)
  }

  @ViewBuilder
  private func sectionView(_ section: ShellNavSection, isFirst: Bool) -> some View {
    VStack(alignment: .leading, spacing: theme.spacing.xxs) {
      if let sectionTitle = section.title {
        Text(sectionTitle.uppercased())
          .font(theme.typography.font(size: theme.typography.sizes.xs, weight: .bold))
          .kerning(0.8)
          .foregroundStyle(theme.colors.textSecondary)
          .padding(.horizontal, theme.spacing.sm)
          .padding(.top, theme.spacing.xs)
      } else if !isFirst {
        Rectangle()
          .fill(theme.colors.border)
          .frame(height: 1)
          .padding(.horizontal, theme.spacing.sm)
          .padding(.vertical, theme.spacing.xs)
      }
      ForEach(section.items) { item in
        navRow(item, isChild: false)
        if !item.children.isEmpty, expandedGroupIds.contains(item.id) {
          ForEach(item.children) { child in
            navRow(child, isChild: true)
          }
        }
      }
    }
  }

  @ViewBuilder
  private func navRow(_ item: ShellNavItem, isChild: Bool) -> some View {
    let isActive = selectedItemId == item.id
    let hasChildren = !item.children.isEmpty
    Button {
      if hasChildren {
        toggleGroup(item.id)
      } else {
        onSelect(item)
      }
    } label: {
      HStack(spacing: theme.spacing.sm) {
        if let systemImage = item.systemImage {
          Image(systemName: systemImage)
            .font(.system(size: theme.typography.sizes.md, weight: .medium))
            .frame(width: 20)
        }
        Text(item.label)
          .font(theme.typography.font(size: theme.typography.sizes.sm, weight: .semibold))
          .lineLimit(1)
        Spacer(minLength: 0)
        if let badgeText = item.badgeText, !badgeText.isEmpty, badgeText != "0" {
          Text(badgeText)
            .font(theme.typography.font(size: theme.typography.sizes.xs, weight: .bold))
            .foregroundStyle(theme.colors.accent)
            .padding(.horizontal, theme.spacing.xs)
            .padding(.vertical, 1)
            .background(Capsule().fill(theme.colors.accent.opacity(0.14)))
        }
        if hasChildren {
          Image(systemName: "chevron.forward")
            .font(.system(size: theme.typography.sizes.xs, weight: .semibold))
            .foregroundStyle(theme.colors.textSecondary)
            .rotationEffect(.degrees(expandedGroupIds.contains(item.id) ? 90 : 0))
        }
      }
      .foregroundStyle(isActive ? theme.colors.accent : theme.colors.textSecondary)
      .padding(.horizontal, theme.spacing.sm)
      .padding(.vertical, theme.spacing.xs + 2)
      .padding(.leading, isChild ? theme.spacing.xl : 0)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .fill(isActive ? theme.colors.accent.opacity(0.12) : Color.clear)
      )
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .accessibilityLabel(item.label)
  }

  @ViewBuilder
  private func accountFooter(_ profile: ShellProfile) -> some View {
    VStack(alignment: .leading, spacing: theme.spacing.xs) {
      Rectangle()
        .fill(theme.colors.border)
        .frame(height: 1)

      if isAccountMenuOpen {
        ForEach(profile.items) { item in
          Button(action: item.action) {
            menuRow(systemImage: item.systemImage ?? "gearshape", label: item.label)
          }
          .buttonStyle(.plain)
        }

        Button {
          themeModeSetting = theme.mode == .light ? "dark" : "light"
        } label: {
          menuRow(
            systemImage: theme.mode == .light ? "moon" : "sun.max",
            label: theme.mode == .light ? "Dark mode" : "Light mode"
          )
        }
        .buttonStyle(.plain)

        if let onSignOut = profile.onSignOut {
          Button(action: onSignOut) {
            menuRow(systemImage: "rectangle.portrait.and.arrow.right", label: "Sign out")
          }
          .buttonStyle(.plain)
        }
      }

      Button {
        withAnimation(.easeInOut(duration: 0.15)) {
          isAccountMenuOpen.toggle()
        }
      } label: {
        HStack(spacing: theme.spacing.sm) {
          profileAvatar(profile)
          VStack(alignment: .leading, spacing: 1) {
            Text(profile.label)
              .font(theme.typography.font(size: theme.typography.sizes.sm, weight: .semibold))
              .foregroundStyle(theme.colors.textPrimary)
              .lineLimit(1)
            if let sublabel = profile.sublabel {
              Text(sublabel)
                .font(theme.typography.font(size: theme.typography.sizes.xs))
                .foregroundStyle(theme.colors.textSecondary)
                .lineLimit(1)
            }
          }
          Spacer(minLength: 0)
          Image(systemName: "chevron.up")
            .font(.system(size: theme.typography.sizes.xs, weight: .semibold))
            .foregroundStyle(theme.colors.textSecondary)
            .rotationEffect(.degrees(isAccountMenuOpen ? 180 : 0))
        }
        .padding(.horizontal, theme.spacing.sm)
        .padding(.vertical, theme.spacing.xs)
        .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
      .accessibilityLabel("Account: \(profile.label)")
    }
    .padding(.horizontal, theme.spacing.sm)
    .padding(.bottom, theme.spacing.sm)
  }

  /// The footer's avatar affordance: the uploaded avatar image when the
  /// profile carries one (storage-kernel PUBLIC serving URL), otherwise the
  /// label's initials — matching the web AppShell's avatar rendering.
  @ViewBuilder
  private func profileAvatar(_ profile: ShellProfile) -> some View {
    if let avatarURL = profile.avatarURL {
      AsyncImage(url: avatarURL) { image in
        image
          .resizable()
          .scaledToFill()
      } placeholder: {
        profileInitials(profile.label)
      }
      .frame(width: 28, height: 28)
      .clipShape(Circle())
    } else {
      profileInitials(profile.label)
    }
  }

  private func profileInitials(_ label: String) -> some View {
    Text(Self.initials(of: label))
      .font(theme.typography.font(size: theme.typography.sizes.xs, weight: .bold))
      .foregroundStyle(theme.colors.accent)
      .frame(width: 28, height: 28)
      .background(Circle().fill(theme.colors.accent.opacity(0.14)))
  }

  private func menuRow(systemImage: String, label: String) -> some View {
    HStack(spacing: theme.spacing.sm) {
      Image(systemName: systemImage)
        .font(.system(size: theme.typography.sizes.sm, weight: .medium))
        .frame(width: 20)
      Text(label)
        .font(theme.typography.font(size: theme.typography.sizes.sm, weight: .semibold))
      Spacer(minLength: 0)
    }
    .foregroundStyle(theme.colors.textPrimary)
    .padding(.horizontal, theme.spacing.sm)
    .padding(.vertical, theme.spacing.xs + 2)
    .contentShape(Rectangle())
  }

  private func toggleGroup(_ id: String) {
    withAnimation(.easeInOut(duration: 0.15)) {
      if expandedGroupIds.contains(id) {
        expandedGroupIds.remove(id)
      } else {
        expandedGroupIds.insert(id)
      }
    }
  }

  private func expandGroupContainingSelection() {
    for section in sections {
      for item in section.items where item.children.contains(where: { $0.id == selectedItemId }) {
        expandedGroupIds.insert(item.id)
      }
    }
  }

  static func initials(of label: String) -> String {
    let parts = label.split(whereSeparator: { " @._-".contains($0) }).filter { !$0.isEmpty }
    guard let first = parts.first else { return "?" }
    if parts.count == 1 {
      return String(first.prefix(2)).uppercased()
    }
    return String([first.first!, parts[1].first!]).uppercased()
  }
}
