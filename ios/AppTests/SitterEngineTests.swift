import XCTest
@testable import AppIOS

/// Exercises the pure SitterBot simulation against the web `mishaps.ts` +
/// `SitterPage.tsx` rules it mirrors: escalation timing, tool matching,
/// multi-tap and hold fixes, the scripted bathtub overflow, end-of-shift
/// scoring, and deterministic spawns through the injected random source.
final class SitterEngineTests: XCTestCase {
  /// The web tick: 100ms.
  private let tick = 0.1

  private func makeEngine(
    difficulty: SitterDifficulty = .normal,
    random: @escaping () -> Double = { 0.5 }
  ) -> SitterEngine {
    let engine = SitterEngine(difficulty: difficulty, random: random)
    engine.startShift()
    return engine
  }

  /// Steps in web-sized ticks until `elapsedMs` reaches at least `targetMs`.
  private func advance(_ engine: SitterEngine, toMs targetMs: Double) -> [SitterEvent] {
    var events: [SitterEvent] = []
    while engine.elapsedMs < targetMs && engine.isPlaying {
      events.append(contentsOf: engine.step(dt: tick))
    }
    return events
  }

  // MARK: Escalation

  func testMishapEscalatesIntoMessAtTwelveSecondsAndPanicsTheKids() {
    let engine = makeEngine()
    let id = engine.forceSpawn(.juice, in: .living)

    // Just inside the 12s timer: still fresh.
    _ = advance(engine, toMs: SitterEngine.mishapTimerMs - 200)
    XCTAssertFalse(engine.mishaps.first { $0.id == id }!.isMess)

    // Crossing the timer: hardens into a MESS, exactly like the web.
    let events = advance(engine, toMs: SitterEngine.mishapTimerMs + 200)
    XCTAssertTrue(events.contains(.mishapBecameMess(id: id)))
    XCTAssertTrue(engine.mishaps.first { $0.id == id }!.isMess)

    // Messes rile the kids up: every wander clock is pulled inside the
    // panic window (web KID_PANIC_MS).
    for kid in engine.kids {
      XCTAssertLessThanOrEqual(kid.nextMoveAtMs, engine.elapsedMs + SitterEngine.kidPanicMs)
    }

    // A mess is permanent unless fixed: 30 more seconds change nothing.
    _ = advance(engine, toMs: engine.elapsedMs + 30_000)
    XCTAssertTrue(engine.mishaps.contains { $0.id == id && $0.isMess })
  }

  // MARK: Tool matching

  func testCorrectToolFixesAndCreditsKidCare() {
    let engine = makeEngine()

    // Mop fixes the juice; not a kid-care mishap.
    let juiceID = engine.forceSpawn(.juice, in: .kitchen)
    XCTAssertEqual(engine.applyTool(.mop, toMishapID: juiceID), .fixed)
    XCTAssertEqual(engine.fixes, 1)
    XCTAssertEqual(engine.kidCare, 0)
    XCTAssertTrue(engine.mishaps.isEmpty)

    // Snack fixes the hungry kid and feeds the happiness score.
    let hungryID = engine.forceSpawn(.hungry, in: .bedroom)
    XCTAssertEqual(engine.applyTool(.snack, toMishapID: hungryID), .fixed)
    XCTAssertEqual(engine.fixes, 2)
    XCTAssertEqual(engine.kidCare, 1)
  }

  func testToyExplosionNeedsThreeTidyTaps() {
    let engine = makeEngine()
    let id = engine.forceSpawn(.toys, in: .living)

    XCTAssertEqual(engine.applyTool(.tidy, toMishapID: id), .progressed(clicksLeft: 2))
    XCTAssertEqual(engine.applyTool(.tidy, toMishapID: id), .progressed(clicksLeft: 1))
    XCTAssertEqual(engine.applyTool(.tidy, toMishapID: id), .fixed)
    XCTAssertEqual(engine.fixes, 1)
    XCTAssertTrue(engine.mishaps.isEmpty)
  }

