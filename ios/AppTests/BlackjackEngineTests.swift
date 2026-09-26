import XCTest
@testable import AppIOS

/// Exercises the pure blackjack engine against the web `cards.ts` /
/// `BlackjackPage.tsx` rules it mirrors: soft/hard hand valuation, the
/// dealer's stand-on-all-17s policy, 3:2 naturals, double down, pushes, the
/// 25% reshuffle point, and shuffle determinism under an injected RNG.
final class BlackjackEngineTests: XCTestCase {
  // MARK: - Hand valuation

  func testHandTotalsWithAces() {
    // Hard hand, no aces.
    XCTAssertEqual(total(of: [.king, .seven]), BlackjackHandTotal(total: 17, soft: false))

    // A+6 is soft 17: the ace still counts 11.
    XCTAssertEqual(total(of: [.ace, .six]), BlackjackHandTotal(total: 17, soft: true))

    // A+6+9: the ace must demote to 1 to avoid busting — hard 16.
    XCTAssertEqual(total(of: [.ace, .six, .nine]), BlackjackHandTotal(total: 16, soft: false))

    // Two aces: one stays 11, one demotes — soft 12.
    XCTAssertEqual(total(of: [.ace, .ace]), BlackjackHandTotal(total: 12, soft: true))

    // Three aces + 8: A+A+A+8 = 11+1+1+8 — soft 21.
    XCTAssertEqual(total(of: [.ace, .ace, .ace, .eight]), BlackjackHandTotal(total: 21, soft: true))

    // All aces demoted and still over 21 stays a bust total.
    XCTAssertEqual(
      total(of: [.ace, .king, .queen, .two]),
      BlackjackHandTotal(total: 23, soft: false)
    )
  }

  func testBlackjackIsExactlyTwoCardTwentyOne() {
    XCTAssertTrue(BlackjackEngine.isBlackjack(hand([.ace, .king])))
    // 21 in three cards is not a natural.
    XCTAssertFalse(BlackjackEngine.isBlackjack(hand([.seven, .seven, .seven])))
    XCTAssertFalse(BlackjackEngine.isBlackjack(hand([.ace, .nine])))
  }

  // MARK: - Dealer policy

  func testDealerDrawsToSeventeenThenStands() {
    // Player 20 vs dealer 2+4: the dealer must keep drawing while under 17
    // (10 → 16, then 5 → 21) and stop the moment it reaches 17 or more.
    let engine = makeDealtEngine(
      bet: 10,
      playerRanks: [.ten, .queen],
      dealerRanks: [.two, .four],
      shoeRanks: [.ten, .five, .nine]
    )
    engine.stand()
    finishDealerTurn(engine)

    // Drew exactly 10 and 5 (the trailing 9 stays in the shoe).
    XCTAssertEqual(engine.dealerCards.count, 4)
    XCTAssertEqual(BlackjackEngine.handTotal(of: engine.dealerCards).total, 21)
  }

