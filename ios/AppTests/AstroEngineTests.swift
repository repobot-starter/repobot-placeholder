import XCTest
@testable import AppIOS

/// Exercises the pure AstroBot simulation. The engine takes an injectable
/// random source, so every test below is deterministic: `random() == 0.5`
/// pins asteroid spawn headings, speeds, spins and silhouettes.
final class AstroEngineTests: XCTestCase {
  /// Small enough that entity movement within one frame is negligible.
  private let dt = 0.001

  func testBulletDestroysLargeAsteroidAndSplitsIntoTwoMediums() {
    let engine = makeEngine()
    engine.removeAllAsteroids()
    engine.addAsteroid(x: 200, y: 200, tier: .large)
    engine.addBullet(x: 200, y: 200)

    let events = engine.step(dt: dt)

    XCTAssertTrue(events.contains(.asteroidDestroyed(tier: .large)))
    XCTAssertEqual(engine.asteroids.count, 2)
    for child in engine.asteroids {
      XCTAssertEqual(child.tier, .medium)
      XCTAssertEqual(child.radius, AstroTier.medium.radius)
      // Children spawn where the parent died.
      XCTAssertEqual(child.x, 200, accuracy: 1)
      XCTAssertEqual(child.y, 200, accuracy: 1)
    }
    // The bullet is consumed by the hit.
    XCTAssertTrue(engine.bullets.isEmpty)
    XCTAssertEqual(engine.score, AstroTier.large.score)
  }

  func testMediumSplitsIntoSmallsAndSmallVaporizes() {
    let engine = makeEngine()
    engine.removeAllAsteroids()
    // Far-away filler rock keeps the field non-empty so no sector-clear
    // respawn muddies the assertions.
    engine.addAsteroid(x: 700, y: 500, tier: .large)

    engine.addAsteroid(x: 200, y: 200, tier: .medium)
    engine.addBullet(x: 200, y: 200)
    _ = engine.step(dt: dt)
    let smalls = engine.asteroids.filter { $0.tier == .small }
    XCTAssertEqual(smalls.count, 2)

    // Now shoot both smalls: they vaporize without children.
    for small in smalls {
      engine.addBullet(x: small.x, y: small.y)
    }
    _ = engine.step(dt: dt)
    XCTAssertTrue(engine.asteroids.allSatisfy { $0.tier == .large })
    XCTAssertEqual(engine.asteroids.count, 1)
  }

  func testScoringPerAsteroidSize() {
    XCTAssertEqual(scoreDelta(for: .large), 20)
    XCTAssertEqual(scoreDelta(for: .medium), 50)
    XCTAssertEqual(scoreDelta(for: .small), 100)
  }

  func testShipWrapsAroundEdges() {
    let engine = makeEngine()

    // Off the right edge (margin = ship radius 14): reappears at -margin.
    engine.setShip(x: AstroEngine.fieldWidth + 13.9, y: 300, vx: 200)
    _ = engine.step(dt: 0.05)
    XCTAssertEqual(engine.ship.x, -AstroEngine.shipRadius)

    // Off the left edge: reappears at width + margin.
    engine.setShip(x: -13.9, y: 300, vx: -200)
    _ = engine.step(dt: 0.05)
    XCTAssertEqual(engine.ship.x, AstroEngine.fieldWidth + AstroEngine.shipRadius)

    // Off the bottom edge: reappears above the top.
    engine.setShip(x: 400, y: AstroEngine.fieldHeight + 13.9, vy: 200)
    _ = engine.step(dt: 0.05)
    XCTAssertEqual(engine.ship.y, -AstroEngine.shipRadius)
  }

