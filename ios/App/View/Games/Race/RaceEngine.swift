import Foundation

/// One traffic car. `x` is the center in field units, `y` the top edge;
/// `kind` picks the paint-job palette entry (part of the deterministic RNG
/// stream, like the asteroid silhouettes in Astro).
struct RaceTrafficCar: Equatable {
  /// Lane index 0 (left) to 2 (right).
  let lane: Int
  let x: Double
  var y: Double
  /// Own cruise speed (units/s); closing speed is player minus this.
  let speed: Double
  /// Paint-job palette index (0..trafficKindCount-1).
  let kind: Int
  /// Whether the overtake bonus for this car has been paid.
  var passed: Bool
}

/// Discrete things that happened during one `step(dt:)` — the native twin of
/// the web game's HUD/crash callbacks.
enum RaceEvent: Equatable {
  case overtake(total: Int)
  case crash(score: Int)
}

/// Pure port of the web RaceBot simulation
/// (`web/app/src/View/Games/Race/engine.ts`). No SwiftUI here: the engine is
/// a plain state machine driven by `step(dt:)` so it can be unit-tested
/// headlessly and rendered by any frontend.
///
/// Steering is tap-based (`steerLeft()`/`steerRight()` move the target lane);
/// nitro arrives as a held-input flag — the native twin of a held key.
///
/// Randomness (spawn lane, traffic speed, paint job) goes through an injected
/// closure so tests can pin every spawn decision. The RNG call order in
/// `trySpawnCar` (lane, speed, kind) matches the web engine exactly.
final class RaceEngine {
  // Field geometry and tuning — must stay byte-for-byte in sync with the web
  // constants in engine.ts.
  static let fieldWidth: Double = 420
  static let fieldHeight: Double = 720
  static let laneCount = 3
  /// Asphalt inset: shoulders on both sides of the three 110-unit lanes.
  static let roadLeft: Double = 45
  static let roadWidth: Double = 330
  static let laneWidth: Double = roadWidth / Double(laneCount)
  static let carWidth: Double = 62
  static let carLength: Double = 108
  /// Top edge of the player car; fixed — the world scrolls, the car does not.
  static let playerY: Double = 560
  /// Cruise speed at the green light (field units/s).
  static let baseSpeed: Double = 260
  /// Cruise ceiling; nitro can push past it.
  static let maxSpeed: Double = 640
  /// Cruise speed gained per second of driving — the difficulty ramp.
  static let acceleration: Double = 9
  /// Sideways glide speed during a lane change (units/s).
  static let laneChangeSpeed: Double = 520
  static let nitroMultiplier: Double = 1.6
  /// Gauge (0-1) drained per second while boosting.
  static let nitroDrain: Double = 0.35
  /// Gauge regenerated per second while cruising.
  static let nitroRegen: Double = 0.12
  /// Traffic cruises at a fixed speed rolled at spawn (units/s).
  static let trafficMinSpeed: Double = 110
  static let trafficMaxSpeed: Double = 215
  /// Distinct traffic paint jobs; the roll only picks the palette index.
  static let trafficKindCount = 4
  /// Seconds between spawn attempts at the start of a run…
  static let spawnIntervalStart: Double = 1.35
  /// …and the floor it ramps down to.
  static let spawnIntervalMin: Double = 0.55
  /// How much the spawn interval shrinks per second of driving.
  static let spawnIntervalRamp: Double = 0.008
  /// A spawn is skipped if it would leave no free lane in the top
  /// `entryWindow` units of the field — there must always be a way through.
  static let entryWindow: Double = 260
  /// Minimum bumper-to-bumper gap within a lane at spawn time.
  static let spawnGap: Double = carLength * 1.6
  /// Score per car passed.
  static let overtakeBonus = 50
  /// Field units per scored meter (≈ 43 m/s at base cruise).
  static let unitsPerMeter: Double = 6
  /// Collision paddings: slightly forgiving, like the web.
  static let hitWidth: Double = carWidth * 0.82
  static let hitLengthPad: Double = 6

  static let highScoreKey = "racebot-high-score"

  static func laneCenter(_ lane: Int) -> Double {
    roadLeft + laneWidth * (Double(lane) + 0.5)
  }

  /// Held input: nitro pedal down.
  var isBoosting = false

  private(set) var traffic: [RaceTrafficCar] = []
  /// Lane the player is gliding toward.
  private(set) var targetLane = 1
  /// Player center x; glides toward the target lane's center.
  private(set) var playerX = RaceEngine.laneCenter(1)
  /// Current cruise speed (before the nitro multiplier).
  private(set) var speed = RaceEngine.baseSpeed
  /// Nitro gauge, 0-1.
  private(set) var nitro: Double = 1
  private(set) var distanceMeters: Double = 0
  private(set) var overtakes = 0
  private(set) var isOver = false
  /// Engine clock in seconds; drives the difficulty ramp.
  private(set) var elapsed: Double = 0

  private var spawnCooldown = RaceEngine.spawnIntervalStart
  private let random: () -> Double

  init(random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.random = random
  }

  var score: Int {
    Int(distanceMeters) + overtakes * Self.overtakeBonus
  }

  /// True while the nitro flame should render and the multiplier applies.
  var isNitroActive: Bool {
    isBoosting && nitro > 0 && !isOver
  }