  func testWrongToolOrNoToolLeavesTheMishapAndScoresNothing() {
    let engine = makeEngine()
    let id = engine.forceSpawn(.juice, in: .bathroom)

    // Wrong tool: the kids giggle, nothing is fixed (the web's only
    // penalty — the mishap keeps aging toward MESS).
    XCTAssertEqual(engine.applyTool(.hug, toMishapID: id), .wrongTool)
    XCTAssertEqual(engine.fixes, 0)
    XCTAssertEqual(engine.mishaps.count, 1)
    XCTAssertEqual(engine.statusMessage, "🤗 WON'T FIX THAT! THE KIDS GIGGLE AT YOU.")

    // No tool selected: same, with a nudge toward the tray.
    XCTAssertEqual(engine.applyTool(nil, toMishapID: id), .noToolSelected)
    XCTAssertEqual(engine.fixes, 0)
    XCTAssertEqual(engine.mishaps.count, 1)
  }

  func testHugIsAHoldFixThatCancelsOnRelease() {
    let engine = makeEngine()
    let id = engine.forceSpawn(.crying, in: .bedroom)

    // Press: the 2000ms hold starts but nothing is fixed yet. (Unrelated
    // mishaps keep spawning naturally, so assert on this id, not counts.)
    XCTAssertEqual(engine.applyTool(.hug, toMishapID: id), .holdStarted)
    _ = engine.step(dt: 1.0)
    XCTAssertTrue(engine.mishaps.contains { $0.id == id })
    XCTAssertEqual(engine.holdProgress, 0.5, accuracy: 0.001)

    // Letting go early cancels: 3 more seconds without holding fix nothing.
    engine.releaseHold()
    _ = engine.step(dt: 3.0)
    XCTAssertTrue(engine.mishaps.contains { $0.id == id })

    // Holding through the full 2000ms completes the hug and credits care.
    XCTAssertEqual(engine.applyTool(.hug, toMishapID: id), .holdStarted)
    _ = engine.step(dt: 1.0)
    let events = engine.step(dt: 1.1)
    XCTAssertTrue(events.contains(.mishapFixed(key: .crying)))
    XCTAssertFalse(engine.mishaps.contains { $0.id == id })
    XCTAssertEqual(engine.fixes, 1)
    XCTAssertEqual(engine.kidCare, 1)
  }

  // MARK: The scripted emergency

  func testOverflowFiresAtTheOneMinuteMarkAndFloodsIfIgnored() {
    let engine = makeEngine()

    // Before the 1:00-remaining mark, the tub is quiet.
    _ = advance(engine, toMs: SitterEngine.shiftLengthMs - SitterEngine.overflowAtRemainingMs - 200)
    XCTAssertEqual(engine.overflowStage, .waiting)

    // At remaining <= 60s it activates...
    let startEvents = advance(
      engine, toMs: SitterEngine.shiftLengthMs - SitterEngine.overflowAtRemainingMs + 200
    )
    XCTAssertTrue(startEvents.contains(.overflowStarted))
    XCTAssertEqual(engine.overflowStage, .active)

    // ...and 8 ignored seconds later the bathroom floods, for good.
    let floodEvents = advance(engine, toMs: engine.elapsedMs + SitterEngine.overflowWindowMs + 200)
    XCTAssertTrue(floodEvents.contains(.bathroomFlooded))
    XCTAssertEqual(engine.overflowStage, .flooded)
  }

  func testFiveTapsShutOffTheTubAndCountAsAFix() {
    let engine = makeEngine()
    _ = advance(engine, toMs: SitterEngine.shiftLengthMs - SitterEngine.overflowAtRemainingMs + 200)
    XCTAssertEqual(engine.overflowStage, .active)

    let fixesBefore = engine.fixes
    for _ in 0..<(SitterEngine.overflowClicks - 1) {
      XCTAssertFalse(engine.tapOverflow())
    }
    XCTAssertTrue(engine.tapOverflow())
    XCTAssertEqual(engine.overflowStage, .shutOff)
    XCTAssertEqual(engine.fixes, fixesBefore + 1)

    // Once shut off it never floods.
    _ = advance(engine, toMs: engine.elapsedMs + SitterEngine.overflowWindowMs + 1_000)
    XCTAssertEqual(engine.overflowStage, .shutOff)
  }

  // MARK: Scoring

