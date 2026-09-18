import Foundation

/// The pastry-machine pack's engine: pure freshness logic, mirrored from
/// the web pack's freshness.ts (and SugarFreshness.kt on Android) so a
/// machine's status badge agrees on every platform.
enum SugarFreshness {
  struct MachineSchedule {
    /// Days the machine is stocked; 0 = Sunday … 6 = Saturday.
    let stockedDays: Set<Int>
    /// Minutes since midnight when the case is restocked.
    let restockMinute: Int
    /// Minutes since midnight when the case typically sells out.
    let selloutMinute: Int
  }

  /// How long before typical sellout the "selling fast" nudge appears.
  static let sellingFastWindow = 90

  enum StatusKind {
    case closed, upcoming, fresh, sellingFast, soldOut
  }

  struct CaseStatus: Equatable {
    let kind: StatusKind
    let label: String
  }

  private static let dayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ]

  /// "7:00 AM" from minutes since midnight.
  static func formatMinute(_ minute: Int) -> String {
    let hour24 = (minute / 60) % 24
    let minutes = minute % 60
    let suffix = hour24 < 12 ? "AM" : "PM"
    let hour12 = hour24 % 12 == 0 ? 12 : hour24 % 12
    return String(format: "%d:%02d %@", hour12, minutes, suffix)
  }

  /// "tomorrow" or the day name of the next stocked day after `day`.
  static func nextRestockDayLabel(_ schedule: MachineSchedule, day: Int) -> String {
    for ahead in 1...7 where schedule.stockedDays.contains((day + ahead) % 7) {
      return ahead == 1 ? "tomorrow" : dayNames[(day + ahead) % 7]
    }
    return "soon"
  }

  /// The status badge for a machine at the given local day and minute.
  static func statusAt(_ schedule: MachineSchedule, day: Int, minute: Int) -> CaseStatus {
    let restock = formatMinute(schedule.restockMinute)
    if !schedule.stockedDays.contains(day) {
      return CaseStatus(
        kind: .closed,
        label: "Back \(nextRestockDayLabel(schedule, day: day)) at \(restock)")
    }
    if minute < schedule.restockMinute {
      return CaseStatus(kind: .upcoming, label: "Restocking at \(restock)")
    }
    if minute >= schedule.selloutMinute {
      return CaseStatus(
        kind: .soldOut,
        label: "Sold out — back \(nextRestockDayLabel(schedule, day: day)) at \(restock)")
    }
    if minute >= schedule.selloutMinute - sellingFastWindow {
      return CaseStatus(kind: .sellingFast, label: "Selling fast — almost gone")
    }
    return CaseStatus(kind: .fresh, label: "Stocked fresh at \(restock)")
  }

  /// Which daily case a machine shows: the lineup rotates through the list
  /// one day at a time.
  static func lineupIndexForDay(_ epochDay: Int, lineupCount: Int) -> Int {
    guard lineupCount > 0 else { return 0 }
    return ((epochDay % lineupCount) + lineupCount) % lineupCount
  }

  /// Days since the Unix epoch in local time — drives the lineup rotation.
  static func epochDay(_ date: Date) -> Int {
    let offset = TimeZone.current.secondsFromGMT(for: date)
    return Int(floor((date.timeIntervalSince1970 + Double(offset)) / 86_400))
  }

  /// "$4.50" / "$4" — trims trailing zero cents.
  static func formatPrice(_ priceCents: Int) -> String {
    let dollars = priceCents / 100
    let cents = priceCents % 100
    return cents == 0 ? "$\(dollars)" : String(format: "$%d.%02d", dollars, cents)
  }
}
