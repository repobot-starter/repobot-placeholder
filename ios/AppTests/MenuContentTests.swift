import XCTest

@testable import AppIOS

/// Content-integrity tests for the menu pack: prices, sections, and the
/// weekly schedule are the product, so malformed data is a build failure.
final class MenuContentTests: XCTestCase {
  func testBusinessIdentityIsPresent() {
    XCTAssertFalse(MenuContent.name.isEmpty)
    XCTAssertFalse(MenuContent.tagline.isEmpty)
    XCTAssertFalse(MenuContent.address.isEmpty)
    XCTAssertFalse(MenuContent.phone.isEmpty)
  }

  func testEverySectionHasUniqueItemsWithPositivePrices() {
    XCTAssertFalse(MenuContent.menu.isEmpty)
    let titles = MenuContent.menu.map(\.title)
    XCTAssertEqual(Set(titles).count, titles.count, "section titles must be unique")
    for section in MenuContent.menu {
      XCTAssertFalse(section.items.isEmpty, "\(section.title): sections can't be empty")
      let names = section.items.map(\.name)
      XCTAssertEqual(
        Set(names).count, names.count, "\(section.title): item names must be unique")
      for item in section.items {
        XCTAssertGreaterThan(item.priceCents, 0, "\(item.name): price must be positive")
        XCTAssertFalse(item.description.isEmpty)
      }
    }
  }

  func testWeeklyHoursAreWellFormed() {
    for dayHours in MenuContent.weeklyHours {
      XCTAssertTrue((0...6).contains(dayHours.day))
      var previousClose = 0
      for interval in dayHours.intervals {
        XCTAssertLessThan(interval.open, interval.close, "intervals must be forward")
        XCTAssertGreaterThanOrEqual(
          interval.open, previousClose, "intervals must be sorted and non-overlapping")
        XCTAssertLessThanOrEqual(interval.close, 1440)
        previousClose = interval.close
      }
    }
  }

  func testPriceFormattingTrimsWholeDollars() {
    XCTAssertEqual(MenuContent.formatPrice(1400), "$14")
    XCTAssertEqual(MenuContent.formatPrice(950), "$9.50")
    XCTAssertEqual(MenuContent.formatPrice(525), "$5.25")
  }
}
