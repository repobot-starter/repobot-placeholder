import Foundation

/// Asteroid size tiers. `radius` (px), base `speed` (px/s) and `score` mirror
/// the web `radiusByTier` / `speedByTier` / `SCORE_BY_TIER` tables exactly so
/// both platforms play and score identically.
enum AstroTier: Int, CaseIterable, Equatable {
  case small = 1
  case medium = 2
  case large = 3

  var radius: Double {
    switch self {
    case .small: return 15
    case .medium: return 28
    case .large: return 46
    }
  }

  /// Base drift speed; the actual speed is scaled by 0.7–1.3 at spawn,
  /// exactly like the web `spawnAsteroidAt`.
  var speed: Double {
    switch self {
    case .small: return 110
    case .medium: return 70
    case .large: return 40
    }
  }

  var score: Int {
    switch self {
    case .small: return 100
    case .medium: return 50
    case .large: return 20
    }
  }

  /// Tier the two split children spawn at; nil for the smallest rocks, which
  /// vaporize outright.
  var smaller: AstroTier? { AstroTier(rawValue: rawValue - 1) }
}

/// The player ship. `invulnerableUntil` is in engine seconds (the web stores
/// `performance.now() + 2000`; the engine keeps its own clock instead so the
/// simulation stays pure and step-driven).
struct AstroShip: Equatable {
  var x: Double
  var y: Double
  /// Heading in radians; -π/2 points "up" like the web ship.
  var angle: Double
  var vx: Double
  var vy: Double
  var invulnerableUntil: Double
  var thrusting: Bool
}

/// One rock. `spin`/`rotation`/`lumps` are the baked-once visual identity
/// from the web `spawnAsteroidAt` (lumpy silhouette), carried in the engine
/// because they are part of the deterministic RNG stream.
struct AstroAsteroid: Equatable {
  var x: Double
  var y: Double
  var vx: Double
  var vy: Double
  let tier: AstroTier
  let radius: Double
  let spin: Double
  var rotation: Double
  /// Radius multipliers (0.75–1.25) for each silhouette vertex.
  let lumps: [Double]
}

struct AstroBullet: Equatable {
  var x: Double
  var y: Double
  var vx: Double
  var vy: Double
  /// Engine-clock time the bullet was fired (web: `performance.now()`).
  var bornAt: Double
}

/// Explosion debris color family — the web passes literal hex colors into
/// `makeExplosion`; the engine only records which palette entry to use.
enum AstroParticleKind: Equatable {
  /// Web "#ff9d5c" — asteroid destruction.
  case asteroidDebris
  /// Web "#57c8ff" — ship destruction.
  case shipDebris
}

struct AstroParticle: Equatable {
  var x: Double
  var y: Double
  var vx: Double
  var vy: Double
  /// Remaining life in seconds; the renderer uses it as the fade alpha.
  var life: Double
  let kind: AstroParticleKind
}

/// Discrete things that happened during one `step(dt:)` — the native twin of
/// the web game's HUD/game-over callbacks. The renderer can use these for
/// sounds or haptics; tests use them to assert on game flow.
enum AstroEvent: Equatable {
  case asteroidDestroyed(tier: AstroTier)
  case shipDestroyed(livesLeft: Int)
  case sectorCleared(newLevel: Int)
  case gameOver(score: Int, level: Int)
}

