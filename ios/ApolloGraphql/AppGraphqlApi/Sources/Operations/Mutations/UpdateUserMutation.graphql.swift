// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class UpdateUserMutation: GraphQLMutation {
  public static let operationName: String = "UpdateUser"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation UpdateUser($input: UpdateUserInput!) { updateUser(input: $input) { __typename ...UserFields } }"#,
      fragments: [UserFields.self]
    ))

  public var input: UpdateUserInput

  public init(input: UpdateUserInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("updateUser", UpdateUser.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      UpdateUserMutation.Data.self
    ] }

    public var updateUser: UpdateUser { __data["updateUser"] }

    /// UpdateUser
    ///
    /// Parent Type: `User`
    public struct UpdateUser: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.User }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .fragment(UserFields.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        UpdateUserMutation.Data.UpdateUser.self,
        UserFields.self
      ] }

      public var id: AppGraphqlApi.Id { __data["id"] }
      public var email: String { __data["email"] }
      public var displayName: String { __data["displayName"] }
      public var status: GraphQLEnum<AppGraphqlApi.UserStatus> { __data["status"] }
      public var createdTime: AppGraphqlApi.Instant { __data["createdTime"] }
      /// The user's avatar upload (storage kernel), or null when none is set.
      public var avatarUploadId: AppGraphqlApi.Id? { __data["avatarUploadId"] }
      public var account: Account? { __data["account"] }

      public struct Fragments: FragmentContainer {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public var userFields: UserFields { _toFragment() }
      }

      public typealias Account = UserFields.Account
    }
  }
}
