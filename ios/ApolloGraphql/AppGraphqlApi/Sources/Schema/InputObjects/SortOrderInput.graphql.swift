// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct SortOrderInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    fieldName: String,
    direction: GraphQLEnum<SortDirection>
  ) {
    __data = InputDict([
      "fieldName": fieldName,
      "direction": direction
    ])
  }

  public var fieldName: String {
    get { __data["fieldName"] }
    set { __data["fieldName"] = newValue }
  }

  public var direction: GraphQLEnum<SortDirection> {
    get { __data["direction"] }
    set { __data["direction"] = newValue }
  }
}
