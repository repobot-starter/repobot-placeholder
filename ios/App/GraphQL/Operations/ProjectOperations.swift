import Foundation
import AppGraphqlApi

/// Thin translation layer between feed filters and the generated connection
/// inputs. Mirrors the web app's Projects query (sort by name, ascending).
@MainActor
final class ProjectOperations {
  func fetchProjects(
    filters: ProjectFeedFilters,
    pageSize: Int,
    afterCursor: String?
  ) async throws -> ProjectFeedPage {
    let searchValue = filters.search?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let result = try await gql.fetchProjects(
      input: ProjectConnectionInput(
        filters: searchValue.isEmpty
          ? .none
          : .some(ProjectConnectionFilters(name: .some(searchValue))),
        connection: ConnectionInput(
          pagination: PaginationInput(first: pageSize, after: afterCursor.map { GraphQLNullable.some($0) } ?? .none),
          sort: [SortOrderInput(fieldName: filters.sortFieldName, direction: GraphQLEnum(filters.sortDirection))]
        )
      )
    )

    return ProjectFeedPage(
      rows: result.nodes.compactMap { $0 },
      endCursor: result.pageInfo.endCursor,
      hasNextPage: result.pageInfo.hasNextPage
    )
  }
}
