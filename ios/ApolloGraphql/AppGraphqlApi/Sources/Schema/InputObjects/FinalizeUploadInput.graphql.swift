// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct FinalizeUploadInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    uploadId: Id
  ) {
    __data = InputDict([
      "uploadId": uploadId
    ])
  }

  public var uploadId: Id {
    get { __data["uploadId"] }
    set { __data["uploadId"] = newValue }
  }
}
