import Foundation

/// Bot difficulty levels. `botSpeed` (px/s tracking speed) and `botJitter`
/// (how far the intercept point wobbles, in px) mirror the web `BOT_LEVELS`
/// table exactly so both platforms play identically.
enum PongDifficulty: String, CaseIterable, Identifiable {
  case easy
  case medium
  case hard
  case impossible

  var id: String { rawValue }

  var botSpeed: Double {
    switch self {
    case .easy: return 180
    case .medium: return 280
    case .hard: return 380
    case .impossible: return 620
    }
  }

  var botJitter: Double {
    switch self {
    case .easy: return 60
    case .medium: return 34
    case .hard: return 16
    case .impossible: return 0
    }
  }
}

enum PongSide: Equatable {
  case left
  case right
}

/// Discrete things that happened during one `step(dt:)` — the native twin of
/// the web game's sound/score/game-over callbacks. The renderer can use these
/// for sounds or haptics; tests use them to assert on game flow.
enum PongEvent: Equatable {
  case wallBounce
  case paddleHit(PongSide)
  case score(scorer: PongSide)
  case gameOver(winner: PongSide)
}

/// Ball state. `vx`/`vy` are a unit direction vector (as in the web version);
/// the scalar speed is derived each frame from the rally length so the ball
/// speeds up as an exchange goes on.
struct PongBall: Equatable {
  var x: Double
  var y: Double
  var vx: Double
  var vy: Double
}

/// Pure port of the web Pong simulation
/// (`web/app/src/View/Games/Pong/PongGame.tsx`). No SwiftUI here: the engine
/// is a plain state machine driven by `step(dt:)` so it can be unit-tested
/// headlessly and rendered by any frontend.
///
/// Unlike the web version there is no 2-player mode — touch devices have no
/// second keyboard player — so the right paddle is always the bot.
///
/// Randomness (serve angle, bot jitter) goes through an injected closure so
/// tests can make the simulation fully deterministic.
final class PongEngine {
  // Field geometry — must stay byte-for-byte in sync with the web constants.
  static let fieldWidth: Double = 800
  static let fieldHeight: Double = 560
  static let paddleHeight: Double = 90
  static let paddleWidth: Double = 12
  static let paddleMargin: Double = 24
  static let ballSize: Double = 12
  static let playerPaddleSpeed: Double = 420
  static let winScore = 7

  var difficulty: PongDifficulty
  /// Global speed multiplier (the web page exposes it as a slider; 1 = normal).
  var speedMultiplier: Double = 1
  /// Where the player wants the left paddle (field coordinates, from touch).
  /// `nil` means "stay put". The web version snaps the paddle to the mouse;
  /// a finger can jump across the whole field in one frame, so we chase the
  /// target at the keyboard paddle speed (420 px/s, same constant as web W/S).
  var playerTargetY: Double?

  private(set) var leftPaddleY = PongEngine.fieldHeight / 2
  private(set) var rightPaddleY = PongEngine.fieldHeight / 2
  private(set) var leftScore = 0
  private(set) var rightScore = 0
  private(set) var ball = PongBall(
    x: PongEngine.fieldWidth / 2, y: PongEngine.fieldHeight / 2, vx: 0, vy: 0
  )
  private(set) var rallyHits = 0
  private(set) var winner: PongSide?

  var isOver: Bool { winner != nil }

  /// Current scalar ball speed (px/s): base speed plus a bump per rally hit,
  /// exactly like the web `ballSpeed`.
  var currentBallSpeed: Double { 260 * speedMultiplier + Double(rallyHits) * 18 }

  private let random: () -> Double

  init(
    difficulty: PongDifficulty = .hard,
    random: @escaping () -> Double = { Double.random(in: 0..<1) }
  ) {
    self.difficulty = difficulty
    self.random = random
    newGame()
  }

  /// Full match reset (the web "New Game" / resetToken path). Pass a side to
  /// make the first serve deterministic; `nil` picks one at random like web.
  func newGame(servingToward side: PongSide? = nil) {
    leftPaddleY = Self.fieldHeight / 2
    rightPaddleY = Self.fieldHeight / 2
    leftScore = 0
    rightScore = 0
    winner = nil
    serve(toward: side ?? (random() < 0.5 ? .right : .left))
  }

