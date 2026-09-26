// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct ProjectConnectionFilters: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    name: GraphQLNullable<String> = nil,
    statuses: GraphQLNullable<[GraphQLEnum<ProjectStatus>]> = nil
  ) {
    __data = InputDict([
      "name": name,
      "statuses": statuses
    ])
  }

  public var name: GraphQLNullable<String> {
    get { __data["name"] }
    set { __data["name"] = newValue }
  }

  public var statuses: GraphQLNullable<[GraphQLEnum<ProjectStatus>]> {
    get { __data["statuses"] }
    set { __data["statuses"] = newValue }
  }
}
