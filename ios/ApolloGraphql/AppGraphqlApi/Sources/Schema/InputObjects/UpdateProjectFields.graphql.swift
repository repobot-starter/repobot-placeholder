// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct UpdateProjectFields: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    name: GraphQLNullable<String> = nil,
    description: GraphQLNullable<String> = nil,
    doArchive: GraphQLNullable<Bool> = nil
  ) {
    __data = InputDict([
      "name": name,
      "description": description,
      "doArchive": doArchive
    ])
  }

  public var name: GraphQLNullable<String> {
    get { __data["name"] }
    set { __data["name"] = newValue }
  }

  public var description: GraphQLNullable<String> {
    get { __data["description"] }
    set { __data["description"] = newValue }
  }

  public var doArchive: GraphQLNullable<Bool> {
    get { __data["doArchive"] }
    set { __data["doArchive"] = newValue }
  }
}
