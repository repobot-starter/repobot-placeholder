import Foundation

// MARK: - Static gameplay data
//
// Everything in this section mirrors `web/app/src/View/Games/Sitter/mishaps.ts`
// verbatim — rooms, tools, mishap tables, shift tuning, and scoring — so the
// native game plays identically to the web one. Keep the two files in sync.

/// The four rooms of the house, in the web's 2×2 grid order
/// (living, kitchen / bedroom, bathroom).
enum SitterRoomKey: String, CaseIterable, Equatable {
  case living
  case kitchen
  case bedroom
  case bathroom
}

/// Decorative furniture inside a room. `x`/`y` are percent offsets within the
/// room panel, exactly like the web CSS positioning.
struct SitterFurnitureItem: Equatable {
  let emoji: String
  let x: Double
  let y: Double
}

struct SitterRoom: Equatable {
  let key: SitterRoomKey
  let name: String
  let emoji: String
  let furniture: [SitterFurnitureItem]
}

/// The six tools in the tray. Each mishap is fixed by exactly one tool.
enum SitterToolKey: String, CaseIterable, Equatable {
  case mop
  case hug
  case snack
  case tidy
  case sponge
  case remote
}

struct SitterTool: Equatable {
  let key: SitterToolKey
  let emoji: String
  let label: String
}

enum SitterMishapKey: String, CaseIterable, Equatable {
  case juice
  case crying
  case hungry
  case toys
  case crayon
  case tv
}

/// A kind of mishap — the web `MishapKind` table row.
struct SitterMishapKind: Equatable {
  let key: SitterMishapKey
  let emoji: String
  let label: String
  /// The one tool that fixes it — anything else earns a buzz and a giggle.
  let tool: SitterToolKey
  /// Taps with the right tool needed to fix (toys vanish one per tap).
  let clicksToFix: Int
  /// If > 0, the fix is press-and-hold for this long (ms) instead of tapping.
  let holdMs: Double
  /// Relative spawn weight.
  let weight: Double
  /// True for mishaps about a kid — fixing them feeds the happiness score.
  let kidCare: Bool
}

/// Spawn pacing per difficulty: the interval ramps from start to end over the
/// shift. Values mirror the web `DIFFICULTIES` table.
enum SitterDifficulty: String, CaseIterable, Identifiable, Equatable {
  case chill
  case normal
  case chaos

  var id: String { rawValue }

  var label: String {
    switch self {
    case .chill: return "Chill"
    case .normal: return "Normal"
    case .chaos: return "Chaos"
    }
  }

  var spawnStartMs: Double {
    switch self {
    case .chill: return 7_000
    case .normal: return 5_500
    case .chaos: return 4_000
    }
  }

  var spawnEndMs: Double {
    switch self {
    case .chill: return 4_200
    case .normal: return 3_000
    case .chaos: return 2_000
    }
  }
}

// MARK: - Live shift state

/// A live mishap sitting in a room, waiting for the right tool.
/// The web `ActiveMishap` twin.
struct SitterMishap: Identifiable, Equatable {
  let id: Int
  let kind: SitterMishapKind
  let room: SitterRoomKey
  /// Percent offsets within the room panel.
  let x: Double
  let y: Double
  /// Shift-elapsed ms when it appeared (drives the severity ring).
  let spawnedAtMs: Double
  var clicksDone: Int
  /// Escalated past its timer: permanent unless fixed, counts double.
  var isMess: Bool
}

/// A kid wandering the house. The web `Kid` twin.
struct SitterKid: Identifiable, Equatable {
  let id: Int
  let emoji: String
  var room: SitterRoomKey
  /// Percent offsets within the room panel.
  var x: Double
  var y: Double
  /// Bumped on each move so the hop animation replays.
  var hopToken: Int
  /// Shift-elapsed ms of the next wander.
  var nextMoveAtMs: Double
}

