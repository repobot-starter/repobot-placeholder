// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public struct CheckoutSessionFields: AppGraphqlApi.SelectionSet, Fragment {
  public static var fragmentDefinition: StaticString {
    #"fragment CheckoutSessionFields on CheckoutSession { __typename id provider status checkoutUrl productKey productName amountTotal currency deliveryAvailable createdTime }"#
  }

  public let __data: DataDict
  public init(_dataDict: DataDict) { __data = _dataDict }

  public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.CheckoutSession }
  public static var __selections: [ApolloAPI.Selection] { [
    .field("__typename", String.self),
    .field("id", AppGraphqlApi.Id.self),
    .field("provider", GraphQLEnum<AppGraphqlApi.CheckoutProvider>.self),
    .field("status", GraphQLEnum<AppGraphqlApi.CheckoutSessionStatus>.self),
    .field("checkoutUrl", String.self),
    .field("productKey", String.self),
    .field("productName", String.self),
    .field("amountTotal", Int.self),
    .field("currency", String.self),
    .field("deliveryAvailable", Bool.self),
    .field("createdTime", AppGraphqlApi.Instant.self),
  ] }
  public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
    CheckoutSessionFields.self
  ] }

  public var id: AppGraphqlApi.Id { __data["id"] }
  public var provider: GraphQLEnum<AppGraphqlApi.CheckoutProvider> { __data["provider"] }
  public var status: GraphQLEnum<AppGraphqlApi.CheckoutSessionStatus> { __data["status"] }
  /// Where to send the buyer to pay: the in-app test checkout or Stripe's hosted page.
  public var checkoutUrl: String { __data["checkoutUrl"] }
  /// Product snapshot taken at checkout time.
  public var productKey: String { __data["productKey"] }
  public var productName: String { __data["productName"] }
  /// Total in the currency's minor units.
  public var amountTotal: Int { __data["amountTotal"] }
  public var currency: String { __data["currency"] }
  /// True when the product has a session-gated download (see docs/payments.md).
  public var deliveryAvailable: Bool { __data["deliveryAvailable"] }
  public var createdTime: AppGraphqlApi.Instant { __data["createdTime"] }
}
