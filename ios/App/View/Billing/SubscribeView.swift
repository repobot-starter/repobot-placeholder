import SwiftUI

/// The subscribe flow — the native twin of web/app's SubscribePage.tsx: on
/// appear it starts a subscription checkout for the signed-in user and hands
/// them to the session's checkoutUrl (Stripe's hosted page when deployed,
/// the web app's in-app test checkout in the sandbox) in the system browser,
/// matching how the twin opens OAuth URLs. Subscription checkout is never
/// anonymous — this view only renders inside the signed-in shell (the web
/// twin routes signed-out visitors to sign-up first).
///
/// `productKey` picks a catalog plan; nil means the default plan (the web
/// twin's `?plan=<key>` query parameter). Present it from a pricing CTA or
/// the Settings Billing card's subscribe affordance.
struct SubscribeView: View {
  @EnvironmentObject private var appComponents: AppComponents
  @EnvironmentObject private var billingStore: BillingStore
  @Environment(\.uiThemeTokens) private var theme
  @Environment(\.openURL) private var openURL
  @Environment(\.dismiss) private var dismiss

  var productKey: String? = nil

  /// Web parity with SubscribePage's startedRef: the checkout starts once
  /// per presentation, not on every state change.
  @State private var hasStarted = false
  @State private var checkoutOpened = false

  var body: some View {
    VStack(spacing: 16) {
      if let error = billingStore.checkoutError {
        Text("Checkout unavailable")
          .font(.system(size: theme.typography.sizes.lg, weight: .bold))
          .foregroundStyle(theme.colors.textPrimary)
        Text(error)
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.statusError)
          .multilineTextAlignment(.center)
        Button("Back") {
          dismiss()
        }
        .font(.system(size: theme.typography.sizes.md, weight: .semibold))
        .foregroundStyle(theme.colors.accent)
      } else if checkoutOpened {
        Text("Finish your checkout in the browser")
          .font(.system(size: theme.typography.sizes.lg, weight: .bold))
          .foregroundStyle(theme.colors.textPrimary)
        Text("Your subscription becomes active as soon as the payment settles.")
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.textSecondary)
          .multilineTextAlignment(.center)
        Button("Done") {
          dismiss()
        }
        .font(.system(size: theme.typography.sizes.md, weight: .semibold))
        .foregroundStyle(theme.colors.accent)
      } else {
        Text("Starting your checkout…")
          .font(.system(size: theme.typography.sizes.lg, weight: .bold))
          .foregroundStyle(theme.colors.textPrimary)
        Text("One moment while we prepare your subscription.")
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.textSecondary)
          .multilineTextAlignment(.center)
        ProgressView()
      }
    }
    .padding(24)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
    .task {
      await startCheckout()
    }
  }

  private func startCheckout() async {
    guard !hasStarted else {
      return
    }
    hasStarted = true
    guard let checkoutURL = await appComponents.billing.startSubscriptionCheckout(productKey: productKey) else {
      return
    }
    openURL(checkoutURL)
    checkoutOpened = true
  }
}
