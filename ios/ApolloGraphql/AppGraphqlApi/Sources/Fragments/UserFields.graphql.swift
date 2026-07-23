// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public struct UserFields: AppGraphqlApi.SelectionSet, Fragment {
  public static var fragmentDefinition: StaticString {
    #"fragment UserFields on User { __typename id email displayName status createdTime account { __typename id name } }"#
  }

  public let __data: DataDict
  public init(_dataDict: DataDict) { __data = _dataDict }

  public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.User }
  public static var __selections: [ApolloAPI.Selection] { [
    .field("__typename", String.self),
    .field("id", AppGraphqlApi.Id.self),
    .field("email", String.self),
    .field("displayName", String.self),
    .field("status", GraphQLEnum<AppGraphqlApi.UserStatus>.self),
    .field("createdTime", AppGraphqlApi.Instant.self),
    .field("account", Account?.self),
  ] }
  public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
    UserFields.self
  ] }

  public var id: AppGraphqlApi.Id { __data["id"] }
  public var email: String { __data["email"] }
  public var displayName: String { __data["displayName"] }
  public var status: GraphQLEnum<AppGraphqlApi.UserStatus> { __data["status"] }
  public var createdTime: AppGraphqlApi.Instant { __data["createdTime"] }
  public var account: Account? { __data["account"] }

  /// Account
  ///
  /// Parent Type: `Account`
  public struct Account: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Account }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("__typename", String.self),
      .field("id", AppGraphqlApi.Id.self),
      .field("name", String.self),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      UserFields.Account.self
    ] }

    public var id: AppGraphqlApi.Id { __data["id"] }
    public var name: String { __data["name"] }
  }
}
