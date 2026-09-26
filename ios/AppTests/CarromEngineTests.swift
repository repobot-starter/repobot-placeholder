import XCTest
@testable import AppIOS

/// Exercises the pure carrom simulation. The engine takes an injectable
/// random source (only used for the bot's aim error), so every scenario
/// below is deterministic: pieces are placed with the test hooks and the
/// fixed-timestep physics is pumped with `step(dt:)` until it settles.
final class CarromEngineTests: XCTestCase {
  /// `random() == 0.5` keeps the (unused-here) bot gaussian deterministic.
  private func makeEngine() -> CarromEngine {
    CarromEngine(random: { 0.5 })
  }

  /// Pump the simulation until every body is at rest and the strike has
  /// resolved (phase leaves `.rolling`), collecting all events.
  @discardableResult
  private func settle(_ engine: CarromEngine, maxSeconds: Double = 12) -> [CarromEvent] {
    var events: [CarromEvent] = []
    var elapsed: Double = 0
    while engine.phase == .rolling && elapsed < maxSeconds {
      events.append(contentsOf: engine.step(dt: 1 / 60))
      elapsed += 1 / 60
    }
    XCTAssertNotEqual(engine.phase, .rolling, "simulation failed to settle")
    return events
  }

  func testOpeningRackHasNineCoinsEachAndQueenCentered() {
    let engine = makeEngine()

    XCTAssertEqual(engine.pieces.filter { $0.kind == .white }.count, 9)
    XCTAssertEqual(engine.pieces.filter { $0.kind == .black }.count, 9)
    XCTAssertEqual(engine.queen.x, CarromEngine.boardSize / 2)
    XCTAssertEqual(engine.queen.y, CarromEngine.boardSize / 2)
    XCTAssertEqual(engine.striker.y, CarromEngine.baselineY(for: 0))
    XCTAssertEqual(engine.phase, .aiming)
  }

  func testStruckCoinDeceleratesToRestUnderFriction() {
    let engine = makeEngine()

    // Send the striker along the empty bottom lane; exponential friction
    // must bring it to a stop well before the far wall. Track its position
    // while rolling because resolution respots the striker afterwards.
    engine.placePiece(id: 0, x: 150, y: 500, vx: 200, vy: 0)
    engine.beginRollingForTesting()
    var restingX = 150.0
    var elapsed = 0.0
    while engine.phase == .rolling && elapsed < 12 {
      _ = engine.step(dt: 1 / 60)
      elapsed += 1 / 60
      if engine.phase == .rolling {
        restingX = engine.striker.x
      }
    }

    XCTAssertEqual(engine.phase, .aiming)
    // v0/k is the theoretical travel bound for pure exponential damping.
    XCTAssertLessThan(restingX, 150 + 200 / CarromEngine.friction + 1)
    XCTAssertGreaterThan(restingX, 150 + 50)
    // Nothing pocketed: the turn passes to the opponent.
    XCTAssertEqual(engine.currentPlayer, 1)
  }

  func testHeadOnElasticCollisionTransfersMomentum() {
    let engine = makeEngine()
    guard let coinId = engine.firstPieceId(of: .white) else {
      return XCTFail("no white coin")
    }

    // Striker (mass 1.5) hurtles head-on at a resting coin (mass 1) in the
    // open bottom lane, just touching so the impulse lands immediately.
    let gap = CarromEngine.strikerRadius + CarromEngine.coinRadius + 0.5
    engine.placePiece(id: 0, x: 200, y: 500, vx: 400, vy: 0)
    engine.placePiece(id: coinId, x: 200 + gap, y: 500, vx: 0, vy: 0)
    engine.beginRollingForTesting()

    let events = engine.step(dt: 4 * CarromEngine.physicsStep)
    XCTAssertTrue(events.contains { if case .collision = $0 { return true } else { return false } })

    let striker = engine.striker
    let coin = engine.pieces[coinId]
    // The light coin flies off faster than the striker arrived scaled by
    // (1+e)·mA/(mA+mB) = 1.152; the heavy striker keeps rolling forward.
    XCTAssertGreaterThan(coin.vx, 350)
    XCTAssertGreaterThan(striker.vx, 0)
    XCTAssertLessThan(striker.vx, 150)
    // Momentum along the impact normal is conserved (friction over these
    // few substeps only shaves a small fraction).
    let momentum = striker.mass * striker.vx + coin.mass * coin.vx
    XCTAssertEqual(momentum, 1.5 * 400, accuracy: 1.5 * 400 * 0.05)
  }

  func testCoinOverPocketIsCapturedAndShooterKeepsTurn() {
    let engine = makeEngine()
    guard let coinId = engine.firstPieceId(of: .white) else {
      return XCTFail("no white coin")
    }

    // Park a white coin inside the top-left pocket circle and settle.
    engine.placePiece(id: coinId, x: 35, y: 35)
    engine.beginRollingForTesting()
    let events = settle(engine)

    XCTAssertTrue(events.contains(.pocket(piece: .white)))
    XCTAssertFalse(engine.pieces[coinId].onBoard)
    XCTAssertEqual(engine.pocketedCount(of: .white), 1)
    // Pocketing your own color keeps the turn.
    XCTAssertEqual(engine.currentPlayer, 0)
    XCTAssertEqual(engine.lastSummary?.keptTurn, true)
  }

