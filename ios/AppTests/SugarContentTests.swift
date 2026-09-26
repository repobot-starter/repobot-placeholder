import XCTest

@testable import AppIOS

/// Guards the pastry and machine data the sugar pack ships with.
final class SugarContentTests: XCTestCase {
  func testEveryLineupHasPastriesAtHonestPrices() {
    XCTAssertFalse(SugarContent.lineups.isEmpty)
    for lineup in SugarContent.lineups {
      XCTAssertFalse(lineup.title.isEmpty)
      XCTAssertFalse(lineup.pastries.isEmpty)
      for pastry in lineup.pastries {
        XCTAssertFalse(pastry.name.isEmpty)
        XCTAssertGreaterThan(pastry.priceCents, 0)
      }
    }
  }

  func testPastryNamesUniqueWithinEachLineup() {
    for lineup in SugarContent.lineups {
      let names = lineup.pastries.map(\.name)
      XCTAssertEqual(Set(names).count, names.count, lineup.title)
    }
  }

  func testEveryMachineHasACoherentSchedule() {
    XCTAssertFalse(SugarContent.machines.isEmpty)
    for machine in SugarContent.machines {
      XCTAssertFalse(machine.name.isEmpty)
      XCTAssertFalse(machine.schedule.stockedDays.isEmpty)
      for day in machine.schedule.stockedDays {
        XCTAssertTrue((0...6).contains(day), machine.name)
      }
      XCTAssertGreaterThanOrEqual(machine.schedule.restockMinute, 0)
      XCTAssertLessThan(machine.schedule.restockMinute, machine.schedule.selloutMinute)
      XCTAssertLessThan(machine.schedule.selloutMinute, 24 * 60)
    }
  }

  func testMachineNamesAreUnique() {
    let names = SugarContent.machines.map(\.name)
    XCTAssertEqual(Set(names).count, names.count)
  }
}
