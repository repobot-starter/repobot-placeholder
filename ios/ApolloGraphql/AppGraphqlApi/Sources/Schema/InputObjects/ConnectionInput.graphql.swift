// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct ConnectionInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    pagination: PaginationInput,
    sort: [SortOrderInput]
  ) {
    __data = InputDict([
      "pagination": pagination,
      "sort": sort
    ])
  }

  public var pagination: PaginationInput {
    get { __data["pagination"] }
    set { __data["pagination"] = newValue }
  }

  public var sort: [SortOrderInput] {
    get { __data["sort"] }
    set { __data["sort"] = newValue }
  }
}
