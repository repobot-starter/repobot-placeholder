package com.baseapp.android.query

import com.baseapp.android.store.ListPaginationStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

object ListFeedLoader {
    suspend fun <Page> fetchCurrentPage(
        pager: ListPaginationStore,
        withLoading: Boolean,
        resetPagination: Boolean,
        fetchPage: suspend (Int, String?) -> Page,
        applyPage: (Page, Int) -> Unit,
        onError: (Throwable, Int) -> Page?,
    ) {
        pager.setLoading(resetPagination = resetPagination, withLoading = withLoading)
        try {
            if (resetPagination) {
                pager.resetPaginationState()
            }

            val pageNumber = pager.currentPage
            try {
                val page = fetchPage(pageNumber, pager.afterCursor(pageNumber))
                applyPage(page, pageNumber)
            } catch (error: Exception) {
                onError(error, pageNumber)?.let { recoveryPage ->
                    applyPage(recoveryPage, pageNumber)
                }
            }
        } finally {
            pager.clearLoading(resetPagination = resetPagination)
        }
    }

    suspend fun <Page> loadNextPage(
        pager: ListPaginationStore,
        fetchPage: suspend (Int, String?) -> Page,
        applyPage: (Page, Int) -> Unit,
        onError: (Throwable, Int) -> Page?,
    ) {
        val nextPage = pager.nextPageNumberForLoading() ?: return
        pager.setLoading(resetPagination = false, withLoading = false)
        try {
            val page = fetchPage(nextPage, pager.afterCursor(nextPage))
            applyPage(page, nextPage)
        } catch (error: Exception) {
            onError(error, nextPage)?.let { recoveryPage ->
                applyPage(recoveryPage, nextPage)
            }
        } finally {
            pager.clearLoading(resetPagination = false)
        }
    }
}

/** Debounces rapid search-as-you-type refreshes into one trailing refresh. */
class DebouncedRefreshCoordinator(private val scope: CoroutineScope) {
    private var job: Job? = null

    fun schedule(delayMs: Long = 250, action: suspend () -> Unit) {
        job?.cancel()
        job = scope.launch {
            delay(delayMs)
            action()
        }
    }
}
