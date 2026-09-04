// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct CreateSubscriptionCheckoutSessionFields: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    origin: String,
    productKey: GraphQLNullable<String> = nil
  ) {
    __data = InputDict([
      "origin": origin,
      "productKey": productKey
    ])
  }

  /// The web app's origin (window.location.origin); success/cancel redirects are built from it.
  public var origin: String {
    get { __data["origin"] }
    set { __data["origin"] = newValue }
  }

  /// Which catalog plan to subscribe to; omitted means the default plan.
  public var productKey: GraphQLNullable<String> {
    get { __data["productKey"] }
    set { __data["productKey"] = newValue }
  }
}
