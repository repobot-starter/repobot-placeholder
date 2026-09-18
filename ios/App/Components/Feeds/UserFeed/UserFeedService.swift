import Foundation
import AppGraphqlApi

final class UserFeedFilters {
  var search: String?
  var sortFieldName: String = "displayName"
  var sortDirection: SortDirection = .asc
}

struct UserFeedPage {
  let rows: [UserRowData]
  let endCursor: String?
  let hasNextPage: Bool
}

@MainActor
final class UserFeedService {
  private let operations = UserOperations()

  func fetchPage(
    filters: UserFeedFilters,
    pageSize: Int,
    afterCursor: String?
  ) async throws -> ConnectionPage<UserRowData> {
    let page = try await operations.fetchUsers(
      filters: filters,
      pageSize: pageSize,
      afterCursor: afterCursor
    )

    return ConnectionPage(
      items: page.rows,
      endCursor: page.endCursor,
      hasNextPage: page.hasNextPage
    )
  }
}
