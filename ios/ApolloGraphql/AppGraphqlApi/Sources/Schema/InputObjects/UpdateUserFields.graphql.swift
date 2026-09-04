// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct UpdateUserFields: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    displayName: GraphQLNullable<String> = nil,
    status: GraphQLNullable<GraphQLEnum<UserStatus>> = nil,
    avatarUploadId: GraphQLNullable<Id> = nil
  ) {
    __data = InputDict([
      "displayName": displayName,
      "status": status,
      "avatarUploadId": avatarUploadId
    ])
  }

  public var displayName: GraphQLNullable<String> {
    get { __data["displayName"] }
    set { __data["displayName"] = newValue }
  }

  public var status: GraphQLNullable<GraphQLEnum<UserStatus>> {
    get { __data["status"] }
    set { __data["status"] = newValue }
  }

  /// A READY PUBLIC upload id from the storage kernel (Settings avatar flow).
  public var avatarUploadId: GraphQLNullable<Id> {
    get { __data["avatarUploadId"] }
    set { __data["avatarUploadId"] = newValue }
  }
}