/// The scripted bathtub overflow's lifecycle (web `OverflowState.stage`).
enum SitterOverflowStage: Equatable {
  case waiting
  case active
  case shutOff
  case flooded
}

// MARK: - Scoring

/// End-of-shift tallies handed to `scoreShift` (web `ShiftReport`).
struct SitterShiftReport: Equatable {
  let fixes: Int
  /// Hugs given + snacks served.
  let kidCare: Int
  /// Unfixed mishaps still within their timer when the parents arrive.
  let leftoverMishaps: Int
  /// Unfixed escalated messes (count double).
  let leftoverMesses: Int
  let flooded: Bool
}

/// What the parents decide (web `ShiftResult`).
struct SitterShiftResult: Equatable {
  let stars: Int
  let pay: Int
  let tidiness: Int
  let happiness: Int
}

// MARK: - Step events and tap outcomes

/// Discrete things that happened during one `step(dt:)` — the native twin of
/// the web game's status/sound side effects. The renderer can use these for
/// sounds or haptics; tests use them to assert on game flow.
enum SitterEvent: Equatable {
  case mishapSpawned(key: SitterMishapKey, room: SitterRoomKey)
  case mishapBecameMess(id: Int)
  /// A press-and-hold fix (the hug) completed during this step.
  case mishapFixed(key: SitterMishapKey)
  case overflowStarted
  case bathroomFlooded
  case shiftEnded(SitterShiftResult)
}

/// What a tool tap on a mishap did — mirrors the web
/// `handleMishapPointerDown` branches one-for-one.
enum SitterTapOutcome: Equatable {
  case noToolSelected
  case wrongTool
  /// A multi-tap fix (toys) advanced but is not done yet.
  case progressed(clicksLeft: Int)
  /// A press-and-hold fix (the hug) started; keep holding.
  case holdStarted
  case fixed
}

// MARK: - Engine

/// Pure port of the web SitterBot simulation
/// (`web/app/src/View/Games/Sitter/SitterPage.tsx` + `mishaps.ts`). No SwiftUI
/// here: the engine is a plain state machine driven by `step(dt:)` so it can
/// be unit-tested headlessly and rendered by any frontend.
///
/// The web ticks the shift at a fixed 100ms; this engine accepts any `dt`, so
/// callers may either replicate the web tick (dt = 0.1) or step per frame —
/// all timing thresholds are expressed in elapsed milliseconds either way.
///
/// Randomness (mishap kind/room/spot, kid wandering, spawn jitter) goes
/// through an injected closure so tests can make the simulation fully
/// deterministic.
final class SitterEngine {
  // Shift tuning — must stay byte-for-byte in sync with the web constants.
  static let shiftLengthMs: Double = 120_000
  /// How long a mishap wobbles before it hardens into a MESS.
  static let mishapTimerMs: Double = 12_000
  static let maxActiveMishaps = 8
  /// The first mishap of a shift arrives this soon.
  static let firstSpawnMs: Double = 2_500

  /// The scripted bathtub overflow: trigger time, taps to shut off, time
  /// before flood.
  static let overflowAtRemainingMs: Double = 60_000
  static let overflowClicks = 5
  static let overflowWindowMs: Double = 8_000

  static let kidMoveMinMs: Double = 3_000
  static let kidMoveMaxMs: Double = 6_000
  /// After a mishap escalates into a mess, kids scatter within this window.
  static let kidPanicMs: Double = 900

  /// Each replay ("Babysit again") multiplies spawn intervals by this.
  static let replaySpawnFactor: Double = 0.92
  static let minSpawnMs: Double = 1_500

  // Scoring.
  static let unfixedPenalty = 8
  /// Escalated messes count double against tidiness.
  static let messPenalty = 16
  static let floodPenalty = 25
  static let basePayPerStar = 12
  static let tipPerFix = 1
  /// UserDefaults key for the best paycheck — the same name as the web's
  /// localStorage key so the two stores are interchangeable in spirit.
  static let bestPayKey = "sitter.bestPay"

