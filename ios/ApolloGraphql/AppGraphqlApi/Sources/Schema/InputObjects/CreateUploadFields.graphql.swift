// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct CreateUploadFields: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    contentType: String,
    sizeBytes: Int,
    visibility: GraphQLEnum<UploadVisibility>
  ) {
    __data = InputDict([
      "contentType": contentType,
      "sizeBytes": sizeBytes,
      "visibility": visibility
    ])
  }

  /// Must be on the kernel's content-type allowlist (Services/Storage/StorageConfig.ts).
  public var contentType: String {
    get { __data["contentType"] }
    set { __data["contentType"] = newValue }
  }

  /// Declared size; validated against the kernel's max, re-checked at finalize.
  public var sizeBytes: Int {
    get { __data["sizeBytes"] }
    set { __data["sizeBytes"] = newValue }
  }

  public var visibility: GraphQLEnum<UploadVisibility> {
    get { __data["visibility"] }
    set { __data["visibility"] = newValue }
  }
}