  /// Ground speed including nitro (what the speedometer shows).
  var effectiveSpeed: Double {
    speed * (isNitroActive ? Self.nitroMultiplier : 1)
  }

  /// Full reset (the web "Restart Race" path).
  func newGame() {
    traffic = []
    targetLane = 1
    playerX = Self.laneCenter(1)
    speed = Self.baseSpeed
    nitro = 1
    distanceMeters = 0
    overtakes = 0
    isOver = false
    elapsed = 0
    spawnCooldown = Self.spawnIntervalStart
    isBoosting = false
  }

  func steerLeft() {
    if !isOver, targetLane > 0 {
      targetLane -= 1
    }
  }

  func steerRight() {
    if !isOver, targetLane < Self.laneCount - 1 {
      targetLane += 1
    }
  }

  /// Advance the simulation. Mirrors the web `step` frame-for-frame: ramp
  /// the cruise speed, drain/refill nitro, glide the lane change, scroll
  /// traffic by the closing speed, pay overtakes, spawn on the cadence, and
  /// check for a crash. Returns the discrete events that occurred.
  func step(dt: Double) -> [RaceEvent] {
    guard !isOver else { return [] }
    var events: [RaceEvent] = []
    elapsed += dt

    // Cruise ramp and nitro gauge.
    speed = min(Self.maxSpeed, speed + Self.acceleration * dt)
    if isNitroActive {
      nitro = max(0, nitro - Self.nitroDrain * dt)
    } else if !isBoosting {
      // The gauge only refills once the pedal is released — holding it on
      // an empty tank never sputters the boost back on.
      nitro = min(1, nitro + Self.nitroRegen * dt)
    }
    let groundSpeed = effectiveSpeed
    distanceMeters += groundSpeed * dt / Self.unitsPerMeter

    // Lane-change glide: constant lateral speed toward the target center,
    // snapping on arrival so drift never accumulates.
    let target = Self.laneCenter(targetLane)
    if playerX != target {
      let delta = Self.laneChangeSpeed * dt
      if abs(target - playerX) <= delta {
        playerX = target
      } else {
        playerX += target > playerX ? delta : -delta
      }
    }

    // Traffic scrolls by the closing speed; cars behind the field are
    // recycled once fully off-screen.
    for index in traffic.indices {
      traffic[index].y += (groundSpeed - traffic[index].speed) * dt
      if !traffic[index].passed, traffic[index].y > Self.playerY + Self.carLength {
        traffic[index].passed = true
        overtakes += 1
        events.append(.overtake(total: overtakes))
      }
    }
    traffic.removeAll { $0.y >= Self.fieldHeight + Self.carLength * 2 }

    // Spawn cadence ramps with elapsed time.
    spawnCooldown -= dt
    if spawnCooldown <= 0 {
      spawnCooldown = max(
        Self.spawnIntervalMin,
        Self.spawnIntervalStart - elapsed * Self.spawnIntervalRamp
      )
      trySpawnCar()
    }

    // Crash check: forgiving rectangle overlap against every live car.
    let crashed = traffic.contains { car in
      abs(car.x - playerX) < Self.hitWidth
        && Self.playerY + Self.hitLengthPad < car.y + Self.carLength
        && Self.playerY + Self.carLength - Self.hitLengthPad > car.y
    }
    if crashed {
      isOver = true
      events.append(.crash(score: score))
    }

    return events
  }

  /// Roll a spawn (RNG order: lane, speed, kind — matching the web engine).
  /// The spawn is dropped when the rolled lane is too crowded or when it
  /// would close the last free lane in the entry window.
  private func trySpawnCar() {
    let lane = Int(random() * Double(Self.laneCount))
    let speed = Self.trafficMinSpeed + random() * (Self.trafficMaxSpeed - Self.trafficMinSpeed)
    let kind = Int(random() * Double(Self.trafficKindCount))

    let tooClose = traffic.contains { $0.lane == lane && $0.y < Self.spawnGap - Self.carLength }
    if tooClose {
      return
    }
    var blockedLanes = Set(traffic.filter { $0.y < Self.entryWindow }.map(\.lane))
    blockedLanes.insert(lane)
    if blockedLanes.count >= Self.laneCount {
      return
    }

    traffic.append(RaceTrafficCar(
      lane: lane,
      x: Self.laneCenter(lane),
      y: -Self.carLength,
      speed: speed,
      kind: kind,
      passed: false
    ))
  }

  // MARK: - Test hooks

  /// Test hook: empty the road to build exact scenarios.
  func clearTraffic() {
    traffic = []
  }

  /// Test hook: place a car at an exact spot.
  func addCar(lane: Int, y: Double, speed: Double = RaceEngine.trafficMinSpeed, kind: Int = 0) {
    traffic.append(RaceTrafficCar(
      lane: lane, x: Self.laneCenter(lane), y: y, speed: speed, kind: kind, passed: false
    ))
  }

  /// Test hook: snap the player into a lane with no glide.
  func snapToLane(_ lane: Int) {
    targetLane = lane
    playerX = Self.laneCenter(lane)
  }

  /// Test hook: roll one spawn attempt without advancing the world.
  func forceSpawnRoll() {
    trySpawnCar()
  }
}
