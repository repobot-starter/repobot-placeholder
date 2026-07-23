import Foundation

/// One row house. `x` is the left edge in world units; `roofY` the roof line
/// (down is +y). `chimneyOffset` is the chimney's left edge relative to the
/// house's left, or nil for the chimney-free warm-up houses.
struct ChimneyHouse: Equatable {
  let x: Double
  let width: Double
  let roofY: Double
  let chimneyOffset: Double?
  /// Sequential index; index 0 is the first house of the run.
  let index: Int
  /// Whether this house has paid its "cleared" score.
  var cleared: Bool
}

/// Discrete things that happened during one `step(dt:)` — the native twin of
/// the web game's HUD/ending callbacks.
enum ChimneyEvent: Equatable {
  case hop(total: Int)
  case cooked(score: Int)
  case fell(score: Int)
  case bonked(score: Int)
}

/// How a run ended; nil while running.
enum ChimneyEnding {
  case cooked
  case fell
  case bonked
}

/// Pure port of the web ChimneyBot simulation
/// (`web/app/src/View/Games/Chimney/engine.ts`). No SwiftUI here: the engine
/// is a plain state machine driven by `step(dt:)` so it can be unit-tested
/// headlessly and rendered by any frontend.
///
/// A night-time rooftop runner: the robot sprints across an endless street of
/// row houses, jumping house by house. Clear the gap and the chimney and the
/// run continues; land IN a chimney and you slide down onto the family's
/// dinner stove — you get cooked. Smack into a chimney or miss a roof and you
/// fall to the street.
///
/// Jump is press/release (`pressJump()`/`releaseJump()`) so a tap hops and a
/// hold clears the wide gaps — the native twin of a held key.
///
/// Randomness (house width, gap, roof height, chimney spot) goes through an
/// injected closure so tests can pin every roll. Keep the constants, the RNG
/// call order in `pushHouse` (width, gap, roof rise, chimney position —
/// including the dummy roll for narrow houses), and the collision rules in
/// sync with the web engine so every platform plays identically.
final class ChimneyEngine {
  // Field geometry and tuning — must stay byte-for-byte in sync with the web
  // constants in engine.ts.
  /// Field units; the view scales the field to its canvas.
  static let fieldWidth: Double = 720
  static let fieldHeight: Double = 420
  /// The runner's fixed screen x; the world scrolls, the runner does not.
  static let playerX: Double = 168
  static let playerWidth: Double = 26
  static let playerHeight: Double = 34
  /// Ground speed at the first rooftop (units/s)…
  static let runSpeedStart: Double = 180
  /// …the ceiling it ramps to…
  static let runSpeedMax: Double = 360
  /// …and the ramp per second of running — the difficulty curve.
  static let runAcceleration: Double = 4.5
  static let gravity: Double = 1500
  static let jumpVelocity: Double = -600
  /// Releasing jump early multiplies any remaining upward velocity by this,
  /// so a tap hops and a hold soars.
  static let jumpCutFactor: Double = 0.45
  /// Grace window to jump after running off a roof edge (seconds).
  static let coyoteTime: Double = 0.09
  /// A jump pressed this long before landing still fires on touchdown.
  static let jumpBuffer: Double = 0.12
  /// House geometry is generated in SECONDS of travel at the current run
  /// speed, not fixed units: jump airtime is constant (gravity does not
  /// ramp), so a gap that takes 0.5s to cross is equally hard at every
  /// speed. This keeps the street fair forever while the world visually
  /// rushes ever faster.
  static let houseSecondsMin: Double = 0.95
  static let houseSecondsMax: Double = 1.45
  /// Tap-hop airtime is ~0.36s and a full-hold jump ~0.8s; gaps sit between.
  static let gapSecondsMin: Double = 0.28
  static let gapSecondsMax: Double = 0.52
  /// Roof y band (down is +y): roofs step up/down between these levels.
  static let roofYMin: Double = 200
  static let roofYMax: Double = 300
  /// Biggest upward step between consecutive roofs (keeps jumps makeable).
  static let roofRiseMax: Double = 40
  static let chimneyWidth: Double = 36
  static let chimneyHeight: Double = 30
  /// Brick lip on each side of the opening.
  static let chimneyLip: Double = 5
  static let chimneyOpening: Double = chimneyWidth - chimneyLip * 2
  /// Chimney keeps this margin (in seconds of travel) from the house edges,
  /// so a landing arc always leaves room to touch down before the bricks
  /// and set up the next jump — at any speed.
  static let chimneyMarginSeconds: Double = 0.35
  /// The first houses of a run are chimney-free so the opening is a warm-up.
  static let safeHouses = 3

  static let highScoreKey = "chimneybot-high-score"