  func testScoreShiftMirrorsTheWebMath() {
    // Leftovers cost 8, messes double that (16), a flood costs 25 —
    // straight from the web penalty constants.
    let messy = SitterEngine.scoreShift(
      SitterShiftReport(fixes: 10, kidCare: 2, leftoverMishaps: 1, leftoverMesses: 1, flooded: false)
    )
    // tidiness 100-8-16=76, happiness 40+30+30=100, overall 85.6 → 4 stars.
    XCTAssertEqual(messy.tidiness, 76)
    XCTAssertEqual(messy.happiness, 100)
    XCTAssertEqual(messy.stars, 4)
    XCTAssertEqual(messy.pay, 4 * SitterEngine.basePayPerStar + 10 * SitterEngine.tipPerFix)

    // An ignored mess costs exactly double an ignored fresh mishap.
    let oneMishap = SitterEngine.scoreShift(
      SitterShiftReport(fixes: 0, kidCare: 0, leftoverMishaps: 1, leftoverMesses: 0, flooded: false)
    )
    let oneMess = SitterEngine.scoreShift(
      SitterShiftReport(fixes: 0, kidCare: 0, leftoverMishaps: 0, leftoverMesses: 1, flooded: false)
    )
    XCTAssertEqual(100 - oneMishap.tidiness, SitterEngine.unfixedPenalty)
    XCTAssertEqual(100 - oneMess.tidiness, SitterEngine.messPenalty)

    // Disaster shift: tidiness clamps at 0, happiness floor is 40 → 1 star.
    let disaster = SitterEngine.scoreShift(
      SitterShiftReport(fixes: 0, kidCare: 0, leftoverMishaps: 5, leftoverMesses: 3, flooded: true)
    )
    XCTAssertEqual(disaster.tidiness, 0)
    XCTAssertEqual(disaster.happiness, 40)
    XCTAssertEqual(disaster.stars, 1)
    XCTAssertEqual(disaster.pay, SitterEngine.basePayPerStar)

    // 5-star boundary: overall 89.2 rates 4 stars, 90.4 rates 5.
    let fourStars = SitterEngine.scoreShift(
      SitterShiftReport(fixes: 6, kidCare: 1, leftoverMishaps: 0, leftoverMesses: 0, flooded: false)
    )
    XCTAssertEqual(fourStars.stars, 4)
    let fiveStars = SitterEngine.scoreShift(
      SitterShiftReport(fixes: 7, kidCare: 1, leftoverMishaps: 0, leftoverMesses: 0, flooded: false)
    )
    XCTAssertEqual(fiveStars.stars, 5)
  }

  func testShiftEndsAtTwoMinutesWithAConsistentReport() {
    let engine = makeEngine()
    var endResult: SitterShiftResult?

    while engine.isPlaying {
      for event in engine.step(dt: tick) {
        if case .shiftEnded(let result) = event {
          endResult = result
        }
      }
    }

    XCTAssertFalse(engine.isPlaying)
    XCTAssertNotNil(endResult)
    XCTAssertEqual(endResult, engine.result)
    XCTAssertGreaterThanOrEqual(engine.elapsedMs, SitterEngine.shiftLengthMs)

    // Nobody touched the tub, so the untended overflow must have flooded,
    // and the leftover mishaps/messes must reproduce the final score.
    XCTAssertEqual(engine.overflowStage, .flooded)
    let leftoverMesses = engine.mishaps.filter(\.isMess).count
    let expected = SitterEngine.scoreShift(
      SitterShiftReport(
        fixes: engine.fixes,
        kidCare: engine.kidCare,
        leftoverMishaps: engine.mishaps.count - leftoverMesses,
        leftoverMesses: leftoverMesses,
        flooded: true
      )
    )
    XCTAssertEqual(engine.result, expected)

    // A finished shift is inert until the next doorbell.
    XCTAssertTrue(engine.step(dt: tick).isEmpty)
  }

  // MARK: Spawning

