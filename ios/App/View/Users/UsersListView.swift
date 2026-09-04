import SwiftUI

struct UsersListView: View {
  @EnvironmentObject private var page: UsersPageComponent
  @Environment(\.uiThemeTokens) private var theme

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 12) {
        searchField(
          placeholder: "Find user...",
          text: Binding(
            get: { page.searchQuery },
            set: { page.setSearchQuery($0) }
          )
        )

        if page.rows.isEmpty, !page.pager.loading {
          Text("No users found.")
            .font(.system(size: theme.typography.sizes.sm))
            .foregroundStyle(theme.colors.textSecondary)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 32)
        }

        LazyVStack(spacing: 12) {
          ForEach(page.rows, id: \.id) { user in
            userCard(user)
          }
        }
        if page.pager.hasNextPage {
          loadMoreButton
        }
      }
      .padding(16)
      .frame(maxWidth: .infinity, alignment: .topLeading)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(theme.colors.appBg)
    .task {
      await page.refresh(withLoading: true)
    }
    .refreshable {
      await page.refresh(withLoading: false)
    }
  }

  @ViewBuilder
  private func userCard(_ user: UserRowData) -> some View {
    HStack(spacing: 12) {
      Circle()
        .fill(theme.colors.surfaceAlt)
        .frame(width: 38, height: 38)
        .overlay(
          Text(initials(of: user.displayName))
            .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
            .foregroundStyle(theme.colors.textSecondary)
        )

      VStack(alignment: .leading, spacing: 3) {
        Text(user.displayName)
          .font(.system(size: theme.typography.sizes.md, weight: .semibold))
          .foregroundStyle(theme.colors.textPrimary)
          .lineLimit(1)
        Text(user.email)
          .font(.system(size: theme.typography.sizes.xs))
          .foregroundStyle(theme.colors.textSecondary)
          .lineLimit(1)
      }

      Spacer(minLength: 0)

      if user.status.value == .disabled {
        Text("Disabled")
          .font(.system(size: theme.typography.sizes.xs, weight: .medium))
          .foregroundStyle(theme.colors.statusWarning)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .fill(theme.colors.surface)
        .overlay(
          RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .stroke(theme.colors.border, lineWidth: 1)
        )
    )
  }

  private func initials(of displayName: String) -> String {
    let parts = displayName
      .split(separator: " ")
      .prefix(2)
      .compactMap { $0.first.map(String.init) }
    return parts.isEmpty ? "?" : parts.joined().uppercased()
  }

  @ViewBuilder
  private var loadMoreButton: some View {
    Button("Load more users") {
      Task {
        await page.loadNextPage()
      }
    }
    .buttonStyle(.plain)
    .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
    .foregroundStyle(theme.colors.accent)
    .padding(.vertical, 8)
  }

  @ViewBuilder
  private func searchField(placeholder: String, text: Binding<String>) -> some View {
    TextField(placeholder, text: text)
      .textInputAutocapitalization(.never)
      .autocorrectionDisabled()
      .padding(.horizontal, 12)
      .padding(.vertical, 10)
      .font(.system(size: theme.typography.sizes.sm))
      .foregroundStyle(theme.colors.textPrimary)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .fill(theme.colors.surface)
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
      )
      .frame(maxWidth: .infinity)
  }
}
