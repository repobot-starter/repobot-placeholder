import XCTest
@testable import AppIOS

/// Exercises the pure Pong simulation. The engine takes an injectable random
/// source, so every test below is deterministic: `fixedRandom(0.5)` makes the
/// serve angle exactly 0 (horizontal) and the bot jitter term exactly 0.
final class PongEngineTests: XCTestCase {
  func testServePutsBallInMotionTowardRequestedSide() {
    let engine = makeEngine()

    engine.newGame(servingToward: .right)
    XCTAssertEqual(engine.ball.x, PongEngine.fieldWidth / 2)
    XCTAssertEqual(engine.ball.y, PongEngine.fieldHeight / 2)
    XCTAssertGreaterThan(engine.ball.vx, 0)

    let ballXBefore = engine.ball.x
    _ = engine.step(dt: 0.016)
    XCTAssertGreaterThan(engine.ball.x, ballXBefore)

    engine.newGame(servingToward: .left)
    XCTAssertLessThan(engine.ball.vx, 0)
  }

  func testMissScoresForOpponentAndReServes() {
    let engine = makeEngine()

    // Ball flying out the left side, far from the player paddle (which sits
    // at field center): the bot should be awarded the point.
    engine.setBall(x: 0, y: 500, vx: -1, vy: 0)
    let events = engine.step(dt: 0.05)

    XCTAssertTrue(events.contains(.score(scorer: .right)))
    XCTAssertEqual(engine.rightScore, 1)
    XCTAssertEqual(engine.leftScore, 0)
    XCTAssertFalse(engine.isOver)

    // Re-serve: ball back at center, moving toward the scorer's side like
    // the web version (right scored, so the serve goes right).
    XCTAssertEqual(engine.ball.x, PongEngine.fieldWidth / 2)
    XCTAssertEqual(engine.ball.y, PongEngine.fieldHeight / 2)
    XCTAssertGreaterThan(engine.ball.vx, 0)
    XCTAssertEqual(engine.rallyHits, 0)
  }

  func testBotPaddleStaysWithinField() {
    let engine = makeEngine(difficulty: .impossible)
    let half = PongEngine.paddleHeight / 2

    // Keep re-pinning the ball near the bottom edge, heading at the bot, so
    // the bot chases a target close to the field boundary for many frames.
    for _ in 0..<120 {
      engine.setBall(x: 400, y: PongEngine.fieldHeight - 8, vx: 1, vy: 0)
      _ = engine.step(dt: 0.016)
      XCTAssertLessThanOrEqual(engine.rightPaddleY, PongEngine.fieldHeight - half)
      XCTAssertGreaterThanOrEqual(engine.rightPaddleY, half)
    }
  }

  func testReachingWinScoreEndsGameWithRightWinner() {
    let engine = makeEngine()
    var lastEvents: [PongEvent] = []

    // Force seven straight points for the player by throwing the ball past
    // the right edge (outside the bot paddle's catch window).
    for _ in 0..<PongEngine.winScore {
      engine.setBall(x: 900, y: 280, vx: 1, vy: 0)
      lastEvents = engine.step(dt: 0.016)
    }

    XCTAssertEqual(engine.leftScore, PongEngine.winScore)
    XCTAssertEqual(engine.winner, .left)
    XCTAssertTrue(engine.isOver)
    XCTAssertTrue(lastEvents.contains(.gameOver(winner: .left)))

    // A finished match must not keep simulating until a new game starts.
    XCTAssertTrue(engine.step(dt: 0.016).isEmpty)
  }

  func testPaddleDeflectionFollowsStrikePosition() {
    // Striking below the paddle center must send the ball downward, above
    // must send it upward, and dead center returns it flat — the arcade rule.
    let belowCenter = deflectedBall(strikeOffsetFromPaddleCenter: 20)
    XCTAssertGreaterThan(belowCenter.vy, 0)
    XCTAssertGreaterThan(belowCenter.vx, 0)

    let aboveCenter = deflectedBall(strikeOffsetFromPaddleCenter: -20)
    XCTAssertLessThan(aboveCenter.vy, 0)
    XCTAssertGreaterThan(aboveCenter.vx, 0)

    let deadCenter = deflectedBall(strikeOffsetFromPaddleCenter: 0)
    XCTAssertEqual(deadCenter.vy, 0, accuracy: 0.0001)

    // A steeper strike offset deflects at a steeper angle.
    XCTAssertGreaterThan(
      deflectedBall(strikeOffsetFromPaddleCenter: 40).vy,
      belowCenter.vy
    )
  }

  func testPaddleHitSpeedsUpTheRally() {
    let engine = makeEngine()
    let speedBefore = engine.currentBallSpeed

    engine.setBall(x: 45, y: engine.leftPaddleY, vx: -1, vy: 0)
    let events = engine.step(dt: 0.05)

    XCTAssertTrue(events.contains(.paddleHit(.left)))
    XCTAssertEqual(engine.rallyHits, 1)
    XCTAssertGreaterThan(engine.currentBallSpeed, speedBefore)
  }

  // MARK: - Helpers

  /// `random() == 0.5` → serve angle 0 (purely horizontal) and zero bot
  /// jitter, which keeps every scenario reproducible.
  private func makeEngine(difficulty: PongDifficulty = .hard) -> PongEngine {
    PongEngine(difficulty: difficulty, random: { 0.5 })
  }

  /// Runs one frame where the ball arrives at the left paddle offset from
  /// its center, and returns the deflected ball.
  private func deflectedBall(strikeOffsetFromPaddleCenter offset: Double) -> PongBall {
    let engine = makeEngine()
    engine.setBall(x: 45, y: engine.leftPaddleY + offset, vx: -1, vy: 0)
    let events = engine.step(dt: 0.05)
    XCTAssertTrue(events.contains(.paddleHit(.left)))
    return engine.ball
  }
}
