package com.baseapp.android.store

import com.baseapp.android.query.CursorPaginationController
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class ListPaginationState(
    val loading: Boolean = false,
    val loadingPage: Boolean = false,
    val currentPage: Int = 1,
    val hasNextPage: Boolean = false,
    val endCursor: String? = null,
)

/**
 * Pagination state container for list feeds (state only; the load workflows
 * live in ListFeedLoader/ListFeedController).
 */
class ListPaginationStore(val pageSize: Int) {
    private val cursorPagination = CursorPaginationController()
    private val _state = MutableStateFlow(ListPaginationState())
    val state: StateFlow<ListPaginationState> = _state.asStateFlow()

    val loading: Boolean get() = _state.value.loading
    val loadingPage: Boolean get() = _state.value.loadingPage
    val currentPage: Int get() = _state.value.currentPage
    val hasNextPage: Boolean get() = _state.value.hasNextPage

    fun setLoading(resetPagination: Boolean, withLoading: Boolean) {
        if (resetPagination) {
            _state.value = _state.value.copy(loading = withLoading)
            return
        }
        _state.value = _state.value.copy(loadingPage = true)
    }

    fun clearLoading(resetPagination: Boolean) {
        if (resetPagination) {
            _state.value = _state.value.copy(loading = false)
            return
        }
        _state.value = _state.value.copy(loadingPage = false)
    }

    fun resetPaginationState() {
        cursorPagination.reset()
        syncFromController()
    }

    fun afterCursor(forPage: Int): String? = cursorPagination.afterCursor(forPage)

    fun nextPageNumberForLoading(): Int? {
        if (loadingPage) {
            return null
        }
        val nextPage = cursorPagination.prepareNextPage() ?: return null
        syncFromController()
        return nextPage
    }

    fun applyPageResult(page: Int, endCursor: String?, serverHasNextPage: Boolean) {
        cursorPagination.applyPageResult(page, endCursor, serverHasNextPage)
        syncFromController()
    }

    private fun syncFromController() {
        _state.value = _state.value.copy(
            currentPage = cursorPagination.currentPage,
            hasNextPage = cursorPagination.hasNextPage,
            endCursor = cursorPagination.endCursor,
        )
    }
}
