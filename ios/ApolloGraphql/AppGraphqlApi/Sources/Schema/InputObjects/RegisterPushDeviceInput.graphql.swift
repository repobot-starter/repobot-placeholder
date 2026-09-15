// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public struct RegisterPushDeviceInput: InputObject {
  public private(set) var __data: InputDict

  public init(_ data: InputDict) {
    __data = data
  }

  public init(
    platform: GraphQLEnum<PushDevicePlatform>,
    endpoint: String,
    subscriptionJson: String
  ) {
    __data = InputDict([
      "platform": platform,
      "endpoint": endpoint,
      "subscriptionJson": subscriptionJson
    ])
  }

  public var platform: GraphQLEnum<PushDevicePlatform> {
    get { __data["platform"] }
    set { __data["platform"] = newValue }
  }

  /// Unique per browser/device; registration upserts on it.
  public var endpoint: String {
    get { __data["endpoint"] }
    set { __data["endpoint"] = newValue }
  }

  /// The full browser PushSubscription JSON (endpoint + keys.p256dh + keys.auth) for WEB.
  public var subscriptionJson: String {
    get { __data["subscriptionJson"] }
    set { __data["subscriptionJson"] = newValue }
  }
}
