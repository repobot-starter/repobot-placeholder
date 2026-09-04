// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class CreateProjectMutation: GraphQLMutation {
  public static let operationName: String = "CreateProject"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation CreateProject($input: CreateProjectInput!) { createProject(input: $input) { __typename ...ProjectFields } }"#,
      fragments: [ProjectFields.self]
    ))

  public var input: CreateProjectInput

  public init(input: CreateProjectInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("createProject", CreateProject.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      CreateProjectMutation.Data.self
    ] }

    public var createProject: CreateProject { __data["createProject"] }

    /// CreateProject
    ///
    /// Parent Type: `Project`
    public struct CreateProject: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Project }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .fragment(ProjectFields.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        CreateProjectMutation.Data.CreateProject.self,
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
  }
}