/// Pure port of the web AstroBot simulation
/// (`web/app/src/View/Games/Astro/AstroGame.tsx` + `entities.ts`). No SwiftUI
/// here: the engine is a plain state machine driven by `step(dt:)` so it can
/// be unit-tested headlessly and rendered by any frontend.
///
/// Controls arrive as held-input flags (`isTurningLeft` etc.) — the native
/// twin of the web's pressed-keys set — so the view layer only translates
/// touches into booleans and never touches the rules.
///
/// Randomness (asteroid spawn position/speed/shape, debris spray) goes
/// through an injected closure so tests can make the simulation fully
/// deterministic.
final class AstroEngine {
  // Field geometry and tuning — must stay byte-for-byte in sync with the web
  // constants in AstroGame.tsx / entities.ts.
  static let fieldWidth: Double = 820
  static let fieldHeight: Double = 620
  static let turnSpeed: Double = 3.6
  static let thrust: Double = 300
  static let drag: Double = 0.4
  /// Web FIRE_COOLDOWN_MS = 180.
  static let fireCooldown: Double = 0.18
  /// Web BULLET_LIFE_MS = 1100.
  static let bulletLife: Double = 1.1
  static let bulletSpeed: Double = 460
  static let startingLives = 3
  static let shipRadius: Double = 14
  /// Fresh ships are safe for 2s (web `makeShip`: now + 2000).
  static let respawnInvulnerability: Double = 2.0
  /// Bonus for clearing a sector.
  static let sectorBonus = 250
  /// New rocks never spawn within this distance of the ship (web: 160).
  static let safeSpawnDistance: Double = 160

  // Held inputs, set by the view every time a touch begins/ends. These are
  // the native equivalent of the web's `keys` set (←/→, ↑, space).
  var isTurningLeft = false
  var isTurningRight = false
  var isThrusting = false
  var isFiring = false

  private(set) var ship: AstroShip
  private(set) var asteroids: [AstroAsteroid] = []
  private(set) var bullets: [AstroBullet] = []
  private(set) var particles: [AstroParticle] = []
  private(set) var score = 0
  private(set) var lives = AstroEngine.startingLives
  private(set) var level = 1
  private(set) var isOver = false
  /// Engine clock in seconds, advanced by `step(dt:)`. Replaces the web's
  /// `performance.now()` so identical steps always produce identical states.
  private(set) var elapsed: Double = 0

  private var lastShotAt = -Double.greatestFiniteMagnitude
  private let random: () -> Double

  var isShipInvulnerable: Bool { elapsed < ship.invulnerableUntil }

  init(random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.random = random
    self.ship = AstroShip(
      x: Self.fieldWidth / 2, y: Self.fieldHeight / 2, angle: -Double.pi / 2,
      vx: 0, vy: 0, invulnerableUntil: Self.respawnInvulnerability, thrusting: false
    )
    startLevel(1)
  }

  /// Full reset (the web "New Game" / resetToken path).
  func newGame() {
    elapsed = 0
    score = 0
    lives = Self.startingLives
    isOver = false
    bullets = []
    particles = []
    lastShotAt = -Double.greatestFiniteMagnitude
    ship = makeShip()
    startLevel(1)
  }

