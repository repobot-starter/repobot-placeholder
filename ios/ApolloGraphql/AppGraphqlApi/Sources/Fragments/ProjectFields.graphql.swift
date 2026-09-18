// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public struct ProjectFields: AppGraphqlApi.SelectionSet, Fragment {
  public static var fragmentDefinition: StaticString {
    #"fragment ProjectFields on Project { __typename id name description status createdTime archivedAt createdBy { __typename id displayName } }"#
  }

  public let __data: DataDict
  public init(_dataDict: DataDict) { __data = _dataDict }

  public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Project }
  public static var __selections: [ApolloAPI.Selection] { [
    .field("__typename", String.self),
    .field("id", AppGraphqlApi.Id.self),
    .field("name", String.self),
    .field("description", String?.self),
    .field("status", GraphQLEnum<AppGraphqlApi.ProjectStatus>.self),
    .field("createdTime", AppGraphqlApi.Instant.self),
    .field("archivedAt", AppGraphqlApi.Instant?.self),
    .field("createdBy", CreatedBy.self),
  ] }
  public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
    ProjectFields.self
  ] }

  public var id: AppGraphqlApi.Id { __data["id"] }
  public var name: String { __data["name"] }
  public var description: String? { __data["description"] }
  public var status: GraphQLEnum<AppGraphqlApi.ProjectStatus> { __data["status"] }
  public var createdTime: AppGraphqlApi.Instant { __data["createdTime"] }
  public var archivedAt: AppGraphqlApi.Instant? { __data["archivedAt"] }
  public var createdBy: CreatedBy { __data["createdBy"] }

  /// CreatedBy
  ///
  /// Parent Type: `User`
  public struct CreatedBy: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.User }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("__typename", String.self),
      .field("id", AppGraphqlApi.Id.self),
      .field("displayName", String.self),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      ProjectFields.CreatedBy.self
    ] }

    public var id: AppGraphqlApi.Id { __data["id"] }
    public var displayName: String { __data["displayName"] }
  }
}
