import Foundation

/// One grid cell. Also doubles as a direction vector (x/y in {-1, 0, 1}),
/// exactly like the web game's `Cell` interface.
struct SnakeCell: Equatable {
  var x: Int
  var y: Int
}

/// The current food pellet: a grid cell plus the emoji "kind" drawn on it,
/// mirroring the web `Food` interface.
struct SnakeFood: Equatable {
  var x: Int
  var y: Int
  var kind: String
}

/// Discrete things that happened during one `step()` — the native twin of the
/// web game's `onScore` / `onGameOver` callbacks. The renderer can use these
/// for readouts or haptics; tests use them to assert on game flow.
enum SnakeEvent: Equatable {
  case foodEaten(points: Int)
  case levelUp(Int)
  case gameOver(score: Int, level: Int)
}

/// Pure port of the web SnakeBot simulation
/// (`web/app/src/View/Games/Snake/SnakeGame.tsx`). No SwiftUI here: the engine
/// is a plain state machine advanced one grid tick at a time by `step()` so it
/// can be unit-tested headlessly and rendered by any frontend.
///
/// The caller owns the clock: it should call `step()` whenever `tickInterval`
/// has elapsed, which reproduces the web's fixed-timestep loop (the tick gets
/// shorter as the level rises).
///
/// Randomness (food position and kind) goes through an injected closure so
/// tests can make food spawning fully deterministic. The closure must return
/// values in [0, 1), like `Math.random()`.
final class SnakeEngine {
  // Grid geometry and pacing — must stay byte-for-byte in sync with the web
  // constants in SnakeGame.tsx.
  static let gridCols = 28
  static let gridRows = 22
  static let cellsPerLevel = 5
  static let baseTickMs: Double = 150
  static let tickDecreasePerLevelMs: Double = 12
  static let minTickMs: Double = 55
  /// Points per food are multiplied by the current level, like web.
  static let pointsPerFood = 100
  /// Food emoji, in the web's array order (index = floor(random * count)).
  static let foodKinds = ["⚡", "💾", "🔋", "💎"]

  private(set) var snake: [SnakeCell] = []
  /// Direction applied on the most recent tick. Steering input is compared
  /// against this (not `nextDirection`) when rejecting reversals, same as web.
  private(set) var direction = SnakeCell(x: 1, y: 0)
  /// Direction that will be applied on the next tick (the web `nextDirection`
  /// buffer, so multiple inputs between ticks resolve to the last one).
  private(set) var nextDirection = SnakeCell(x: 1, y: 0)
  private(set) var food = SnakeFood(x: 0, y: 0, kind: "⚡")
  private(set) var score = 0
  private(set) var cellsEaten = 0
  private(set) var level = 1
  private(set) var isOver = false

  /// Seconds between ticks at the current level.
  var tickInterval: TimeInterval { Self.tickMs(level: level) / 1000 }

  /// Web tick pacing: `max(MIN_TICK_MS, BASE_TICK_MS - (level - 1) * TICK_DECREASE_PER_LEVEL)`.
  static func tickMs(level: Int) -> Double {
    max(minTickMs, baseTickMs - Double(level - 1) * tickDecreasePerLevelMs)
  }

  private let random: () -> Double

  init(random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.random = random
    newGame()
  }

  /// Full reset (the web resetToken effect): 3-segment snake on the middle
  /// row heading right, level 1, fresh food.
  func newGame() {
    let middleRow = Self.gridRows / 2
    snake = [
      SnakeCell(x: 8, y: middleRow),
      SnakeCell(x: 7, y: middleRow),
      SnakeCell(x: 6, y: middleRow),
    ]
    direction = SnakeCell(x: 1, y: 0)
    nextDirection = direction
    score = 0
    cellsEaten = 0
    level = 1
    isOver = false
    food = spawnFood()
  }

  /// Steering input (the web keydown handler). A reversal straight into the
  /// snake's own neck — the exact opposite of the last *applied* direction —
  /// is ignored; anything else replaces the buffered direction.
  func setDirection(dx: Int, dy: Int) {
    if dx == -direction.x && dy == -direction.y {
      return
    }
    nextDirection = SnakeCell(x: dx, y: dy)
  }

  /// Advance the simulation by one grid tick. Mirrors the web `step`
  /// line-for-line: apply the buffered direction, move the head, die on wall
  /// or self contact (checked against the pre-move body, tail included), then
  /// grow on food or drop the tail. Returns the discrete events that occurred.
  func step() -> [SnakeEvent] {
    guard !isOver else { return [] }
    direction = nextDirection
    let head = SnakeCell(x: snake[0].x + direction.x, y: snake[0].y + direction.y)

    let hitWall = head.x < 0 || head.y < 0 || head.x >= Self.gridCols || head.y >= Self.gridRows
    let hitSelf = snake.contains(head)
    if hitWall || hitSelf {
      isOver = true
      return [.gameOver(score: score, level: level)]
    }

    snake.insert(head, at: 0)

    var events: [SnakeEvent] = []
    if head.x == food.x && head.y == food.y {
      cellsEaten += 1
      let points = Self.pointsPerFood * level
      score += points
      events.append(.foodEaten(points: points))
      if cellsEaten % Self.cellsPerLevel == 0 {
        level += 1
        events.append(.levelUp(level))
      }
      food = spawnFood()
    } else {
      snake.removeLast()
    }
    return events
  }

  /// Test hook: replace the body and travel direction to set up collision
  /// scenarios without scripting dozens of ticks.
  func setSnake(_ cells: [SnakeCell], direction: SnakeCell) {
    snake = cells
    self.direction = direction
    nextDirection = direction
  }

  /// Test hook: pin the food so movement tests are independent of the RNG.
  func setFood(x: Int, y: Int, kind: String = "⚡") {
    food = SnakeFood(x: x, y: y, kind: kind)
  }

  /// Web `spawnFood`: keep proposing (x, y, kind) triples — three RNG draws
  /// per attempt, in that order — until the cell is off the snake body.
  private func spawnFood() -> SnakeFood {
    while true {
      let candidate = SnakeFood(
        x: Int(random() * Double(Self.gridCols)),
        y: Int(random() * Double(Self.gridRows)),
        kind: Self.foodKinds[Int(random() * Double(Self.foodKinds.count))]
      )
      if !snake.contains(where: { $0.x == candidate.x && $0.y == candidate.y }) {
        return candidate
      }
    }
  }
}