  /// Overall score (0-100) needed for each star count, checked top down.
  static let starThresholds: [(stars: Int, minScore: Double)] = [
    (stars: 5, minScore: 90),
    (stars: 4, minScore: 72),
    (stars: 3, minScore: 52),
    (stars: 2, minScore: 30),
    (stars: 1, minScore: 0),
  ]

  static let kidEmoji = ["🧒", "👧"]

  /// The four rooms with their furniture — web `ROOMS` verbatim.
  static let rooms: [SitterRoom] = [
    SitterRoom(
      key: .living, name: "Living Room", emoji: "🛋️",
      furniture: [
        SitterFurnitureItem(emoji: "🛋️", x: 22, y: 66),
        SitterFurnitureItem(emoji: "🖼️", x: 50, y: 26),
        SitterFurnitureItem(emoji: "🪴", x: 82, y: 34),
        SitterFurnitureItem(emoji: "📻", x: 78, y: 72),
      ]
    ),
    SitterRoom(
      key: .kitchen, name: "Kitchen", emoji: "🍳",
      furniture: [
        SitterFurnitureItem(emoji: "🍳", x: 24, y: 32),
        SitterFurnitureItem(emoji: "🫖", x: 74, y: 30),
        SitterFurnitureItem(emoji: "🍽️", x: 50, y: 70),
        SitterFurnitureItem(emoji: "🧁", x: 82, y: 66),
      ]
    ),
    SitterRoom(
      key: .bedroom, name: "Bedroom", emoji: "🛏️",
      furniture: [
        SitterFurnitureItem(emoji: "🛏️", x: 26, y: 64),
        SitterFurnitureItem(emoji: "🌙", x: 76, y: 26),
        SitterFurnitureItem(emoji: "📚", x: 82, y: 66),
        SitterFurnitureItem(emoji: "🧦", x: 52, y: 30),
      ]
    ),
    SitterRoom(
      key: .bathroom, name: "Bathroom", emoji: "🛁",
      furniture: [
        SitterFurnitureItem(emoji: "🛁", x: 26, y: 66),
        SitterFurnitureItem(emoji: "🚿", x: 22, y: 28),
        SitterFurnitureItem(emoji: "🪥", x: 72, y: 28),
        SitterFurnitureItem(emoji: "🧻", x: 80, y: 68),
      ]
    ),
  ]

  /// The tool tray — web `TOOLS` verbatim.
  static let tools: [SitterTool] = [
    SitterTool(key: .mop, emoji: "🧹", label: "Mop"),
    SitterTool(key: .hug, emoji: "🤗", label: "Hug"),
    SitterTool(key: .snack, emoji: "🍎", label: "Snack"),
    SitterTool(key: .tidy, emoji: "🧺", label: "Tidy"),
    SitterTool(key: .sponge, emoji: "🧽", label: "Sponge"),
    SitterTool(key: .remote, emoji: "🎮", label: "Remote"),
  ]

  /// The mishap table — web `MISHAP_KINDS` verbatim (tools, click counts,
  /// hold durations, spawn weights, kid-care flags).
  static let mishapKinds: [SitterMishapKind] = [
    SitterMishapKind(
      key: .juice, emoji: "🧃", label: "Juice spill", tool: .mop,
      clicksToFix: 1, holdMs: 0, weight: 3, kidCare: false
    ),
    SitterMishapKind(
      key: .crying, emoji: "😭", label: "Crying kid", tool: .hug,
      clicksToFix: 1, holdMs: 2_000, weight: 2, kidCare: true
    ),
    SitterMishapKind(
      key: .hungry, emoji: "🍪", label: "Hungry kid", tool: .snack,
      clicksToFix: 1, holdMs: 0, weight: 2, kidCare: true
    ),
    SitterMishapKind(
      key: .toys, emoji: "🧸", label: "Toy explosion", tool: .tidy,
      clicksToFix: 3, holdMs: 0, weight: 2, kidCare: false
    ),
    SitterMishapKind(
      key: .crayon, emoji: "🖍️", label: "Crayon on the wall", tool: .sponge,
      clicksToFix: 1, holdMs: 0, weight: 2, kidCare: false
    ),
    SitterMishapKind(
      key: .tv, emoji: "📺", label: "TV blasting", tool: .remote,
      clicksToFix: 1, holdMs: 0, weight: 2, kidCare: false
    ),
  ]

