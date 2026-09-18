import XCTest
import ApolloAPI
import AppGraphqlApi
@testable import AppIOS

/// State-transition tests for the billing workflows (web twins: BillingCard's
/// manageBilling and SubscribePage's checkout effect) against a stubbed
/// payments API.
@MainActor
final class BillingComponentTests: XCTestCase {
  private let webOrigin = URL(string: "https://myapp.example")!

  private func makeSummary(status: SubscriptionStatusValue = .active) -> SubscriptionSummary {
    SubscriptionSummary(
      status: GraphQLEnum(status),
      productName: "Pro",
      amountTotal: 2400,
      currency: "usd",
      recurringInterval: GraphQLEnum(SubscriptionIntervalValue.month),
      currentPeriodEnd: nil
    )
  }

  func testLoadSubscriptionStoresTheSummaryAndMarksLoaded() async {
    let store = BillingStore()
    let api = StubBillingApi()
    api.subscriptionResult = .success(makeSummary())
    let component = BillingComponent(billingStore: store, api: api, webOrigin: { self.webOrigin })

    XCTAssertFalse(store.hasLoadedSubscription)
    await component.loadSubscription()

    XCTAssertEqual(store.subscription, makeSummary())
    XCTAssertTrue(store.hasLoadedSubscription)
    XCTAssertFalse(store.isLoadingSubscription)
    XCTAssertNil(store.billingError)
  }

  func testLoadSubscriptionWithNoSubscriptionStillMarksLoaded() async {
    let store = BillingStore()
    let api = StubBillingApi()
    api.subscriptionResult = .success(nil)
    let component = BillingComponent(billingStore: store, api: api, webOrigin: { self.webOrigin })

    await component.loadSubscription()

    XCTAssertNil(store.subscription)
    XCTAssertTrue(store.hasLoadedSubscription)
  }

  func testLoadSubscriptionFailureRecordsErrorAndStaysUnloaded() async {
    let store = BillingStore()
    let api = StubBillingApi()
    api.subscriptionResult = .failure(StubFailure.boom)
    let component = BillingComponent(billingStore: store, api: api, webOrigin: { self.webOrigin })

    await component.loadSubscription()

    // Web parity: a failed mySubscription query renders no Billing card.
    XCTAssertFalse(store.hasLoadedSubscription)
    XCTAssertNotNil(store.billingError)
    XCTAssertFalse(store.isLoadingSubscription)
  }

  func testOpenBillingPortalReturnsUrlAndPassesTheWebOrigin() async {
    let store = BillingStore()
    let api = StubBillingApi()
    api.portalResult = .success(URL(string: "https://myapp.example/billing/test")!)
    let component = BillingComponent(billingStore: store, api: api, webOrigin: { self.webOrigin })

    let url = await component.openBillingPortal()

    XCTAssertEqual(url?.absoluteString, "https://myapp.example/billing/test")
    XCTAssertEqual(api.portalOrigins, ["https://myapp.example"])
    XCTAssertFalse(store.isOpeningPortal)
    XCTAssertNil(store.billingError)
  }

  func testOpenBillingPortalFailureRecordsError() async {
    let store = BillingStore()
    let api = StubBillingApi()
    api.portalResult = .failure(StubFailure.boom)
    let component = BillingComponent(billingStore: store, api: api, webOrigin: { self.webOrigin })

    let url = await component.openBillingPortal()

    XCTAssertNil(url)
    XCTAssertNotNil(store.billingError)
    XCTAssertFalse(store.isOpeningPortal)
  }

  func testOpenBillingPortalWithoutWebOriginFailsWithoutCallingApi() async {
    let store = BillingStore()
    let api = StubBillingApi()
    let component = BillingComponent(billingStore: store, api: api, webOrigin: { nil })

    let url = await component.openBillingPortal()

    XCTAssertNil(url)
    XCTAssertNotNil(store.billingError)
    XCTAssertTrue(api.portalOrigins.isEmpty)
  }

  func testStartSubscriptionCheckoutReturnsCheckoutUrlAndClearsError() async {
    let store = BillingStore()
    let api = StubBillingApi()
    api.checkoutResult = .failure(StubFailure.boom)
    let component = BillingComponent(billingStore: store, api: api, webOrigin: { self.webOrigin })

    // First attempt fails and records the error...
    let failedUrl = await component.startSubscriptionCheckout(productKey: "pro")
    XCTAssertNil(failedUrl)
    XCTAssertNotNil(store.checkoutError)

    // ...a retry clears it and hands back the session's checkout URL.
    api.checkoutResult = .success(URL(string: "https://myapp.example/checkout/test?session=s1")!)
    let url = await component.startSubscriptionCheckout(productKey: "pro")

    XCTAssertEqual(url?.absoluteString, "https://myapp.example/checkout/test?session=s1")
    XCTAssertNil(store.checkoutError)
    XCTAssertFalse(store.isStartingCheckout)
    XCTAssertEqual(api.checkoutRequests.last?.origin, "https://myapp.example")
    XCTAssertEqual(api.checkoutRequests.last?.productKey, "pro")
  }

  func testStartSubscriptionCheckoutPassesNilProductKeyForTheDefaultPlan() async {
    let store = BillingStore()
    let api = StubBillingApi()
    api.checkoutResult = .success(URL(string: "https://pay.example/session")!)
    let component = BillingComponent(billingStore: store, api: api, webOrigin: { self.webOrigin })

    _ = await component.startSubscriptionCheckout(productKey: nil)

    XCTAssertEqual(api.checkoutRequests.count, 1)
    XCTAssertNil(api.checkoutRequests[0].productKey)
  }
}

private enum StubFailure: Error, LocalizedError {
  case boom

  var errorDescription: String? { "The payments backend is unavailable." }
}

@MainActor
private final class StubBillingApi: BillingApi {
  var subscriptionResult: Result<SubscriptionSummary?, Error> = .success(nil)
  var portalResult: Result<URL, Error> = .failure(StubFailure.boom)
  var checkoutResult: Result<URL, Error> = .failure(StubFailure.boom)

  private(set) var portalOrigins: [String] = []
  private(set) var checkoutRequests: [(origin: String, productKey: String?)] = []

  func fetchMySubscription(productKey: String?) async throws -> SubscriptionSummary? {
    try subscriptionResult.get()
  }

  func createBillingPortalSession(origin: String) async throws -> URL {
    portalOrigins.append(origin)
    return try portalResult.get()
  }

  func createSubscriptionCheckoutSession(origin: String, productKey: String?) async throws -> URL {
    checkoutRequests.append((origin: origin, productKey: productKey))
    return try checkoutResult.get()
  }
}
