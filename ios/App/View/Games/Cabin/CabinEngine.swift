import Foundation

/// Difficulty levels. `spawnIntervalMs` mirrors the web `TUNING.spawnIntervalMs`
/// table exactly so the request pressure ramps identically on both platforms.
enum CabinDifficulty: String, CaseIterable, Identifiable {
  case trainee
  case crew
  case captain

  var id: String { rawValue }

  /// Ms between request spawns at the start of the cruise.
  var spawnIntervalMs: Double {
    switch self {
    case .trainee: return 5200
    case .crew: return 3800
    case .captain: return 2600
    }
  }
}

/// Flight arc phases — same four states as the web `FlightPhase`.
enum CabinPhase: Equatable {
  case idle
  case boarding
  case cruise
  case landed
}

/// The five galley items, in the web `GALLEY_ITEMS` display order. Emoji and
/// labels are the web values verbatim so the tray reads the same everywhere.
enum CabinItem: String, CaseIterable, Identifiable {
  case pretzels
  case drink
  case headphones
  case blanket
  case airsick

  var id: String { rawValue }

  var emoji: String {
    switch self {
    case .pretzels: return "🥨"
    case .drink: return "🥤"
    case .headphones: return "🎧"
    case .blanket: return "🧣"
    case .airsick: return "🤢"
    }
  }

  var label: String {
    switch self {
    case .pretzels: return "Pretzels"
    case .drink: return "Drink"
    case .headphones: return "Headphones"
    case .blanket: return "Blanket"
    case .airsick: return "Airsick Bag"
    }
  }
}

/// Special passenger roles (`SpecialRole` on the web).
enum CabinRole: Equatable {
  case none
  case celebrity
  case runner
  case grandma
}

/// Brief face override after a serve/grumble.
enum CabinMood: Equatable {
  case happy
  case upset
}

/// Discrete things that happened during one `step(dt:)` — the native twin of
/// the web `SoundCue` return channel. The renderer can use these for sounds
/// or haptics; tests use them to assert on game flow.
enum CabinCue: Equatable {
  case pop
  case request
  case serve
  case grumble
  case intercom
  case sparkle
  case landing
}

/// The three scripted mid-flight events (`ScheduledEvent` on the web).
enum CabinEventKind: Equatable {
  case celebrity
  case runner
  case grandma
}

/// One scheduled event with its randomized trigger time within the cruise.
struct CabinScheduledEvent {
  let kind: CabinEventKind
  let atMs: Double
  var fired: Bool
}

/// An open request over a seat, draining from `totalMs` toward failure.
struct CabinRequest: Equatable {
  var item: CabinItem
  var remainingMs: Double
  var totalMs: Double
}

/// Result of holding an item up to a seat (`ServeResult` on the web).
struct CabinServeResult {
  let correct: Bool
  let cues: [CabinCue]
}

/// Every gameplay number in one place — must stay byte-for-byte in sync with
/// the web `TUNING` object in `web/app/src/View/Games/Cabin/flight.ts`.
enum CabinTuning {
  static let boardingMs: Double = 5000
  static let cruiseMs: Double = 120000
  static let cruiseAltitudeFt: Double = 35000
  /// Ms spent climbing to (and descending from) cruise altitude, inside cruiseMs.
  static let climbMs: Double = 20000
  static let startHappiness: Double = 70
  static let requestPatienceMs: Double = 10000
  static let servedHappiness: Double = 12
  static let expiredHappiness: Double = -15
  static let wrongItemHappiness: Double = -8
  /// Spawn interval multiplier by the end of the cruise (lower = more hectic finale).
  static let endOfFlightSpawnFactor: Double = 0.45
  /// How long an intercom announcement and a mood face stay on screen.
  static let announcementMs: Double = 4500
  static let moodMs: Double = 900
  static let celebrityPatienceMs: Double = 6000
  static let celebrityHappinessBonus: Double = 30
  static let celebrityHappinessPenalty: Double = -25
  static let celebrityFlashMs: Double = 900
  static let runnerGrabsToCalm = 3
  static let runnerHopIntervalMs: Double = 1300
  static let runnerNearbyDrainPerSec: Double = 2.5
  static let grandmaChatMs: Double = 3000
  static let grandmaPatienceMs: Double = 20000
  static let grandmaHappinessBonus: Double = 24
  static let grandmaCookieBoost: Double = 10
  static let grandmaGlowMs: Double = 1600
}

