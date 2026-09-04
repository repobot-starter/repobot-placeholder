import XCTest
@testable import AppIOS

/// Exercises the pure StyleBot engine against the web wardrobe.ts /
/// StylePage.tsx rules it mirrors: judge scoring weights, star thresholds,
/// the tick-driven round timer, deterministic theme rotation, and the
/// integrity of the ported wardrobe catalog.
final class StyleEngineTests: XCTestCase {
  // MARK: - Scoring

  func testScoringRewardsOnThemeItemsPerWebWeights() {
    let gala = theme(named: "Gala Night")

    // Full gala outfit: 5 matches x 20 + 20 full-match + 10 complete = 130.
    let allGala = outfit(
      hat: "crown", top: "ball-gown", bottom: "silk-skirt",
      shoes: "heels", accessory: "diamond-ring"
    )
    let perfect = StyleWardrobe.scoreOutfit(allGala, theme: gala)
    XCTAssertEqual(perfect.matches, 5)
    XCTAssertTrue(perfect.complete)
    XCTAssertTrue(perfect.fullMatch)
    XCTAssertEqual(perfect.total, StyleWardrobe.maxRoundScore)
    XCTAssertEqual(perfect.total, 130)

    // Swapping one slot off-theme drops that item's 20 points AND the
    // 20-point full-match bonus, keeping only the complete-outfit 10.
    var oneMiss = allGala
    oneMiss[.accessory] = item("teddy-bear") // pajama-only: off-theme at the gala
    let nearMiss = StyleWardrobe.scoreOutfit(oneMiss, theme: gala)
    XCTAssertEqual(nearMiss.matches, 4)
    XCTAssertTrue(nearMiss.complete)
    XCTAssertFalse(nearMiss.fullMatch)
    XCTAssertEqual(nearMiss.total, 4 * 20 + 10)

    // The same five items judged against Beach Day are all off-theme:
    // only the complete-outfit bonus survives.
    let wrongParty = StyleWardrobe.scoreOutfit(allGala, theme: theme(named: "Beach Day"))
    XCTAssertEqual(wrongParty.matches, 0)
    XCTAssertEqual(wrongParty.total, StyleWardrobe.completeOutfitBonus)

    // An incomplete outfit earns match points but no completion bonus.
    let partial: StyleOutfit = [.hat: item("crown"), .top: item("ball-gown")]
    let twoOnTheme = StyleWardrobe.scoreOutfit(partial, theme: gala)
    XCTAssertEqual(twoOnTheme.matches, 2)
    XCTAssertFalse(twoOnTheme.complete)
    XCTAssertEqual(twoOnTheme.total, 2 * 20)

    // Multi-tag items match any theme sharing one tag: the hair bow
    // (pajama/school/gala) counts at both the gala and the school run.
    XCTAssertTrue(StyleWardrobe.itemMatchesTheme(item("hair-bow"), theme: gala))
    XCTAssertTrue(
      StyleWardrobe.itemMatchesTheme(item("hair-bow"), theme: theme(named: "Rainy School Run"))
    )
    XCTAssertFalse(StyleWardrobe.itemMatchesTheme(item("hair-bow"), theme: theme(named: "Snow Trip")))
  }

  func testStarThresholdsMatchWebRounding() {
    let gala = theme(named: "Gala Night")
    // stars = round(total / 130 * 5), JS Math.round semantics.
    XCTAssertEqual(stars(total: 130, against: gala), 5) // perfect
    XCTAssertEqual(stars(total: 90, against: gala), 3) // 4/5 complete: 3.46 → 3
    XCTAssertEqual(stars(total: 60, against: gala), 2) // 3 matches only: 2.31 → 2
    XCTAssertEqual(stars(total: 40, against: gala), 2) // 2 matches only: 1.54 → 2
    XCTAssertEqual(stars(total: 20, against: gala), 1) // 1 match only: 0.77 → 1
    XCTAssertEqual(stars(total: 10, against: gala), 0) // complete but 0 on-theme: 0.38 → 0
    XCTAssertEqual(StyleWardrobe.scoreOutfit([:], theme: gala).stars, 0) // naked: 0
  }

  // MARK: - Round timer

