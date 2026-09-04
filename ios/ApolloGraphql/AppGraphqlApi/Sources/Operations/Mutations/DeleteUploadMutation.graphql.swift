// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class DeleteUploadMutation: GraphQLMutation {
  public static let operationName: String = "DeleteUpload"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation DeleteUpload($input: DeleteUploadInput!) { deleteUpload(input: $input) }"#
    ))

  public var input: DeleteUploadInput

  public init(input: DeleteUploadInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("deleteUpload", Bool.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      DeleteUploadMutation.Data.self
    ] }

    /// Deletes the stored object and its row (owner-only).
    public var deleteUpload: Bool { __data["deleteUpload"] }
  }
}