/// One seated passenger. Reference-typed (like the web's mutable objects) so
/// the tick functions can update roster members in place.
final class CabinPassenger {
  let id: Int
  let row: Int
  let seat: Int
  var face: String
  var happiness = CabinTuning.startHappiness
  let boardAtMs: Double
  var boarded = false
  var request: CabinRequest?
  var role = CabinRole.none
  /// Celebrity/grandma: how many of their special demands are complete.
  var demandsServed = 0
  /// Runner: true while dashing around the aisle instead of sitting.
  var running = false
  var grabCount = 0
  /// Runner: aisle position as a fraction of cabin depth (0 = front row).
  var aislePos: Double = 0
  var hopCooldownMs: Double = 0
  /// Grandma: still owes the player a click-and-hold chat.
  var needsChat = false
  var chatting = false
  var chatMs: Double = 0
  /// Brief face override after a serve/grumble.
  var mood: CabinMood?
  var moodMs: Double = 0

  init(id: Int, row: Int, seat: Int, face: String, boardAtMs: Double) {
    self.id = id
    self.row = row
    self.seat = seat
    self.face = face
    self.boardAtMs = boardAtMs
  }
}

/// Pure port of the web CabinBot simulation
/// (`web/app/src/View/Games/Cabin/flight.ts`). No SwiftUI here: the engine is
/// a plain state machine driven by `step(dt:)` so it can be unit-tested
/// headlessly and rendered by any frontend.
///
/// All durations are tracked in milliseconds internally (the web's unit, so
/// every `TUNING` number ports verbatim); `step(dt:)` takes seconds to match
/// the frame-loop convention of the other native engines.
///
/// Randomness (face shuffle, event trigger times, request spawning, runner
/// hops, special-passenger picks) goes through an injected closure so tests
/// can make the simulation fully deterministic.
final class CabinEngine {
  static let rows = 5
  static let seatsPerRow = 4

  /// One face per seat; shuffled every flight so the cabin always looks fresh.
  private static let faces = [
    "🧑", "👵", "🧒", "👨‍🦱", "👩‍🎤", "👨‍💼", "👩‍🦰", "🧔", "👱‍♀️", "👴",
    "👦", "👩‍🦱", "🧕", "👨‍🎨", "👧", "🧓", "👨‍🦰", "👩", "🙎‍♂️", "👩‍💼",
  ]

  private(set) var phase = CabinPhase.idle
  private(set) var difficulty: CabinDifficulty
  /// Elapsed ms within the current phase.
  private(set) var elapsedMs: Double = 0
  private(set) var passengers: [CabinPassenger] = []
  private(set) var events: [CabinScheduledEvent] = []
  private(set) var spawnCooldownMs: Double = 1500
  private(set) var served = 0
  private(set) var missed = 0
  private(set) var announcement: String?
  private(set) var announcementMs: Double = 0
  /// Countdown overlays: paparazzi camera flash and grandma's cookie glow.
  private(set) var paparazziMs: Double = 0
  private(set) var cookieGlowMs: Double = 0
  /// Final 1-5 rating, computed on landing.
  private(set) var stars = 0

  private let random: () -> Double

  init(
    difficulty: CabinDifficulty = .crew,
    random: @escaping () -> Double = { Double.random(in: 0..<1) }
  ) {
    self.difficulty = difficulty
    self.random = random
    newFlight(difficulty: difficulty)
  }