  func testDealerStandsOnSoftSeventeen() {
    // Dealer A+6 is soft 17. The web draw condition is `total < 17`, so the
    // dealer stands — it must not draw the ten waiting in the shoe.
    let engine = makeDealtEngine(
      bet: 10,
      playerRanks: [.ten, .eight],
      dealerRanks: [.ace, .six],
      shoeRanks: [.ten]
    )
    engine.stand()
    finishDealerTurn(engine)

    XCTAssertEqual(engine.dealerCards.count, 2)
    XCTAssertEqual(
      BlackjackEngine.handTotal(of: engine.dealerCards),
      BlackjackHandTotal(total: 17, soft: true)
    )
    // Player 18 beats dealer soft 17.
    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .win, net: 10))
  }

  func testDealerStandsOnHardSeventeenAndWinsShowdown() {
    let engine = makeDealtEngine(
      bet: 10,
      playerRanks: [.nine, .seven],
      dealerRanks: [.ten, .seven],
      shoeRanks: [.five]
    )
    engine.stand()
    finishDealerTurn(engine)

    XCTAssertEqual(engine.dealerCards.count, 2)
    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .lose, net: -10))
    XCTAssertEqual(engine.bankroll, 490)
  }

  // MARK: - Payouts

  func testBlackjackPaysThreeToTwo() {
    // Player A+K natural vs dealer 20: pays 3:2 — $10 stake returns $25.
    let engine = makeDealtEngine(
      bet: 10,
      playerRanks: [.ace, .king],
      dealerRanks: [.ten, .queen],
      shoeRanks: []
    )

    XCTAssertEqual(engine.phase, .settled)
    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .blackjack, net: 15))
    XCTAssertEqual(engine.bankroll, 515)
  }

  func testBlackjackOnOddBetPaysFractionalCents() {
    // The web allows fractional payouts (a $5 chip is odd for 3:2): $5
    // natural nets $7.50.
    let engine = makeDealtEngine(
      bet: 5,
      playerRanks: [.ace, .queen],
      dealerRanks: [.nine, .eight],
      shoeRanks: []
    )

    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .blackjack, net: 7.5))
    XCTAssertEqual(engine.bankroll, 507.5)
  }

  func testDealerNaturalBeatsPlayerTwentyOne() {
    // Both dealt naturals push; a player 21 that is NOT a natural still loses
    // to a dealer natural. Here both have 21 but only the dealer's is dealt.
    let engine = makeDealtEngine(
      bet: 20,
      playerRanks: [.ten, .nine],
      dealerRanks: [.ace, .king],
      shoeRanks: []
    )

    XCTAssertEqual(engine.phase, .settled)
    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .lose, net: -20))
  }

  func testBothNaturalsPush() {
    let engine = makeDealtEngine(
      bet: 20,
      playerRanks: [.ace, .king],
      dealerRanks: [.ace, .queen],
      shoeRanks: []
    )

    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .push, net: 0))
    XCTAssertEqual(engine.bankroll, 500)
  }

  func testPushReturnsBet() {
    // Player 18 vs dealer 18: the stake comes back, bankroll unchanged.
    let engine = makeDealtEngine(
      bet: 25,
      playerRanks: [.ten, .eight],
      dealerRanks: [.ten, .eight],
      shoeRanks: []
    )
    engine.stand()
    finishDealerTurn(engine)

    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .push, net: 0))
    XCTAssertEqual(engine.bankroll, 500)
    XCTAssertEqual(engine.stats.pushes, 1)
  }

  func testBustLosesImmediatelyWithoutDealerDraw() {
    let engine = makeDealtEngine(
      bet: 10,
      playerRanks: [.ten, .six],
      dealerRanks: [.two, .three],
      shoeRanks: [.king, .nine]
    )
    engine.hit()

    // 10+6+K busts: settled on the spot, dealer keeps two cards.
    XCTAssertEqual(engine.phase, .settled)
    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .bust, net: -10))
    XCTAssertEqual(engine.dealerCards.count, 2)
    XCTAssertFalse(engine.holeHidden)
  }

  // MARK: - Double down

  func testDoubleDownDoublesBetAndDrawsExactlyOneCard() {
    // Player 5+6 doubles: bet 10 → 20, one card (9 → 20), then the dealer
    // plays out and loses with 19.
    let engine = makeDealtEngine(
      bet: 10,
      playerRanks: [.five, .six],
      dealerRanks: [.ten, .six],
      shoeRanks: [.nine, .three, .king]
    )
    XCTAssertTrue(engine.canDouble)
    engine.doubleDown()

    XCTAssertEqual(engine.bet, 20)
    XCTAssertEqual(engine.playerCards.count, 3)
    // No further player actions: the hand went straight to the dealer.
    XCTAssertNotEqual(engine.phase, .player)

    finishDealerTurn(engine)
    // Dealer 16 draws the 3 → 19; player 20 wins a doubled stake.
    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .win, net: 20))
    XCTAssertEqual(engine.bankroll, 520)
  }

  func testDoubleDownBustSettlesImmediatelyAndLosesDoubledBet() {
    let engine = makeDealtEngine(
      bet: 10,
      playerRanks: [.eight, .seven],
      dealerRanks: [.ten, .six],
      shoeRanks: [.king]
    )
    engine.doubleDown()

    XCTAssertEqual(engine.phase, .settled)
    XCTAssertEqual(engine.playerCards.count, 3)
    XCTAssertEqual(engine.result, BlackjackHandResult(kind: .bust, net: -20))
    XCTAssertEqual(engine.bankroll, 480)
  }

  func testDoubleDownRequiresTwoCardsAndCoveringBankroll() {
    // After a hit the double option is gone, like the web canDouble.
    let engine = makeDealtEngine(
      bet: 10,
      playerRanks: [.two, .three],
      dealerRanks: [.ten, .six],
      shoeRanks: [.four, .five, .six]
    )
    engine.hit()
    XCTAssertFalse(engine.canDouble)

    // A bet the bankroll cannot match twice also cannot double: bankroll 500,
    // bet 500 → after dealing the bankroll is 0 < bet.
    let broke = BlackjackEngine(bankroll: 500, random: { 0.5 })
    for _ in 0..<5 { broke.addChip(100) }
    broke.setShoe(fullDrawShoe([.two, .three, .ten, .six]))
    broke.deal()
    if broke.phase == .player {
      XCTAssertFalse(broke.canDouble)
    }
  }

  // MARK: - Shoe & determinism

  func testShoeReshufflesAtQuarterRemaining() {
    // 25% of the six-deck shoe: floor(312 * 0.25) = 78 cards.
    XCTAssertEqual(BlackjackEngine.reshuffleAt, 78)

    // First draw of a session: the empty shoe reshuffles immediately (the
    // web's shoe ref also starts empty for exactly this reason).
    let fresh = BlackjackEngine(random: { 0.5 })
    fresh.addChip(5)
    fresh.deal()
    XCTAssertEqual(fresh.shuffleCount, 1)
    XCTAssertEqual(fresh.shoeCount, BlackjackEngine.shoeSize - 4)

    // A shoe holding more than reshuffleAt cards through the whole deal must
    // NOT reshuffle: 78 + 1 filler cards under the 4 scripted draws.
    let above = BlackjackEngine(random: { 0.5 })
    above.addChip(5)
    above.setShoe(
      Array(repeating: card(.two, .clubs), count: BlackjackEngine.reshuffleAt + 1)
        + hand([.six, .ten, .five, .nine].reversed())
    )
    above.deal()
    XCTAssertEqual(above.shuffleCount, 0)
    XCTAssertEqual(above.shoeCount, BlackjackEngine.reshuffleAt + 1)

    // At exactly reshuffleAt cards the next draw rebuilds the shoe first.
    let at = BlackjackEngine(random: { 0.5 })
    at.addChip(5)
    at.setShoe(Array(repeating: card(.two, .clubs), count: BlackjackEngine.reshuffleAt))
    at.deal()
    XCTAssertEqual(at.shuffleCount, 1)
    XCTAssertEqual(at.shoeCount, BlackjackEngine.shoeSize - 4)
  }

  func testInjectedRandomMakesDealsDeterministic() {
    // Two engines fed the same LCG sequence must shuffle identical shoes and
    // therefore deal identical hands.
    let first = BlackjackEngine(random: makeSeededRandom(seed: 42))
    let second = BlackjackEngine(random: makeSeededRandom(seed: 42))
    for engine in [first, second] {
      engine.addChip(25)
      engine.deal()
    }
    XCTAssertEqual(first.playerCards, second.playerCards)
    XCTAssertEqual(first.dealerCards, second.dealerCards)

    // A different seed produces a different deal (overwhelmingly likely for
    // any two of the 312! shoe orders; fixed seeds keep this deterministic).
    let third = BlackjackEngine(random: makeSeededRandom(seed: 7))
    third.addChip(25)
    third.deal()
    XCTAssertNotEqual(
      first.playerCards + first.dealerCards,
      third.playerCards + third.dealerCards
    )
  }

  func testBankrollArithmeticAcrossBetting() {
    let engine = BlackjackEngine(random: { 0.5 })

    // Chips accumulate and clamp to the bankroll.
    engine.addChip(100)
    engine.addChip(100)
    XCTAssertEqual(engine.bet, 200)
    engine.clearBet()
    XCTAssertEqual(engine.bet, 0)

    // The stake leaves the bankroll at deal time.
    engine.addChip(25)
    engine.setShoe(fullDrawShoe([.two, .three, .ten, .six]))
    engine.deal()
    XCTAssertEqual(engine.bankroll, 475)
    XCTAssertEqual(engine.shuffleCount, 0)
  }

  func testHouseCreditRestoresStartingBankroll() {
    let engine = BlackjackEngine(bankroll: 0, random: { 0.5 })
    XCTAssertTrue(engine.isBroke)
    engine.takeHouseCredit()
    XCTAssertEqual(engine.bankroll, BlackjackEngine.startingBankroll)
    XCTAssertFalse(engine.isBroke)
  }

  // MARK: - Helpers

  private func card(_ rank: BlackjackRank, _ suit: BlackjackSuit = .spades) -> BlackjackCard {
    BlackjackCard(rank: rank, suit: suit)
  }

  private func hand(_ ranks: [BlackjackRank]) -> [BlackjackCard] {
    ranks.map { card($0) }
  }

  private func total(of ranks: [BlackjackRank]) -> BlackjackHandTotal {
    BlackjackEngine.handTotal(of: hand(ranks))
  }

  /// Builds a shoe that deals `draws` in order, padded with filler twos so
  /// the draw count never crosses the reshuffle point. The engine pops from
  /// the END of the shoe (web `shoe.pop()`), so the draw order is reversed
  /// onto the padding.
  private func fullDrawShoe(_ draws: [BlackjackRank]) -> [BlackjackCard] {
    Array(repeating: card(.two, .clubs), count: BlackjackEngine.shoeSize - draws.count)
      + hand(draws.reversed())
  }

  /// Engine mid-hand: bet placed and cards dealt exactly as scripted —
  /// player `playerRanks`, dealer `dealerRanks`, with `shoeRanks` next up.
  private func makeDealtEngine(
    bet: Int,
    playerRanks: [BlackjackRank],
    dealerRanks: [BlackjackRank],
    shoeRanks: [BlackjackRank]
  ) -> BlackjackEngine {
    let engine = BlackjackEngine(random: { 0.5 })
    var addedBet = 0
    while addedBet < bet {
      let chip = min(5, bet - addedBet)
      engine.addChip(chip)
      addedBet += chip
    }
    // Deal order is player, dealer up, player, dealer hole.
    let dealt: [BlackjackRank] = [
      playerRanks[0], dealerRanks[0], playerRanks[1], dealerRanks[1],
    ]
    engine.setShoe(fullDrawShoe(dealt + shoeRanks))
    engine.deal()
    return engine
  }

  /// Runs the dealer's paced draw loop to completion, like the view does.
  private func finishDealerTurn(_ engine: BlackjackEngine) {
    while engine.phase == .dealer {
      engine.dealerStep()
    }
  }

  /// Deterministic uniform source: a 64-bit LCG mapped into [0, 1).
  private func makeSeededRandom(seed: UInt64) -> () -> Double {
    var state = seed
    return {
      state = state &* 6_364_136_223_846_793_005 &+ 1_442_695_040_888_963_407
      return Double(state >> 11) / Double(UInt64(1) << 53)
    }
  }
}
