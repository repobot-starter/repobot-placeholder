import Foundation

/// Workflows for the payments-kernel twin surfaces: loading the caller's
/// subscription (the Settings Billing card, web twin BillingCard in
/// SettingsPage.tsx), opening the Billing Portal, and starting a subscription
/// checkout (web twin SubscribePage.tsx). URL-opening is the view's concern
/// (the openURL environment action, matching the OAuth pattern in
/// SignInView); this component owns the state transitions.
@MainActor
final class BillingComponent {
  private let billingStore: BillingStore
  private let api: BillingApi
  /// The web app's origin the payments kernel builds redirect URLs from —
  /// the twin of the web's window.location.origin. Nil when the build
  /// carries no WEB_ORIGIN (billing surfaces report unavailability).
  private let webOrigin: () -> URL?

  init(
    billingStore: BillingStore,
    api: BillingApi,
    webOrigin: @escaping () -> URL?
  ) {
    self.billingStore = billingStore
    self.api = api
    self.webOrigin = webOrigin
  }

  private static let missingOriginMessage =
    "Billing is not available in this build (no web app URL is configured)."

  /// Loads (or reloads) the caller's subscription. Mirrors the web card's
  /// network-only fetch policy: always hits the backend so state set by a
  /// checkout or the portal is picked up when the user returns to the app.
  func loadSubscription() async {
    billingStore.setLoadingSubscription(true)
    defer { billingStore.setLoadingSubscription(false) }
    do {
      billingStore.setSubscription(try await api.fetchMySubscription(productKey: nil))
    } catch {
      // Web parity: a failed mySubscription query renders no Billing card;
      // the error is kept for the surfaces that want to show it.
      billingStore.setBillingError(error.localizedDescription)
    }
  }

  /// Mints a Billing Portal session and returns its URL for the view to
  /// open (Stripe's hosted portal, or the in-app test billing page in local
  /// mode). Nil means the attempt failed and billingError explains why.
  func openBillingPortal() async -> URL? {
    billingStore.setBillingError(nil)
    guard let origin = webOrigin() else {
      billingStore.setBillingError(Self.missingOriginMessage)
      return nil
    }
    billingStore.setOpeningPortal(true)
    defer { billingStore.setOpeningPortal(false) }
    do {
      return try await api.createBillingPortalSession(origin: origin.absoluteString)
    } catch {
      billingStore.setBillingError(error.localizedDescription)
      return nil
    }
  }

  /// Starts a subscription checkout and returns the session's checkout URL
  /// for the view to open (Stripe's hosted page, or the in-app test checkout
  /// in local mode). Nil means the attempt failed and checkoutError explains
  /// why. Never anonymous: the mutation is authenticated, and the shell only
  /// reaches this surface signed in (the web twin routes signed-out visitors
  /// to sign-up).
  func startSubscriptionCheckout(productKey: String?) async -> URL? {
    billingStore.setCheckoutError(nil)
    guard let origin = webOrigin() else {
      billingStore.setCheckoutError(Self.missingOriginMessage)
      return nil
    }
    billingStore.setStartingCheckout(true)
    defer { billingStore.setStartingCheckout(false) }
    do {
      return try await api.createSubscriptionCheckoutSession(
        origin: origin.absoluteString,
        productKey: productKey
      )
    } catch {
      billingStore.setCheckoutError(error.localizedDescription)
      return nil
    }
  }
}
