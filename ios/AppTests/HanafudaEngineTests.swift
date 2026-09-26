import XCTest
@testable import AppIOS

/// Exercises the pure Koi-Koi engine against the web engine.ts rules it
/// mirrors: deck composition, the 8/8/8 deal, month-match capture, yaku
/// evaluation, and the koi-koi doubling house rules. Shuffling goes through
/// an injected random source (or is bypassed entirely with `dealArranged`),
/// so every test is deterministic.
final class HanafudaEngineTests: XCTestCase {

  // MARK: - Deck composition

  func testDeckHasCanonicalComposition() {
    let deck = HanafudaEngine.fullDeck

    XCTAssertEqual(deck.count, 48)
    XCTAssertEqual(deck.filter { $0.kind == .bright }.count, 5)
    XCTAssertEqual(deck.filter { $0.kind == .animal }.count, 9)
    XCTAssertEqual(deck.filter { $0.kind == .ribbon }.count, 10)
    XCTAssertEqual(deck.filter { $0.kind == .chaff }.count, 24)

    // Four cards per month, ids stable at (month-1)*4 + slot.
    for month in 1...12 {
      XCTAssertEqual(deck.filter { $0.month == month }.count, 4)
    }
    XCTAssertEqual(deck.map(\.id), Array(0..<48))

    // Ribbon split: 3 poetry, 3 blue, 4 plain.
    XCTAssertEqual(deck.filter { $0.ribbon == .poetry }.count, 3)
    XCTAssertEqual(deck.filter { $0.ribbon == .blue }.count, 3)
    XCTAssertEqual(deck.filter { $0.ribbon == .plain }.count, 4)

    // The willow oddities and the paulownia extra chaff.
    let willow = deck.filter { $0.month == 11 }
    XCTAssertEqual(willow.map(\.kind), [.bright, .animal, .ribbon, .chaff])
    let paulownia = deck.filter { $0.month == 12 }
    XCTAssertEqual(paulownia.filter { $0.kind == .chaff }.count, 3)
  }

  // MARK: - Deal shape

  func testDealIsEightEightEight() {
    let engine = HanafudaEngine(random: { 0.42 })

    XCTAssertEqual(engine.playerHand.count, 8)
    XCTAssertEqual(engine.botHand.count, 8)
    XCTAssertEqual(engine.field.count, 8)
    XCTAssertEqual(engine.deck.count, 24)

    // The player deals (and leads) round 1.
    XCTAssertEqual(engine.dealer, .player)
    XCTAssertEqual(engine.turn, .player)
    XCTAssertEqual(engine.phase, .selectHand)
  }

  // MARK: - Month matching capture

  func testPlayingAMatchingCardCapturesBothAndFlipsTheDeck() {
    let engine = HanafudaEngine(random: { 0.42 })
    engine.dealArranged(arrangedDeck())

    // The crane (id 0, month 1) matches the single pine ribbon (id 1) on
    // the field; the flip (Pine Chaff id 2) then also matches... the pine
    // pair was just captured, so it lands on the field instead.
    engine.playHandCard(0)

    XCTAssertEqual(engine.playerCaptured.map(\.id).sorted(), [0, 1])
    XCTAssertEqual(engine.playerHand.count, 7)
    // 8 field - 1 captured + 1 flipped discard = 8.
    XCTAssertEqual(engine.field.count, 8)
    XCTAssertTrue(engine.field.contains { $0.id == 2 })
    XCTAssertEqual(engine.deck.count, 23)
    // Crane + ribbon is no yaku, so the turn passes to the bot.
    XCTAssertEqual(engine.turn, .bot)
    XCTAssertEqual(engine.phase, .botTurn)
  }

  func testDiscardingANonMatchingCardAddsItToTheField() {
    let engine = HanafudaEngine(random: { 0.42 })
    engine.dealArranged(arrangedDeck())

    // The Bush Warbler (id 4, month 2): no February card on the field, so
    // the hand play discards. The flip (Pine Chaff id 2) then pairs with
    // the pine ribbon (id 1) still sitting on the field.
    engine.playHandCard(4)

    XCTAssertTrue(engine.lastReport?.playedCaptured.isEmpty ?? false)
    XCTAssertTrue(engine.field.contains { $0.id == 4 })
    XCTAssertEqual(engine.playerCaptured.map(\.id).sorted(), [1, 2])
    XCTAssertEqual(engine.turn, .bot)
  }

  // MARK: - Yaku evaluation

  func testSankoRequiresThreeDryBrights() {
    let crane = card(HanafudaEngine.craneId)
    let curtain = card(HanafudaEngine.curtainId)
    let moon = card(HanafudaEngine.moonId)
    let rain = card(HanafudaEngine.rainManId)

    let sanko = HanafudaEngine.evaluateYaku([crane, curtain, moon])
    XCTAssertEqual(sanko.map(\.key), ["sanko"])
    XCTAssertEqual(sanko[0].points, 6)

    // Rain Man does not count toward sanko: three brights including him
    // score nothing on the bright track.
    let withRain = HanafudaEngine.evaluateYaku([crane, curtain, rain])
    XCTAssertTrue(withRain.isEmpty)

    // Four with rain is ame-shiko (7); four dry is shiko (8); five is goko.
    let phoenix = card(HanafudaEngine.phoenixId)
    XCTAssertEqual(
      HanafudaEngine.evaluateYaku([crane, curtain, moon, rain]).map(\.points), [7]
    )
    XCTAssertEqual(
      HanafudaEngine.evaluateYaku([crane, curtain, moon, phoenix]).map(\.points), [8]
    )
    XCTAssertEqual(
      HanafudaEngine.evaluateYaku([crane, curtain, moon, rain, phoenix]).map(\.points), [15]
    )
  }

