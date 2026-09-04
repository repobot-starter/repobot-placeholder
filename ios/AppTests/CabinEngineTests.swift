import XCTest
@testable import AppIOS

/// Exercises the pure CabinBot simulation against the web `flight.ts` rules
/// it mirrors. The engine takes an injectable random source, so every test is
/// deterministic: `fixedRandom(0.5)` pins the event schedule (celebrity at
/// 25s, runner at 57.5s, grandma at 87s of cruise), spawn targets, and item
/// picks.
final class CabinEngineTests: XCTestCase {
  func testBoardingPopsPassengersThenHandsOffToCruise() {
    let engine = makeEngine()
    engine.beginBoarding()

    // First passenger boards at 300ms; nobody is seated before that.
    _ = engine.step(dt: 0.2)
    XCTAssertFalse(engine.passengers[0].boarded)
    let cues = engine.step(dt: 0.2)
    XCTAssertTrue(engine.passengers[0].boarded)
    XCTAssertTrue(cues.contains(.pop))

    // Boarding runs exactly TUNING.boardingMs, then the cruise begins with an
    // intercom announcement and a fully seated cabin.
    let handoff = engine.step(dt: CabinTuning.boardingMs / 1000)
    XCTAssertEqual(engine.phase, .cruise)
    XCTAssertTrue(engine.passengers.allSatisfy { $0.boarded })
    XCTAssertTrue(handoff.contains(.intercom))
    XCTAssertNotNil(engine.announcement)
  }

  func testPatienceDrainsAtWebRateAndIgnoredRequestFailsAtZero() {
    let engine = cruisingEngine()
    engine.setRequest(passengerId: 0, item: .drink)
    XCTAssertEqual(engine.passengers[0].request?.totalMs, CabinTuning.requestPatienceMs)

    // Patience drains in real time: after 4s of the 10s allowance, 6s remain.
    stepFor(engine, seconds: 4)
    XCTAssertEqual(engine.passengers[0].request!.remainingMs, 6000, accuracy: 1)

    // Ignore it to zero: the request fails, costs -15 happiness, counts as a
    // miss, and grumbles.
    var cues: [CabinCue] = []
    stepFor(engine, seconds: 6.05, collecting: &cues)
    XCTAssertNil(engine.passengers[0].request)
    XCTAssertEqual(engine.missed, 1)
    XCTAssertEqual(
      engine.passengers[0].happiness,
      CabinTuning.startHappiness + CabinTuning.expiredHappiness,
      accuracy: 0.001
    )
    XCTAssertEqual(engine.passengers[0].mood, .upset)
    XCTAssertTrue(cues.contains(.grumble))
  }

  func testServingTheRightItemResolvesTheRequestAndScores() {
    let engine = cruisingEngine()
    engine.setRequest(passengerId: 3, item: .pretzels)

    let result = engine.serveItem(passengerId: 3, item: .pretzels)

    XCTAssertTrue(result.correct)
    XCTAssertTrue(result.cues.contains(.serve))
    XCTAssertNil(engine.passengers[3].request)
    XCTAssertEqual(engine.served, 1)
    XCTAssertEqual(
      engine.passengers[3].happiness,
      CabinTuning.startHappiness + CabinTuning.servedHappiness,
      accuracy: 0.001
    )
    XCTAssertEqual(engine.passengers[3].mood, .happy)
  }

  func testServingTheWrongItemCostsTheWebPenaltyAndKeepsTheRequest() {
    let engine = cruisingEngine()
    engine.setRequest(passengerId: 3, item: .drink)

    let result = engine.serveItem(passengerId: 3, item: .headphones)

    XCTAssertFalse(result.correct)
    XCTAssertEqual(result.cues, [.grumble])
    XCTAssertEqual(engine.passengers[3].request?.item, .drink)
    XCTAssertEqual(engine.served, 0)
    XCTAssertEqual(
      engine.passengers[3].happiness,
      CabinTuning.startHappiness + CabinTuning.wrongItemHappiness,
      accuracy: 0.001
    )

    // A seat with no open request shrugs the tray off entirely (no penalty).
    let idle = engine.serveItem(passengerId: 5, item: .drink)
    XCTAssertFalse(idle.correct)
    XCTAssertTrue(idle.cues.isEmpty)
    XCTAssertEqual(engine.passengers[5].happiness, CabinTuning.startHappiness)
  }