  static func kind(for key: SitterMishapKey) -> SitterMishapKind {
    mishapKinds.first { $0.key == key } ?? mishapKinds[0]
  }

  static func tool(for key: SitterToolKey) -> SitterTool {
    tools.first { $0.key == key } ?? tools[0]
  }

  static func roomName(_ key: SitterRoomKey) -> String {
    rooms.first { $0.key == key }?.name ?? key.rawValue
  }

  // MARK: Public state

  var difficulty: SitterDifficulty
  /// 1 on the first shift; "Babysit again" increments it, which speeds up
  /// spawns via `replaySpawnFactor` exactly like the web.
  private(set) var shiftNumber = 1
  private(set) var isPlaying = false
  /// The parents' verdict once the shift ends; nil while playing/idle.
  private(set) var result: SitterShiftResult?

  private(set) var elapsedMs: Double = 0
  private(set) var mishaps: [SitterMishap] = []
  private(set) var kids: [SitterKid] = []
  private(set) var fixes = 0
  private(set) var kidCare = 0
  private(set) var overflowStage: SitterOverflowStage = .waiting
  private(set) var overflowClicksDone = 0
  private(set) var holdingMishapID: Int?
  private(set) var holdHeldMs: Double = 0
  /// The web status-bar line, kept in the engine so both platforms show the
  /// exact same copy.
  private(set) var statusMessage = "READY. PICK A DIFFICULTY AND RING THE BELL."

  var remainingMs: Double { max(0, Self.shiftLengthMs - elapsedMs) }

  /// Fraction of `holdMs` completed for the currently held mishap (0...1).
  var holdProgress: Double {
    guard let id = holdingMishapID,
          let mishap = mishaps.first(where: { $0.id == id }),
          mishap.kind.holdMs > 0
    else { return 0 }
    return min(1, holdHeldMs / mishap.kind.holdMs)
  }

  private var nextSpawnAtMs: Double = SitterEngine.firstSpawnMs
  private var nextId = 1
  private var overflowStartedAtMs: Double = 0
  private let random: () -> Double

  init(
    difficulty: SitterDifficulty = .normal,
    random: @escaping () -> Double = { Double.random(in: 0..<1) }
  ) {
    self.difficulty = difficulty
    self.random = random
  }

  // MARK: Shift lifecycle

  /// Ring the doorbell: reset everything and start a fresh shift
  /// (web `makeShift` + `startShift`).
  func startShift() {
    elapsedMs = 0
    nextSpawnAtMs = Self.firstSpawnMs
    nextId = 1
    mishaps = []
    kids = makeKids()
    fixes = 0
    kidCare = 0
    overflowStage = .waiting
    overflowClicksDone = 0
    overflowStartedAtMs = 0
    holdingMishapID = nil
    holdHeldMs = 0
    result = nil
    isPlaying = true
    statusMessage = "SHIFT STARTED. KEEP AN EYE ON THE KIDS!"
  }

  /// Replay: the next shift spawns mishaps `replaySpawnFactor`× faster.
  func babysitAgain() {
    shiftNumber += 1
    startShift()
  }

