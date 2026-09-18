package com.baseapp.android.components.pages

import com.baseapp.android.components.feeds.UserFeedFilters
import com.baseapp.android.components.feeds.UserFeedService
import com.baseapp.android.components.store
import com.baseapp.android.graphql.UserRowData
import com.baseapp.android.query.ConnectionPage
import com.baseapp.android.query.DebouncedRefreshCoordinator
import com.baseapp.android.query.ListFeedController
import com.baseapp.android.query.nilIfEmpty
import com.baseapp.android.store.AppAlertStore
import com.baseapp.android.store.ListPaginationStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class UsersPageComponent {
    private val service = UserFeedService()
    private val filters = UserFeedFilters()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private val _rows = MutableStateFlow<List<UserRowData>>(emptyList())
    val rows: StateFlow<List<UserRowData>> = _rows.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    private var appliedSearchQuery: String = ""

    val pager = ListPaginationStore(pageSize = 40)
    private val autoApplyCoordinator = DebouncedRefreshCoordinator(scope)

    private val query = ListFeedController<UserRowData>(
        pager = pager,
        fetchPage = { pageNumber, afterCursor -> fetchUsersPage(pageNumber, afterCursor) },
        applyRows = { rows -> _rows.value = rows },
        onError = { error -> reportError(error.message ?: "Could not load users.") },
    )

    suspend fun refresh(withLoading: Boolean = true) {
        query.refresh(withLoading = withLoading)
    }

    fun setSearchQuery(value: String) {
        _searchQuery.value = value
        scheduleAutoApplyRefresh()
    }

    suspend fun loadNextPage() {
        query.loadNextPage()
    }

    private suspend fun fetchUsersPage(
        pageNumber: Int,
        afterCursor: String?,
    ): ConnectionPage<UserRowData> {
        filters.search = nilIfEmpty(appliedSearchQuery)
        return service.fetchPage(filters = filters, pageSize = pager.pageSize, afterCursor = afterCursor)
    }

    private fun reportError(message: String) {
        val trimmed = message.trim()
        if (trimmed.isEmpty()) {
            return
        }
        store.sessionStore.reportError(trimmed)
        store.appAlertStore.setActiveAlert(
            AppAlertStore.AlertMessage(
                id = "users-query-error-$trimmed",
                message = trimmed,
                isError = true,
            )
        )
    }

    private fun scheduleAutoApplyRefresh() {
        appliedSearchQuery = _searchQuery.value
        autoApplyCoordinator.schedule {
            refresh(withLoading = false)
        }
    }
}
