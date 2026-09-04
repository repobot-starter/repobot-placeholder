import Foundation

@MainActor
final class ListFeedController<Row> {
  private let pager: ListPaginationStore
  private let fetchPage: (Int, String?) async throws -> ConnectionPage<Row>
  private let applyRows: ([Row]) -> Void
  private let onError: (Error) -> Void
  private var accumulatedRows: [Row] = []

  init(
    pager: ListPaginationStore,
    fetchPage: @escaping (Int, String?) async throws -> ConnectionPage<Row>,
    applyRows: @escaping ([Row]) -> Void,
    onError: @escaping (Error) -> Void
  ) {
    self.pager = pager
    self.fetchPage = fetchPage
    self.applyRows = applyRows
    self.onError = onError
  }

  func refresh(withLoading: Bool = true) async {
    accumulatedRows = []
    await ListFeedLoader.fetchCurrentPage(
      pager: pager,
      withLoading: withLoading,
      resetPagination: true,
      fetchPage: fetchPage,
      applyPage: applyConnectionPage,
      onError: handlePageError
    )
  }

  func loadNextPage() async {
    await ListFeedLoader.loadNextPage(
      pager: pager,
      fetchPage: fetchPage,
      applyPage: applyConnectionPage,
      onError: handlePageError
    )
  }

  func adoptExternalPage(items: [Row], endCursor: String?, hasNextPage: Bool) {
    accumulatedRows = items
    applyRows(items)
    pager.resetPaginationState()
    pager.applyPageResult(page: 1, endCursor: endCursor, serverHasNextPage: hasNextPage)
  }

  private func applyConnectionPage(_ page: ConnectionPage<Row>, _ pageNumber: Int) {
    if pageNumber <= 1 {
      accumulatedRows = page.items
    } else {
      accumulatedRows.append(contentsOf: page.items)
    }
    applyRows(accumulatedRows)
    pager.applyPageResult(page: pageNumber, endCursor: page.endCursor, serverHasNextPage: page.hasNextPage)
  }

  private func handlePageError(_ error: Error, _: Int) -> ConnectionPage<Row>? {
    onError(error)
    return nil
  }
}
