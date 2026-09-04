import Foundation
import AppGraphqlApi

/// Mirrors the web app's Users query (sort by displayName, ascending).
@MainActor
final class UserOperations {
  func fetchUsers(
    filters: UserFeedFilters,
    pageSize: Int,
    afterCursor: String?
  ) async throws -> UserFeedPage {
    let searchValue = filters.search?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let result = try await gql.fetchUsers(
      input: UserConnectionInput(
        filters: searchValue.isEmpty
          ? .none
          : .some(UserConnectionFilters(displayName: .some(searchValue))),
        connection: ConnectionInput(
          pagination: PaginationInput(first: pageSize, after: afterCursor.map { GraphQLNullable.some($0) } ?? .none),
          sort: [SortOrderInput(fieldName: filters.sortFieldName, direction: GraphQLEnum(filters.sortDirection))]
        )
      )
    )

    return UserFeedPage(
      rows: result.nodes.compactMap { $0 },
      endCursor: result.pageInfo.endCursor,
      hasNextPage: result.pageInfo.hasNextPage
    )
  }
}
