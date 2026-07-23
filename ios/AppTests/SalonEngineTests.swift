import XCTest
@testable import AppIOS

/// Exercises the pure salon simulation. The engine takes an injectable random
/// source, so every test below is deterministic: a scripted queue of values
/// (or a constant) pins client rolls, bubble/stray placement, and reaction
/// picks exactly.
final class SalonEngineTests: XCTestCase {
  // MARK: - Client generation

  func testClientGenerationIsDeterministicWithInjectedRNG() {
    let script = [0.0, 0.3, 0.1, 0.2, 0.4, 0.6, 0.4, 0.5, 0.7, 0.8, 0.2]
    let first = SalonEngine.rollClient(random: sequenceRandom(script))
    let second = SalonEngine.rollClient(random: sequenceRandom(script))
    XCTAssertEqual(first, second)

    // Spot-check the pick math against the web tables (same call order as
    // `randomClient`): 0.0 → first walk-in color (brown); 0.3 < 0.5 → the
    // client has an accessory wish; 0.1 → name floor(0.1 * 12) = 1 (Milo).
    XCTAssertEqual(first.startLook.color, .brown)
    XCTAssertNotNil(first.request.accessory)
    XCTAssertEqual(first.name, "Milo")
  }

  func testEveryGeneratedClientIsSatisfiable() {
    // A request is satisfiable when every wish is a pickable option and the
    // color differs from the walk-in color (the dye grid has no "keep it").
    var counter = 0.0
    let random: () -> Double = {
      counter += 0.137
      return counter.truncatingRemainder(dividingBy: 1)
    }
    for _ in 0..<200 {
      let client = SalonEngine.rollClient(random: random)
      XCTAssertNotEqual(client.request.color, client.startLook.color)
      XCTAssertNotEqual(client.request.accessory, SalonAccessory.none)
      // Walk-in look is always the same tangled baseline as the web.
      XCTAssertEqual(
        client.startLook,
        SalonHairLook(length: .long, color: client.startLook.color, texture: .straight, accessory: SalonAccessory.none)
      )
    }
  }

  // MARK: - Wash station

  func testWashCompletesAtFullProgressAndAdvancesToCut() {
    let engine = SalonEngine(random: { 0.5 })
    XCTAssertEqual(engine.station, .wash)
    XCTAssertEqual(engine.bubbles.count, SalonEngine.bubbleCount)
    XCTAssertEqual(engine.cleanliness, 0)

    // Each bubble needs exactly `scrubsToPop` passes; the last pop flips the
    // station to cut with cleanliness at 1.
    for bubble in engine.bubbles {
      for pass in 0..<SalonEngine.scrubsToPop {
        let popped = engine.scrub(bubbleID: bubble.id)
        XCTAssertEqual(popped, pass == SalonEngine.scrubsToPop - 1)
      }
    }
    XCTAssertEqual(engine.cleanliness, 1)
    XCTAssertEqual(engine.station, .cut)

    // Popped bubbles ignore further scrubs (web handleScrub early-return).
    XCTAssertFalse(engine.scrub(bubbleID: 0))
  }

  func testPartialWashLeavesPartialCleanliness() {
    let engine = SalonEngine(random: { 0.5 })
    // Fully pop 4 of 10 bubbles → cleanliness 0.4, wash bonus rounds to 10.
    for id in 0..<4 {
      for _ in 0..<SalonEngine.scrubsToPop {
        engine.scrub(bubbleID: id)
      }
    }
    XCTAssertEqual(engine.cleanliness, 0.4, accuracy: 0.0001)
    XCTAssertEqual(engine.station, .wash)
  }

  // MARK: - Cut station

