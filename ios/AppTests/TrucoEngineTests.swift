import XCTest
@testable import AppIOS

/// Exercises the pure Truco engine. The engine takes an injectable random
/// source; `fixedRandom(0.99)` makes every test deterministic: the shuffle is
/// the identity (Int(0.99·(i+1)) == i), the bot never spontaneously raises
/// (its urge caps at 0.8), and with `bluff: 0` it never bluffs.
final class TrucoEngineTests: XCTestCase {
  private func makeEngine(bluff: Double = 0) -> TrucoEngine {
    TrucoEngine(bluff: bluff, random: { 0.99 })
  }

  private func card(_ rank: TrucoRank, _ suit: TrucoSuit) -> TrucoCard {
    TrucoCard(rank: rank, suit: suit)
  }

  // MARK: - Card ordering

  func testManilhaBeatsEverythingAndRanksBySuit() {
    // Vira 4 → manilha is 5 (the rank above the vira).
    XCTAssertEqual(TrucoEngine.manilhaRank(forVira: .four), .five)
    // Wrap: vira 3 → manilha 4.
    XCTAssertEqual(TrucoEngine.manilhaRank(forVira: .three), .four)

    let manilha: TrucoRank = .five
    let zap = TrucoEngine.cardStrength(card(.five, .clubs), manilhaRank: manilha)
    let copas = TrucoEngine.cardStrength(card(.five, .hearts), manilhaRank: manilha)
    let espadas = TrucoEngine.cardStrength(card(.five, .spades), manilhaRank: manilha)
    let ouros = TrucoEngine.cardStrength(card(.five, .diamonds), manilhaRank: manilha)

    // Suit ladder among manilhas: clubs > hearts > spades > diamonds.
    XCTAssertGreaterThan(zap, copas)
    XCTAssertGreaterThan(copas, espadas)
    XCTAssertGreaterThan(espadas, ouros)

    // The weakest manilha still beats the strongest plain card (a 3).
    let bestPlain = TrucoEngine.cardStrength(card(.three, .clubs), manilhaRank: manilha)
    XCTAssertGreaterThan(ouros, bestPlain)
  }

  func testPlainCardRankOrder() {
    // With manilha Q out of the way: 4 < 5 < 6 < 7 < J < K < A < 2 < 3.
    let manilha: TrucoRank = .queen
    let ascending: [TrucoRank] = [.four, .five, .six, .seven, .jack, .king, .ace, .two, .three]
    let strengths = ascending.map {
      TrucoEngine.cardStrength(card($0, .spades), manilhaRank: manilha)
    }
    XCTAssertEqual(strengths, strengths.sorted())
    XCTAssertEqual(Set(strengths).count, strengths.count)

    // Plain cards of equal rank tie regardless of suit.
    XCTAssertEqual(
      TrucoEngine.cardStrength(card(.king, .clubs), manilhaRank: manilha),
      TrucoEngine.cardStrength(card(.king, .diamonds), manilhaRank: manilha)
    )
  }

  // MARK: - Empate rules

  func testTiedFirstTrickIsDecidedByTheSecond() {
    let engine = makeEngine()
    engine.newGame()
    // Vira 7♥ → manilha Q. The bot holds only plain 3s, so trick one (3 vs 3)
    // must tie, and the player's zap (Q♣) then decides trick two.
    engine.setHands(
      playerHand: [card(.three, .spades), card(.queen, .clubs), card(.five, .diamonds)],
      botHand: [card(.three, .hearts), card(.three, .diamonds), card(.three, .clubs)],
      vira: card(.seven, .hearts)
    )

    engine.playCard(at: 0)
    var events = engine.botAct()
    XCTAssertTrue(events.contains(.trickResolved(.tie)))
    XCTAssertEqual(engine.trickResults, [.tie])
    XCTAssertNil(engine.handWinner)
    // A tie keeps the same leader, so the player acts again.
    XCTAssertEqual(engine.phase, .playerTurn)

    // Trick two: the zap manilha beats any plain 3 → hand over immediately.
    engine.playCard(at: 0)
    events = engine.botAct()
    XCTAssertTrue(events.contains(.trickResolved(.player)))
    XCTAssertTrue(events.contains(.handEnded(winner: .player, points: 1)))
    XCTAssertEqual(engine.playerScore, 1)
    XCTAssertEqual(engine.phase, .handOver)
  }

  // MARK: - Raise ladder

  func testRaiseLadderStakes() {
    XCTAssertEqual(TrucoEngine.nextStake(1), 3)
    XCTAssertEqual(TrucoEngine.nextStake(3), 6)
    XCTAssertEqual(TrucoEngine.nextStake(6), 9)
    XCTAssertEqual(TrucoEngine.nextStake(9), 12)
    XCTAssertNil(TrucoEngine.nextStake(12))

    let engine = makeEngine()
    engine.newGame()
    // Bot hand strength 0.955 (zap + copas manilhas + a 3): it always
    // re-raises, walking the ladder without any randomness.
    engine.setHands(
      playerHand: [card(.four, .diamonds), card(.five, .diamonds), card(.six, .diamonds)],
      botHand: [card(.queen, .clubs), card(.queen, .hearts), card(.three, .diamonds)],
      vira: card(.seven, .hearts)
    )

    // Player: "Truco!" (3). Bot accepts and re-raises to 6.
    var events = engine.playerCallRaise()
    XCTAssertTrue(events.contains(.botRaised(toStake: 6)))
    XCTAssertEqual(engine.stake, 3)
    XCTAssertEqual(engine.proposedStake, 6)
    XCTAssertEqual(engine.phase, .respond)

    // Player: "Nove!" (re-raise 6 → 9). Bot re-raises to 12.
    events = engine.respondToRaise(.raise)
    XCTAssertTrue(events.contains(.botRaised(toStake: 12)))
    XCTAssertEqual(engine.stake, 9)
    XCTAssertEqual(engine.proposedStake, 12)

    // Player accepts Doze: the hand is now worth 12 and play resumes.
    engine.respondToRaise(.accept)
    XCTAssertEqual(engine.stake, 12)
    XCTAssertNil(engine.proposedStake)
    XCTAssertEqual(engine.phase, .playerTurn)
    // The ladder is exhausted: nobody can raise above 12.
    XCTAssertFalse(engine.canRaise(.player))
  }

