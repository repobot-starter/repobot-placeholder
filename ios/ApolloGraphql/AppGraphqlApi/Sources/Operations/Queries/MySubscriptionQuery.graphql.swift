// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class MySubscriptionQuery: GraphQLQuery {
  public static let operationName: String = "MySubscription"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"query MySubscription($productKey: String) { mySubscription(productKey: $productKey) { __typename ...PaymentSubscriptionFields } }"#,
      fragments: [PaymentSubscriptionFields.self]
    ))

  public var productKey: GraphQLNullable<String>

  public init(productKey: GraphQLNullable<String>) {
    self.productKey = productKey
  }

  public var __variables: Variables? { ["productKey": productKey] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Query }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("mySubscription", MySubscription?.self, arguments: ["productKey": .variable("productKey")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      MySubscriptionQuery.Data.self
    ] }

    /// The caller's subscription (most recent; optionally scoped to a product), or null.
    public var mySubscription: MySubscription? { __data["mySubscription"] }

    /// MySubscription
    ///
    /// Parent Type: `PaymentSubscription`
    public struct MySubscription: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.PaymentSubscription }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .fragment(PaymentSubscriptionFields.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        MySubscriptionQuery.Data.MySubscription.self,
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

      public struct Fragments: FragmentContainer {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public var paymentSubscriptionFields: PaymentSubscriptionFields { _toFragment() }
      }
    }
  }
}