  private(set) var houses: [ChimneyHouse] = []
  /// World-space x of the runner's left edge (the camera follows it).
  private(set) var playerWorldX: Double = 0
  /// Runner top y.
  private(set) var playerY: Double = 0
  /// Vertical velocity (down is +).
  private(set) var velocityY: Double = 0
  private(set) var speed = ChimneyEngine.runSpeedStart
  private(set) var housesCleared = 0
  private(set) var isOver = false
  /// How the run ended; nil while running.
  private(set) var ending: ChimneyEnding?
  /// Engine clock in seconds.
  private(set) var elapsed: Double = 0

  private var isOnRoof = true
  private var coyoteRemaining = ChimneyEngine.coyoteTime
  private var jumpBufferRemaining: Double = 0
  private var isJumpHeld = false
  /// World x where the most recently generated house ends (next spawn x).
  private var frontier: Double = 0
  private var nextHouseIndex = 0
  private let random: () -> Double

  init(random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.random = random
  }

  var score: Int {
    housesCleared
  }

  /// Full reset (the web "Restart Run" path).
  func newGame() {
    houses = []
    frontier = 0
    nextHouseIndex = 0
    speed = Self.runSpeedStart
    housesCleared = 0
    isOver = false
    ending = nil
    elapsed = 0
    velocityY = 0
    isOnRoof = true
    coyoteRemaining = Self.coyoteTime
    jumpBufferRemaining = 0
    isJumpHeld = false

    // The opening house starts under the runner's feet with no gap before
    // it, so every run begins mid-stride on a safe roof.
    pushHouse(isFirst: true)
    playerWorldX = houses[0].x + 40
    playerY = houses[0].roofY - Self.playerHeight
    ensureHouses()
  }

  func pressJump() {
    guard !isOver else { return }
    isJumpHeld = true
    if isOnRoof || coyoteRemaining > 0 {
      velocityY = Self.jumpVelocity
      isOnRoof = false
      coyoteRemaining = 0
    } else {
      jumpBufferRemaining = Self.jumpBuffer
    }
  }

  func releaseJump() {
    isJumpHeld = false
    if velocityY < 0 {
      velocityY *= Self.jumpCutFactor
    }
  }

  /// Advance the simulation. Mirrors the web `step` frame-for-frame: ramp
  /// the run speed, move the runner, apply gravity, land on roofs, detect
  /// the three endings (cooked in a chimney, bonked on a chimney wall, fell
  /// in a gap), and keep the street generated ahead of the camera.
  func step(dt: Double) -> [ChimneyEvent] {
    guard !isOver else { return [] }
    var events: [ChimneyEvent] = []
    elapsed += dt
    speed = min(Self.runSpeedMax, speed + Self.runAcceleration * dt)

    let previousFeet = playerY + Self.playerHeight
    let previousWorldX = playerWorldX
    playerWorldX += speed * dt
    velocityY += Self.gravity * dt
    playerY += velocityY * dt

    let feet = playerY + Self.playerHeight

    // Running into a taller facade: the wall stops the runner, who then
    // slides down the bricks into the alley (gravity finishes the run).
    let wall = houses.first { candidate in
      previousWorldX + Self.playerWidth <= candidate.x
        && playerWorldX + Self.playerWidth > candidate.x
        && feet > candidate.roofY + 4
    }
    if let wall {
      playerWorldX = wall.x - Self.playerWidth
    }

    let left = playerWorldX
    let right = playerWorldX + Self.playerWidth
    let centerX = left + Self.playerWidth / 2
    let houseIndex = houseIndexUnder(left: left, right: right)

    // Chimney checks come first: the chimney owns its slice of the roof.
    if let houseIndex, let chimneyOffset = houses[houseIndex].chimneyOffset {
      let house = houses[houseIndex]
      let chimneyLeft = house.x + chimneyOffset
      let chimneyRight = chimneyLeft + Self.chimneyWidth
      let chimneyTop = house.roofY - Self.chimneyHeight
      let openingLeft = chimneyLeft + Self.chimneyLip
      let openingRight = chimneyRight - Self.chimneyLip
      let overlapsChimney = right > chimneyLeft && left < chimneyRight

      if velocityY > 0, previousFeet <= chimneyTop, feet >= chimneyTop, overlapsChimney {
        if centerX >= openingLeft, centerX <= openingRight {
          // Cooked: dropped straight down the flue, onto the stove.
          isOver = true
          ending = .cooked
          events.append(.cooked(score: score))
          return events
        }
        // Caught the brick rim: stand on the chimney like a mini roof.
        // Still counts as making the house.
        playerY = chimneyTop - Self.playerHeight
        velocityY = 0
        isOnRoof = true
        coyoteRemaining = Self.coyoteTime
        if !house.cleared, house.index > 0 {
          houses[houseIndex].cleared = true
          housesCleared += 1
          events.append(.hop(total: housesCleared))
        }
        ensureHouses()
        return events
      }

      // Bonked: running face-first into the brick side while below the
      // chimney's rim. The runner drops where they stand.
      if previousWorldX + Self.playerWidth <= chimneyLeft,
        right > chimneyLeft,
        feet > chimneyTop + 4 {
        isOver = true
        ending = .bonked
        events.append(.bonked(score: score))
        return events
      }
    }

    // Landing: falling onto (or running along) a roof snaps the feet to the
    // roof line. Only the roof the feet actually crossed counts.
    if let houseIndex,
      velocityY >= 0,
      previousFeet <= houses[houseIndex].roofY,
      feet >= houses[houseIndex].roofY {
      playerY = houses[houseIndex].roofY - Self.playerHeight
      velocityY = 0
      isOnRoof = true
      coyoteRemaining = Self.coyoteTime
      if jumpBufferRemaining > 0 {
        jumpBufferRemaining = 0
        velocityY = Self.jumpVelocity
        isOnRoof = false
        if !isJumpHeld {
          velocityY *= Self.jumpCutFactor
        }
      }
      if !houses[houseIndex].cleared, houses[houseIndex].index > 0 {
        houses[houseIndex].cleared = true
        housesCleared += 1
        events.append(.hop(total: housesCleared))
      }
    } else if isOnRoof, houseIndex.map({ feet < houses[$0].roofY - 1 }) ?? true {
      // Ran off an edge: start falling with the coyote window open.
      isOnRoof = false
    }

    if !isOnRoof {
      coyoteRemaining = max(0, coyoteRemaining - dt)
    }
    jumpBufferRemaining = max(0, jumpBufferRemaining - dt)

    // Fell: past every roof line, into the street between the houses.
    if playerY + Self.playerHeight > Self.fieldHeight {
      isOver = true
      ending = .fell
      events.append(.fell(score: score))
      return events
    }

    ensureHouses()
    return events
  }