  func testCutRequiresLengthChoiceAndAllStraysSnipped() {
    let engine = makeEngineAtCut()

    // Cannot advance before choosing a length.
    XCTAssertFalse(engine.cutDone)
    engine.advanceToColor()
    XCTAssertEqual(engine.station, .cut)

    engine.chooseLength(.short)
    XCTAssertTrue(engine.lengthChosen)
    XCTAssertEqual(engine.look.length, .short)
    // random 0.5 → 2 + floor(0.5 * 2) = 3 strays, alternating sides.
    XCTAssertEqual(engine.strays.count, 3)
    XCTAssertEqual(engine.strays.map(\.direction), [1, -1, 1])
    XCTAssertFalse(engine.cutDone)

    for stray in engine.strays {
      engine.snip(strayID: stray.id)
    }
    XCTAssertTrue(engine.cutDone)
    engine.advanceToColor()
    XCTAssertEqual(engine.station, .color)
  }

  func testRePickingLengthReRollsStrays() {
    let engine = makeEngineAtCut()
    engine.chooseLength(.short)
    for stray in engine.strays {
      engine.snip(strayID: stray.id)
    }
    XCTAssertTrue(engine.cutDone)

    // Changing your mind re-rolls fresh (unsnipped) strays, like the web.
    engine.chooseLength(.long)
    XCTAssertEqual(engine.look.length, .long)
    XCTAssertFalse(engine.cutDone)
    XCTAssertTrue(engine.strays.allSatisfy { !$0.snipped })
  }

  // MARK: - Scoring

  func testCutAccuracyScoringBands() {
    // Length is scored as a single 25-point band: exact match or nothing.
    let request = SalonClientRequest(length: .short, color: .pink, texture: .curly, accessory: nil)
    let matched = SalonEngine.scoreLook(
      request: request, look: look(length: .short, color: .pink, texture: .curly), cleanliness: 0
    )
    XCTAssertTrue(matched.lengthMatch)
    let missed = SalonEngine.scoreLook(
      request: request, look: look(length: .long, color: .pink, texture: .curly), cleanliness: 0
    )
    XCTAssertFalse(missed.lengthMatch)
    XCTAssertEqual(matched.total - missed.total, SalonEngine.pointsPerMatch)
  }

  func testDyeMatchAndMismatchScoring() {
    let request = SalonClientRequest(length: .short, color: .mint, texture: .waves, accessory: nil)
    let matched = SalonEngine.scoreLook(
      request: request, look: look(length: .short, color: .mint, texture: .waves), cleanliness: 1
    )
    XCTAssertTrue(matched.colorMatch)
    let mismatched = SalonEngine.scoreLook(
      request: request, look: look(length: .short, color: .black, texture: .waves), cleanliness: 1
    )
    XCTAssertFalse(mismatched.colorMatch)
    XCTAssertEqual(matched.total - mismatched.total, SalonEngine.pointsPerMatch)
  }

  func testPerfectMakeoverMatchesWebFormula() {
    // With an accessory wish: max = 25 * 4 + 25 = 125, and a perfect look
    // with a full scrub earns all of it.
    let request = SalonClientRequest(length: .long, color: .purple, texture: .braids, accessory: .tiara)
    let score = SalonEngine.scoreLook(
      request: request,
      look: look(length: .long, color: .purple, texture: .braids, accessory: .tiara),
      cleanliness: 1
    )
    XCTAssertEqual(score.max, 125)
    XCTAssertEqual(score.total, 125)
    XCTAssertEqual(score.washBonus, SalonEngine.washBonusMax)

    // Without an accessory wish the ceiling drops to 25 * 3 + 25 = 100.
    let noWish = SalonClientRequest(length: .long, color: .purple, texture: .braids, accessory: nil)
    let capped = SalonEngine.scoreLook(
      request: noWish,
      look: look(length: .long, color: .purple, texture: .braids),
      cleanliness: 1
    )
    XCTAssertEqual(capped.max, 100)
    XCTAssertEqual(capped.total, 100)
    XCTAssertNil(capped.accessoryMatch)
  }