  func testStrikerFoulReturnsACoinAndPassesTheTurn() {
    let engine = makeEngine()
    guard let coinId = engine.firstPieceId(of: .white) else {
      return XCTFail("no white coin")
    }

    // Player 0 already banked one coin; then they sink the striker.
    engine.pocketForTesting(id: coinId)
    XCTAssertEqual(engine.pocketedCount(of: .white), 1)
    engine.placePiece(id: 0, x: 35, y: 35)
    engine.beginRollingForTesting()
    let events = settle(engine)

    XCTAssertTrue(events.contains(.pocket(piece: .striker)))
    XCTAssertEqual(engine.lastSummary?.foul, true)
    // The banked coin came back onto the wood and the turn passed.
    XCTAssertEqual(engine.pocketedCount(of: .white), 0)
    XCTAssertTrue(engine.pieces[coinId].onBoard)
    XCTAssertEqual(engine.currentPlayer, 1)
    // The striker is respotted for the next shooter.
    XCTAssertTrue(engine.striker.onBoard)
  }

  func testQueenCoverRule() {
    // Covered: queen and an own coin fall on the same strike.
    let covered = makeEngine()
    guard let coinId = covered.firstPieceId(of: .white) else {
      return XCTFail("no white coin")
    }
    covered.placePiece(id: 1, x: 35, y: 35)
    covered.placePiece(id: coinId, x: CarromEngine.boardSize - 35, y: 35)
    covered.beginRollingForTesting()
    settle(covered)
    XCTAssertEqual(covered.queenOwner, 0)
    XCTAssertEqual(covered.lastSummary?.queenOutcome, .covered)
    XCTAssertEqual(covered.currentPlayer, 0)

    // Pending then returned: queen alone, then a dry follow-up strike.
    let pending = makeEngine()
    pending.placePiece(id: 1, x: 35, y: 35)
    pending.beginRollingForTesting()
    settle(pending)
    XCTAssertNil(pending.queenOwner)
    XCTAssertEqual(pending.queenPendingBy, 0)
    XCTAssertEqual(pending.lastSummary?.queenOutcome, .pending)
    // Queen taken: shooter must shoot again to attempt the cover.
    XCTAssertEqual(pending.currentPlayer, 0)
    XCTAssertFalse(pending.queen.onBoard)

    // The cover strike pockets nothing: the queen returns to the board
    // and the turn passes.
    pending.beginRollingForTesting()
    settle(pending)
    XCTAssertNil(pending.queenPendingBy)
    XCTAssertTrue(pending.queen.onBoard)
    XCTAssertEqual(pending.lastSummary?.queenOutcome, .returned)
    XCTAssertEqual(pending.currentPlayer, 1)
  }

  func testClearingAllCoinsWinsTheBoardAndScoresRemainingOpponentCoins() {
    let engine = makeEngine()

    // Pocket eight whites off-screen, then sink the ninth for real.
    var sunk = 0
    for piece in engine.pieces where piece.kind == .white && sunk < 8 {
      engine.pocketForTesting(id: piece.id)
      sunk += 1
    }
    guard let lastWhite = engine.firstPieceId(of: .white) else {
      return XCTFail("no white coin left")
    }
    engine.placePiece(id: lastWhite, x: 35, y: 35)
    engine.beginRollingForTesting()
    let events = settle(engine)

    // All 9 black coins remain and the queen was never covered → 9 points.
    XCTAssertTrue(events.contains(.boardOver(winner: 0, points: 9)))
    XCTAssertEqual(engine.boardWinner, 0)
    XCTAssertEqual(engine.matchScore[0], 9)
    XCTAssertEqual(engine.phase, .boardOver)
    XCTAssertNil(engine.matchWinner)

    // The board winner breaks the next board.
    engine.nextBoard()
    XCTAssertEqual(engine.phase, .aiming)
    XCTAssertEqual(engine.currentPlayer, 0)
    XCTAssertEqual(engine.pocketedCount(of: .white), 0)
  }

  func testMatchEndsAtTwentyFivePoints() {
    let engine = makeEngine()

    // Player 0 sweeps three boards at 9 points each (all opponent coins
    // left, queen uncovered): 9 + 9 + 9 = 27 crosses the 25-point target
    // on the third board and ends the match.
    for board in 0..<3 {
      var sunk = 0
      for piece in engine.pieces where piece.kind == .white && sunk < 8 {
        engine.pocketForTesting(id: piece.id)
        sunk += 1
      }
      guard let lastWhite = engine.firstPieceId(of: .white) else {
        return XCTFail("no white coin left on board \(board)")
      }
      engine.placePiece(id: lastWhite, x: 35, y: 35)
      engine.beginRollingForTesting()
      settle(engine)
      XCTAssertEqual(engine.matchScore[0], (board + 1) * 9)
      if engine.matchWinner == nil {
        engine.nextBoard()
      }
    }

    XCTAssertEqual(engine.matchWinner, 0)
    XCTAssertEqual(engine.phase, .matchOver)
    XCTAssertGreaterThanOrEqual(engine.matchScore[0], CarromEngine.matchTarget)
  }

  func testBotStrikePutsTheStrikerInMotion() {
    let engine = makeEngine()

    // Hand the turn to the bot by fouling out player 0's opening strike.
    engine.placePiece(id: 0, x: 35, y: 35)
    engine.beginRollingForTesting()
    settle(engine)
    XCTAssertEqual(engine.currentPlayer, 1)

    engine.botStrike(level: .hard)
    XCTAssertEqual(engine.phase, .rolling)
    let speed = (engine.striker.vx * engine.striker.vx
      + engine.striker.vy * engine.striker.vy).squareRoot()
    XCTAssertGreaterThan(speed, CarromEngine.minShotSpeed - 1)
    // The bot flicks from its own (top) baseline.
    XCTAssertEqual(engine.striker.y, CarromEngine.baselineY(for: 1))
    settle(engine)
  }
}
