// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class FinalizeUploadMutation: GraphQLMutation {
  public static let operationName: String = "FinalizeUpload"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation FinalizeUpload($input: FinalizeUploadInput!) { finalizeUpload(input: $input) { __typename id status sizeBytes } }"#
    ))

  public var input: FinalizeUploadInput

  public init(input: FinalizeUploadInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("finalizeUpload", FinalizeUpload.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      FinalizeUploadMutation.Data.self
    ] }

    /// Verifies the bytes arrived and flips the upload to READY (owner-only, idempotent).
    public var finalizeUpload: FinalizeUpload { __data["finalizeUpload"] }

    /// FinalizeUpload
    ///
    /// Parent Type: `Upload`
    public struct FinalizeUpload: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Upload }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .field("id", AppGraphqlApi.Id.self),
        .field("status", GraphQLEnum<AppGraphqlApi.UploadStatus>.self),
        .field("sizeBytes", Int.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        FinalizeUploadMutation.Data.FinalizeUpload.self
      ] }

      public var id: AppGraphqlApi.Id { __data["id"] }
      public var status: GraphQLEnum<AppGraphqlApi.UploadStatus> { __data["status"] }
      /// Declared at create time; the actual byte count once READY.
      public var sizeBytes: Int { __data["sizeBytes"] }
    }
  }
}
