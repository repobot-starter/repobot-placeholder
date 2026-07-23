import XCTest

@testable import AppIOS

/// Mirrors the web pack's freshness.test.ts so a machine's status badge
/// agrees on every platform.
final class SugarFreshnessTests: XCTestCase {
  /// Stocked every day, 7 AM restock, sells out around 1 PM.
  private let daily = SugarFreshness.MachineSchedule(
    stockedDays: [0, 1, 2, 3, 4, 5, 6], restockMinute: 7 * 60, selloutMinute: 13 * 60)

  /// Weekdays only.
  private let weekdays = SugarFreshness.MachineSchedule(
    stockedDays: [1, 2, 3, 4, 5], restockMinute: 7 * 60, selloutMinute: 11 * 60)

  func testShowsRestockingBeforeTheMorningFill() {
    let status = SugarFreshness.statusAt(daily, day: 2, minute: 6 * 60)
    XCTAssertEqual(status.kind, .upcoming)
    XCTAssertEqual(status.label, "Restocking at 7:00 AM")
  }

  func testFreshFromRestockUntilSellingFastWindow() {
    XCTAssertEqual(SugarFreshness.statusAt(daily, day: 2, minute: 7 * 60).kind, .fresh)
    XCTAssertEqual(
      SugarFreshness.statusAt(
        daily, day: 2, minute: 13 * 60 - SugarFreshness.sellingFastWindow - 1
      ).kind, .fresh)
    XCTAssertEqual(
      SugarFreshness.statusAt(daily, day: 2, minute: 7 * 60).label, "Stocked fresh at 7:00 AM")
  }

  func testNudgesWhenAlmostGone() {
    XCTAssertEqual(
      SugarFreshness.statusAt(
        daily, day: 2, minute: 13 * 60 - SugarFreshness.sellingFastWindow
      ).kind, .sellingFast)
    XCTAssertEqual(SugarFreshness.statusAt(daily, day: 2, minute: 13 * 60 - 1).kind, .sellingFast)
  }

  func testSellsOutAndPointsAtTomorrow() {
    let status = SugarFreshness.statusAt(daily, day: 2, minute: 13 * 60)
    XCTAssertEqual(status.kind, .soldOut)
    XCTAssertEqual(status.label, "Sold out — back tomorrow at 7:00 AM")
  }

  func testRestsOnUnstockedDaysAndNamesTheNextStockedDay() {
    let saturday = SugarFreshness.statusAt(weekdays, day: 6, minute: 9 * 60)
    XCTAssertEqual(saturday.kind, .closed)
    XCTAssertEqual(saturday.label, "Back Monday at 7:00 AM")
    XCTAssertEqual(
      SugarFreshness.statusAt(weekdays, day: 5, minute: 12 * 60).label,
      "Sold out — back Monday at 7:00 AM")
  }

  func testNextRestockDayLabel() {
    XCTAssertEqual(SugarFreshness.nextRestockDayLabel(daily, day: 3), "tomorrow")
    XCTAssertEqual(SugarFreshness.nextRestockDayLabel(weekdays, day: 6), "Monday")
    XCTAssertEqual(SugarFreshness.nextRestockDayLabel(weekdays, day: 5), "Monday")
  }

  func testFormatMinute() {
    XCTAssertEqual(SugarFreshness.formatMinute(7 * 60), "7:00 AM")
    XCTAssertEqual(SugarFreshness.formatMinute(7 * 60 + 5), "7:05 AM")
    XCTAssertEqual(SugarFreshness.formatMinute(0), "12:00 AM")
    XCTAssertEqual(SugarFreshness.formatMinute(12 * 60), "12:00 PM")
    XCTAssertEqual(SugarFreshness.formatMinute(15 * 60 + 30), "3:30 PM")
  }

  func testLineupRotation() {
    XCTAssertEqual(SugarFreshness.lineupIndexForDay(0, lineupCount: 3), 0)
    XCTAssertEqual(SugarFreshness.lineupIndexForDay(1, lineupCount: 3), 1)
    XCTAssertEqual(SugarFreshness.lineupIndexForDay(3, lineupCount: 3), 0)
    XCTAssertEqual(SugarFreshness.lineupIndexForDay(-1, lineupCount: 3), 2)
    XCTAssertEqual(SugarFreshness.lineupIndexForDay(5, lineupCount: 0), 0)
  }

  func testFormatPrice() {
    XCTAssertEqual(SugarFreshness.formatPrice(450), "$4.50")
    XCTAssertEqual(SugarFreshness.formatPrice(500), "$5")
    XCTAssertEqual(SugarFreshness.formatPrice(375), "$3.75")
  }
}
