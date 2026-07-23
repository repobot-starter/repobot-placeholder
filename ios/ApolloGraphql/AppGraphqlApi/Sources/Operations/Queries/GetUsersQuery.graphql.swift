// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class GetUsersQuery: GraphQLQuery {
  public static let operationName: String = "GetUsers"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"query GetUsers($input: UserConnectionInput!) { users(input: $input) { __typename nodes { __typename ...UserFields } pageInfo { __typename ...PageInfoFields } } }"#,
      fragments: [PageInfoFields.self, UserFields.self]
    ))

  public var input: UserConnectionInput

  public init(input: UserConnectionInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Query }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("users", Users.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      GetUsersQuery.Data.self
    ] }

    public var users: Users { __data["users"] }

    /// Users
    ///
    /// Parent Type: `UserConnection`
    public struct Users: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.UserConnection }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .field("nodes", [Node?].self),
        .field("pageInfo", PageInfo.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        GetUsersQuery.Data.Users.self
      ] }

      public var nodes: [Node?] { __data["nodes"] }
      public var pageInfo: PageInfo { __data["pageInfo"] }

      /// Users.Node
      ///
      /// Parent Type: `User`
      public struct Node: AppGraphqlApi.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.User }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .fragment(UserFields.self),
        ] }
        public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          GetUsersQuery.Data.Users.Node.self,
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

      /// Users.PageInfo
      ///
      /// Parent Type: `PageInfo`
      public struct PageInfo: AppGraphqlApi.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.PageInfo }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .fragment(PageInfoFields.self),
        ] }
        public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          GetUsersQuery.Data.Users.PageInfo.self,
          PageInfoFields.self
        ] }

        public var hasNextPage: Bool { __data["hasNextPage"] }
        public var endCursor: String? { __data["endCursor"] }

        public struct Fragments: FragmentContainer {
          public let __data: DataDict
          public init(_dataDict: DataDict) { __data = _dataDict }

          public var pageInfoFields: PageInfoFields { _toFragment() }
        }
      }
    }
  }
}
