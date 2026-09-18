// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct UserConnectionFilters: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    email: GraphQLNullable<String> = nil,
    displayName: GraphQLNullable<String> = nil,
    statuses: GraphQLNullable<[GraphQLEnum<UserStatus>]> = nil
  ) {
    __data = InputDict([
      "email": email,
      "displayName": displayName,
      "statuses": statuses
    ])
  }

  public var email: GraphQLNullable<String> {
    get { __data["email"] }
    set { __data["email"] = newValue }
  }

  public var displayName: GraphQLNullable<String> {
    get { __data["displayName"] }
    set { __data["displayName"] = newValue }
  }

  public var statuses: GraphQLNullable<[GraphQLEnum<UserStatus>]> {
    get { __data["statuses"] }
    set { __data["statuses"] = newValue }
  }
}
