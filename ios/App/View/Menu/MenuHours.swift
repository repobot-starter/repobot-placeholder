import Foundation

/// Opening-hours logic for the menu pack, mirrored from the web pack's
/// hours.ts (and MenuHours.kt on Android). Pure and deterministic — the
/// current time is always passed in — so the "Open now" badge agrees on
/// every platform.
///
/// Hours are same-day intervals in minutes since midnight (0–1440);
/// a day may have several intervals (e.g. lunch and dinner service).
enum MenuHours {
  struct DayHours {
    /// 0 = Sunday … 6 = Saturday.
    let day: Int
    /// (openMinute, closeMinute) pairs, sorted, non-overlapping.
    let intervals: [(open: Int, close: Int)]
  }

  struct OpenStatus: Equatable {
    let open: Bool
    /// The next transition: when we close (if open) or next open (if closed).
    let nextChangeDay: Int?
    let nextChangeMinute: Int?
  }

  static let dayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ]

  /// Whether the business is open at the given weekday and minute.
  static func isOpen(_ hours: [DayHours], day: Int, minute: Int) -> Bool {
    guard let today = hours.first(where: { $0.day == day }) else { return false }
    return today.intervals.contains { minute >= $0.open && minute < $0.close }
  }

  /// Full status: open/closed plus the next transition, searching up to a week ahead.
  static func statusAt(_ hours: [DayHours], day: Int, minute: Int) -> OpenStatus {
    func intervalsFor(_ d: Int) -> [(open: Int, close: Int)] {
      hours.first(where: { $0.day == ((d % 7) + 7) % 7 })?.intervals ?? []
    }

    if isOpen(hours, day: day, minute: minute) {
      let close = intervalsFor(day).first { minute >= $0.open && minute < $0.close }
      return OpenStatus(
        open: true, nextChangeDay: day, nextChangeMinute: close?.close ?? minute)
    }

    // Closed: find the next opening within the coming week.
    for offset in 0..<8 {
      let d = (day + offset) % 7
      let candidates = intervalsFor(d).filter { offset > 0 || $0.open > minute }
      if let first = candidates.first {
        return OpenStatus(open: false, nextChangeDay: d, nextChangeMinute: first.open)
      }
    }
    return OpenStatus(open: false, nextChangeDay: nil, nextChangeMinute: nil)
  }

  /// "8 AM" / "12:30 PM" for a minutes-since-midnight value (1440 = midnight).
  static func formatMinute(_ minute: Int) -> String {
    let total = minute % 1440
    let hour24 = total / 60
    let mins = total % 60
    let suffix = hour24 < 12 ? "AM" : "PM"
    let hour12 = hour24 % 12 == 0 ? 12 : hour24 % 12
    return mins == 0
      ? "\(hour12) \(suffix)" : "\(hour12):\(String(format: "%02d", mins)) \(suffix)"
  }

  /// "Open — closes 3 PM" / "Closed — opens Tuesday 8 AM".
  static func statusLabel(_ hours: [DayHours], day: Int, minute: Int) -> String {
    let status = statusAt(hours, day: day, minute: minute)
    guard let nextDay = status.nextChangeDay, let nextMinute = status.nextChangeMinute else {
      return "Closed"
    }
    let time = formatMinute(nextMinute)
    if status.open {
      return "Open — closes \(time)"
    }
    let dayLabel = nextDay == day ? "" : "\(dayNames[nextDay]) "
    return "Closed — opens \(dayLabel)\(time)"
  }
}
