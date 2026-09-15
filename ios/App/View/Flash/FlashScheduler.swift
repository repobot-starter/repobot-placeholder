import Foundation

/// A Leitner-box spaced-repetition scheduler, mirrored from the web pack's
/// scheduler.ts (and FlashScheduler.kt on Android). Pure and deterministic —
/// the current day is always passed in — so progress means the same thing
/// on every platform.
///
/// Five boxes with doubling intervals: box 1 is due every day, box 5 every
/// 16 days. "Got it" promotes a card one box; "Again" sends it back to box 1.
enum FlashScheduler {
  static let boxCount = 5

  /// Days between reviews for each box (index 0 = box 1).
  static let boxIntervals = [1, 2, 4, 8, 16]

  struct CardState: Equatable, Codable {
    /// 1...boxCount. New cards start in box 1.
    var box: Int
    /// Day index (days since epoch) of the last review; -1 = never reviewed.
    var lastReviewedDay: Int
  }

  enum Grade {
    case again
    case good
  }

  static func newCardState() -> CardState {
    CardState(box: 1, lastReviewedDay: -1)
  }

  /// Whether a card is due for review on the given day.
  static func isDue(_ state: CardState, today: Int) -> Bool {
    if state.lastReviewedDay < 0 { return true }  // never reviewed
    return today >= state.lastReviewedDay + boxIntervals[state.box - 1]
  }

  /// Apply a review grade. Good promotes one box (capped); again resets to box 1.
  static func review(_ state: CardState, grade: Grade, today: Int) -> CardState {
    let box = grade == .good ? min(state.box + 1, boxCount) : 1
    return CardState(box: box, lastReviewedDay: today)
  }

  /// Indices of the cards due today, in stable order.
  static func dueIndices(_ states: [CardState], today: Int) -> [Int] {
    states.enumerated().filter { isDue($0.element, today: today) }.map(\.offset)
  }

  struct DeckProgress: Equatable {
    let total: Int
    /// Cards that have reached the top box.
    let mastered: Int
    /// Cards reviewed at least once.
    let seen: Int
    let due: Int
  }

  static func deckProgress(_ states: [CardState], today: Int) -> DeckProgress {
    DeckProgress(
      total: states.count,
      mastered: states.filter { $0.box == boxCount }.count,
      seen: states.filter { $0.lastReviewedDay >= 0 }.count,
      due: dueIndices(states, today: today).count)
  }

  /// Days since the Unix epoch in local time — the scheduler's clock tick.
  static func dayIndex(_ date: Date) -> Int {
    let seconds = date.timeIntervalSince1970
    let offset = TimeInterval(TimeZone.current.secondsFromGMT(for: date))
    return Int(floor((seconds + offset) / 86_400))
  }
}
