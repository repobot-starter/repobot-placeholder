import XCTest
import ApolloAPI
import AppGraphqlApi
@testable import AppIOS

/// Parity tests for the Billing card's display models against the web twin's
/// tables in SettingsPage.tsx (subscriptionBadgeTone / subscriptionStatusLabel)
/// and web/core's formatMinorUnits.
final class BillingModelsTests: XCTestCase {
  func testBadgeMappingMirrorsWebToneAndLabelTables() {
    XCTAssertEqual(
      SubscriptionStatusBadge.badge(for: GraphQLEnum(SubscriptionStatusValue.active)),
      SubscriptionStatusBadge(label: "Active", tone: .success)
    )
    XCTAssertEqual(
      SubscriptionStatusBadge.badge(for: GraphQLEnum(SubscriptionStatusValue.pastDue)),
      SubscriptionStatusBadge(label: "Past due", tone: .danger)
    )
    XCTAssertEqual(
      SubscriptionStatusBadge.badge(for: GraphQLEnum(SubscriptionStatusValue.canceled)),
      SubscriptionStatusBadge(label: "Cancelled", tone: .neutral)
    )
  }

  func testUnknownStatusFallsBackToNeutralWithRawLabel() {
    XCTAssertEqual(
      SubscriptionStatusBadge.badge(for: .unknown("PAUSED")),
      SubscriptionStatusBadge(label: "Paused", tone: .neutral)
    )
  }

  func testFormatMinorUnitsMatchesWebFormatting() {
    XCTAssertEqual(MoneyFormat.formatMinorUnits(2400, currency: "usd"), "$24.00")
    XCTAssertEqual(MoneyFormat.formatMinorUnits(950, currency: "USD"), "$9.50")
    XCTAssertEqual(MoneyFormat.formatMinorUnits(1400, currency: "eur"), "€14.00")
  }

  func testPriceLabelMirrorsWebBillingCard() {
    let summary = SubscriptionSummary(
      status: GraphQLEnum(SubscriptionStatusValue.active),
      productName: "Pro",
      amountTotal: 2400,
      currency: "usd",
      recurringInterval: GraphQLEnum(SubscriptionIntervalValue.month),
      currentPeriodEnd: nil
    )
    XCTAssertEqual(summary.priceLabel, "$24.00 / month")

    let yearly = SubscriptionSummary(
      status: GraphQLEnum(SubscriptionStatusValue.active),
      productName: "Pro",
      amountTotal: 24000,
      currency: "usd",
      recurringInterval: GraphQLEnum(SubscriptionIntervalValue.year),
      currentPeriodEnd: nil
    )
    XCTAssertEqual(yearly.priceLabel, "$240.00 / year")
  }

  func testInstantParsingHandlesBackendTimestamps() {
    // The backend serializes Instants with milliseconds.
    let withMillis = InstantParsing.date(from: "2026-07-18T00:00:00.000Z")
    XCTAssertNotNil(withMillis)

    // Stripe-derived period ends may come back without a fractional part;
    // both spellings parse to the same moment.
    let wholeSeconds = InstantParsing.date(from: "2026-07-18T12:30:00Z")
    XCTAssertNotNil(wholeSeconds)
    XCTAssertEqual(wholeSeconds, InstantParsing.date(from: "2026-07-18T12:30:00.000Z"))

    XCTAssertNil(InstantParsing.date(from: "not-a-date"))
  }
}