  /// Fresh flight in the idle phase with a full, shuffled roster — the web
  /// `createFlight`. The three special events get their randomized trigger
  /// times here (celebrity 15-35s, runner 45-70s, grandma 78-96s of cruise).
  func newFlight(difficulty: CabinDifficulty) {
    self.difficulty = difficulty
    phase = .idle
    elapsedMs = 0
    spawnCooldownMs = 1500
    served = 0
    missed = 0
    announcement = nil
    announcementMs = 0
    paparazziMs = 0
    cookieGlowMs = 0
    stars = 0

    // Fisher–Yates through the injected RNG (the web leans on an unstable
    // sort comparator; the intent — a fresh random cabin — is identical).
    var faces = Self.faces
    for index in stride(from: faces.count - 1, to: 0, by: -1) {
      faces.swapAt(index, randomIndex(count: index + 1))
    }

    let seatCount = Self.rows * Self.seatsPerRow
    passengers = (0..<seatCount).map { id in
      CabinPassenger(
        id: id,
        row: id / Self.seatsPerRow,
        seat: id % Self.seatsPerRow,
        face: faces[id],
        boardAtMs: 300 + (Double(id) / Double(seatCount)) * (CabinTuning.boardingMs - 800)
      )
    }
    events = [
      CabinScheduledEvent(kind: .celebrity, atMs: 15000 + random() * 20000, fired: false),
      CabinScheduledEvent(kind: .runner, atMs: 45000 + random() * 25000, fired: false),
      CabinScheduledEvent(kind: .grandma, atMs: 78000 + random() * 18000, fired: false),
    ]
  }

  /// Push back from the gate: starts the boarding phase.
  func beginBoarding() {
    phase = .boarding
    elapsedMs = 0
  }

  /// Average happiness of everyone on board, 0-100 (rounded like the web).
  var cabinHappiness: Int {
    let boarded = passengers.filter { $0.boarded }
    guard !boarded.isEmpty else { return Int(CabinTuning.startHappiness) }
    let total = boarded.reduce(0.0) { $0 + $1.happiness }
    return Int((total / Double(boarded.count)).rounded())
  }

  /// Current altitude for the status-bar ticker (climb, cruise, descend).
  var altitudeFt: Int {
    guard phase == .cruise else { return 0 }
    if elapsedMs < CabinTuning.climbMs {
      return Int((CabinTuning.cruiseAltitudeFt * (elapsedMs / CabinTuning.climbMs)).rounded())
    }
    if elapsedMs > CabinTuning.cruiseMs - CabinTuning.climbMs {
      let remaining = max(0, CabinTuning.cruiseMs - elapsedMs)
      return Int((CabinTuning.cruiseAltitudeFt * (remaining / CabinTuning.climbMs)).rounded())
    }
    return Int(CabinTuning.cruiseAltitudeFt)
  }

  /// Overall 🛫→🛬 progress across boarding + cruise, 0-1.
  var flightProgress: Double {
    let total = CabinTuning.boardingMs + CabinTuning.cruiseMs
    switch phase {
    case .idle: return 0
    case .landed: return 1
    case .boarding: return min(1, elapsedMs / total)
    case .cruise: return min(1, (CabinTuning.boardingMs + elapsedMs) / total)
    }
  }

  /// Seat label like "3B" for a row/seat index pair.
  static func seatLabel(row: Int, seat: Int) -> String {
    "\(row + 1)\(["A", "B", "C", "D"][seat])"
  }

  /// Advance the simulation by `dt` seconds. Mirrors the web `tickFlight`
  /// tick-for-tick (boarding pops, spawn ramp, patience drain, scripted
  /// events, runner chaos, grandma chat, landing) and returns the sound cues
  /// that fired so the caller can react.
  func step(dt: Double) -> [CabinCue] {
    var cues: [CabinCue] = []
    guard phase != .idle && phase != .landed else { return cues }
    let dtMs = dt * 1000
    elapsedMs += dtMs
    tickTimers(dtMs: dtMs)

    if phase == .boarding {
      for passenger in passengers where !passenger.boarded && elapsedMs >= passenger.boardAtMs {
        passenger.boarded = true
        cues.append(.pop)
      }
      if elapsedMs >= CabinTuning.boardingMs {
        passengers.forEach { $0.boarded = true }
        phase = .cruise
        elapsedMs = 0
        announce("📢 Doors closed, climbing to cruise. Snack service begins!")
        cues.append(.intercom)
      }
      return cues
    }

    tickSpawns(dtMs: dtMs, cues: &cues)
    tickRequests(dtMs: dtMs, cues: &cues)
    tickEvents(cues: &cues)
    tickRunner(dtMs: dtMs)
    tickChat(dtMs: dtMs, cues: &cues)

    if elapsedMs >= CabinTuning.cruiseMs {
      land()
      cues.append(.landing)
    }
    return cues
  }