  func testTimerExpiryEndsTheRound() {
    var engine = StyleEngine(random: { 0 })
    engine.startSeason()
    XCTAssertEqual(engine.phase, .dressing)
    XCTAssertEqual(engine.secondsLeft, StyleWardrobe.roundSeconds)

    // 39 accumulated seconds tick the clock down without ending the round,
    // regardless of how the dt slices arrive.
    _ = engine.tick(dt: 38.5)
    _ = engine.tick(dt: 0.5)
    XCTAssertEqual(engine.secondsLeft, 1)
    XCTAssertEqual(engine.phase, .dressing)

    // The final second locks the score and starts the walk automatically.
    let events = engine.tick(dt: 1)
    XCTAssertTrue(events.contains(.timeExpired))
    XCTAssertEqual(engine.phase, .walking)
    XCTAssertEqual(engine.roundScores.count, 1)

    // The walk runs on the same tick clock and reveals the verdict at 2.6s.
    XCTAssertTrue(engine.tick(dt: 2.5).isEmpty)
    XCTAssertEqual(engine.phase, .walking)
    let walkEvents = engine.tick(dt: 0.2)
    XCTAssertTrue(walkEvents.contains(.verdictRevealed))
    XCTAssertEqual(engine.phase, .verdict)
    XCTAssertNotNil(engine.verdict)
  }

  func testManualFinishLocksScoreAndSeasonEndsAfterFinalRound() {
    var engine = StyleEngine(random: { 0 })
    engine.startSeason()

    for round in 0..<StyleWardrobe.roundsPerSeason {
      XCTAssertEqual(engine.roundIndex, round)
      engine.shuffleOutfit()
      engine.finishRound()
      XCTAssertEqual(engine.phase, .walking)
      _ = engine.tick(dt: StyleEngine.walkDuration)
      XCTAssertEqual(engine.phase, .verdict)
      engine.dismissVerdict()
    }

    XCTAssertEqual(engine.phase, .seasonOver)
    XCTAssertEqual(engine.roundScores.count, StyleWardrobe.roundsPerSeason)
    XCTAssertEqual(engine.seasonTotal, engine.roundScores.reduce(0, +))

    // A finished season is inert until a new one starts.
    engine.finishRound()
    XCTAssertEqual(engine.phase, .seasonOver)
    engine.startSeason()
    XCTAssertEqual(engine.phase, .dressing)
    XCTAssertEqual(engine.roundIndex, 0)
    XCTAssertTrue(engine.roundScores.isEmpty)
  }

  func testPickTogglesAndRespectsPhase() {
    var engine = StyleEngine(random: { 0 })
    // Backstage: the closet is closed.
    engine.pick(item("crown"), in: .hat)
    XCTAssertNil(engine.outfit[.hat])

    engine.startSeason()
    engine.pick(item("crown"), in: .hat)
    XCTAssertEqual(engine.outfit[.hat]?.id, "crown")
    // Picking the worn item takes it off (the web toggle).
    engine.pick(item("crown"), in: .hat)
    XCTAssertNil(engine.outfit[.hat])

    engine.shuffleOutfit()
    XCTAssertEqual(engine.outfit.count, StyleWardrobe.slots.count)
    engine.clearOutfit()
    XCTAssertTrue(engine.outfit.isEmpty)
  }

  // MARK: - Theme rotation

  func testThemeRotationIsDeterministicWithSeededRNG() {
    var first = StyleEngine(random: seededRandom(7))
    var second = StyleEngine(random: seededRandom(7))
    first.startSeason()
    second.startSeason()

    // Same seed → same shuffled deck, and the deck is a true permutation.
    XCTAssertEqual(first.themes.map(\.name), second.themes.map(\.name))
    XCTAssertEqual(Set(first.themes.map(\.name)).count, StyleWardrobe.themes.count)

    // A different seed produces a different rotation (with these seeds).
    var third = StyleEngine(random: seededRandom(8))
    third.startSeason()
    XCTAssertNotEqual(first.themes.map(\.name), third.themes.map(\.name))

    // Each round advances through the deck in order.
    let deck = first.themes.map(\.name)
    XCTAssertEqual(first.theme?.name, deck[0])
    first.finishRound()
    _ = first.tick(dt: StyleEngine.walkDuration)
    first.dismissVerdict()
    XCTAssertEqual(first.theme?.name, deck[1])
  }

  // MARK: - Wardrobe data integrity

