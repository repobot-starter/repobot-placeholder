import Foundation

final class CursorPaginationController {
  private(set) var currentPage: Int = 1
  private(set) var hasNextPage: Bool = false
  private(set) var endCursor: String?
  private(set) var pageToAfterCursor: [Int: String] = [:]

  func reset() {
    currentPage = 1
    hasNextPage = false
    endCursor = nil
    pageToAfterCursor = [:]
  }

  func afterCursor(forPage page: Int) -> String? {
    guard page > 1 else {
      return nil
    }
    return pageToAfterCursor[page]
  }

  func prepareNextPage() -> Int? {
    guard hasNextPage, let endCursor else {
      return nil
    }
    let nextPage = currentPage + 1
    pageToAfterCursor[nextPage] = endCursor
    return nextPage
  }

  func previousPage() -> Int? {
    guard currentPage > 1 else {
      return nil
    }
    return currentPage - 1
  }

  func applyPageResult(page: Int, endCursor: String?, serverHasNextPage: Bool) {
    currentPage = page
    hasNextPage = serverHasNextPage
    self.endCursor = serverHasNextPage ? endCursor : nil
    if serverHasNextPage, let endCursor {
      pageToAfterCursor[page + 1] = endCursor
    } else {
      pageToAfterCursor[page + 1] = nil
    }
  }
}