  func testScriptedCelebrityFiresAtItsTriggerTime() {
    // fixedRandom(0.5): celebrity trigger = 15000 + 0.5 * 20000 = 25000ms.
    let engine = cruisingEngine()
    let triggerMs = engine.events[0].atMs
    XCTAssertEqual(triggerMs, 25000)

    // Just before the trigger: no celebrity anywhere.
    stepFor(engine, seconds: (triggerMs - 100) / 1000)
    XCTAssertFalse(engine.passengers.contains { $0.role == .celebrity })
    XCTAssertFalse(engine.events[0].fired)

    // Crossing the trigger fires the event: an intercom cue, a front-row
    // passenger in shades with a short-patience demand, and an announcement.
    var cues: [CabinCue] = []
    stepFor(engine, seconds: 0.2, collecting: &cues)
    XCTAssertTrue(cues.contains(.intercom))
    XCTAssertTrue(engine.events[0].fired)
    let celebrity = engine.passengers.first { $0.role == .celebrity }
    XCTAssertNotNil(celebrity)
    XCTAssertEqual(celebrity?.row, 0)
    XCTAssertEqual(celebrity?.face, "🕶️")
    XCTAssertEqual(celebrity?.request?.totalMs, CabinTuning.celebrityPatienceMs)
    XCTAssertEqual(engine.announcement?.contains("celebrity"), true)
  }

  func testStarThresholdsAtFlightEnd() {
    // Web land(): >=90 → 5, >=75 → 4, >=55 → 3, >=35 → 2, else 1.
    let cases: [(happiness: Double, stars: Int)] = [
      (90, 5), (89, 4), (75, 4), (74, 3), (55, 3), (54, 2), (35, 2), (34, 1), (0, 1),
    ]
    for testCase in cases {
      let engine = cruisingEngine()
      engine.setUniformHappiness(testCase.happiness)
      engine.landNow()
      XCTAssertEqual(engine.phase, .landed)
      XCTAssertEqual(
        engine.stars, testCase.stars,
        "happiness \(testCase.happiness) should land \(testCase.stars) stars"
      )
      // Landing clears every open request and stops further simulation.
      XCTAssertTrue(engine.passengers.allSatisfy { $0.request == nil })
      XCTAssertTrue(engine.step(dt: 1).isEmpty)
    }
  }

  func testRequestSpawningIsDeterministicWithInjectedRNG() {
    // fixedRandom(0.5) with a 20-seat idle cabin: spawn target is index 10
    // and the item is GALLEY pool index 2 (headphones), every time. 14 x
    // 110ms = 1540ms crosses the 1.5s initial cooldown strictly (a 15 x
    // 100ms split can float-round just short of it).
    var firstCues: [CabinCue] = []
    let first = cruisingEngine()
    for _ in 0..<14 {
      firstCues.append(contentsOf: first.step(dt: 0.11))
    }
    XCTAssertTrue(firstCues.contains(.request))
    let firstTarget = first.passengers.first { $0.request != nil }
    XCTAssertEqual(firstTarget?.id, 10)
    XCTAssertEqual(firstTarget?.request?.item, .headphones)
    XCTAssertEqual(firstTarget?.request?.totalMs, CabinTuning.requestPatienceMs)

    // A second engine with the same RNG replays the exact same spawn.
    let second = cruisingEngine()
    for _ in 0..<14 {
      _ = second.step(dt: 0.11)
    }
    let secondTarget = second.passengers.first { $0.request != nil }
    XCTAssertEqual(secondTarget?.id, firstTarget?.id)
    XCTAssertEqual(secondTarget?.request?.item, firstTarget?.request?.item)

    // The next spawn interval follows the web ramp: interval * (1 - progress
    // * (1 - endOfFlightSpawnFactor)) for the crew difficulty.
    let progress = first.elapsedMs / CabinTuning.cruiseMs
    let expected =
      CabinDifficulty.crew.spawnIntervalMs
      * (1 - progress * (1 - CabinTuning.endOfFlightSpawnFactor))
    XCTAssertEqual(first.spawnCooldownMs, expected, accuracy: 1)
  }

  // MARK: - Helpers

  /// `random() == 0.5` pins every random draw: event times land mid-window,
  /// index picks always take the middle candidate.
  private func makeEngine(difficulty: CabinDifficulty = .crew) -> CabinEngine {
    CabinEngine(difficulty: difficulty, random: { 0.5 })
  }

  /// Engine that has finished boarding and just entered the cruise.
  private func cruisingEngine() -> CabinEngine {
    let engine = makeEngine()
    engine.beginBoarding()
    _ = engine.step(dt: CabinTuning.boardingMs / 1000)
    XCTAssertEqual(engine.phase, .cruise)
    XCTAssertEqual(engine.elapsedMs, 0)
    return engine
  }

  /// Steps in 100ms slices like a frame loop, optionally collecting cues.
  private func stepFor(_ engine: CabinEngine, seconds: Double) {
    var cues: [CabinCue] = []
    stepFor(engine, seconds: seconds, collecting: &cues)
  }

  private func stepFor(_ engine: CabinEngine, seconds: Double, collecting cues: inout [CabinCue]) {
    var remaining = seconds
    while remaining > 0 {
      let slice = min(0.1, remaining)
      cues.append(contentsOf: engine.step(dt: slice))
      remaining -= slice
    }
  }
}
