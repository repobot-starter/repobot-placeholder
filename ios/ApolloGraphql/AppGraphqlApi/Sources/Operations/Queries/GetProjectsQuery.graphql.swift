// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class GetProjectsQuery: GraphQLQuery {
  public static let operationName: String = "GetProjects"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"query GetProjects($input: ProjectConnectionInput!) { projects(input: $input) { __typename nodes { __typename ...ProjectFields } pageInfo { __typename ...PageInfoFields } } }"#,
      fragments: [PageInfoFields.self, ProjectFields.self]
    ))

  public var input: ProjectConnectionInput

  public init(input: ProjectConnectionInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Query }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("projects", Projects.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      GetProjectsQuery.Data.self
    ] }

    public var projects: Projects { __data["projects"] }

    /// Projects
    ///
    /// Parent Type: `ProjectConnection`
    public struct Projects: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.ProjectConnection }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .field("nodes", [Node?].self),
        .field("pageInfo", PageInfo.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        GetProjectsQuery.Data.Projects.self
      ] }

      public var nodes: [Node?] { __data["nodes"] }
      public var pageInfo: PageInfo { __data["pageInfo"] }

      /// Projects.Node
      ///
      /// Parent Type: `Project`
      public struct Node: AppGraphqlApi.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Project }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .fragment(ProjectFields.self),
        ] }
        public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          GetProjectsQuery.Data.Projects.Node.self,
          ProjectFields.self
        ] }

        public var id: AppGraphqlApi.Id { __data["id"] }
        public var name: String { __data["name"] }
        public var description: String? { __data["description"] }
        public var status: GraphQLEnum<AppGraphqlApi.ProjectStatus> { __data["status"] }
        public var createdTime: AppGraphqlApi.Instant { __data["createdTime"] }
        public var archivedAt: AppGraphqlApi.Instant? { __data["archivedAt"] }
        public var createdBy: CreatedBy { __data["createdBy"] }

        public struct Fragments: FragmentContainer {
          public let __data: DataDict
          public init(_dataDict: DataDict) { __data = _dataDict }

          public var projectFields: ProjectFields { _toFragment() }
        }

        public typealias CreatedBy = ProjectFields.CreatedBy
      }

      /// Projects.PageInfo
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
          GetProjectsQuery.Data.Projects.PageInfo.self,
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
