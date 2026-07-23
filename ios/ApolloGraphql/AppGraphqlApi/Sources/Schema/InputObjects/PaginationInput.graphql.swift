// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct PaginationInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    first: Int,
    after: GraphQLNullable<String> = nil
  ) {
    __data = InputDict([
      "first": first,
      "after": after
    ])
  }

  public var first: Int {
    get { __data["first"] }
    set { __data["first"] = newValue }
  }

  public var after: GraphQLNullable<String> {
    get { __data["after"] }
    set { __data["after"] = newValue }
  }
}
