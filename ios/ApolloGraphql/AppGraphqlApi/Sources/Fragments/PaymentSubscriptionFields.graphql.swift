// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public struct PaymentSubscriptionFields: AppGraphqlApi.SelectionSet, Fragment {
  public static var fragmentDefinition: StaticString {
    #"fragment PaymentSubscriptionFields on PaymentSubscription { __typename id status provider productKey productName amountTotal currency recurringInterval currentPeriodEnd createdTime }"#
  }

  public let __data: DataDict
  public init(_dataDict: DataDict) { __data = _dataDict }

  public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.PaymentSubscription }
  public static var __selections: [ApolloAPI.Selection] { [
    .field("__typename", String.self),
    .field("id", AppGraphqlApi.Id.self),
    .field("status", GraphQLEnum<AppGraphqlApi.SubscriptionStatus>.self),
    .field("provider", GraphQLEnum<AppGraphqlApi.CheckoutProvider>.self),
    .field("productKey", String.self),
    .field("productName", String.self),
    .field("amountTotal", Int.self),
    .field("currency", String.self),
    .field("recurringInterval", GraphQLEnum<AppGraphqlApi.SubscriptionInterval>.self),
    .field("currentPeriodEnd", AppGraphqlApi.Instant?.self),
    .field("createdTime", AppGraphqlApi.Instant.self),
  ] }
  public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
    PaymentSubscriptionFields.self
  ] }

  public var id: AppGraphqlApi.Id { __data["id"] }
  public var status: GraphQLEnum<AppGraphqlApi.SubscriptionStatus> { __data["status"] }
  public var provider: GraphQLEnum<AppGraphqlApi.CheckoutProvider> { __data["provider"] }
  /// Product snapshot taken at activation time.
  public var productKey: String { __data["productKey"] }
  public var productName: String { __data["productName"] }
  /// Per-period total in the currency's minor units.
  public var amountTotal: Int { __data["amountTotal"] }
  public var currency: String { __data["currency"] }
  public var recurringInterval: GraphQLEnum<AppGraphqlApi.SubscriptionInterval> { __data["recurringInterval"] }
  /// End of the current billing period as reported by Stripe; null for LOCAL subscriptions.
  public var currentPeriodEnd: AppGraphqlApi.Instant? { __data["currentPeriodEnd"] }
  public var createdTime: AppGraphqlApi.Instant { __data["createdTime"] }
}