  func testSpawnIntervalRampsAndSpeedsUpOnReplays() {
    // Shift start vs end mirrors the DIFFICULTIES table (normal: 5500→3000).
    XCTAssertEqual(
      SitterEngine.spawnIntervalMs(elapsedMs: 0, difficulty: .normal, shiftNumber: 1),
      5_500
    )
    XCTAssertEqual(
      SitterEngine.spawnIntervalMs(
        elapsedMs: SitterEngine.shiftLengthMs, difficulty: .normal, shiftNumber: 1
      ),
      3_000
    )
    // Each replay multiplies by 0.92...
    XCTAssertEqual(
      SitterEngine.spawnIntervalMs(elapsedMs: 0, difficulty: .normal, shiftNumber: 2),
      5_500 * 0.92,
      accuracy: 0.001
    )
    // ...but never below the 1500ms floor.
    XCTAssertEqual(
      SitterEngine.spawnIntervalMs(
        elapsedMs: SitterEngine.shiftLengthMs, difficulty: .chaos, shiftNumber: 20
      ),
      SitterEngine.minSpawnMs
    )
  }

  func testInjectedRNGMakesSpawnsFullyDeterministic() {
    // random() == 0 always picks the first weighted kind (juice), the first
    // room (living), and the minimum spot (12%, 34%).
    let zeroEngine = makeEngine(random: { 0 })
    let spawnEvents = advance(zeroEngine, toMs: SitterEngine.firstSpawnMs + 100)
      .compactMap { event -> (SitterMishapKey, SitterRoomKey)? in
        if case .mishapSpawned(let key, let room) = event { return (key, room) }
        return nil
      }
    XCTAssertEqual(spawnEvents.count, 1)
    XCTAssertEqual(spawnEvents[0].0, .juice)
    XCTAssertEqual(spawnEvents[0].1, .living)
    let mishap = zeroEngine.mishaps[0]
    XCTAssertEqual(mishap.x, 12)
    XCTAssertEqual(mishap.y, 34)
    XCTAssertEqual(mishap.spawnedAtMs, SitterEngine.firstSpawnMs, accuracy: 1)

    // random() == 0.99 rolls past every other weight to the last kind (tv)
    // and the last room (bathroom) — same walk as the web pickMishapKind.
    let highEngine = makeEngine(random: { 0.99 })
    _ = advance(highEngine, toMs: SitterEngine.firstSpawnMs + 100)
    XCTAssertEqual(highEngine.mishaps.count, 1)
    XCTAssertEqual(highEngine.mishaps[0].kind.key, .tv)
    XCTAssertEqual(highEngine.mishaps[0].room, .bathroom)

    // Two engines sharing the same RNG stream stay in lockstep.
    let a = makeEngine(random: { 0.37 })
    let b = makeEngine(random: { 0.37 })
    _ = advance(a, toMs: 30_000)
    _ = advance(b, toMs: 30_000)
    XCTAssertEqual(a.mishaps, b.mishaps)
    XCTAssertEqual(a.kids, b.kids)
  }

  func testKidsWanderToADifferentRoomOnTheirClock() {
    let engine = makeEngine()
    // With random() == 0.5 both kids start in the bedroom (room index 2)
    // and first move at 1500 + 0.5*2500 = 2750ms.
    XCTAssertEqual(engine.kids.map(\.room), [.bedroom, .bedroom])

    _ = advance(engine, toMs: 2_800)
    for kid in engine.kids {
      XCTAssertNotEqual(kid.room, .bedroom)
      XCTAssertEqual(kid.hopToken, 1)
      // Next wander lands in the 3-6s window (web KID_MOVE_MIN/MAX).
      XCTAssertGreaterThanOrEqual(kid.nextMoveAtMs - engine.elapsedMs, 2_000)
      XCTAssertLessThanOrEqual(kid.nextMoveAtMs, engine.elapsedMs + SitterEngine.kidMoveMaxMs)
    }
  }

  func testHouseCapsAtEightActiveMishaps() {
    let engine = makeEngine()
    for _ in 0..<SitterEngine.maxActiveMishaps {
      engine.forceSpawn(.juice, in: .living)
    }

    // Run long enough for several natural spawn attempts; the cap holds.
    _ = advance(engine, toMs: 30_000)
    XCTAssertEqual(engine.mishaps.count, SitterEngine.maxActiveMishaps)
  }
}
