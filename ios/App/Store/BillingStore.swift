import SwiftUI

/// State for the payments-kernel twin surfaces: the Settings Billing card
/// (mySubscription + the Billing Portal) and the subscribe flow. State only —
/// the workflows live in BillingComponent.
@MainActor
final class BillingStore: ObservableObject {
  @Published private(set) var subscription: SubscriptionSummary?
  /// True once the first mySubscription load settled (the Billing card stays
  /// hidden until then, mirroring the web card's render-nothing-while-loading).
  @Published private(set) var hasLoadedSubscription = false
  @Published private(set) var isLoadingSubscription = false
  @Published private(set) var isOpeningPortal = false
  @Published private(set) var isStartingCheckout = false
  @Published private(set) var billingError: String?
  @Published private(set) var checkoutError: String?

  func setSubscription(_ value: SubscriptionSummary?) {
    subscription = value
    hasLoadedSubscription = true
  }

  func setLoadingSubscription(_ value: Bool) {
    isLoadingSubscription = value
  }

  func setOpeningPortal(_ value: Bool) {
    isOpeningPortal = value
  }

  func setStartingCheckout(_ value: Bool) {
    isStartingCheckout = value
  }

  func setBillingError(_ value: String?) {
    billingError = value
  }

  func setCheckoutError(_ value: String?) {
    checkoutError = value
  }
}
