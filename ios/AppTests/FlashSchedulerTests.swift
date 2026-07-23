import XCTest

@testable import AppIOS

/// Mirrors the web pack's scheduler.test.ts — the Leitner scheduler is the
/// flashcard pack's engine, and progress must mean the same thing on every
/// platform.
final class FlashSchedulerTests: XCTestCase {
  func testGoodPromotesOneBoxAndCapsAtTheTop() {
    var state = FlashScheduler.newCardState()
    for expected in 2...FlashScheduler.boxCount {
      state = FlashScheduler.review(state, grade: .good, today: 100)
      XCTAssertEqual(state.box, expected)
    }
    state = FlashScheduler.review(state, grade: .good, today: 100)
    XCTAssertEqual(state.box, FlashScheduler.boxCount)  // capped
  }

  func testAgainResetsToBoxOneFromAnyBox() {
    let high = FlashScheduler.CardState(box: 4, lastReviewedDay: 90)
    XCTAssertEqual(
      FlashScheduler.review(high, grade: .again, today: 100),
      FlashScheduler.CardState(box: 1, lastReviewedDay: 100))
  }

  func testNeverReviewedCardsAreDue() {
    XCTAssertTrue(FlashScheduler.isDue(FlashScheduler.newCardState(), today: 0))
  }

  func testDoublingIntervalsPerBox() {
    XCTAssertEqual(FlashScheduler.boxIntervals, [1, 2, 4, 8, 16])
    let box3 = FlashScheduler.CardState(box: 3, lastReviewedDay: 100)
    XCTAssertFalse(FlashScheduler.isDue(box3, today: 103))
    XCTAssertTrue(FlashScheduler.isDue(box3, today: 104))  // 100 + interval 4
  }

  func testDueIndicesAndDeckProgress() {
    let states = [
      FlashScheduler.newCardState(),  // never seen -> due
      FlashScheduler.CardState(box: 1, lastReviewedDay: 100),  // due at 101
      FlashScheduler.CardState(box: 5, lastReviewedDay: 100),  // mastered, due at 116
      FlashScheduler.CardState(box: 2, lastReviewedDay: 100),  // due at 102
    ]
    XCTAssertEqual(FlashScheduler.dueIndices(states, today: 101), [0, 1])
    XCTAssertEqual(FlashScheduler.dueIndices(states, today: 116), [0, 1, 2, 3])
    XCTAssertEqual(
      FlashScheduler.deckProgress(states, today: 101),
      FlashScheduler.DeckProgress(total: 4, mastered: 1, seen: 3, due: 2))
  }

  func testDayIndexIncrementsAcrossLocalMidnight() {
    var components = DateComponents(year: 2026, month: 7, day: 22, hour: 23, minute: 59)
    let calendar = Calendar.current
    let before = FlashScheduler.dayIndex(calendar.date(from: components)!)
    components.day = 23
    components.hour = 0
    components.minute = 1
    let after = FlashScheduler.dayIndex(calendar.date(from: components)!)
    XCTAssertEqual(after - before, 1)
  }
}
