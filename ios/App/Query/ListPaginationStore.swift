import Foundation
import SwiftUI

@MainActor
final class ListPaginationStore: ObservableObject {
  @Published var loading = false
  @Published var loadingPage = false
  @Published var pageSize: Int
  @Published var currentPage = 1
  @Published var hasNextPage = false
  @Published var endCursor: String?
  @Published var pageToAfterCursor: [Int: String] = [:]

  private let cursorPagination = CursorPaginationController()

  init(pageSize: Int) {
    self.pageSize = pageSize
    syncFromController()
  }

  func setLoading(resetPagination: Bool, withLoading: Bool) {
    if resetPagination {
      loading = withLoading
      return
    }
    loadingPage = true
  }

  func clearLoading(resetPagination: Bool) {
    if resetPagination {
      loading = false
      return
    }
    loadingPage = false
  }

  func resetPaginationState() {
    cursorPagination.reset()
    syncFromController()
  }

  func afterCursor(forPage page: Int) -> String? {
    cursorPagination.afterCursor(forPage: page)
  }

  func nextPageNumberForLoading() -> Int? {
    guard !loadingPage else {
      return nil
    }
    guard let nextPage = cursorPagination.prepareNextPage() else {
      return nil
    }
    syncFromController()
    return nextPage
  }

  func previousPageNumberForLoading() -> Int? {
    guard !loadingPage else {
      return nil
    }
    return cursorPagination.previousPage()
  }

  func applyPageResult(page: Int, endCursor: String?, serverHasNextPage: Bool) {
    cursorPagination.applyPageResult(page: page, endCursor: endCursor, serverHasNextPage: serverHasNextPage)
    syncFromController()
  }

  private func syncFromController() {
    currentPage = cursorPagination.currentPage
    hasNextPage = cursorPagination.hasNextPage
    endCursor = cursorPagination.endCursor
    pageToAfterCursor = cursorPagination.pageToAfterCursor
  }
}
