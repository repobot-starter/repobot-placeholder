// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension Objects {
  /// One user's subscription: written exactly once when its checkout session
  /// reaches PAID, then moved through ACTIVE / PAST_DUE / CANCELED by Stripe's
  /// lifecycle events. Never anonymous.
  static let PaymentSubscription = ApolloAPI.Object(
    typename: "PaymentSubscription",
    implementedInterfaces: [],
    keyFields: nil
  )
}