// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct UserConnectionInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    filters: GraphQLNullable<UserConnectionFilters> = nil,
    connection: ConnectionInput
  ) {
    __data = InputDict([
      "filters": filters,
      "connection": connection
    ])
  }

  public var filters: GraphQLNullable<UserConnectionFilters> {
    get { __data["filters"] }
    set { __data["filters"] = newValue }
  }

  public var connection: ConnectionInput {
    get { __data["connection"] }
    set { __data["connection"] = newValue }
  }
}
