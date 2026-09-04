import XCTest
@testable import AppIOS

/// Exercises the pure RaceBot simulation. The engine takes an injectable
/// random source, so every test below is deterministic: `random() == 0.5`
/// pins spawn lanes (middle), traffic speeds, and paint jobs.
final class RaceEngineTests: XCTestCase {
  /// Small enough that world movement within one frame is negligible.
  private let dt = 0.001

  func testStartsCenteredCruisingWithFullNitro() {
    let engine = makeEngine()
    XCTAssertEqual(engine.targetLane, 1)
    XCTAssertEqual(engine.playerX, RaceEngine.laneCenter(1))
    XCTAssertEqual(engine.speed, RaceEngine.baseSpeed)
    XCTAssertEqual(engine.nitro, 1)
    XCTAssertFalse(engine.isOver)
  }

  func testSteeringClampsToTheRoad() {
    let engine = makeEngine()
    engine.steerLeft()
    XCTAssertEqual(engine.targetLane, 0)
    engine.steerLeft()
    XCTAssertEqual(engine.targetLane, 0, "steering off the left shoulder is ignored")

    engine.steerRight()
    engine.steerRight()
    XCTAssertEqual(engine.targetLane, 2)
    engine.steerRight()
    XCTAssertEqual(engine.targetLane, 2, "steering off the right shoulder is ignored")
  }

  func testLaneChangeGlidesAtTheLateralSpeedAndSnapsOnArrival() {
    let engine = makeEngine()
    engine.steerLeft()

    _ = engine.step(dt: 0.05)
    let expected = RaceEngine.laneCenter(1) - RaceEngine.laneChangeSpeed * 0.05
    XCTAssertEqual(engine.playerX, expected, accuracy: 0.001)

    // Plenty of frames later the glide has snapped exactly onto the lane
    // center (no drift accumulation).
    for _ in 0..<20 {
      _ = engine.step(dt: 0.05)
    }
    XCTAssertEqual(engine.playerX, RaceEngine.laneCenter(0))
  }

  func testNitroBoostsSpeedDrainsAndRegenerates() {
    let engine = makeEngine()
    engine.isBoosting = true
    XCTAssertTrue(engine.isNitroActive)
    XCTAssertEqual(engine.effectiveSpeed, engine.speed * RaceEngine.nitroMultiplier)

    _ = engine.step(dt: 1)
    XCTAssertEqual(engine.nitro, 1 - RaceEngine.nitroDrain, accuracy: 0.0001)

    // An empty gauge turns the boost off even while the pedal is held.
    for _ in 0..<3 {
      _ = engine.step(dt: 1)
    }
    XCTAssertEqual(engine.nitro, 0)
    XCTAssertFalse(engine.isNitroActive)
    XCTAssertEqual(engine.effectiveSpeed, engine.speed)

    // Releasing the pedal refills the gauge.
    engine.isBoosting = false
    _ = engine.step(dt: 1)
    XCTAssertEqual(engine.nitro, RaceEngine.nitroRegen, accuracy: 0.0001)
  }

  func testCruiseSpeedRampsToTheCeiling() {
    let engine = makeEngine()
    // Hug the left shoulder: random() == 0.5 only ever spawns middle-lane
    // traffic, so the long cruise below can never end in a crash.
    engine.steerLeft()
    _ = engine.step(dt: 1)
    XCTAssertEqual(engine.speed, RaceEngine.baseSpeed + RaceEngine.acceleration, accuracy: 0.0001)

    for _ in 0..<100 {
      _ = engine.step(dt: 1)
    }
    XCTAssertEqual(engine.speed, RaceEngine.maxSpeed)
  }

  func testOvertakePaysOnceAndCarIsRecycledOffScreen() {
    let engine = makeEngine()
    engine.clearTraffic()
    // Hug the left shoulder so the middle-lane spawns of the long run
    // below can never crash the player.
    engine.steerLeft()
    // A car in the other lane just above the pay line.
    engine.addCar(lane: 0, y: RaceEngine.playerY + RaceEngine.carLength - 1)

    let events = engine.step(dt: 0.05)
    XCTAssertTrue(events.contains(.overtake(total: 1)))
    XCTAssertEqual(engine.overtakes, 1)
    XCTAssertEqual(engine.score, Int(engine.distanceMeters) + RaceEngine.overtakeBonus)

    // Passing frames never pay the same car twice…
    for _ in 0..<5 {
      XCTAssertFalse(engine.step(dt: 0.05).contains(.overtake(total: 2)))
    }
    XCTAssertEqual(engine.overtakes, 1)

    // …and the car is dropped once it is fully off-screen. (Cadence spawns
    // are middle-lane only under the 0.5 roll, so lane 0 going empty means
    // exactly our car was recycled.)
    for _ in 0..<200 {
      _ = engine.step(dt: 0.05)
    }
    XCTAssertFalse(engine.traffic.contains { $0.lane == 0 })
  }

