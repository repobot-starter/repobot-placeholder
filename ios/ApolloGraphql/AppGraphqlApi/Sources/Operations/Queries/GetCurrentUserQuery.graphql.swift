// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class GetCurrentUserQuery: GraphQLQuery {
  public static let operationName: String = "GetCurrentUser"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"query GetCurrentUser { currentUser { __typename ...UserFields } }"#,
      fragments: [UserFields.self]
    ))

  public init() {}

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Query }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("currentUser", CurrentUser.self),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      GetCurrentUserQuery.Data.self
    ] }

    public var currentUser: CurrentUser { __data["currentUser"] }

    /// CurrentUser
    ///
    /// Parent Type: `User`
    public struct CurrentUser: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.User }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .fragment(UserFields.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        GetCurrentUserQuery.Data.CurrentUser.self,
        UserFields.self
      ] }

      public var id: AppGraphqlApi.Id { __data["id"] }
      public var email: String { __data["email"] }
      public var displayName: String { __data["displayName"] }
      public var status: GraphQLEnum<AppGraphqlApi.UserStatus> { __data["status"] }
      public var createdTime: AppGraphqlApi.Instant { __data["createdTime"] }
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
