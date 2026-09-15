// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class CreateUploadMutation: GraphQLMutation {
  public static let operationName: String = "CreateUpload"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation CreateUpload($input: CreateUploadInput!) { createUpload(input: $input) { __typename uploadId uploadUrl headersJson upload { __typename id contentType sizeBytes visibility status } } }"#
    ))

  public var input: CreateUploadInput

  public init(input: CreateUploadInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("createUpload", CreateUpload.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      CreateUploadMutation.Data.self
    ] }

    /// Mints an upload slot: a PENDING row plus the URL and headers for the byte PUT.
    public var createUpload: CreateUpload { __data["createUpload"] }

    /// CreateUpload
    ///
    /// Parent Type: `UploadSlot`
    public struct CreateUpload: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.UploadSlot }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .field("uploadId", AppGraphqlApi.Id.self),
        .field("uploadUrl", String.self),
        .field("headersJson", String.self),
        .field("upload", Upload.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        CreateUploadMutation.Data.CreateUpload.self
      ] }

      public var uploadId: AppGraphqlApi.Id { __data["uploadId"] }
      /// Absolute signed GCS URL (gcs mode) or a /upload path on the storage function (local mode).
      public var uploadUrl: String { __data["uploadUrl"] }
      /// Headers to send verbatim on the PUT, JSON-encoded ({"Content-Type": ...}).
      public var headersJson: String { __data["headersJson"] }
      public var upload: Upload { __data["upload"] }

      /// CreateUpload.Upload
      ///
      /// Parent Type: `Upload`
      public struct Upload: AppGraphqlApi.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Upload }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("id", AppGraphqlApi.Id.self),
          .field("contentType", String.self),
          .field("sizeBytes", Int.self),
          .field("visibility", GraphQLEnum<AppGraphqlApi.UploadVisibility>.self),
          .field("status", GraphQLEnum<AppGraphqlApi.UploadStatus>.self),
        ] }
        public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
          CreateUploadMutation.Data.CreateUpload.Upload.self
        ] }

        public var id: AppGraphqlApi.Id { __data["id"] }
        public var contentType: String { __data["contentType"] }
        /// Declared at create time; the actual byte count once READY.
        public var sizeBytes: Int { __data["sizeBytes"] }
        public var visibility: GraphQLEnum<AppGraphqlApi.UploadVisibility> { __data["visibility"] }
        public var status: GraphQLEnum<AppGraphqlApi.UploadStatus> { __data["status"] }
      }
    }
  }
}
