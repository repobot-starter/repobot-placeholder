import XCTest
@testable import AppIOS

/// Exercises the pure Ludo rules engine against the web engine.ts rules it
/// mirrors: six-to-exit, captures and safe squares, exact home-column rolls,
/// the triple-six forfeit, and win/placings detection. Dice values are
/// injected directly and the bot takes a fixed random source, so every test
/// is deterministic.
final class LudoEngineTests: XCTestCase {
  /// Two-racer match (red human, green bot) with every token in its yard.
  private func makeGame() -> LudoGameState {
    LudoEngine.createGame(seats: [.human, .bot, .off, .off])
  }

  /// Convenience builder for mid-game positions. `dice` defaults to a
  /// pending-roll state so tests can drive `applyRoll` themselves.
  private func makeState(
    redTokens: [Int],
    greenTokens: [Int] = [-1, -1, -1, -1],
    current: Int = 0,
    dice: Int? = nil,
    sixStreak: Int = 0
  ) -> LudoGameState {
    LudoGameState(
      seats: [.human, .bot, .off, .off],
      tokens: [redTokens, greenTokens, [-1, -1, -1, -1], [-1, -1, -1, -1]],
      current: current,
      dice: dice,
      sixStreak: sixStreak,
      placings: [],
      over: false
    )
  }

  func testExitingTheYardRequiresASix() {
    // A non-six with everyone in the yard has no legal move: turn passes.
    let blocked = LudoEngine.applyRoll(makeGame(), value: 3)
    XCTAssertNil(blocked.dice)
    XCTAssertEqual(blocked.current, 1)

    // A six offers all four yard exits (to progress 0, the start square).
    let rolled = LudoEngine.applyRoll(makeGame(), value: 6)
    XCTAssertEqual(rolled.dice, 6)
    let moves = LudoEngine.legalMoves(rolled)
    XCTAssertEqual(moves.count, 4)
    XCTAssertTrue(moves.allSatisfy { $0.from == -1 && $0.to == 0 && !$0.captures })

    // Playing the exit grants the extra roll: same seat, awaiting a roll.
    let moved = LudoEngine.applyMove(rolled, token: 0)
    XCTAssertEqual(moved.tokens[0][0], 0)
    XCTAssertEqual(moved.current, 0)
    XCTAssertNil(moved.dice)
  }

  func testLandingOnAnOpponentCapturesIt() {
    // Green progress 44 sits on ring index (13 + 44) % 52 = 5, which red
    // reaches from progress 3 with a roll of 2. Ring 5 is not safe.
    let state = makeState(redTokens: [3, -1, -1, -1], greenTokens: [44, -1, -1, -1])
    let rolled = LudoEngine.applyRoll(state, value: 2)
    let moves = LudoEngine.legalMoves(rolled)
    XCTAssertEqual(moves.count, 1)
    XCTAssertTrue(moves[0].captures)

    let moved = LudoEngine.applyMove(rolled, token: 0)
    XCTAssertEqual(moved.tokens[0][0], 5)
    XCTAssertEqual(moved.tokens[1][0], -1, "captured token returns to its yard")
    XCTAssertEqual(moved.current, 1, "a non-six move passes the turn")
  }

  func testSafeSquaresBlockCapture() {
    // Green progress 47 sits on ring index (13 + 47) % 52 = 8 — a safe star.
    // Red lands on it from progress 6 with a roll of 2; both tokens stay.
    let state = makeState(redTokens: [6, -1, -1, -1], greenTokens: [47, -1, -1, -1])
    let rolled = LudoEngine.applyRoll(state, value: 2)
    let moves = LudoEngine.legalMoves(rolled)
    XCTAssertEqual(moves.count, 1)
    XCTAssertFalse(moves[0].captures)

    let moved = LudoEngine.applyMove(rolled, token: 0)
    XCTAssertEqual(moved.tokens[0][0], 8)
    XCTAssertEqual(moved.tokens[1][0], 47, "tokens on safe squares are never captured")
  }

  func testHomeColumnRequiresAnExactRoll() {
    // Progress 54 needs exactly 2 to finish (56). A 4 overshoots, and with
    // no other movable token the turn passes.
    let state = makeState(redTokens: [54, -1, -1, -1], greenTokens: [10, -1, -1, -1])
    let overshoot = LudoEngine.applyRoll(state, value: 4)
    XCTAssertNil(overshoot.dice)
    XCTAssertEqual(overshoot.current, 1)

    let exact = LudoEngine.applyRoll(state, value: 2)
    let moves = LudoEngine.legalMoves(exact)
    XCTAssertEqual(moves.count, 1)
    XCTAssertEqual(moves[0].to, LudoEngine.homeProgress)
    XCTAssertEqual(LudoEngine.applyMove(exact, token: 0).tokens[0][0], LudoEngine.homeProgress)
  }

  func testThreeConsecutiveSixesForfeitTheTurn() {
    // Two sixes already rolled this turn; a token on the ring guarantees the
    // third six would otherwise have a legal move.
    let state = makeState(redTokens: [5, -1, -1, -1], greenTokens: [30, -1, -1, -1], sixStreak: 2)
    let forfeited = LudoEngine.applyRoll(state, value: 6)
    XCTAssertNil(forfeited.dice, "the third six is void — no move is offered")
    XCTAssertEqual(forfeited.current, 1)
    XCTAssertEqual(forfeited.sixStreak, 0)
    XCTAssertEqual(forfeited.tokens[0][0], 5, "no token moves on a forfeit")

    // One and two sixes keep the turn alive.
    let second = LudoEngine.applyRoll(
      makeState(redTokens: [5, -1, -1, -1], greenTokens: [30, -1, -1, -1], sixStreak: 1),
      value: 6
    )
    XCTAssertEqual(second.dice, 6)
    XCTAssertEqual(second.sixStreak, 2)
  }

  func testBringingTheLastTokenHomeWinsAndFillsPlacings() {
    let state = makeState(redTokens: [56, 56, 56, 55], greenTokens: [10, -1, -1, -1])
    let rolled = LudoEngine.applyRoll(state, value: 1)
    let finished = LudoEngine.applyMove(rolled, token: 3)

    XCTAssertTrue(LudoEngine.isSeatFinished(finished, seat: 0))
    XCTAssertTrue(finished.over)
    XCTAssertEqual(finished.placings, [0, 1], "the last remaining racer takes the final placing")

    // A finished match is inert.
    XCTAssertEqual(LudoEngine.applyRoll(finished, value: 6), finished)
  }

  func testBotPrefersCaptureOverPlainAdvance() {
    // Token 0 can capture (green on ring 5); token 1 just advances. With a
    // fixed random source the capture priority must win.
    let state = makeState(
      redTokens: [3, 20, -1, -1],
      greenTokens: [44, -1, -1, -1],
      dice: 2
    )
    XCTAssertEqual(LudoEngine.chooseBotMove(state, random: { 0.5 }), 0)
  }
}
