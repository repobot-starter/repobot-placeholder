import XCTest
@testable import AppIOS

/// Exercises the pure SnakeBot simulation against the web SnakeGame.tsx rules
/// it mirrors. The engine takes an injectable random source, so every test is
/// deterministic: `scriptedRandom` replays a fixed sequence of [0, 1) draws
/// (three per food-spawn attempt: x, y, kind) and then settles on 0.5.
final class SnakeEngineTests: XCTestCase {
  func testSnakeGrowsAndScoresOnFood() {
    let engine = makeEngine()
    let initialLength = engine.snake.count
    XCTAssertEqual(initialLength, 3)

    // Food directly in the snake's path (it starts at x=8 heading right).
    engine.setFood(x: 9, y: 11)
    let events = engine.step()

    XCTAssertTrue(events.contains(.foodEaten(points: 100)))
    XCTAssertEqual(engine.snake.count, initialLength + 1)
    XCTAssertEqual(engine.score, 100)
    XCTAssertEqual(engine.cellsEaten, 1)
    // Fresh food was spawned somewhere off the eaten cell and off the body.
    XCTAssertFalse(engine.food.x == 9 && engine.food.y == 11)
    XCTAssertFalse(engine.snake.contains(SnakeCell(x: engine.food.x, y: engine.food.y)))

    // A plain move (no food) keeps the length constant.
    engine.setFood(x: 0, y: 0)
    _ = engine.step()
    XCTAssertEqual(engine.snake.count, initialLength + 1)
  }

  func testSnakeDiesOnWallHit() {
    let engine = makeEngine()
    engine.setFood(x: 0, y: 0)

    // Head straight up from (8, 11): 11 safe steps to reach y=0, then the
    // 12th crosses the wall and must end the game.
    engine.setDirection(dx: 0, dy: -1)
    for _ in 0..<11 {
      XCTAssertTrue(engine.step().isEmpty)
      XCTAssertFalse(engine.isOver)
    }
    let events = engine.step()

    XCTAssertTrue(engine.isOver)
    XCTAssertTrue(events.contains(.gameOver(score: 0, level: 1)))
    // A crashed game is inert until newGame(), like the web `over` flag.
    XCTAssertTrue(engine.step().isEmpty)
  }

  func testSnakeDiesOnSelfHit() {
    let engine = makeEngine()
    engine.setFood(x: 0, y: 0)
    // Long straight body heading right; a down-left-up hook turns the head
    // back into the body's third segment.
    engine.setSnake(
      [
        SnakeCell(x: 10, y: 10),
        SnakeCell(x: 9, y: 10),
        SnakeCell(x: 8, y: 10),
        SnakeCell(x: 7, y: 10),
        SnakeCell(x: 6, y: 10),
      ],
      direction: SnakeCell(x: 1, y: 0)
    )

    engine.setDirection(dx: 0, dy: 1)
    XCTAssertTrue(engine.step().isEmpty)
    engine.setDirection(dx: -1, dy: 0)
    XCTAssertTrue(engine.step().isEmpty)
    engine.setDirection(dx: 0, dy: -1)
    let events = engine.step()

    XCTAssertTrue(engine.isOver)
    XCTAssertTrue(events.contains(.gameOver(score: 0, level: 1)))
  }

  func testCannotReverseIntoItself() {
    let engine = makeEngine()
    engine.setFood(x: 0, y: 0)

    // Heading right; a left input is a straight reversal and must be ignored.
    engine.setDirection(dx: -1, dy: 0)
    _ = engine.step()
    XCTAssertEqual(engine.snake[0], SnakeCell(x: 9, y: 11))
    XCTAssertEqual(engine.direction, SnakeCell(x: 1, y: 0))
    XCTAssertFalse(engine.isOver)

    // Web parity: reversal is checked against the last *applied* direction,
    // so up-then-down between two ticks resolves to down (both inputs are
    // perpendicular to the current rightward travel).
    engine.setDirection(dx: 0, dy: -1)
    engine.setDirection(dx: 0, dy: 1)
    _ = engine.step()
    XCTAssertEqual(engine.snake[0], SnakeCell(x: 9, y: 12))
  }

  func testLevelAndSpeedProgressionThresholds() {
    let engine = makeEngine()

    // Five foods advance one level; points are 100 x the level at eat time.
    for offset in 0..<5 {
      engine.setFood(x: 9 + offset, y: 11)
      let events = engine.step()
      XCTAssertTrue(events.contains(.foodEaten(points: 100)))
      if offset < 4 {
        XCTAssertEqual(engine.level, 1)
      } else {
        XCTAssertTrue(events.contains(.levelUp(2)))
      }
    }
    XCTAssertEqual(engine.level, 2)
    XCTAssertEqual(engine.score, 500)
    XCTAssertEqual(engine.tickInterval, 0.138, accuracy: 0.0001)

    // The tick curve matches the web constants: 150ms base, -12ms per level,
    // clamped at 55ms (level 9 would otherwise be 54ms).
    XCTAssertEqual(SnakeEngine.tickMs(level: 1), 150)
    XCTAssertEqual(SnakeEngine.tickMs(level: 2), 138)
    XCTAssertEqual(SnakeEngine.tickMs(level: 8), 66)
    XCTAssertEqual(SnakeEngine.tickMs(level: 9), 55)
    XCTAssertEqual(SnakeEngine.tickMs(level: 20), 55)
  }

  func testFoodSpawnIsDeterministicAndAvoidsSnakeBody() {
    // Script the initial spawn: the first (x, y, kind) attempt lands on the
    // snake's head (floor(0.3 * 28) = 8, floor(0.5 * 22) = 11) and must be
    // rejected; the second attempt lands on free cell (14, 11) with kind
    // index floor(0.25 * 4) = 1.
    let engine = SnakeEngine(random: scriptedRandom([0.3, 0.5, 0.0, 0.5, 0.5, 0.25]))

    XCTAssertEqual(engine.food, SnakeFood(x: 14, y: 11, kind: "💾"))
    XCTAssertFalse(engine.snake.contains(SnakeCell(x: engine.food.x, y: engine.food.y)))
  }

  // MARK: - Helpers

  /// Engine whose RNG always returns 0.5: the initial food lands on the free
  /// cell (14, 11), keeping movement scenarios reproducible.
  private func makeEngine() -> SnakeEngine {
    SnakeEngine(random: scriptedRandom([]))
  }

  /// Replays `values` in order, then returns 0.5 forever.
  private func scriptedRandom(_ values: [Double]) -> () -> Double {
    var index = 0
    return {
      defer { index += 1 }
      return index < values.count ? values[index] : 0.5
    }
  }
}
