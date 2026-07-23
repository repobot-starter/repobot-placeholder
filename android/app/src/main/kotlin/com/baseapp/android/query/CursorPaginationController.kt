package com.baseapp.android.query

class CursorPaginationController {
    var currentPage: Int = 1
        private set
    var hasNextPage: Boolean = false
        private set
    var endCursor: String? = null
        private set
    private val pageToAfterCursor = mutableMapOf<Int, String>()

    fun reset() {
        currentPage = 1
        hasNextPage = false
        endCursor = null
        pageToAfterCursor.clear()
    }

    fun afterCursor(forPage: Int): String? {
        if (forPage <= 1) {
            return null
        }
        return pageToAfterCursor[forPage]
    }

    fun prepareNextPage(): Int? {
        val cursor = endCursor
        if (!hasNextPage || cursor == null) {
            return null
        }
        val nextPage = currentPage + 1
        pageToAfterCursor[nextPage] = cursor
        return nextPage
    }

    fun applyPageResult(page: Int, endCursor: String?, serverHasNextPage: Boolean) {
        currentPage = page
        hasNextPage = serverHasNextPage
        this.endCursor = if (serverHasNextPage) endCursor else null
        if (serverHasNextPage && endCursor != null) {
            pageToAfterCursor[page + 1] = endCursor
        } else {
            pageToAfterCursor.remove(page + 1)
        }
    }
}
