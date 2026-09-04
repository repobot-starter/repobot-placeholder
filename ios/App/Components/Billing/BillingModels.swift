import ApolloAPI
import Foundation

/// Plain-value summary of the caller's subscription — what the Settings
/// Billing card renders. Mirrors the web twin's PaymentSubscriptionFields
/// selection; a value type so stores and tests never depend on generated
/// Apollo selection sets.
struct SubscriptionSummary: Equatable {
  let status: GraphQLEnum<SubscriptionStatusValue>
  let productName: String
  /// Per-period total in the currency's minor units.
  let amountTotal: Int
  let currency: String
  let recurringInterval: GraphQLEnum<SubscriptionIntervalValue>
  /// End of the current billing period; nil for LOCAL subscriptions.
  let currentPeriodEnd: Date?

  init(
    status: GraphQLEnum<SubscriptionStatusValue>,
    productName: String,
    amountTotal: Int,
    currency: String,
    recurringInterval: GraphQLEnum<SubscriptionIntervalValue>,
    currentPeriodEnd: Date?
  ) {
    self.status = status
    self.productName = productName
    self.amountTotal = amountTotal
    self.currency = currency
    self.recurringInterval = recurringInterval
    self.currentPeriodEnd = currentPeriodEnd
  }

  init(data: PaymentSubscriptionData) {
    self.init(
      status: data.status,
      productName: data.productName,
      amountTotal: data.amountTotal,
      currency: data.currency,
      recurringInterval: data.recurringInterval,
      currentPeriodEnd: data.currentPeriodEnd.flatMap(InstantParsing.date(from:))
    )
  }

  /// "$24.00 / month" — the web Billing card's price label.
  var priceLabel: String {
    let interval = recurringInterval.rawValue.lowercased()
    return "\(MoneyFormat.formatMinorUnits(amountTotal, currency: currency)) / \(interval)"
  }
}

enum SubscriptionBadgeTone {
  case success
  case danger
  case neutral
}

/// Status badge shown on the Billing card. The mapping mirrors the web
/// twin's subscriptionBadgeTone / subscriptionStatusLabel tables in
/// SettingsPage.tsx.
struct SubscriptionStatusBadge: Equatable {
  let label: String
  let tone: SubscriptionBadgeTone

  static func badge(for status: GraphQLEnum<SubscriptionStatusValue>) -> SubscriptionStatusBadge {
    switch status.value {
    case .active:
      return SubscriptionStatusBadge(label: "Active", tone: .success)
    case .pastDue:
      return SubscriptionStatusBadge(label: "Past due", tone: .danger)
    case .canceled:
      return SubscriptionStatusBadge(label: "Cancelled", tone: .neutral)
    case .none:
      return SubscriptionStatusBadge(label: status.rawValue.capitalized, tone: .neutral)
    }
  }
}

/// Formats amounts in a currency's minor units for display, matching the web
/// twin's formatMinorUnits (Intl.NumberFormat "en-US" currency style):
/// formatMinorUnits(2400, currency: "usd") -> "$24.00".
enum MoneyFormat {
  static func formatMinorUnits(_ amountMinorUnits: Int, currency: String) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.locale = Locale(identifier: "en_US")
    formatter.currencyCode = currency.uppercased()
    let amount = Double(amountMinorUnits) / 100
    return formatter.string(from: NSNumber(value: amount))
      ?? String(format: "%.2f %@", amount, currency.uppercased())
  }
}

/// Parses the backend's Instant scalar (ISO-8601 with milliseconds, e.g.
/// "2026-07-18T00:00:00.000Z"); tolerates whole-second timestamps too.
enum InstantParsing {
  static func date(from instant: String) -> Date? {
    let fractional = ISO8601DateFormatter()
    fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let parsed = fractional.date(from: instant) {
      return parsed
    }
    let whole = ISO8601DateFormatter()
    whole.formatOptions = [.withInternetDateTime]
    return whole.date(from: instant)
  }
}
