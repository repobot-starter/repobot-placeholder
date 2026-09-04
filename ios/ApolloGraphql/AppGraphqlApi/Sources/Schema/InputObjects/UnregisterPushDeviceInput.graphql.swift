// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct UnregisterPushDeviceInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    endpoint: String
  ) {
    __data = InputDict([
      "endpoint": endpoint
    ])
  }

  public var endpoint: String {
    get { __data["endpoint"] }
    set { __data["endpoint"] = newValue }
  }
}