  /// The house whose roof span overlaps the runner's footprint, if any.
  private func houseIndexUnder(left: Double, right: Double) -> Int? {
    // Prefer the house under the runner's center of mass so an edge
    // straddle resolves to the roof most of the runner stands on.
    let center = (left + right) / 2
    if let index = houses.firstIndex(where: { center >= $0.x && center < $0.x + $0.width }) {
      return index
    }
    return houses.firstIndex(where: { right > $0.x && left < $0.x + $0.width })
  }

  /// Keep the street generated one screen past the camera's right edge.
  private func ensureHouses() {
    while frontier < playerWorldX + Self.fieldWidth * 1.5 {
      pushHouse(isFirst: false)
    }
    // Drop houses fully behind the camera.
    houses.removeAll { $0.x + $0.width <= playerWorldX - Self.fieldWidth }
  }

  /// Generate the next house (RNG order: width, gap, roof rise, chimney
  /// position — matching the web engine). All horizontal sizes are rolled
  /// in seconds of travel at the current speed, so the street stays fair as
  /// the run accelerates. The first house of a run starts at the frontier
  /// with no gap; warm-up houses skip the chimney.
  private func pushHouse(isFirst: Bool) {
    let width = speed * (Self.houseSecondsMin + random() * (Self.houseSecondsMax - Self.houseSecondsMin))
    let gap = isFirst
      ? 0
      : speed * (Self.gapSecondsMin + random() * (Self.gapSecondsMax - Self.gapSecondsMin))

    let previousRoof = houses.last?.roofY ?? (Self.roofYMin + Self.roofYMax) / 2
    // Roofs step anywhere down, but at most roofRiseMax up.
    let lowestAllowed = max(Self.roofYMin, previousRoof - Self.roofRiseMax)
    let roofY = isFirst
      ? previousRoof
      : lowestAllowed + random() * (Self.roofYMax - lowestAllowed)

    let index = nextHouseIndex
    nextHouseIndex += 1

    var chimneyOffset: Double?
    let margin = speed * Self.chimneyMarginSeconds
    let chimneySpan = width - margin * 2 - Self.chimneyWidth
    if index >= Self.safeHouses, chimneySpan > 0 {
      chimneyOffset = margin + random() * chimneySpan
    } else if index >= Self.safeHouses {
      // Roll anyway so narrow houses keep the RNG stream aligned across
      // platforms, then center the chimney.
      _ = random()
      chimneyOffset = max(0, (width - Self.chimneyWidth) / 2)
    }

    houses.append(ChimneyHouse(
      x: frontier + gap,
      width: width,
      roofY: roofY,
      chimneyOffset: chimneyOffset,
      index: index,
      cleared: index == 0
    ))
    frontier += gap + width
  }

  // MARK: - Test hooks

  /// Test hook: replace the generated street with an exact layout.
  func setHouses(_ houses: [ChimneyHouse]) {
    self.houses = houses
    frontier = .greatestFiniteMagnitude
  }

  /// Test hook: place the runner at an exact spot with a velocity.
  func placeRunner(worldX: Double, y: Double, velocityY: Double, onRoof: Bool) {
    playerWorldX = worldX
    playerY = y
    self.velocityY = velocityY
    isOnRoof = onRoof
  }
}
