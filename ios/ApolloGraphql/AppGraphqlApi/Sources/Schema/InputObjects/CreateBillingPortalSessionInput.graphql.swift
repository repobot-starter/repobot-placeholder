// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct CreateBillingPortalSessionInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    origin: String
  ) {
    __data = InputDict([
      "origin": origin
    ])
  }

  /// The web app's origin (window.location.origin); the portal's return URL is built from it.
  public var origin: String {
    get { __data["origin"] }
    set { __data["origin"] = newValue }
  }
}
