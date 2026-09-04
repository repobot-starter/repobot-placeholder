import Foundation

@MainActor
enum ListFeedLoader {
  static func fetchCurrentPage<Page>(
    pager: ListPaginationStore,
    withLoading: Bool,
    resetPagination: Bool,
    fetchPage: (Int, String?) async throws -> Page,
    applyPage: (Page, Int) -> Void,
    onError: (Error, Int) -> Page?
  ) async {
    pager.setLoading(resetPagination: resetPagination, withLoading: withLoading)
    defer {
      pager.clearLoading(resetPagination: resetPagination)
    }

    if resetPagination {
      pager.resetPaginationState()
    }

    let pageNumber = pager.currentPage
    do {
      let page = try await fetchPage(pageNumber, pager.afterCursor(forPage: pageNumber))
      applyPage(page, pageNumber)
    } catch {
      if let recoveryPage = onError(error, pageNumber) {
        applyPage(recoveryPage, pageNumber)
      }
    }
  }

  static func loadNextPage<Page>(
    pager: ListPaginationStore,
    fetchPage: (Int, String?) async throws -> Page,
    applyPage: (Page, Int) -> Void,
    onError: (Error, Int) -> Page?
  ) async {
    guard let nextPage = pager.nextPageNumberForLoading() else {
      return
    }
    await fetchSpecificPageWithPageLoadingState(
      pager: pager,
      pageNumber: nextPage,
      fetchPage: fetchPage,
      applyPage: applyPage,
      onError: onError
    )
  }

  private static func fetchSpecificPageWithPageLoadingState<Page>(
    pager: ListPaginationStore,
    pageNumber: Int,
    fetchPage: (Int, String?) async throws -> Page,
    applyPage: (Page, Int) -> Void,
    onError: (Error, Int) -> Page?
  ) async {
    pager.setLoading(resetPagination: false, withLoading: false)
    defer {
      pager.clearLoading(resetPagination: false)
    }

    do {
      let page = try await fetchPage(pageNumber, pager.afterCursor(forPage: pageNumber))
      applyPage(page, pageNumber)
    } catch {
      if let recoveryPage = onError(error, pageNumber) {
        applyPage(recoveryPage, pageNumber)
      }
    }
  }
}

@MainActor
final class DebouncedRefreshCoordinator {
  private var task: Task<Void, Never>?

  func schedule(
    delayNanoseconds: UInt64 = 250_000_000,
    action: @escaping @MainActor () async -> Void
  ) {
    task?.cancel()
    task = Task {
      try? await Task.sleep(nanoseconds: delayNanoseconds)
      guard !Task.isCancelled else {
        return
      }
      await action()
    }
  }

  deinit {
    task?.cancel()
  }
}