  /// Advance the simulation. Mirrors the web `tickShift` step-for-step: kids
  /// wander, mishaps spawn, fresh mishaps escalate into messes (scattering
  /// the kids), holds progress, the scripted overflow fires/floods, and the
  /// shift ends when the parents arrive. Returns the discrete events that
  /// occurred so the caller can react.
  @discardableResult
  func step(dt: Double) -> [SitterEvent] {
    guard isPlaying else { return [] }
    var events: [SitterEvent] = []

    elapsedMs += dt * 1_000
    let remaining = Self.shiftLengthMs - elapsedMs

    // Kids wander between rooms on their own clocks.
    for index in kids.indices where elapsedMs >= kids[index].nextMoveAtMs {
      moveKid(at: index)
    }

    // Spawning: one attempt per step, retry in 1s when the house is full.
    if elapsedMs >= nextSpawnAtMs {
      if mishaps.count < Self.maxActiveMishaps {
        let spawned = spawnMishap()
        events.append(.mishapSpawned(key: spawned.kind.key, room: spawned.room))
      } else {
        nextSpawnAtMs = elapsedMs + 1_000
      }
    }

    // Escalation: past the timer a mishap hardens into a permanent MESS and
    // the kids scatter to new rooms within the panic window.
    for index in mishaps.indices
    where !mishaps[index].isMess && elapsedMs - mishaps[index].spawnedAtMs >= Self.mishapTimerMs {
      mishaps[index].isMess = true
      statusMessage = "\(mishaps[index].kind.emoji) TURNED INTO A MESS! THE KIDS ARE GOING WILD!"
      events.append(.mishapBecameMess(id: mishaps[index].id))
      for kidIndex in kids.indices {
        kids[kidIndex].nextMoveAtMs = min(
          kids[kidIndex].nextMoveAtMs,
          elapsedMs + random() * Self.kidPanicMs
        )
      }
    }

    // Press-and-hold fixes (the hug) progress while the finger stays down.
    if let holdingID = holdingMishapID {
      holdHeldMs += dt * 1_000
      if let index = mishaps.firstIndex(where: { $0.id == holdingID }) {
        if holdHeldMs >= mishaps[index].kind.holdMs {
          let fixedKey = fixMishap(at: index)
          events.append(.mishapFixed(key: fixedKey))
        }
      } else {
        holdingMishapID = nil
        holdHeldMs = 0
      }
    }

    // The scripted mid-shift emergency: at the 1:00 mark the tub starts
    // overflowing; ignore it for 8s and the bathroom floods.
    if overflowStage == .waiting && remaining <= Self.overflowAtRemainingMs {
      overflowStage = .active
      overflowClicksDone = 0
      overflowStartedAtMs = elapsedMs
      statusMessage = "UH OH! THE BATHTUB IS OVERFLOWING!"
      events.append(.overflowStarted)
    } else if overflowStage == .active && elapsedMs - overflowStartedAtMs >= Self.overflowWindowMs {
      overflowStage = .flooded
      statusMessage = "THE BATHROOM FLOODED! 💦"
      events.append(.bathroomFlooded)
    }

    if remaining <= 0 {
      let shiftResult = finishShift()
      events.append(.shiftEnded(shiftResult))
    }

    return events
  }

  // MARK: Player input

  /// Apply the selected tool to a mishap — the web `handleMishapPointerDown`
  /// branch-for-branch. Returns nil if the mishap no longer exists.
  @discardableResult
  func applyTool(_ toolKey: SitterToolKey?, toMishapID id: Int) -> SitterTapOutcome? {
    guard isPlaying, let index = mishaps.firstIndex(where: { $0.id == id }) else { return nil }
    guard let toolKey else {
      statusMessage = "PICK A TOOL FROM THE TRAY FIRST!"
      return .noToolSelected
    }
    let tool = Self.tool(for: toolKey)
    let kind = mishaps[index].kind
    if tool.key != kind.tool {
      statusMessage = "\(tool.emoji) WON'T FIX THAT! THE KIDS GIGGLE AT YOU."
      return .wrongTool
    }
    if kind.holdMs > 0 {
      holdingMishapID = id
      holdHeldMs = 0
      statusMessage = "HOLD THE \(tool.label.uppercased())..."
      return .holdStarted
    }
    mishaps[index].clicksDone += 1
    if mishaps[index].clicksDone >= kind.clicksToFix {
      _ = fixMishap(at: index)
      return .fixed
    }
    let clicksLeft = kind.clicksToFix - mishaps[index].clicksDone
    statusMessage = "\(kind.emoji) \(clicksLeft) MORE TO TIDY..."
    return .progressed(clicksLeft: clicksLeft)
  }

