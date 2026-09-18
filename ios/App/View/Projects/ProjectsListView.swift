import SwiftUI

struct ProjectsListView: View {
  @EnvironmentObject private var page: ProjectsPageComponent
  @Environment(\.uiThemeTokens) private var theme
  @State private var isCreateSheetPresented = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 12) {
        searchField(
          placeholder: "Find project...",
          text: Binding(
            get: { page.searchQuery },
            set: { page.setSearchQuery($0) }
          )
        )

        if page.rows.isEmpty, !page.pager.loading {
          emptyState
        }

        LazyVStack(spacing: 12) {
          ForEach(page.rows, id: \.id) { project in
            projectCard(project)
          }
        }
        if page.pager.hasNextPage {
          loadMoreButton
        }
      }
      .padding(16)
      .frame(maxWidth: .infinity, alignment: .topLeading)
    }
    .safeAreaInset(edge: .bottom) {
      PrimaryActionButton(
        title: "+ New Project",
        loadingTitle: "",
        isLoading: false,
        isEnabled: true
      ) {
        isCreateSheetPresented = true
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 10)
      .background(theme.colors.appBg.opacity(0.98))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(theme.colors.appBg)
    .sheet(isPresented: $isCreateSheetPresented) {
      ProjectCreateView(
        onCreated: {
          isCreateSheetPresented = false
        }
      )
      .presentationDetents([.medium])
    }
    .task {
      await page.refresh(withLoading: true)
    }
    .refreshable {
      await page.refresh(withLoading: false)
    }
  }

  private var emptyState: some View {
    Text("No projects yet. Create your first one below.")
      .font(.system(size: theme.typography.sizes.sm))
      .foregroundStyle(theme.colors.textSecondary)
      .frame(maxWidth: .infinity, alignment: .center)
      .padding(.vertical, 32)
  }

  @ViewBuilder
  private func projectCard(_ project: ProjectRowData) -> some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .top, spacing: 8) {
        Text(project.name)
          .font(.system(size: theme.typography.sizes.md, weight: .semibold))
          .foregroundStyle(theme.colors.textPrimary)
          .lineLimit(1)
        Spacer(minLength: 0)
        statusBadge(project.status.value ?? .active)
      }

      if let description = project.description, !description.isEmpty {
        Text(description)
          .font(.system(size: theme.typography.sizes.xs))
          .foregroundStyle(theme.colors.textSecondary)
          .lineLimit(2)
      }

      Text("Created by \(project.createdBy.displayName)")
        .font(.system(size: theme.typography.sizes.xs))
        .foregroundStyle(theme.colors.textSecondary)
        .lineLimit(1)
    }
    .frame(maxWidth: .infinity, alignment: .topLeading)
    .padding(12)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .fill(theme.colors.surface)
        .overlay(
          RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .stroke(theme.colors.border, lineWidth: 1)
        )
    )
  }

  @ViewBuilder
  private func statusBadge(_ status: ProjectStatusValue) -> some View {
    let isActive = status == .active
    Text(isActive ? "Active" : "Archived")
      .font(.system(size: theme.typography.sizes.xs, weight: .medium))
      .foregroundStyle(isActive ? theme.colors.statusSuccess : theme.colors.textSecondary)
      .padding(.horizontal, 8)
      .padding(.vertical, 4)
      .background(
        Capsule(style: .continuous)
          .fill(theme.colors.surfaceAlt)
          .overlay(
            Capsule(style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
      )
  }

  @ViewBuilder
  private var loadMoreButton: some View {
    Button("Load more projects") {
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
