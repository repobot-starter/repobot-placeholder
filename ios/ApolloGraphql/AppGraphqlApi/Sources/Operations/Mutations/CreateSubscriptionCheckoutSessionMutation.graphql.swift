// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public class CreateSubscriptionCheckoutSessionMutation: GraphQLMutation {
  public static let operationName: String = "CreateSubscriptionCheckoutSession"
  public static let operationDocument: ApolloAPI.OperationDocument = .init(
    definition: .init(
      #"mutation CreateSubscriptionCheckoutSession($input: CreateSubscriptionCheckoutSessionInput!) { createSubscriptionCheckoutSession(input: $input) { __typename ...CheckoutSessionFields } }"#,
      fragments: [CheckoutSessionFields.self]
    ))

  public var input: CreateSubscriptionCheckoutSessionInput

  public init(input: CreateSubscriptionCheckoutSessionInput) {
    self.input = input
  }

  public var __variables: Variables? { ["input": input] }

  public struct Data: AppGraphqlApi.SelectionSet {
    public let __data: DataDict
    public init(_dataDict: DataDict) { __data = _dataDict }

    public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.Mutation }
    public static var __selections: [ApolloAPI.Selection] { [
      .field("createSubscriptionCheckoutSession", CreateSubscriptionCheckoutSession.self, arguments: ["input": .variable("input")]),
    ] }
    public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
      CreateSubscriptionCheckoutSessionMutation.Data.self
    ] }

    public var createSubscriptionCheckoutSession: CreateSubscriptionCheckoutSession { __data["createSubscriptionCheckoutSession"] }

    /// CreateSubscriptionCheckoutSession
    ///
    /// Parent Type: `CheckoutSession`
    public struct CreateSubscriptionCheckoutSession: AppGraphqlApi.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: any ApolloAPI.ParentType { AppGraphqlApi.Objects.CheckoutSession }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("__typename", String.self),
        .fragment(CheckoutSessionFields.self),
      ] }
      public static var __fulfilledFragments: [any ApolloAPI.SelectionSet.Type] { [
        CreateSubscriptionCheckoutSessionMutation.Data.CreateSubscriptionCheckoutSession.self,
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

      public struct Fragments: FragmentContainer {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public var checkoutSessionFields: CheckoutSessionFields { _toFragment() }
      }
    }
  }
}
