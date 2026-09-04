import XCTest
@testable import AppIOS

/// Exercises the pure tawla (backgammon) engine against the web engine.ts
/// rules it mirrors: move generation, doubles, hitting, bar entry, bear-off
/// legality, the forced higher-die rule, and gammon/backgammon scoring.
/// Dice go through an injected random source, so every test is deterministic.
final class TawlaEngineTests: XCTestCase {
  /// An empty board with the given bar/off tallies; tests place checkers.
  private func emptyPosition(
    whiteBar: Int = 0, blackBar: Int = 0, whiteOff: Int = 0, blackOff: Int = 0
  ) -> TawlaPosition {
    TawlaPosition(
      points: [Int](repeating: 0, count: 24),
      whiteBar: whiteBar, blackBar: blackBar,
      whiteOff: whiteOff, blackOff: blackOff
    )
  }

  func testLegalTurnsForKnownRollFromStart() {
    // White 3-1 from the start: every turn plays both dice, and the classic
    // "make the 5-point" play (8/5 6/5, indices 7->4 and 5->4) is available.
    let turns = TawlaEngine.legalTurns(TawlaEngine.initialPosition(), .white, dice: [3, 1])

    XCTAssertFalse(turns.isEmpty)
    XCTAssertTrue(turns.allSatisfy { $0.moves.count == 2 })
    XCTAssertTrue(
      turns.contains { TawlaEngine.checkers($0.result, .white, at: 4) == 2 },
      "3-1 must allow making the 5-point"
    )
  }

  func testDoublesPlayFourMoves() {
    let turns = TawlaEngine.legalTurns(TawlaEngine.initialPosition(), .white, dice: [2, 2])

    XCTAssertFalse(turns.isEmpty)
    XCTAssertTrue(turns.allSatisfy { $0.moves.count == 4 }, "double 2s must play four checkers")
  }

  func testHittingABlotSendsItToTheBar() {
    var position = TawlaEngine.initialPosition()
    position.points[20] = -1  // black blot on index 20 (White's 21-point)

    let turns = TawlaEngine.legalTurns(position, .white, dice: [3, 4])
    let hit = turns.first { turn in turn.moves.contains { $0.hit && $0.to == 20 } }

    XCTAssertNotNil(hit, "24/21 with the 3 must hit the blot")
    XCTAssertEqual(hit?.result.blackBar, 1)
    XCTAssertEqual(hit.map { TawlaEngine.checkers($0.result, .white, at: 20) }, 1)
  }

  func testMustEnterFromTheBarFirst() {
    var position = TawlaEngine.initialPosition()
    position.points[23] = 1
    position.whiteBar = 1

    // Entry with the 6 lands on index 18 (blocked by five black checkers),
    // so every turn must start by entering with the 3 on index 21.
    let turns = TawlaEngine.legalTurns(position, .white, dice: [6, 3])

    XCTAssertFalse(turns.isEmpty)
    XCTAssertTrue(turns.allSatisfy { $0.moves[0].from == TawlaEngine.barIndex })
    XCTAssertTrue(turns.allSatisfy { $0.moves[0].to == 21 && $0.moves[0].die == 3 })
  }

  func testBearOffLegality() {
    // White home: two checkers on the 4-point (index 3), one on the 2-point
    // (index 1). A 6 overshoots, so only the rearmost checkers bear off;
    // a 2 bears off the 2-point checker exactly.
    var position = emptyPosition(whiteOff: 12)
    position.points[3] = 2
    position.points[1] = 1
    position.points[0] = -2

    let sixes = TawlaEngine.legalSingleMoves(position, .white, die: 6)
    XCTAssertFalse(sixes.isEmpty)
    XCTAssertTrue(sixes.allSatisfy { $0.to == TawlaEngine.offIndex && $0.from == 3 })

    let twos = TawlaEngine.legalSingleMoves(position, .white, die: 2)
    XCTAssertTrue(twos.contains { $0.from == 1 && $0.to == TawlaEngine.offIndex })

    // A checker outside the home board forbids bearing off entirely.
    position.points[10] = 1
    let blocked = TawlaEngine.legalSingleMoves(position, .white, die: 6)
    XCTAssertTrue(blocked.allSatisfy { $0.to != TawlaEngine.offIndex })
  }

