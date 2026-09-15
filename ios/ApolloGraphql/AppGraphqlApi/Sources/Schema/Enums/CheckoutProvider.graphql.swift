// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public enum CheckoutProvider: String, EnumType {
  /// Sandbox-only simulated checkout (PAYMENTS_MODE=local); no real payment.
  case local = "LOCAL"
  /// Stripe hosted Checkout (PAYMENTS_MODE=stripe).
  case stripe = "STRIPE"
}
