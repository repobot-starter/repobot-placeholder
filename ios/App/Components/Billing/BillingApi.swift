import AppGraphqlApi
import Foundation

/// The payments-kernel operations the billing workflows need, behind a small
/// seam so BillingComponent's state transitions are unit-testable with a
/// stubbed client (the twin of the web hooks the Billing card / SubscribePage
/// call). The real implementation delegates to GraphQLClient.
@MainActor
protocol BillingApi {
  func fetchMySubscription(productKey: String?) async throws -> SubscriptionSummary?
  /// Returns the Billing Portal URL (Stripe's portal, or the in-app test
  /// billing page in local mode).
  func createBillingPortalSession(origin: String) async throws -> URL
  /// Returns the checkout URL (Stripe's hosted page, or the in-app test
  /// checkout in local mode).
  func createSubscriptionCheckoutSession(origin: String, productKey: String?) async throws -> URL
}

enum BillingApiFailure: Error, LocalizedError {
  case malformedPortalUrl
  case malformedCheckoutUrl

  var errorDescription: String? {
    switch self {
    case .malformedPortalUrl:
      return "The billing portal could not be opened."
    case .malformedCheckoutUrl:
      return "The checkout could not be started. Please try again."
    }
  }
}

@MainActor
struct GraphQLBillingApi: BillingApi {
  func fetchMySubscription(productKey: String?) async throws -> SubscriptionSummary? {
    guard let data = try await gql.fetchMySubscription(productKey: productKey) else {
      return nil
    }
    return SubscriptionSummary(data: data)
  }

  func createBillingPortalSession(origin: String) async throws -> URL {
    let session = try await gql.createBillingPortalSession(
      input: CreateBillingPortalSessionInput(origin: origin)
    )
    guard let url = URL(string: session.url) else {
      throw BillingApiFailure.malformedPortalUrl
    }
    return url
  }

  func createSubscriptionCheckoutSession(origin: String, productKey: String?) async throws -> URL {
    let session = try await gql.createSubscriptionCheckoutSession(
      input: CreateSubscriptionCheckoutSessionInput(
        idempotencyKey: UUID().uuidString,
        fields: CreateSubscriptionCheckoutSessionFields(
          origin: origin,
          productKey: productKey.map { GraphQLNullable.some($0) } ?? .none
        )
      )
    )
    guard let url = URL(string: session.checkoutUrl) else {
      throw BillingApiFailure.malformedCheckoutUrl
    }
    return url
  }
}