  /// Lifting the finger anywhere cancels an in-progress hug (web pointerup).
  func releaseHold() {
    holdingMishapID = nil
    holdHeldMs = 0
  }

  /// One tap on the overflowing tub. Returns true when this tap shut it off.
  @discardableResult
  func tapOverflow() -> Bool {
    guard isPlaying, overflowStage == .active else { return false }
    overflowClicksDone += 1
    if overflowClicksDone >= Self.overflowClicks {
      overflowStage = .shutOff
      fixes += 1
      statusMessage = "TUB SHUT OFF! CRISIS AVERTED."
      return true
    }
    statusMessage = "SHUT OFF THE TAP! \(Self.overflowClicks - overflowClicksDone) MORE!"
    return false
  }

  // MARK: Pure scoring/spawn math (web `mishaps.ts` functions)

  /// Current gap between spawns: ramps down over the shift, faster on
  /// replays. Mirrors the web `spawnIntervalMs`.
  static func spawnIntervalMs(
    elapsedMs: Double,
    difficulty: SitterDifficulty,
    shiftNumber: Int
  ) -> Double {
    let progress = min(1, max(0, elapsedMs / shiftLengthMs))
    let base = difficulty.spawnStartMs + (difficulty.spawnEndMs - difficulty.spawnStartMs) * progress
    let replaySpeedup = pow(replaySpawnFactor, Double(shiftNumber - 1))
    return max(minSpawnMs, base * replaySpeedup)
  }

  /// End-of-shift rating: tidiness loses 8 per leftover mishap, 16 per mess,
  /// 25 for a flood; happiness starts at 40 and gains 15 per kid-care fix
  /// and 3 per fix; overall = 60% tidiness + 40% happiness → stars → pay.
  /// Mirrors the web `scoreShift` exactly.
  static func scoreShift(_ report: SitterShiftReport) -> SitterShiftResult {
    let tidiness = clamp(
      100
        - Double(report.leftoverMishaps * unfixedPenalty)
        - Double(report.leftoverMesses * messPenalty)
        - (report.flooded ? Double(floodPenalty) : 0),
      min: 0, max: 100
    )
    let happiness = clamp(
      40 + Double(report.kidCare * 15) + Double(report.fixes * 3),
      min: 0, max: 100
    )
    let overall = tidiness * 0.6 + happiness * 0.4
    let stars = starThresholds.first { overall >= $0.minScore }?.stars ?? 1
    let pay = stars * basePayPerStar + report.fixes * tipPerFix
    return SitterShiftResult(
      stars: stars,
      pay: pay,
      tidiness: Int(tidiness.rounded()),
      happiness: Int(happiness.rounded())
    )
  }

  // MARK: Test hooks

  /// Test hook: drop a specific mishap into a specific room, bypassing the
  /// weighted spawn roll (like Pong's `setBall`). Returns the new mishap id.
  @discardableResult
  func forceSpawn(_ key: SitterMishapKey, in room: SitterRoomKey) -> Int {
    let spot = randomSpot()
    let mishap = SitterMishap(
      id: nextId, kind: Self.kind(for: key), room: room,
      x: spot.x, y: spot.y, spawnedAtMs: elapsedMs, clicksDone: 0, isMess: false
    )
    mishaps.append(mishap)
    nextId += 1
    return mishap.id
  }

  // MARK: Private helpers

