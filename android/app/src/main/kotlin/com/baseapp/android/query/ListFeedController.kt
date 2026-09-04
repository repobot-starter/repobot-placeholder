package com.baseapp.android.query

import com.baseapp.android.store.ListPaginationStore

class ListFeedController<Row>(
    private val pager: ListPaginationStore,
    private val fetchPage: suspend (Int, String?) -> ConnectionPage<Row>,
    private val applyRows: (List<Row>) -> Unit,
    private val onError: (Throwable) -> Unit,
) {
    private var accumulatedRows: List<Row> = emptyList()

    suspend fun refresh(withLoading: Boolean = true) {
        accumulatedRows = emptyList()
        ListFeedLoader.fetchCurrentPage(
            pager = pager,
            withLoading = withLoading,
            resetPagination = true,
            fetchPage = fetchPage,
            applyPage = ::applyConnectionPage,
            onError = ::handlePageError,
        )
    }

    suspend fun loadNextPage() {
        ListFeedLoader.loadNextPage(
            pager = pager,
            fetchPage = fetchPage,
            applyPage = ::applyConnectionPage,
            onError = ::handlePageError,
        )
    }

    private fun applyConnectionPage(page: ConnectionPage<Row>, pageNumber: Int) {
        accumulatedRows = if (pageNumber <= 1) {
            page.items
        } else {
            accumulatedRows + page.items
        }
        applyRows(accumulatedRows)
        pager.applyPageResult(
            page = pageNumber,
            endCursor = page.endCursor,
            serverHasNextPage = page.hasNextPage,
        )
    }

    private fun handlePageError(error: Throwable, pageNumber: Int): ConnectionPage<Row>? {
        onError(error)
        return null
    }
}
