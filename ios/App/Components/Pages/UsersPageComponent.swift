import Foundation
import SwiftUI

@MainActor
final class UsersPageComponent: ObservableObject {
  private let service = UserFeedService()
  private let filters = UserFeedFilters()

  @Published private(set) var rows: [UserRowData] = []
  @Published var searchQuery: String = ""
  private var appliedSearchQuery: String = ""
  let pager = ListPaginationStore(pageSize: 40)
  private let autoApplyCoordinator = DebouncedRefreshCoordinator()

  lazy var query = ListFeedController<UserRowData>(
    pager: pager,
    fetchPage: { [unowned self] pageNumber, afterCursor in
      try await self.fetchUsersPage(pageNumber: pageNumber, afterCursor: afterCursor)
    },
    applyRows: { [unowned self] rows in
      self.rows = rows
    },
    onError: { [weak self] error in
      self?.reportError(error.localizedDescription)
    }
  )

  func refresh(withLoading: Bool = true) async {
    await query.refresh(withLoading: withLoading)
  }

  func setSearchQuery(_ value: String) {
    searchQuery = value
    scheduleAutoApplyRefresh()
  }

  func loadNextPage() async {
    await query.loadNextPage()
  }

  private func fetchUsersPage(pageNumber _: Int, afterCursor: String?) async throws -> ConnectionPage<UserRowData> {
    filters.search = nilIfEmpty(appliedSearchQuery)
    return try await service.fetchPage(filters: filters, pageSize: pager.pageSize, afterCursor: afterCursor)
  }

  private func reportError(_ message: String) {
    let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    store.sessionStore.reportError(trimmed)
    store.appAlertStore.activeAlert = AppAlertStore.AlertMessage(
      id: "users-query-error-\(trimmed)",
      message: trimmed,
      isError: true
    )
  }

  private func scheduleAutoApplyRefresh() {
    appliedSearchQuery = searchQuery
    autoApplyCoordinator.schedule { [weak self] in
      guard let self else {
        return
      }
      await self.refresh(withLoading: false)
    }
  }
}
