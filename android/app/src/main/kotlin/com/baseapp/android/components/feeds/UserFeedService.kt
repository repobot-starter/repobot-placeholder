package com.baseapp.android.components.feeds

import com.apollographql.apollo.api.Optional
import com.baseapp.android.components.gql
import com.baseapp.android.graphql.SortDirectionValue
import com.baseapp.android.graphql.UserRowData
import com.baseapp.android.graphql.generated.type.ConnectionInput
import com.baseapp.android.graphql.generated.type.PaginationInput
import com.baseapp.android.graphql.generated.type.SortOrderInput
import com.baseapp.android.graphql.generated.type.UserConnectionFilters
import com.baseapp.android.graphql.generated.type.UserConnectionInput
import com.baseapp.android.query.ConnectionPage

class UserFeedFilters {
    var search: String? = null
    var sortFieldName: String = "displayName"
    var sortDirection: SortDirectionValue = SortDirectionValue.asc
}

/** Mirrors the web app's Users query (sort by displayName, ascending). */
class UserFeedService {
    suspend fun fetchPage(
        filters: UserFeedFilters,
        pageSize: Int,
        afterCursor: String?,
    ): ConnectionPage<UserRowData> {
        val searchValue = filters.search?.trim() ?: ""
        val result = gql.fetchUsers(
            UserConnectionInput(
                filters = if (searchValue.isEmpty()) {
                    Optional.absent()
                } else {
                    Optional.present(
                        UserConnectionFilters(displayName = Optional.present(searchValue))
                    )
                },
                connection = ConnectionInput(
                    pagination = PaginationInput(
                        first = pageSize,
                        after = afterCursor?.let { Optional.present(it) } ?: Optional.absent(),
                    ),
                    sort = listOf(
                        SortOrderInput(
                            fieldName = filters.sortFieldName,
                            direction = filters.sortDirection,
                        )
                    ),
                ),
            )
        )

        return ConnectionPage(
            items = result.nodes.mapNotNull { it?.userFields },
            endCursor = result.pageInfo.pageInfoFields.endCursor,
            hasNextPage = result.pageInfo.pageInfoFields.hasNextPage,
        )
    }
}