  func testCollisionCostsALifeWithInvulnerabilityWindow() {
    let engine = makeEngine()
    engine.removeAllAsteroids()
    // Park a rock right on the ship.
    engine.addAsteroid(x: AstroEngine.fieldWidth / 2, y: AstroEngine.fieldHeight / 2, tier: .large)

    // Fresh ships carry a 2s shield: overlapping is harmless at first.
    let shielded = engine.step(dt: dt)
    XCTAssertEqual(engine.lives, AstroEngine.startingLives)
    XCTAssertFalse(shielded.contains(.shipDestroyed(livesLeft: AstroEngine.startingLives - 1)))

    // Drop the shield: the same overlap now costs a life and respawns the
    // ship at center.
    engine.endInvulnerability()
    let events = engine.step(dt: dt)
    XCTAssertEqual(engine.lives, AstroEngine.startingLives - 1)
    XCTAssertTrue(events.contains(.shipDestroyed(livesLeft: AstroEngine.startingLives - 1)))
    XCTAssertEqual(engine.ship.x, AstroEngine.fieldWidth / 2)
    XCTAssertEqual(engine.ship.y, AstroEngine.fieldHeight / 2)

    // The respawned ship has a fresh shield, so it survives the still-
    // overlapping rock on the very next frame.
    XCTAssertTrue(engine.isShipInvulnerable)
    _ = engine.step(dt: dt)
    XCTAssertEqual(engine.lives, AstroEngine.startingLives - 1)
  }

  func testLosingLastLifeEndsTheGame() {
    let engine = makeEngine()
    engine.removeAllAsteroids()
    engine.addAsteroid(x: AstroEngine.fieldWidth / 2, y: AstroEngine.fieldHeight / 2, tier: .large)

    var lastEvents: [AstroEvent] = []
    for _ in 0..<AstroEngine.startingLives {
      engine.endInvulnerability()
      lastEvents = engine.step(dt: dt)
    }

    XCTAssertEqual(engine.lives, 0)
    XCTAssertTrue(engine.isOver)
    XCTAssertTrue(lastEvents.contains(.gameOver(score: 0, level: 1)))

    // A finished game must not keep simulating until a new game starts.
    XCTAssertTrue(engine.step(dt: dt).isEmpty)
  }

  func testWaveAdvancesWhenFieldIsClear() {
    let engine = makeEngine()
    XCTAssertEqual(engine.level, 1)
    // Sector 1 spawns 2 + 1 large rocks.
    XCTAssertEqual(engine.asteroids.count, 3)

    engine.removeAllAsteroids()
    let events = engine.step(dt: dt)

    XCTAssertTrue(events.contains(.sectorCleared(newLevel: 2)))
    XCTAssertEqual(engine.level, 2)
    // Sector 2 spawns 2 + 2 fresh large rocks, plus the +250 bonus.
    XCTAssertEqual(engine.asteroids.count, 4)
    XCTAssertTrue(engine.asteroids.allSatisfy { $0.tier == .large })
    XCTAssertEqual(engine.score, AstroEngine.sectorBonus)
  }

  func testBulletsExpireAfterLifetime() {
    let engine = makeEngine()
    engine.removeAllAsteroids()
    engine.addAsteroid(x: 700, y: 500, tier: .large) // keep the field busy
    engine.addBullet(x: 100, y: 100)

    // Just before the 1.1s lifetime: still flying.
    for _ in 0..<21 {
      _ = engine.step(dt: 0.05)
    }
    XCTAssertEqual(engine.bullets.count, 1)

    // Past the lifetime: culled.
    for _ in 0..<3 {
      _ = engine.step(dt: 0.05)
    }
    XCTAssertTrue(engine.bullets.isEmpty)
  }

  // MARK: - Helpers

  /// `random() == 0.5` pins every spawn decision, keeping scenarios
  /// reproducible.
  private func makeEngine() -> AstroEngine {
    AstroEngine(random: { 0.5 })
  }

  /// Destroys a single rock of `tier` (with a far-away filler so the field
  /// never empties) and returns the score it awarded.
  private func scoreDelta(for tier: AstroTier) -> Int {
    let engine = makeEngine()
    engine.removeAllAsteroids()
    engine.addAsteroid(x: 700, y: 500, tier: .large)
    engine.addAsteroid(x: 200, y: 200, tier: tier)
    engine.addBullet(x: 200, y: 200)
    let scoreBefore = engine.score
    _ = engine.step(dt: dt)
    return engine.score - scoreBefore
  }
}