  func testFoldAwardsTheCurrentStake() {
    // Bot folds to "Truco!": the player wins the pre-raise stake (1).
    let weakBot = makeEngine()
    weakBot.newGame()
    weakBot.setHands(
      playerHand: [card(.three, .spades), card(.two, .spades), card(.ace, .spades)],
      botHand: [card(.four, .diamonds), card(.five, .hearts), card(.six, .diamonds)],
      vira: card(.seven, .hearts)
    )
    let events = weakBot.playerCallRaise()
    XCTAssertTrue(events.contains(.botFolded))
    XCTAssertTrue(events.contains(.handEnded(winner: .player, points: 1)))
    XCTAssertEqual(weakBot.playerScore, 1)
    XCTAssertEqual(weakBot.botScore, 0)

    // Player folds to the bot's re-raise to 6: the bot wins the accepted 3.
    let strongBot = makeEngine()
    strongBot.newGame()
    strongBot.setHands(
      playerHand: [card(.four, .diamonds), card(.five, .diamonds), card(.six, .diamonds)],
      botHand: [card(.queen, .clubs), card(.queen, .hearts), card(.three, .diamonds)],
      vira: card(.seven, .hearts)
    )
    strongBot.playerCallRaise() // Truco → bot re-raises to 6, stake now 3.
    XCTAssertEqual(strongBot.stake, 3)
    strongBot.respondToRaise(.fold)
    XCTAssertEqual(strongBot.botScore, 3)
    XCTAssertEqual(strongBot.phase, .handOver)
  }

  // MARK: - Mão de onze

  func testMaoDeOnzePlayLocksStakeAtThree() {
    let engine = makeEngine()
    engine.setScores(player: 11, bot: 5)
    engine.startHand()
    XCTAssertEqual(engine.phase, .maoDeOnze)

    engine.decideMaoDeOnze(play: true)
    XCTAssertEqual(engine.stake, 3)
    // No truco calls on a mão de onze hand.
    XCTAssertEqual(engine.phase, .playerTurn)
    XCTAssertFalse(engine.canRaise(.player))
    XCTAssertEqual(engine.playerCallRaise(), [])
  }

  func testMaoDeOnzeFoldConcedesOnePoint() {
    let engine = makeEngine()
    engine.setScores(player: 11, bot: 5)
    engine.startHand()

    let events = engine.decideMaoDeOnze(play: false)
    XCTAssertTrue(events.contains(.handEnded(winner: .bot, points: 1)))
    XCTAssertEqual(engine.botScore, 6)
    XCTAssertEqual(engine.phase, .handOver)
  }

  func testBotFoldsItsOwnWeakMaoDeOnze() {
    // With random() == 0.99 the shuffle is the identity, dealing the bot
    // 7♦ Q♦ J♦ (strength 0.38 < 0.5) — with bluff 0 it must fold, handing
    // the player 1 point.
    let engine = makeEngine()
    engine.setScores(player: 5, bot: 11)
    let events = engine.startHand()
    XCTAssertTrue(events.contains(.handEnded(winner: .player, points: 1)))
    XCTAssertEqual(engine.playerScore, 6)
    XCTAssertEqual(engine.phase, .handOver)
  }

  // MARK: - Game end

  func testWinningHandAtElevenReachesTwelveAndEndsTheGame() {
    let engine = makeEngine()
    engine.newGame()
    engine.setScores(player: 11, bot: 0)
    // Two manilhas take two straight tricks against a plain bot hand.
    engine.setHands(
      playerHand: [card(.queen, .clubs), card(.queen, .hearts), card(.four, .diamonds)],
      botHand: [card(.four, .spades), card(.five, .spades), card(.six, .spades)],
      vira: card(.seven, .hearts)
    )

    engine.playCard(at: 0)
    engine.botAct()
    XCTAssertEqual(engine.trickResults, [.player])

    engine.playCard(at: 0)
    let events = engine.botAct()
    XCTAssertTrue(events.contains(.handEnded(winner: .player, points: 1)))
    XCTAssertTrue(events.contains(.gameEnded(winner: .player)))
    XCTAssertEqual(engine.playerScore, TrucoEngine.winningScore)
    XCTAssertEqual(engine.gameWinner, .player)
    XCTAssertEqual(engine.phase, .gameOver)

    // A finished game is inert until newGame().
    XCTAssertEqual(engine.startHand(), [])
    XCTAssertEqual(engine.playCard(at: 0), [])
  }
}
