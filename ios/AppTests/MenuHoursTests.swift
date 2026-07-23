import XCTest

@testable import AppIOS

/// Mirrors the web pack's hours.test.ts — the opening-hours logic is the
/// menu pack's "engine", and the "Open now" badge must agree on every
/// platform.
final class MenuHoursTests: XCTestCase {
  /// Tue/Wed 7–15, Fri 7–15 and 17–21; closed the rest of the week.
  private let hours: [MenuHours.DayHours] = [
    .init(day: 2, intervals: [(420, 900)]),
    .init(day: 3, intervals: [(420, 900)]),
    .init(day: 5, intervals: [(420, 900), (1020, 1260)]),
  ]

  func testOpenInsideIntervalAndClosedAtExactEnd() {
    XCTAssertTrue(MenuHours.isOpen(hours, day: 2, minute: 420))
    XCTAssertTrue(MenuHours.isOpen(hours, day: 2, minute: 899))
    XCTAssertFalse(MenuHours.isOpen(hours, day: 2, minute: 900))
    XCTAssertFalse(MenuHours.isOpen(hours, day: 1, minute: 600))
  }

  func testHandlesASplitDayWithTwoServices() {
    XCTAssertFalse(MenuHours.isOpen(hours, day: 5, minute: 960))
    XCTAssertTrue(MenuHours.isOpen(hours, day: 5, minute: 1020))
  }

  func testReportsClosingTimeWhileOpen() {
    let status = MenuHours.statusAt(hours, day: 2, minute: 600)
    XCTAssertEqual(status, MenuHours.OpenStatus(open: true, nextChangeDay: 2, nextChangeMinute: 900))
  }

  func testReportsSecondServiceWhenBetweenIntervals() {
    let status = MenuHours.statusAt(hours, day: 5, minute: 960)
    XCTAssertEqual(
      status, MenuHours.OpenStatus(open: false, nextChangeDay: 5, nextChangeMinute: 1020))
  }

  func testRollsToNextOpenDayAcrossClosedWeekend() {
    let status = MenuHours.statusAt(hours, day: 5, minute: 1300)
    XCTAssertEqual(
      status, MenuHours.OpenStatus(open: false, nextChangeDay: 2, nextChangeMinute: 420))
  }

  func testEmptyScheduleHasNoTransition() {
    let status = MenuHours.statusAt([], day: 2, minute: 600)
    XCTAssertEqual(
      status, MenuHours.OpenStatus(open: false, nextChangeDay: nil, nextChangeMinute: nil))
  }

  func testFormatsMinutesAsTwelveHourTimes() {
    XCTAssertEqual(MenuHours.formatMinute(0), "12 AM")
    XCTAssertEqual(MenuHours.formatMinute(420), "7 AM")
    XCTAssertEqual(MenuHours.formatMinute(750), "12:30 PM")
    XCTAssertEqual(MenuHours.formatMinute(1260), "9 PM")
  }

  func testBuildsOpenAndClosedLabels() {
    XCTAssertEqual(MenuHours.statusLabel(hours, day: 2, minute: 600), "Open — closes 3 PM")
    XCTAssertEqual(MenuHours.statusLabel(hours, day: 5, minute: 960), "Closed — opens 5 PM")
    XCTAssertEqual(
      MenuHours.statusLabel(hours, day: 6, minute: 600), "Closed — opens Tuesday 7 AM")
    XCTAssertEqual(MenuHours.statusLabel([], day: 2, minute: 600), "Closed")
  }
}