  /// Advance the simulation. Mirrors the web `step` frame-for-frame: paddles
  /// move, ball moves, wall bounce, paddle bounce, scoring, re-serve.
  /// Returns the discrete events that occurred so the caller can react.
  func step(dt: Double) -> [PongEvent] {
    guard !isOver else { return [] }
    var events: [PongEvent] = []

    // Player (left): chase the touch target at the fixed paddle speed.
    if let target = playerTargetY {
      let delta = target - leftPaddleY
      leftPaddleY += sign(delta) * min(abs(delta), Self.playerPaddleSpeed * dt)
    }

    // Bot (right): only chase when the ball is coming at it; drift home
    // otherwise — same policy as web, including per-frame jitter.
    let target = ball.vx > 0
      ? ball.y + (random() - 0.5) * difficulty.botJitter
      : Self.fieldHeight / 2
    let botDelta = target - rightPaddleY
    rightPaddleY += sign(botDelta) * min(abs(botDelta), difficulty.botSpeed * dt)

    let half = Self.paddleHeight / 2
    leftPaddleY = max(half, min(Self.fieldHeight - half, leftPaddleY))
    rightPaddleY = max(half, min(Self.fieldHeight - half, rightPaddleY))

    // Ball
    let speed = currentBallSpeed
    ball.x += ball.vx * speed * dt
    ball.y += ball.vy * speed * dt

    if ball.y < Self.ballSize / 2 || ball.y > Self.fieldHeight - Self.ballSize / 2 {
      ball.vy *= -1
      ball.y = max(Self.ballSize / 2, min(Self.fieldHeight - Self.ballSize / 2, ball.y))
      events.append(.wallBounce)
    }

    let leftEdge = Self.paddleMargin + Self.paddleWidth
    let rightEdge = Self.fieldWidth - Self.paddleMargin - Self.paddleWidth
    if ball.vx < 0,
       ball.x - Self.ballSize / 2 <= leftEdge,
       ball.x > Self.paddleMargin,
       abs(ball.y - leftPaddleY) <= Self.paddleHeight / 2 + Self.ballSize / 2 {
      ball.x = leftEdge + Self.ballSize / 2
      bounceOffPaddle(paddleY: leftPaddleY)
      events.append(.paddleHit(.left))
    }
    if ball.vx > 0,
       ball.x + Self.ballSize / 2 >= rightEdge,
       ball.x < Self.fieldWidth - Self.paddleMargin,
       abs(ball.y - rightPaddleY) <= Self.paddleHeight / 2 + Self.ballSize / 2 {
      ball.x = rightEdge - Self.ballSize / 2
      bounceOffPaddle(paddleY: rightPaddleY)
      events.append(.paddleHit(.right))
    }

    // Scoring
    if ball.x < -Self.ballSize || ball.x > Self.fieldWidth + Self.ballSize {
      let scorer: PongSide = ball.x > Self.fieldWidth ? .left : .right
      if scorer == .left {
        leftScore += 1
      } else {
        rightScore += 1
      }
      events.append(.score(scorer: scorer))

      if leftScore >= Self.winScore || rightScore >= Self.winScore {
        winner = leftScore > rightScore ? .left : .right
        events.append(.gameOver(winner: winner ?? .left))
      } else {
        // Web serves toward the scorer's side after a point.
        serve(toward: scorer)
      }
    }

    return events
  }

  /// Test hook: place the ball directly to set up collision scenarios.
  func setBall(x: Double, y: Double, vx: Double, vy: Double) {
    ball = PongBall(x: x, y: y, vx: vx, vy: vy)
  }

  private func serve(toward side: PongSide) {
    // Random angle within ±45°, same distribution as web serveBall.
    let angle = (random() * 0.5 - 0.25) * Double.pi
    let direction: Double = side == .right ? 1 : -1
    ball = PongBall(
      x: Self.fieldWidth / 2,
      y: Self.fieldHeight / 2,
      vx: cos(angle) * direction,
      vy: sin(angle)
    )
    rallyHits = 0
  }

  private func bounceOffPaddle(paddleY: Double) {
    // Hit position controls the return angle, like the arcade original.
    let offset = (ball.y - paddleY) / (Self.paddleHeight / 2)
    let angle = offset * 0.75
    let direction: Double = ball.vx > 0 ? -1 : 1
    ball.vx = cos(angle) * direction
    ball.vy = sin(angle)
    rallyHits += 1
  }

  private func sign(_ value: Double) -> Double {
    if value > 0 { return 1 }
    if value < 0 { return -1 }
    return 0
  }
}