  /// Hold pretzels/a drink/etc. up to a seat. Correct item: +12 happiness and
  /// a score; wrong item: -8 happiness and a grumble — the web `serveItem`.
  func serveItem(passengerId: Int, item: CabinItem) -> CabinServeResult {
    guard phase == .cruise,
          let passenger = passengers.first(where: { $0.id == passengerId }),
          passenger.boarded, !passenger.running,
          let request = passenger.request
    else {
      return CabinServeResult(correct: false, cues: [])
    }
    guard request.item == item else {
      adjustHappiness(passenger, CabinTuning.wrongItemHappiness)
      setMood(passenger, .upset)
      return CabinServeResult(correct: false, cues: [.grumble])
    }

    passenger.request = nil
    served += 1
    adjustHappiness(passenger, CabinTuning.servedHappiness)
    setMood(passenger, .happy)
    var cues: [CabinCue] = [.serve]

    if passenger.role == .celebrity {
      passenger.demandsServed += 1
      if passenger.demandsServed >= 2 {
        adjustHappiness(passenger, CabinTuning.celebrityHappinessBonus)
        passenger.role = .none
        announce("📢 Autograph secured! The celebrity adores this airline ⭐")
        cues.append(.sparkle)
      } else {
        passenger.request = CabinRequest(
          item: randomItem(excluding: item),
          remainingMs: CabinTuning.celebrityPatienceMs,
          totalMs: CabinTuning.celebrityPatienceMs
        )
        cues.append(.request)
      }
    } else if passenger.role == .grandma {
      passenger.demandsServed = 1
      if !passenger.needsChat {
        completeGrandma(passenger, cues: &cues)
      }
    }
    return CabinServeResult(correct: true, cues: cues)
  }

  /// One grab attempt at the runner; three grabs calms them back into their seat.
  func grabRunner(passengerId: Int) -> [CabinCue] {
    guard phase == .cruise,
          let passenger = passengers.first(where: { $0.id == passengerId }),
          passenger.running
    else { return [] }
    passenger.grabCount += 1
    if passenger.grabCount >= CabinTuning.runnerGrabsToCalm {
      passenger.running = false
      passenger.role = .none
      setMood(passenger, .happy)
      announce("📢 Runner calmed and buckled back in. Nice save, crew!")
      return [.serve, .sparkle]
    }
    return [.pop]
  }

  /// Begin the press-and-hold chat with grandma (released via `stopChatting`).
  func startChat(passengerId: Int) {
    guard phase == .cruise,
          let passenger = passengers.first(where: { $0.id == passengerId }),
          passenger.role == .grandma, passenger.needsChat
    else { return }
    passenger.chatting = true
  }

  /// Release every held chat (call on touch-up anywhere).
  func stopChatting() {
    passengers.forEach { $0.chatting = false }
  }

  // MARK: - Test hooks

  /// Test hook: plant a request directly to set up serve/expiry scenarios.
  func setRequest(
    passengerId: Int,
    item: CabinItem,
    patienceMs: Double = CabinTuning.requestPatienceMs
  ) {
    passengers.first(where: { $0.id == passengerId })?.request = CabinRequest(
      item: item, remainingMs: patienceMs, totalMs: patienceMs
    )
  }

  /// Test hook: pin every passenger's happiness for star-threshold assertions.
  func setUniformHappiness(_ value: Double) {
    passengers.forEach { $0.happiness = value }
  }

  /// Test hook: land immediately so star math can be asserted in isolation.
  func landNow() {
    land()
  }

  // MARK: - Ticks