  func testWardrobeDataIntegrity() {
    // Five slots, one per outfit zone, each with a non-empty rack.
    XCTAssertEqual(StyleWardrobe.slots.map(\.id), StyleSlotId.allCases)
    for slot in StyleWardrobe.slots {
      XCTAssertFalse(slot.items.isEmpty, "slot \(slot.id) has no items")
      for item in slot.items {
        XCTAssertFalse(item.tags.isEmpty, "item \(item.id) has no tags")
        XCTAssertFalse(item.name.isEmpty)
        XCTAssertFalse(item.emoji.isEmpty)
      }
    }

    // Item ids are unique across the whole catalog.
    let allIds = StyleWardrobe.slots.flatMap { $0.items.map(\.id) }
    XCTAssertEqual(Set(allIds).count, allIds.count)

    // Every theme can be judged (has tags + verdict lines) and can be
    // dressed for (at least one item in the catalog matches).
    let allItems = StyleWardrobe.slots.flatMap(\.items)
    XCTAssertEqual(StyleWardrobe.themes.count, 8)
    for theme in StyleWardrobe.themes {
      XCTAssertFalse(theme.tags.isEmpty, "theme \(theme.name) has no tags")
      XCTAssertFalse(theme.verdicts.isEmpty, "theme \(theme.name) has no verdicts")
      XCTAssertTrue(
        allItems.contains { StyleWardrobe.itemMatchesTheme($0, theme: theme) },
        "no item matches theme \(theme.name)"
      )
    }

    // The derived cap matches the web MAX_ROUND_SCORE (20*5 + 20 + 10).
    XCTAssertEqual(StyleWardrobe.maxRoundScore, 130)
    XCTAssertEqual(StyleWardrobe.bestScoreKey, "style.bestScore")
  }

  // MARK: - Helpers

  /// Splitmix-style seeded generator in [0, 1) so shuffles are reproducible.
  private func seededRandom(_ seed: UInt64) -> () -> Double {
    var state = seed
    return {
      state = state &* 6_364_136_223_846_793_005 &+ 1_442_695_040_888_963_407
      return Double(state >> 11) / Double(UInt64(1) << 53)
    }
  }

  private func theme(named name: String) -> StyleTheme {
    guard let theme = StyleWardrobe.themes.first(where: { $0.name == name }) else {
      fatalError("unknown theme \(name)")
    }
    return theme
  }

  private func item(_ id: String) -> StyleItem {
    guard let item = StyleWardrobe.slots.flatMap(\.items).first(where: { $0.id == id }) else {
      fatalError("unknown item \(id)")
    }
    return item
  }

  private func outfit(
    hat: String, top: String, bottom: String, shoes: String, accessory: String
  ) -> StyleOutfit {
    [
      .hat: item(hat),
      .top: item(top),
      .bottom: item(bottom),
      .shoes: item(shoes),
      .accessory: item(accessory),
    ]
  }

  /// Builds an outfit that scores exactly `total` against `theme` and
  /// returns its star rating (gala items are on-theme, pajama-only items
  /// are the off-theme filler).
  private func stars(total: Int, against theme: StyleTheme) -> Int {
    let onTheme = [item("crown"), item("ball-gown"), item("silk-skirt"), item("heels"), item("diamond-ring")]
    let offTheme = [item("earmuff-phones"), item("martial-gi"), item("flannel-pjs"), item("fuzzy-socks"), item("teddy-bear")]
    let slots: [StyleSlotId] = [.hat, .top, .bottom, .shoes, .accessory]

    var outfit: StyleOutfit = [:]
    switch total {
    case 130: // 5 matches, complete, full-match
      for (index, slot) in slots.enumerated() { outfit[slot] = onTheme[index] }
    case 90: // 4 matches + complete
      for (index, slot) in slots.enumerated() { outfit[slot] = onTheme[index] }
      outfit[.accessory] = offTheme[4]
    case 60: // 3 matches, incomplete
      outfit = [.hat: onTheme[0], .top: onTheme[1], .bottom: onTheme[2]]
    case 40: // 2 matches, incomplete
      outfit = [.hat: onTheme[0], .top: onTheme[1]]
    case 20: // 1 match, incomplete
      outfit = [.hat: onTheme[0]]
    case 10: // complete, 0 matches
      for (index, slot) in slots.enumerated() { outfit[slot] = offTheme[index] }
    default:
      fatalError("no outfit recipe for total \(total)")
    }

    let score = StyleWardrobe.scoreOutfit(outfit, theme: theme)
    XCTAssertEqual(score.total, total, "outfit recipe for \(total) is wrong")
    return score.stars
  }
}