  /// Advance the simulation. Mirrors the web `step` frame-for-frame: turn,
  /// thrust, drag, move+wrap ship, fire, move bullets/asteroids/particles,
  /// bullet↔asteroid hits (with splitting), asteroid↔ship collision, and the
  /// next-sector check. Returns the discrete events that occurred.
  func step(dt: Double) -> [AstroEvent] {
    guard !isOver else { return [] }
    var events: [AstroEvent] = []
    elapsed += dt
    let now = elapsed

    // Ship: rotate, thrust, drag, integrate, wrap (web margin = ship radius).
    if isTurningLeft { ship.angle -= Self.turnSpeed * dt }
    if isTurningRight { ship.angle += Self.turnSpeed * dt }
    if isThrusting {
      ship.vx += cos(ship.angle) * Self.thrust * dt
      ship.vy += sin(ship.angle) * Self.thrust * dt
    }
    ship.vx *= 1 - Self.drag * dt
    ship.vy *= 1 - Self.drag * dt
    ship.x += ship.vx * dt
    ship.y += ship.vy * dt
    ship.thrusting = isThrusting
    (ship.x, ship.y) = wrapped(x: ship.x, y: ship.y, margin: Self.shipRadius)

    // Fire from the nose, inheriting ship velocity (web makeBullet).
    if isFiring, now - lastShotAt > Self.fireCooldown {
      lastShotAt = now
      bullets.append(AstroBullet(
        x: ship.x + cos(ship.angle) * Self.shipRadius,
        y: ship.y + sin(ship.angle) * Self.shipRadius,
        vx: ship.vx + cos(ship.angle) * Self.bulletSpeed,
        vy: ship.vy + sin(ship.angle) * Self.bulletSpeed,
        bornAt: now
      ))
    }

    // Bullets: expire, move, wrap (no margin, like web).
    bullets.removeAll { now - $0.bornAt >= Self.bulletLife }
    for index in bullets.indices {
      var bullet = bullets[index]
      bullet.x += bullet.vx * dt
      bullet.y += bullet.vy * dt
      (bullet.x, bullet.y) = wrapped(x: bullet.x, y: bullet.y, margin: 0)
      bullets[index] = bullet
    }

    // Asteroids: drift, spin, wrap (margin = own radius).
    for index in asteroids.indices {
      var asteroid = asteroids[index]
      asteroid.x += asteroid.vx * dt
      asteroid.y += asteroid.vy * dt
      asteroid.rotation += asteroid.spin * dt
      (asteroid.x, asteroid.y) = wrapped(x: asteroid.x, y: asteroid.y, margin: asteroid.radius)
      asteroids[index] = asteroid
    }

    // Particles: age out, survivors drift (web filters then moves).
    for index in particles.indices {
      particles[index].life -= dt
    }
    particles.removeAll { $0.life <= 0 }
    for index in particles.indices {
      particles[index].x += particles[index].vx * dt
      particles[index].y += particles[index].vy * dt
    }

    // Bullet -> asteroid hits: first overlapping bullet is consumed, the rock
    // scores and splits until tier 1 (two children per split, like web).
    var survivors: [AstroAsteroid] = []
    for asteroid in asteroids {
      let hitIndex = bullets.firstIndex {
        hypot($0.x - asteroid.x, $0.y - asteroid.y) < asteroid.radius
      }
      guard let hitIndex else {
        survivors.append(asteroid)
        continue
      }
      bullets.remove(at: hitIndex)
      score += asteroid.tier.score
      particles.append(contentsOf: makeExplosion(x: asteroid.x, y: asteroid.y, kind: .asteroidDebris))
      events.append(.asteroidDestroyed(tier: asteroid.tier))
      if let smaller = asteroid.tier.smaller {
        survivors.append(spawnAsteroid(x: asteroid.x, y: asteroid.y, tier: smaller))
        survivors.append(spawnAsteroid(x: asteroid.x, y: asteroid.y, tier: smaller))
      }
    }
    asteroids = survivors

    // Asteroid -> ship collision (web pads the hit circle by -4 px to be
    // forgiving). Skipped entirely while the respawn shield is up.
    if !isShipInvulnerable {
      let collided = asteroids.contains {
        hypot($0.x - ship.x, $0.y - ship.y) < $0.radius + Self.shipRadius - 4
      }
      if collided {
        lives -= 1
        particles.append(contentsOf: makeExplosion(x: ship.x, y: ship.y, kind: .shipDebris))
        if lives <= 0 {
          isOver = true
          events.append(.gameOver(score: score, level: level))
        } else {
          events.append(.shipDestroyed(livesLeft: lives))
          ship = makeShip()
        }
      }
    }

    // Field clear: next sector spawns immediately plus the +250 bonus.
    if asteroids.isEmpty {
      startLevel(level + 1)
      score += Self.sectorBonus
      events.append(.sectorCleared(newLevel: level))
    }

    return events
  }

  // MARK: - Test hooks

  /// Test hook: clear the rock field to build exact collision scenarios.
  /// (The next `step` will treat an empty field as a cleared sector.)
  func removeAllAsteroids() {
    asteroids = []
  }