  private func tickTimers(dtMs: Double) {
    if announcement != nil {
      announcementMs -= dtMs
      if announcementMs <= 0 {
        announcement = nil
      }
    }
    paparazziMs = max(0, paparazziMs - dtMs)
    cookieGlowMs = max(0, cookieGlowMs - dtMs)
    for passenger in passengers where passenger.mood != nil {
      passenger.moodMs -= dtMs
      if passenger.moodMs <= 0 {
        passenger.mood = nil
      }
    }
  }

  private func tickSpawns(dtMs: Double, cues: inout [CabinCue]) {
    spawnCooldownMs -= dtMs
    guard spawnCooldownMs <= 0 else { return }
    let idle = passengers.filter {
      $0.boarded && !$0.running && $0.role == .none && $0.request == nil
    }
    if !idle.isEmpty {
      let passenger = idle[randomIndex(count: idle.count)]
      passenger.request = CabinRequest(
        item: randomItem(excluding: nil),
        remainingMs: CabinTuning.requestPatienceMs,
        totalMs: CabinTuning.requestPatienceMs
      )
      cues.append(.request)
    }
    // Spawn interval shrinks linearly through the flight so the finale is hectic.
    let progress = min(1, elapsedMs / CabinTuning.cruiseMs)
    let factor = 1 - progress * (1 - CabinTuning.endOfFlightSpawnFactor)
    spawnCooldownMs = difficulty.spawnIntervalMs * factor
  }

  private func tickRequests(dtMs: Double, cues: inout [CabinCue]) {
    for passenger in passengers {
      guard passenger.request != nil else { continue }
      passenger.request!.remainingMs -= dtMs
      guard passenger.request!.remainingMs <= 0 else { continue }
      passenger.request = nil
      missed += 1
      adjustHappiness(passenger, CabinTuning.expiredHappiness)
      setMood(passenger, .upset)
      cues.append(.grumble)
      if passenger.role == .celebrity {
        adjustHappiness(passenger, CabinTuning.celebrityHappinessPenalty)
        passenger.role = .none
        paparazziMs = CabinTuning.celebrityFlashMs
        announce("📢 The celebrity is fuming — paparazzi caught everything! 📸")
      } else if passenger.role == .grandma {
        passenger.role = .none
        passenger.needsChat = false
        passenger.chatting = false
        announce("📢 Grandma dozed off without her blanket... the cookies stay in her bag.")
      }
    }
  }

  private func tickEvents(cues: inout [CabinCue]) {
    for index in events.indices {
      guard !events[index].fired, elapsedMs >= events[index].atMs else { continue }
      events[index].fired = true
      cues.append(.intercom)
      switch events[index].kind {
      case .celebrity: fireCelebrity()
      case .runner: fireRunner()
      case .grandma: fireGrandma()
      }
    }
  }

  private func tickRunner(dtMs: Double) {
    guard let runner = passengers.first(where: { $0.running }) else { return }
    runner.hopCooldownMs -= dtMs
    if runner.hopCooldownMs <= 0 {
      runner.aislePos = random()
      runner.hopCooldownMs = CabinTuning.runnerHopIntervalMs
    }
    // Passengers within a row of the runner get rattled while the chaos lasts.
    let runnerRow = runner.aislePos * Double(Self.rows - 1)
    let drain = CabinTuning.runnerNearbyDrainPerSec * dtMs / 1000
    for passenger in passengers
    where passenger.id != runner.id && passenger.boarded
      && abs(Double(passenger.row) - runnerRow) <= 1 {
      adjustHappiness(passenger, -drain)
    }
  }

  private func tickChat(dtMs: Double, cues: inout [CabinCue]) {
    for passenger in passengers
    where passenger.role == .grandma && passenger.needsChat && passenger.chatting {
      passenger.chatMs += dtMs
      guard passenger.chatMs >= CabinTuning.grandmaChatMs else { continue }
      passenger.needsChat = false
      passenger.chatting = false
      setMood(passenger, .happy)
      cues.append(.serve)
      if passenger.demandsServed >= 1 {
        completeGrandma(passenger, cues: &cues)
      }
    }
  }