  func testRearEndingACarEndsTheRun() {
    let engine = makeEngine()
    engine.clearTraffic()
    // A car dead ahead in the player's lane, overlapping the hitbox.
    engine.addCar(lane: 1, y: RaceEngine.playerY - RaceEngine.carLength + RaceEngine.hitLengthPad + 1)

    let events = engine.step(dt: dt)
    XCTAssertTrue(engine.isOver)
    XCTAssertTrue(events.contains(.crash(score: engine.score)))

    // A finished run must not keep simulating until a new game starts.
    XCTAssertTrue(engine.step(dt: dt).isEmpty)
  }

  func testAdjacentLaneTrafficIsHarmless() {
    let engine = makeEngine()
    engine.clearTraffic()
    // Side-by-side with the player, one lane over: lane centers are 110
    // units apart, comfortably past the 50.84-unit hit width.
    engine.addCar(lane: 0, y: RaceEngine.playerY)

    _ = engine.step(dt: dt)
    XCTAssertFalse(engine.isOver)
  }

  func testSpawnKeepsAnEscapeLaneOpen() {
    // random() == 0.5 always rolls the middle lane.
    let engine = makeEngine()
    engine.clearTraffic()
    // The two outer lanes are already occupied in the entry window; a
    // middle-lane spawn would close the last gap, so it must be dropped.
    engine.addCar(lane: 0, y: 40)
    engine.addCar(lane: 2, y: 40)

    engine.forceSpawnRoll()
    XCTAssertEqual(engine.traffic.count, 2, "spawn that blocks every lane is skipped")
  }

  func testSpawnKeepsAGapWithinTheLane() {
    let engine = makeEngine()
    engine.clearTraffic()
    // A car sitting right at the top of the middle lane: the next
    // middle-lane roll has no room and must be dropped.
    engine.addCar(lane: 1, y: -RaceEngine.carLength + 1)

    engine.forceSpawnRoll()
    XCTAssertEqual(engine.traffic.count, 1)
  }

  func testNewGameResetsEverything() {
    let engine = makeEngine()
    engine.isBoosting = true
    engine.steerRight()
    _ = engine.step(dt: 2)
    engine.clearTraffic()
    engine.addCar(lane: 2, y: RaceEngine.playerY)
    engine.snapToLane(2)
    _ = engine.step(dt: dt)
    XCTAssertTrue(engine.isOver)

    engine.newGame()
    XCTAssertFalse(engine.isOver)
    XCTAssertEqual(engine.targetLane, 1)
    XCTAssertEqual(engine.playerX, RaceEngine.laneCenter(1))
    XCTAssertEqual(engine.speed, RaceEngine.baseSpeed)
    XCTAssertEqual(engine.nitro, 1)
    XCTAssertEqual(engine.distanceMeters, 0)
    XCTAssertEqual(engine.overtakes, 0)
    XCTAssertTrue(engine.traffic.isEmpty)
    XCTAssertFalse(engine.isBoosting)
  }

  func testScoreCombinesDistanceAndOvertakes() {
    let engine = makeEngine()
    engine.clearTraffic()
    _ = engine.step(dt: 1)
    let distanceOnly = engine.score
    XCTAssertEqual(distanceOnly, Int(engine.distanceMeters))

    // Right on the pay line: any forward step passes it.
    engine.addCar(lane: 0, y: RaceEngine.playerY + RaceEngine.carLength)
    _ = engine.step(dt: dt)
    XCTAssertEqual(engine.score, Int(engine.distanceMeters) + RaceEngine.overtakeBonus)
  }

  // MARK: - Helpers

  /// `random() == 0.5` pins every spawn roll (middle lane, mid speed,
  /// paint job 2), keeping scenarios reproducible.
  private func makeEngine() -> RaceEngine {
    RaceEngine(random: { 0.5 })
  }
}
