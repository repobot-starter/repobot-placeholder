import Foundation
import AppGraphqlApi

struct ListSortOption: Identifiable, Equatable {
  let id: String
  let title: String
  let fieldName: String
  let direction: SortDirection
}