  // MARK: - Scripted events

  private func fireCelebrity() {
    let candidates = passengers.filter { $0.row == 0 && $0.role == .none && !$0.running }
    let passenger = candidates.isEmpty
      ? passengers[0]
      : candidates[randomIndex(count: candidates.count)]
    passenger.role = .celebrity
    passenger.face = "🕶️"
    passenger.demandsServed = 0
    passenger.request = CabinRequest(
      item: randomItem(excluding: nil),
      remainingMs: CabinTuning.celebrityPatienceMs,
      totalMs: CabinTuning.celebrityPatienceMs
    )
    announce(
      "📢 A celebrity just boarded seat \(Self.seatLabel(row: passenger.row, seat: passenger.seat))! ⭐"
    )
  }

  private func fireRunner() {
    let candidates = passengers.filter { $0.boarded && $0.role == .none && $0.request == nil }
    let passenger = candidates.isEmpty
      ? passengers[0]
      : candidates[randomIndex(count: candidates.count)]
    passenger.role = .runner
    passenger.running = true
    passenger.grabCount = 0
    passenger.request = nil
    passenger.aislePos = random()
    passenger.hopCooldownMs = CabinTuning.runnerHopIntervalMs
    announce("📢 Passenger on the loose in the aisle! Click them 3 times to calm them 🏃")
  }

  private func fireGrandma() {
    let candidates = passengers.filter { $0.boarded && $0.role == .none && !$0.running }
    let passenger = candidates.isEmpty
      ? passengers[0]
      : candidates[randomIndex(count: candidates.count)]
    passenger.role = .grandma
    passenger.face = "👵"
    passenger.demandsServed = 0
    passenger.needsChat = true
    passenger.chatMs = 0
    passenger.request = CabinRequest(
      item: .blanket,
      remainingMs: CabinTuning.grandmaPatienceMs,
      totalMs: CabinTuning.grandmaPatienceMs
    )
    announce(
      "📢 Sweet grandma in \(Self.seatLabel(row: passenger.row, seat: passenger.seat)) needs a blanket and a chat 👵"
    )
  }

  private func completeGrandma(_ passenger: CabinPassenger, cues: inout [CabinCue]) {
    passenger.role = .none
    adjustHappiness(passenger, CabinTuning.grandmaHappinessBonus)
    // Cookies for the whole cabin — the web boosts every passenger, grandma included.
    passengers.forEach { adjustHappiness($0, CabinTuning.grandmaCookieBoost) }
    cookieGlowMs = CabinTuning.grandmaGlowMs
    announce("📢 Grandma is delighted — cookies for the whole cabin! 🍪")
    cues.append(.sparkle)
  }

  // MARK: - Helpers

  private func land() {
    phase = .landed
    let happiness = cabinHappiness
    stars = happiness >= 90 ? 5 : happiness >= 75 ? 4 : happiness >= 55 ? 3 : happiness >= 35 ? 2 : 1
    announcement = nil
    for passenger in passengers {
      passenger.running = false
      passenger.chatting = false
      passenger.request = nil
    }
  }

  private func announce(_ message: String) {
    announcement = message
    announcementMs = CabinTuning.announcementMs
  }

  /// Random galley item, optionally excluding one kind (celebrity follow-ups
  /// never repeat the item just served) — the web `randomItem`.
  private func randomItem(excluding exclude: CabinItem?) -> CabinItem {
    let pool = CabinItem.allCases.filter { $0 != exclude }
    return pool[randomIndex(count: pool.count)]
  }

  private func randomIndex(count: Int) -> Int {
    min(count - 1, Int(random() * Double(count)))
  }

  private func adjustHappiness(_ passenger: CabinPassenger, _ delta: Double) {
    passenger.happiness = max(0, min(100, passenger.happiness + delta))
  }

  private func setMood(_ passenger: CabinPassenger, _ mood: CabinMood) {
    passenger.mood = mood
    passenger.moodMs = CabinTuning.moodMs
  }
}