  func testForcedHigherDieRule() {
    // Lone white runner on the 24-point. 24/18 (the 6) and 24/19 (the 5)
    // are both open, but every continuation is blocked — only one die can
    // be played, so the higher (6) is forced.
    var position = emptyPosition()
    position.points[23] = 1
    position.points[12] = -2  // blocks 6-then-5 and 5-then-6 (both land on index 12)
    position.points[11] = -2  // blocks re-running with the same die pairs

    let turns = TawlaEngine.legalTurns(position, .white, dice: [6, 5])

    XCTAssertFalse(turns.isEmpty)
    XCTAssertTrue(turns.allSatisfy { $0.moves.count == 1 }, "only one die is playable")
    XCTAssertTrue(turns.allSatisfy { $0.moves[0].die == 6 }, "the higher die must play")
  }

  func testGammonAndBackgammonScoring() {
    // White borne off completely; Black has borne off nothing: gammon (2).
    var position = emptyPosition(whiteOff: 15)
    position.points[10] = -15
    XCTAssertEqual(
      TawlaEngine.winResult(position),
      TawlaGameResult(winner: .white, points: 2, kind: .gammon)
    )

    // A black checker in White's home board upgrades it to backgammon (3).
    position.points[10] = -14
    position.points[2] = -1
    XCTAssertEqual(
      TawlaEngine.winResult(position),
      TawlaGameResult(winner: .white, points: 3, kind: .backgammon)
    )

    // A black checker on the bar is a backgammon too.
    position.points[2] = 0
    position.blackBar = 1
    position.points[10] = -14
    XCTAssertEqual(
      TawlaEngine.winResult(position),
      TawlaGameResult(winner: .white, points: 3, kind: .backgammon)
    )

    // Black has borne one off: just a single game (1 point).
    position.blackBar = 0
    position.points[10] = -13
    position.blackOff = 2
    XCTAssertEqual(
      TawlaEngine.winResult(position),
      TawlaGameResult(winner: .white, points: 1, kind: .single)
    )

    // No winner while checkers remain on the board.
    XCTAssertNil(TawlaEngine.winResult(TawlaEngine.initialPosition()))
  }

  func testDeterministicDiceWithInjectedRandom() {
    // random() == 0.5 -> die 4 every time; the opening roll-off consumes an
    // alternating source until the tie breaks.
    XCTAssertEqual(TawlaEngine.rollDie(random: { 0.5 }), 4)
    XCTAssertEqual(TawlaEngine.rollDie(random: { 0.0 }), 1)
    XCTAssertEqual(TawlaEngine.rollDie(random: { 0.99 }), 6)

    var draws = [0.9, 0.1]  // white 6, black 1 — no tie, white starts
    let opening = TawlaEngine.rollOpening(random: { draws.removeFirst() })
    XCTAssertEqual(opening.whiteDie, 6)
    XCTAssertEqual(opening.blackDie, 1)
    XCTAssertEqual(opening.starter, .white)
  }

  func testStartingPipCountsAndBotPicksLegalTurn() {
    let start = TawlaEngine.initialPosition()
    XCTAssertEqual(TawlaEngine.pipCount(start, .white), 167)
    XCTAssertEqual(TawlaEngine.pipCount(start, .black), 167)

    // The medium bot must return one of the enumerated legal turns.
    let turns = TawlaEngine.legalTurns(start, .black, dice: [6, 1])
    let pick = TawlaEngine.findBotTurn(start, .black, dice: [6, 1], level: .medium)
    XCTAssertNotNil(pick)
    XCTAssertTrue(turns.contains { $0.result == pick?.result })
  }
}
