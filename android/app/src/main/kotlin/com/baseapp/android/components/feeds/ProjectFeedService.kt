package com.baseapp.android.components.feeds

import com.apollographql.apollo.api.Optional
import com.baseapp.android.components.gql
import com.baseapp.android.graphql.ProjectRowData
import com.baseapp.android.graphql.SortDirectionValue
import com.baseapp.android.graphql.generated.type.ConnectionInput
import com.baseapp.android.graphql.generated.type.PaginationInput
import com.baseapp.android.graphql.generated.type.ProjectConnectionFilters
import com.baseapp.android.graphql.generated.type.ProjectConnectionInput
import com.baseapp.android.graphql.generated.type.SortOrderInput
import com.baseapp.android.query.ConnectionPage

class ProjectFeedFilters {
    var search: String? = null
    var sortFieldName: String = "name"
    var sortDirection: SortDirectionValue = SortDirectionValue.asc
}

/**
 * Thin translation layer between feed filters and the generated connection
 * inputs. Mirrors the web app's Projects query (sort by name, ascending).
 */
class ProjectFeedService {
    suspend fun fetchPage(
        filters: ProjectFeedFilters,
        pageSize: Int,
        afterCursor: String?,
    ): ConnectionPage<ProjectRowData> {
        val searchValue = filters.search?.trim() ?: ""
        val result = gql.fetchProjects(
            ProjectConnectionInput(
                filters = if (searchValue.isEmpty()) {
                    Optional.absent()
                } else {
                    Optional.present(
                        ProjectConnectionFilters(name = Optional.present(searchValue))
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
            items = result.nodes.mapNotNull { it?.projectFields },
            endCursor = result.pageInfo.pageInfoFields.endCursor,
            hasNextPage = result.pageInfo.pageInfoFields.hasNextPage,
        )
    }
}
