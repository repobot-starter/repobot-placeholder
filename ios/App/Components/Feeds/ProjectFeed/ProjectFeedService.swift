import Foundation
import AppGraphqlApi

final class ProjectFeedFilters {
  var search: String?
  var sortFieldName: String = "name"
  var sortDirection: SortDirection = .asc
}

struct ProjectFeedPage {
  let rows: [ProjectRowData]
  let endCursor: String?
  let hasNextPage: Bool
}

@MainActor
final class ProjectFeedService {
  private let operations = ProjectOperations()

  func fetchPage(
    filters: ProjectFeedFilters,
    pageSize: Int,
    afterCursor: String?
  ) async throws -> ConnectionPage<ProjectRowData> {
    let page = try await operations.fetchProjects(
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