  /// Test hook: spawn a rock at an exact spot with an exact velocity.
  func addAsteroid(x: Double, y: Double, tier: AstroTier, vx: Double = 0, vy: Double = 0) {
    var asteroid = spawnAsteroid(x: x, y: y, tier: tier)
    asteroid.vx = vx
    asteroid.vy = vy
    asteroids.append(asteroid)
  }

  /// Test hook: place a live bullet directly.
  func addBullet(x: Double, y: Double, vx: Double = 0, vy: Double = 0) {
    bullets.append(AstroBullet(x: x, y: y, vx: vx, vy: vy, bornAt: elapsed))
  }

  /// Test hook: teleport the ship.
  func setShip(x: Double, y: Double, vx: Double = 0, vy: Double = 0, angle: Double = -Double.pi / 2) {
    ship.x = x
    ship.y = y
    ship.vx = vx
    ship.vy = vy
    ship.angle = angle
  }

  /// Test hook: drop the respawn shield immediately.
  func endInvulnerability() {
    ship.invulnerableUntil = -1
  }

  // MARK: - Spawning

  /// Fresh centered ship with the 2s shield (web `makeShip`).
  private func makeShip() -> AstroShip {
    AstroShip(
      x: Self.fieldWidth / 2, y: Self.fieldHeight / 2, angle: -Double.pi / 2,
      vx: 0, vy: 0, invulnerableUntil: elapsed + Self.respawnInvulnerability,
      thrusting: false
    )
  }

  /// Populate a sector: `2 + level` large rocks kept away from the ship
  /// (web `startLevel` + `makeAsteroid`).
  private func startLevel(_ newLevel: Int) {
    level = newLevel
    asteroids = (0..<(2 + newLevel)).map { _ in
      // The web rejection-samples with an unbounded do/while; we cap the
      // attempts so a pathological RNG can never hang the engine.
      var x = random() * Self.fieldWidth
      var y = random() * Self.fieldHeight
      for _ in 0..<100 where hypot(x - ship.x, y - ship.y) < Self.safeSpawnDistance {
        x = random() * Self.fieldWidth
        y = random() * Self.fieldHeight
      }
      return spawnAsteroid(x: x, y: y, tier: .large)
    }
  }

  /// Web `spawnAsteroidAt`: random heading, 0.7–1.3× tier speed, random spin
  /// and a baked lumpy silhouette of 9–12 vertices. RNG call order matches
  /// the web factory so seeded runs stay comparable.
  private func spawnAsteroid(x: Double, y: Double, tier: AstroTier) -> AstroAsteroid {
    let angle = random() * Double.pi * 2
    let speed = tier.speed * (0.7 + random() * 0.6)
    let pointCount = 9 + Int(random() * 4)
    return AstroAsteroid(
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      tier: tier,
      radius: tier.radius,
      spin: (random() - 0.5) * 1.6,
      rotation: 0,
      lumps: (0..<pointCount).map { _ in 0.75 + random() * 0.5 }
    )
  }

  /// Web `makeExplosion`: 14 debris sparks with random spread and lifetime.
  private func makeExplosion(x: Double, y: Double, kind: AstroParticleKind) -> [AstroParticle] {
    (0..<14).map { _ in
      let angle = random() * Double.pi * 2
      let speed = 40 + random() * 140
      return AstroParticle(
        x: x,
        y: y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        life: 0.5 + random() * 0.4,
        kind: kind
      )
    }
  }

  /// Toroidal wrap with a per-entity margin (web `wrap`).
  private func wrapped(x: Double, y: Double, margin: Double) -> (Double, Double) {
    var x = x
    var y = y
    if x < -margin { x = Self.fieldWidth + margin }
    if x > Self.fieldWidth + margin { x = -margin }
    if y < -margin { y = Self.fieldHeight + margin }
    if y > Self.fieldHeight + margin { y = -margin }
    return (x, y)
  }
}
