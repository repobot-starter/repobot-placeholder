package com.baseapp.android.components.pages

import com.baseapp.android.components.feeds.ProjectFeedFilters
import com.baseapp.android.components.feeds.ProjectFeedService
import com.baseapp.android.components.store
import com.baseapp.android.graphql.ProjectRowData
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

class ProjectsPageComponent {
    private val service = ProjectFeedService()
    private val filters = ProjectFeedFilters()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private val _rows = MutableStateFlow<List<ProjectRowData>>(emptyList())
    val rows: StateFlow<List<ProjectRowData>> = _rows.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    private var appliedSearchQuery: String = ""

    val pager = ListPaginationStore(pageSize = 40)
    private val autoApplyCoordinator = DebouncedRefreshCoordinator(scope)

    private val query = ListFeedController<ProjectRowData>(
        pager = pager,
        fetchPage = { pageNumber, afterCursor -> fetchProjectsPage(pageNumber, afterCursor) },
        applyRows = { rows -> _rows.value = rows },
        onError = { error -> reportError(error.message ?: "Could not load projects.") },
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

    private suspend fun fetchProjectsPage(
        pageNumber: Int,
        afterCursor: String?,
    ): ConnectionPage<ProjectRowData> {
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
                id = "projects-query-error-$trimmed",
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