  func testHanamiZakeIsCurtainPlusSakeCup() {
    let yaku = HanafudaEngine.evaluateYaku([
      card(HanafudaEngine.curtainId), card(HanafudaEngine.sakeCupId),
    ])
    XCTAssertEqual(yaku.map(\.key), ["hanami-zake"])
    XCTAssertEqual(yaku[0].points, 5)

    // Adding the moon stacks tsukimi-zake on top.
    let both = HanafudaEngine.evaluateYaku([
      card(HanafudaEngine.curtainId), card(HanafudaEngine.sakeCupId), card(HanafudaEngine.moonId),
    ])
    XCTAssertTrue(both.contains { $0.key == "hanami-zake" })
    XCTAssertTrue(both.contains { $0.key == "tsukimi-zake" })
  }

  func testAkatanIsThePoetryRibbons() {
    // Ids 1, 5, 9: the pine/plum/cherry poetry ribbons.
    let yaku = HanafudaEngine.evaluateYaku([card(1), card(5), card(9)])
    XCTAssertEqual(yaku.map(\.key), ["akatan"])
    XCTAssertEqual(yaku[0].points, 5)

    // Two of them are not enough.
    XCTAssertTrue(HanafudaEngine.evaluateYaku([card(1), card(5)]).isEmpty)
  }

  func testKasuCountsOnePointPlusOnePerExtraChaff() {
    // Ten chaff cards: 1 point; every extra adds one.
    let tenChaff = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19].map(card)
    let ten = HanafudaEngine.evaluateYaku(tenChaff)
    XCTAssertEqual(ten.map(\.key), ["kasu"])
    XCTAssertEqual(ten[0].points, 1)

    let twelve = HanafudaEngine.evaluateYaku(tenChaff + [card(22), card(23)])
    XCTAssertEqual(twelve[0].points, 3)

    // Nine chaff is nothing.
    XCTAssertTrue(HanafudaEngine.evaluateYaku(Array(tenChaff.dropLast())).isEmpty)
  }

  // MARK: - Koi-koi scoring house rules

  func testKoiKoiThenBiggerWinAppliesStandardScoring() {
    let engine = HanafudaEngine(random: { 0.42 })
    engine.dealArranged(arrangedDeck())

    // The player forms akatan (5 points) and calls koi-koi...
    engine.setCaptured([card(1), card(5), card(9)], for: .player)
    engine.phase = .decision
    engine.declareKoiKoi()
    XCTAssertTrue(engine.playerCalledKoiKoi)
    XCTAssertEqual(engine.turn, .bot)

    // ...then grows the hand to 7 points (akatan 5 + tan with 6 ribbons 2)
    // and banks. Own koi-koi carries no penalty; 7+ doubles → 14.
    engine.setCaptured([card(1), card(5), card(9), card(13), card(17), card(25)], for: .player)
    engine.phase = .decision
    engine.declareShobu()

    XCTAssertEqual(engine.results.last?.winner, .player)
    XCTAssertEqual(engine.results.last?.basePoints, 7)
    XCTAssertEqual(engine.results.last?.score, 14)
    XCTAssertEqual(engine.playerScores, [14])
    XCTAssertEqual(engine.botScores, [0])
  }

  func testWinningAfterOpponentsKoiKoiDoubles() {
    let engine = HanafudaEngine(random: { 0.42 })
    engine.dealArranged(arrangedDeck())

    // The bot called koi-koi earlier in the round; the player banks akatan
    // (5 points): 5 x 2 = 10. Below 7, so no big-hand double.
    engine.botCalledKoiKoi = true
    engine.setCaptured([card(1), card(5), card(9)], for: .player)
    engine.phase = .decision
    engine.declareShobu()

    XCTAssertEqual(engine.results.last?.basePoints, 5)
    XCTAssertEqual(engine.results.last?.score, 10)
  }

  func testRoundScoreMultipliersStack() {
    // Plain hands score face value.
    XCTAssertEqual(HanafudaEngine.roundScore(points: 5, opponentCalledKoiKoi: false), 5)
    // 7+ doubles.
    XCTAssertEqual(HanafudaEngine.roundScore(points: 7, opponentCalledKoiKoi: false), 14)
    // Opponent's koi-koi doubles.
    XCTAssertEqual(HanafudaEngine.roundScore(points: 5, opponentCalledKoiKoi: true), 10)
    // Both multipliers stack: 8 → 16 → 32.
    XCTAssertEqual(HanafudaEngine.roundScore(points: 8, opponentCalledKoiKoi: true), 32)
  }

  // MARK: - Helpers

  private func card(_ id: Int) -> HanafudaCard {
    HanafudaEngine.fullDeck[id]
  }

  /// A fixed 48-card arrangement (front-first: player hand, bot hand,
  /// field, draw pile) giving the player a known single pine match.
  private func arrangedDeck() -> [HanafudaCard] {
    let playerHand = [0, 4, 5, 6, 7, 10, 12, 16]
    let botHand = [44, 45, 46, 47, 40, 41, 42, 43]
    let field = [1, 9, 13, 17, 24, 28, 32, 36]
    let dealt = Set(playerHand + botHand + field)
    let draw = [2, 3] + (0..<48).filter { !dealt.contains($0) && $0 != 2 && $0 != 3 }
    return (playerHand + botHand + field + draw).map(card)
  }
}