  private func finishShift() -> SitterShiftResult {
    let leftoverMesses = mishaps.filter(\.isMess).count
    let shiftResult = Self.scoreShift(
      SitterShiftReport(
        fixes: fixes,
        kidCare: kidCare,
        leftoverMishaps: mishaps.count - leftoverMesses,
        leftoverMesses: leftoverMesses,
        flooded: overflowStage == .flooded
      )
    )
    result = shiftResult
    isPlaying = false
    statusMessage = "SHIFT OVER. THE PARENTS ARE HOME."
    return shiftResult
  }

  private func makeKids() -> [SitterKid] {
    Self.kidEmoji.enumerated().map { index, emoji in
      let spot = randomSpot()
      return SitterKid(
        id: index, emoji: emoji, room: pickRoom(),
        x: spot.x, y: spot.y, hopToken: 0,
        nextMoveAtMs: 1_500 + random() * 2_500
      )
    }
  }

  /// Hop the kid to a random *different* room (web `moveKid`).
  private func moveKid(at index: Int) {
    let otherRooms = Self.rooms.filter { $0.key != kids[index].room }
    kids[index].room = otherRooms[Int(random() * Double(otherRooms.count))].key
    let spot = randomSpot()
    kids[index].x = spot.x
    kids[index].y = spot.y
    kids[index].hopToken += 1
    kids[index].nextMoveAtMs = elapsedMs + kidMoveDelayMs()
  }

  private func spawnMishap() -> SitterMishap {
    let kind = pickMishapKind()
    let room = pickRoom()
    let spot = randomSpot()
    let mishap = SitterMishap(
      id: nextId, kind: kind, room: room,
      x: spot.x, y: spot.y, spawnedAtMs: elapsedMs, clicksDone: 0, isMess: false
    )
    mishaps.append(mishap)
    nextId += 1
    statusMessage = "\(kind.emoji) \(kind.label.uppercased()) IN THE \(Self.roomName(room).uppercased())!"
    let jitter = 0.75 + random() * 0.5
    nextSpawnAtMs = elapsedMs
      + Self.spawnIntervalMs(elapsedMs: elapsedMs, difficulty: difficulty, shiftNumber: shiftNumber)
      * jitter
    return mishap
  }

  /// Remove a fixed mishap, credit the fix (and kid care), clear any hold.
  private func fixMishap(at index: Int) -> SitterMishapKey {
    let mishap = mishaps[index]
    mishaps.remove(at: index)
    fixes += 1
    if mishap.kind.kidCare {
      kidCare += 1
    }
    if holdingMishapID == mishap.id {
      holdingMishapID = nil
      holdHeldMs = 0
    }
    statusMessage = "\(mishap.kind.emoji) FIXED! NICE SAVE."
    return mishap.kind.key
  }

  /// Weighted random mishap kind (web `pickMishapKind`).
  private func pickMishapKind() -> SitterMishapKind {
    let totalWeight = Self.mishapKinds.reduce(0) { $0 + $1.weight }
    var roll = random() * totalWeight
    for kind in Self.mishapKinds {
      roll -= kind.weight
      if roll <= 0 {
        return kind
      }
    }
    return Self.mishapKinds[0]
  }

  private func pickRoom() -> SitterRoomKey {
    Self.rooms[Int(random() * Double(Self.rooms.count))].key
  }

  /// A random spot inside a room panel, below the label and away from the
  /// edges (web `randomSpot`).
  private func randomSpot() -> (x: Double, y: Double) {
    (x: 12 + random() * 70, y: 34 + random() * 44)
  }

  private func kidMoveDelayMs() -> Double {
    Self.kidMoveMinMs + random() * (Self.kidMoveMaxMs - Self.kidMoveMinMs)
  }

  private static func clamp(_ value: Double, min minValue: Double, max maxValue: Double) -> Double {
    Swift.max(minValue, Swift.min(maxValue, value))
  }
}