  func testBotchedMakeoverMatchesWebFormula() {
    // Nothing matches, half a scrub: total = 0 matches + round(0.5 * 25) = 13.
    let request = SalonClientRequest(length: .short, color: .pink, texture: .updo, accessory: .bow)
    let score = SalonEngine.scoreLook(
      request: request,
      look: look(length: .long, color: .black, texture: .straight),
      cleanliness: 0.5
    )
    XCTAssertEqual(score.washBonus, 13)
    XCTAssertEqual(score.total, 13)
    XCTAssertEqual(score.max, 125)
    XCTAssertEqual(score.accessoryMatch, false)
  }

  // MARK: - Reactions

  func testReactionThresholds() {
    // moodFor bands: ≥ 0.9 delighted, ≥ 0.55 happy, below grimace.
    XCTAssertEqual(SalonEngine.mood(for: score(total: 125, max: 125)), .delighted)
    XCTAssertEqual(SalonEngine.mood(for: score(total: 113, max: 125)), .delighted) // 0.904
    XCTAssertEqual(SalonEngine.mood(for: score(total: 112, max: 125)), .happy) // 0.896
    XCTAssertEqual(SalonEngine.mood(for: score(total: 69, max: 125)), .happy) // 0.552
    XCTAssertEqual(SalonEngine.mood(for: score(total: 68, max: 125)), .grimace) // 0.544
    XCTAssertEqual(SalonEngine.mood(for: score(total: 0, max: 100)), .grimace)
    // Exact boundary: 90 / 100 is delighted, 55 / 100 is happy.
    XCTAssertEqual(SalonEngine.mood(for: score(total: 90, max: 100)), .delighted)
    XCTAssertEqual(SalonEngine.mood(for: score(total: 55, max: 100)), .happy)
    XCTAssertEqual(SalonEngine.mood(for: score(total: 54, max: 100)), .grimace)
  }

  func testRevealUpdatesStreaks() {
    // Play a full round with a constant RNG and force a perfect makeover.
    let engine = SalonEngine(random: { 0.25 })
    completeWash(engine)
    engine.chooseLength(engine.client.request.length)
    for stray in engine.strays {
      engine.snip(strayID: stray.id)
    }
    engine.advanceToColor()
    engine.applyDye(engine.client.request.color)
    engine.advanceToStyle()
    engine.chooseTexture(engine.client.request.texture)
    engine.advanceToFinish()
    if let accessory = engine.client.request.accessory {
      engine.chooseAccessory(accessory)
    }
    engine.reveal()

    XCTAssertEqual(engine.station, .reveal)
    XCTAssertEqual(engine.mood, .delighted)
    XCTAssertEqual(engine.score?.total, engine.score?.max)
    XCTAssertEqual(engine.streak, 1)
    XCTAssertEqual(engine.bestStreak, 1)
    XCTAssertFalse(engine.reactionLine.isEmpty)

    // Next client resets the stations but keeps the streaks.
    engine.nextClient()
    XCTAssertEqual(engine.station, .wash)
    XCTAssertNil(engine.score)
    XCTAssertEqual(engine.streak, 1)
  }

  // MARK: - Helpers

  /// Returns queued values in order, then repeats the last one.
  private func sequenceRandom(_ values: [Double]) -> () -> Double {
    var queue = values
    return {
      queue.count > 1 ? queue.removeFirst() : queue[0]
    }
  }

  private func makeEngineAtCut() -> SalonEngine {
    let engine = SalonEngine(random: { 0.5 })
    completeWash(engine)
    XCTAssertEqual(engine.station, .cut)
    return engine
  }

  private func completeWash(_ engine: SalonEngine) {
    for bubble in engine.bubbles {
      for _ in 0..<SalonEngine.scrubsToPop {
        engine.scrub(bubbleID: bubble.id)
      }
    }
  }

  private func look(
    length: SalonHairLength, color: SalonHairColor, texture: SalonHairTexture,
    accessory: SalonAccessory = .none
  ) -> SalonHairLook {
    SalonHairLook(length: length, color: color, texture: texture, accessory: accessory)
  }

  private func score(total: Int, max: Int) -> SalonScore {
    SalonScore(
      lengthMatch: false, colorMatch: false, textureMatch: false, accessoryMatch: nil,
      washBonus: 0, total: total, max: max
    )
  }
}
