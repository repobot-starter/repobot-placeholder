import Foundation

/// Bot aim/power gaussian error per level. Mirrors the web `BOT_LEVELS`
/// table exactly so the bot plays identically on both platforms.
enum CarromBotLevel: String, CaseIterable, Identifiable {
  case easy
  case medium
  case hard

  var id: String { rawValue }

  var aimStdDev: Double {
    switch self {
    case .easy: return 0.1
    case .medium: return 0.05
    case .hard: return 0.018
    }
  }

  var powerStdDev: Double {
    switch self {
    case .easy: return 0.14
    case .medium: return 0.08
    case .hard: return 0.04
    }
  }
}

/// Player 0 flicks white from the bottom baseline; player 1 (the bot on
/// mobile) flicks black from the top.
typealias CarromPlayer = Int

enum CarromPieceKind: Equatable {
  case white
  case black
  case queen
  case striker
}

enum CarromPhase: Equatable {
  case aiming
  case rolling
  case boardOver
  case matchOver
}

/// Queen fate for one settled strike, if it was involved at all.
enum CarromQueenOutcome: Equatable {
  case covered
  case pending
  case returned
}

/// What one settled strike amounted to — drives turn messages and tests.
struct CarromStrikeSummary: Equatable {
  var shooter: CarromPlayer
  var foul: Bool
  var keptTurn: Bool
  var ownPocketed: Int
  var opponentPocketed: Int
  var queenOutcome: CarromQueenOutcome?
}

/// Discrete things that happened during one `step(dt:)` — the native twin
/// of the web engine's event array. The renderer uses these for sounds and
/// HUD refreshes; tests use them to assert on game flow.
enum CarromEvent: Equatable {
  case collision(speed: Double)
  case wall(speed: Double)
  case pocket(piece: CarromPieceKind)
  case strikeResolved(summary: CarromStrikeSummary)
  case boardOver(winner: CarromPlayer, points: Int)
  case matchOver(winner: CarromPlayer)
}

/// One circular rigid body on the board.
struct CarromPiece {
  var id: Int
  var kind: CarromPieceKind
  var x: Double
  var y: Double
  var vx: Double
  var vy: Double
  var radius: Double
  var mass: Double
  /// false once the piece has been pocketed.
  var onBoard: Bool
}

/// Pure port of the web carrom simulation
/// (`web/app/src/View/Games/Carrom/engine.ts`). No SwiftUI here: the engine
/// is a plain state machine driven by `step(dt:)` so it can be unit-tested
/// headlessly and rendered by any frontend.
///
/// Physics: exponential friction, elastic circle-circle and circle-wall
/// collisions, pocket capture, all on a fixed 1/240s substep so the sim is
/// deterministic regardless of frame rate. Rules: alternate turns, keep the
/// turn by pocketing your own color, queen requires cover, striker fouls,
/// board scoring, match to 25.
///
/// Every constant below must stay byte-for-byte in sync with the web
/// engine; randomness (only the bot's aim error) goes through an injected
/// closure so tests are fully deterministic.
final class CarromEngine {
  // Geometry & physics — must stay in sync with the web constants.
  static let boardSize: Double = 600
  static let coinRadius: Double = 12
  static let strikerRadius: Double = 16
  static let pocketRadius: Double = 24
  static let pocketInset: Double = 30
  /// Exponential velocity damping coefficient (per second): v *= e^(-k*dt).
  static let friction: Double = 1.8
  static let restitutionBody: Double = 0.92
  static let restitutionWall: Double = 0.78
  /// Below this speed (units/s) a body snaps to rest.
  static let restSpeed: Double = 6
  static let coinMass: Double = 1
  static let strikerMass: Double = 1.5
  static let maxShotSpeed: Double = 1500
  static let minShotSpeed: Double = 90
  static let baselineOffset: Double = 90
  static let baselineMargin: Double = 110
  static let physicsStep: Double = 1 / 240
  static let coinsPerPlayer = 9
  static let queenPoints = 3
  static let matchTarget = 25

  /// The four corner pocket centers, in board units.
  static let pockets: [(x: Double, y: Double)] = [
    (pocketInset, pocketInset),
    (boardSize - pocketInset, pocketInset),
    (pocketInset, boardSize - pocketInset),
    (boardSize - pocketInset, boardSize - pocketInset),
  ]

  private static let strikerId = 0
  private static let queenId = 1
  private static let center = boardSize / 2
  /// Coin spacing in the opening rack, slightly over one diameter.
  private static let rackSpacing: Double = 24.6

  private(set) var pieces: [CarromPiece] = []
  private(set) var phase: CarromPhase = .aiming
  private(set) var currentPlayer: CarromPlayer = 0
  private(set) var matchScore: [Int] = [0, 0]
  /// Who covered the queen this board, if anyone.
  private(set) var queenOwner: CarromPlayer?
  /// Player who pocketed the queen and still owes a cover.
  private(set) var queenPendingBy: CarromPlayer?
  private(set) var lastSummary: CarromStrikeSummary?
  private(set) var boardWinner: CarromPlayer?
  private(set) var matchWinner: CarromPlayer?

  private let random: () -> Double
  private var accumulator: Double = 0
  private var pocketedThisStrike: [CarromPieceKind] = []
  private var strikerPocketedThisStrike = false

  init(random: @escaping () -> Double = { Double.random(in: 0..<1) }) {
    self.random = random
    newMatch()
  }

  var striker: CarromPiece { pieces[Self.strikerId] }
  var queen: CarromPiece { pieces[Self.queenId] }

  static func color(of player: CarromPlayer) -> CarromPieceKind {
    player == 0 ? .white : .black
  }

  /// The y coordinate of a player's striker baseline.
  static func baselineY(for player: CarromPlayer) -> Double {
    player == 0 ? boardSize - baselineOffset : baselineOffset
  }

  /// How many coins of a color have been pocketed so far this board.
  func pocketedCount(of kind: CarromPieceKind) -> Int {
    pieces.filter { $0.kind == kind && !$0.onBoard }.count
  }

  /// Full match reset: scores to zero, fresh board, player 0 breaks.
  func newMatch() {
    matchScore = [0, 0]
    matchWinner = nil
    setupBoard(breaker: 0)
  }

  /// Rack the next board after a board ends; the board winner breaks.
  func nextBoard() {
    guard phase == .boardOver else { return }
    setupBoard(breaker: boardWinner ?? 0)
  }

  /// Slide the striker along the current shooter's baseline (aiming only).
  func setStrikerX(_ x: Double) {
    guard phase == .aiming else { return }
    pieces[Self.strikerId].x = max(Self.baselineMargin, min(Self.boardSize - Self.baselineMargin, x))
    pieces[Self.strikerId].y = Self.baselineY(for: currentPlayer)
  }

  /// Flick the striker: direction (any length) plus power in [0, 1] mapped
  /// onto [minShotSpeed, maxShotSpeed]. Begins the rolling phase.
  func strike(dirX: Double, dirY: Double, power01: Double) {
    guard phase == .aiming else { return }
    let length = (dirX * dirX + dirY * dirY).squareRoot()
    guard length > 1e-6 else { return }
    let speed = Self.minShotSpeed + max(0, min(1, power01)) * (Self.maxShotSpeed - Self.minShotSpeed)
    pieces[Self.strikerId].vx = dirX / length * speed
    pieces[Self.strikerId].vy = dirY / length * speed
    pocketedThisStrike = []
    strikerPocketedThisStrike = false
    phase = .rolling
  }

  /// Advance the simulation by dt seconds of real time. Internally runs
  /// fixed `physicsStep` substeps (deterministic regardless of frame rate)
  /// and returns every discrete event that occurred.
  func step(dt: Double) -> [CarromEvent] {
    var events: [CarromEvent] = []
    accumulator += min(dt, 0.1)
    while accumulator >= Self.physicsStep {
      accumulator -= Self.physicsStep
      substep(Self.physicsStep, events: &events)
    }
    return events
  }

  /// Plan and immediately play the bot's shot (call while phase is
  /// `.aiming` and it is the bot's turn). Aim error shrinks with level.
  func botStrike(level: CarromBotLevel) {
    guard phase == .aiming else { return }
    let plan = planBotShot(level: level)
    setStrikerX(plan.x)
    strike(dirX: cos(plan.angle), dirY: sin(plan.angle), power01: plan.power01)
  }

  // MARK: - Test hooks

  /// Teleport a piece — sets up collision/pocket scenarios in tests.
  func placePiece(id: Int, x: Double, y: Double, vx: Double = 0, vy: Double = 0) {
    pieces[id].x = x
    pieces[id].y = y
    pieces[id].vx = vx
    pieces[id].vy = vy
  }

  /// Mark a piece as already pocketed, as if by earlier play this board.
  func pocketForTesting(id: Int) {
    pieces[id].onBoard = false
  }

  /// Force the rolling phase so tests can drive physics without a flick.
  func beginRollingForTesting() {
    pocketedThisStrike = []
    strikerPocketedThisStrike = false
    phase = .rolling
  }

  /// Index of the first on-board coin of a kind (for test targeting).
  func firstPieceId(of kind: CarromPieceKind, onBoard: Bool = true) -> Int? {
    pieces.first { $0.kind == kind && $0.onBoard == onBoard }?.id
  }

  // MARK: - Board setup

  private func setupBoard(breaker: CarromPlayer) {
    pieces = []
    queenOwner = nil
    queenPendingBy = nil
    lastSummary = nil
    boardWinner = nil
    currentPlayer = breaker
    phase = .aiming
    accumulator = 0
    pocketedThisStrike = []
    strikerPocketedThisStrike = false

    pieces.append(CarromPiece(
      id: Self.strikerId, kind: .striker,
      x: Self.center, y: Self.baselineY(for: breaker), vx: 0, vy: 0,
      radius: Self.strikerRadius, mass: Self.strikerMass, onBoard: true
    ))
    pieces.append(makeCoin(id: Self.queenId, kind: .queen, x: Self.center, y: Self.center))

    // Classic rack: queen center, inner ring of 6 (alternating, 3+3),
    // outer ring of 12 (alternating, 6+6) → 9 white + 9 black.
    var id = 2
    for i in 0..<6 {
      let angle = -Double.pi / 2 + Double(i) * Double.pi / 3
      let kind: CarromPieceKind = i % 2 == 0 ? .white : .black
      pieces.append(makeCoin(
        id: id, kind: kind,
        x: Self.center + cos(angle) * Self.rackSpacing,
        y: Self.center + sin(angle) * Self.rackSpacing
      ))
      id += 1
    }
    for i in 0..<12 {
      let angle = -Double.pi / 2 + Double.pi / 12 + Double(i) * Double.pi / 6
      let kind: CarromPieceKind = i % 2 == 0 ? .black : .white
      pieces.append(makeCoin(
        id: id, kind: kind,
        x: Self.center + cos(angle) * Self.rackSpacing * 2,
        y: Self.center + sin(angle) * Self.rackSpacing * 2
      ))
      id += 1
    }
  }

  private func makeCoin(id: Int, kind: CarromPieceKind, x: Double, y: Double) -> CarromPiece {
    CarromPiece(
      id: id, kind: kind, x: x, y: y, vx: 0, vy: 0,
      radius: Self.coinRadius, mass: Self.coinMass, onBoard: true
    )
  }

  // MARK: - Physics

  private func substep(_ h: Double, events: inout [CarromEvent]) {
    // Integrate + exponential friction; snap to rest below restSpeed.
    let damping = exp(-Self.friction * h)
    for index in pieces.indices where pieces[index].onBoard {
      pieces[index].x += pieces[index].vx * h
      pieces[index].y += pieces[index].vy * h
      pieces[index].vx *= damping
      pieces[index].vy *= damping
      let speed = (pieces[index].vx * pieces[index].vx + pieces[index].vy * pieces[index].vy).squareRoot()
      if speed < Self.restSpeed {
        pieces[index].vx = 0
        pieces[index].vy = 0
      }
    }

    // Elastic circle-circle collisions with positional correction.
    for i in pieces.indices where pieces[i].onBoard {
      for j in pieces.indices where j > i && pieces[j].onBoard {
        collide(i, j, events: &events)
      }
    }

    // Walls (axis-aligned, energy scaled by restitutionWall).
    for index in pieces.indices where pieces[index].onBoard {
      let r = pieces[index].radius
      if pieces[index].x < r {
        pieces[index].x = r
        if pieces[index].vx < 0 {
          events.append(.wall(speed: abs(pieces[index].vx)))
          pieces[index].vx = -pieces[index].vx * Self.restitutionWall
        }
      } else if pieces[index].x > Self.boardSize - r {
        pieces[index].x = Self.boardSize - r
        if pieces[index].vx > 0 {
          events.append(.wall(speed: pieces[index].vx))
          pieces[index].vx = -pieces[index].vx * Self.restitutionWall
        }
      }
      if pieces[index].y < r {
        pieces[index].y = r
        if pieces[index].vy < 0 {
          events.append(.wall(speed: abs(pieces[index].vy)))
          pieces[index].vy = -pieces[index].vy * Self.restitutionWall
        }
      } else if pieces[index].y > Self.boardSize - r {
        pieces[index].y = Self.boardSize - r
        if pieces[index].vy > 0 {
          events.append(.wall(speed: pieces[index].vy))
          pieces[index].vy = -pieces[index].vy * Self.restitutionWall
        }
      }
    }

    // Pocket capture: a piece whose center enters a pocket circle drops.
    for index in pieces.indices where pieces[index].onBoard {
      for pocket in Self.pockets {
        let dx = pieces[index].x - pocket.x
        let dy = pieces[index].y - pocket.y
        if (dx * dx + dy * dy).squareRoot() < Self.pocketRadius {
          pieces[index].onBoard = false
          pieces[index].vx = 0
          pieces[index].vy = 0
          if pieces[index].kind == .striker {
            strikerPocketedThisStrike = true
          } else {
            pocketedThisStrike.append(pieces[index].kind)
          }
          events.append(.pocket(piece: pieces[index].kind))
          break
        }
      }
    }

    // A strike is over once every remaining body is at rest.
    if phase == .rolling {
      let settled = pieces.allSatisfy { !$0.onBoard || ($0.vx == 0 && $0.vy == 0) }
      if settled {
        resolveStrike(events: &events)
      }
    }
  }

  private func collide(_ i: Int, _ j: Int, events: inout [CarromEvent]) {
    let dx = pieces[j].x - pieces[i].x
    let dy = pieces[j].y - pieces[i].y
    let dist = (dx * dx + dy * dy).squareRoot()
    let minDist = pieces[i].radius + pieces[j].radius
    guard dist < minDist, dist > 1e-9 else { return }
    let nx = dx / dist
    let ny = dy / dist
    let invA = 1 / pieces[i].mass
    let invB = 1 / pieces[j].mass
    let invTotal = invA + invB

    // Separate the overlap in proportion to inverse mass.
    let overlap = minDist - dist
    pieces[i].x -= nx * overlap * (invA / invTotal)
    pieces[i].y -= ny * overlap * (invA / invTotal)
    pieces[j].x += nx * overlap * (invB / invTotal)
    pieces[j].y += ny * overlap * (invB / invTotal)

    // Impulse along the normal (bodies are frictionless disks).
    let relVel = (pieces[j].vx - pieces[i].vx) * nx + (pieces[j].vy - pieces[i].vy) * ny
    guard relVel < 0 else { return }
    let impulse = -(1 + Self.restitutionBody) * relVel / invTotal
    pieces[i].vx -= impulse * invA * nx
    pieces[i].vy -= impulse * invA * ny
    pieces[j].vx += impulse * invB * nx
    pieces[j].vy += impulse * invB * ny
    events.append(.collision(speed: abs(relVel)))
  }

  // MARK: - Rules

  private func resolveStrike(events: inout [CarromEvent]) {
    let shooter = currentPlayer
    let own = Self.color(of: shooter)
    let opponent = Self.color(of: 1 - shooter)
    let ownPocketed = pocketedThisStrike.filter { $0 == own }.count
    let opponentPocketed = pocketedThisStrike.filter { $0 == opponent }.count
    let queenPocketed = pocketedThisStrike.contains(.queen)
    let foul = strikerPocketedThisStrike

    var queenOutcome: CarromQueenOutcome?
    var keptTurn = false

    if foul {
      // Foul: one of the shooter's pocketed coins returns to center, any
      // queen involvement is undone, and the turn passes.
      returnCoinToBoard(of: own)
      if queenPocketed || queenPendingBy == shooter {
        respotQueen()
        queenPendingBy = nil
        queenOutcome = .returned
      }
    } else if queenPocketed {
      if ownPocketed > 0 {
        queenOwner = shooter
        queenOutcome = .covered
      } else {
        // Cover owed on the shooter's next strike.
        queenPendingBy = shooter
        queenOutcome = .pending
      }
      // Taking the queen always earns another strike (needed to cover).
      keptTurn = true
    } else if queenPendingBy == shooter {
      if ownPocketed > 0 {
        queenOwner = shooter
        queenOutcome = .covered
      } else {
        respotQueen()
        queenOutcome = .returned
      }
      queenPendingBy = nil
      keptTurn = ownPocketed > 0
    } else {
      keptTurn = ownPocketed > 0
    }

    let summary = CarromStrikeSummary(
      shooter: shooter,
      foul: foul,
      keptTurn: keptTurn && !foul,
      ownPocketed: ownPocketed,
      opponentPocketed: opponentPocketed,
      queenOutcome: queenOutcome
    )
    lastSummary = summary
    events.append(.strikeResolved(summary: summary))

    // Win check for both players (a strike can clear either color).
    for player in [shooter, 1 - shooter] {
      if pocketedCount(of: Self.color(of: player)) == Self.coinsPerPlayer {
        // A pending queen at the moment of clearing counts as uncovered.
        if queenPendingBy == player {
          respotQueen()
          queenPendingBy = nil
        }
        endBoard(winner: player, events: &events)
        return
      }
    }

    if !summary.keptTurn {
      currentPlayer = 1 - shooter
    }
    respotStriker()
    phase = .aiming
    pocketedThisStrike = []
    strikerPocketedThisStrike = false
  }

  private func endBoard(winner: CarromPlayer, events: inout [CarromEvent]) {
    let loserColor = Self.color(of: 1 - winner)
    let remaining = Self.coinsPerPlayer - pocketedCount(of: loserColor)
    let points = remaining + (queenOwner == winner ? Self.queenPoints : 0)
    matchScore[winner] += points
    boardWinner = winner
    events.append(.boardOver(winner: winner, points: points))
    if matchScore[winner] >= Self.matchTarget {
      matchWinner = winner
      phase = .matchOver
      events.append(.matchOver(winner: winner))
    } else {
      phase = .boardOver
    }
  }

  /// Foul penalty: put one of the shooter's pocketed coins back near center.
  private func returnCoinToBoard(of kind: CarromPieceKind) {
    guard let index = pieces.firstIndex(where: { $0.kind == kind && !$0.onBoard }) else { return }
    let spot = findFreeSpot()
    pieces[index].x = spot.x
    pieces[index].y = spot.y
    pieces[index].vx = 0
    pieces[index].vy = 0
    pieces[index].onBoard = true
  }

  private func respotQueen() {
    let spot = findFreeSpot()
    pieces[Self.queenId].x = spot.x
    pieces[Self.queenId].y = spot.y
    pieces[Self.queenId].vx = 0
    pieces[Self.queenId].vy = 0
    pieces[Self.queenId].onBoard = true
  }

  private func respotStriker() {
    pieces[Self.strikerId].x = Self.center
    pieces[Self.strikerId].y = Self.baselineY(for: currentPlayer)
    pieces[Self.strikerId].vx = 0
    pieces[Self.strikerId].vy = 0
    pieces[Self.strikerId].onBoard = true
  }

  /// Center if free, else deterministic concentric-ring search outward.
  private func findFreeSpot() -> (x: Double, y: Double) {
    func isFree(_ x: Double, _ y: Double) -> Bool {
      pieces.allSatisfy { piece in
        guard piece.onBoard else { return true }
        let dx = piece.x - x
        let dy = piece.y - y
        return (dx * dx + dy * dy).squareRoot() > piece.radius + Self.coinRadius + 1
      }
    }
    if isFree(Self.center, Self.center) {
      return (Self.center, Self.center)
    }
    for ring in 1...8 {
      let radius = Self.rackSpacing * Double(ring)
      for i in 0..<12 {
        let angle = Double(i) * Double.pi / 6
        let x = Self.center + cos(angle) * radius
        let y = Self.center + sin(angle) * radius
        if isFree(x, y) {
          return (x, y)
        }
      }
    }
    return (Self.center, Self.center)
  }

  // MARK: - Bot

  /// Pick the best (target coin, pocket, baseline position) by simple
  /// line-of-sight scoring, then perturb angle and power by the level's
  /// gaussian error — the same planner as the web engine.
  private func planBotShot(level: CarromBotLevel) -> (x: Double, angle: Double, power01: Double) {
    let shooter = currentPlayer
    let own = Self.color(of: shooter)
    let baseY = Self.baselineY(for: shooter)
    let candidates = pieces.filter { $0.onBoard && ($0.kind == own || $0.kind == .queen) }

    var best: (score: Double, x: Double, angle: Double, travel: Double)?
    for coin in candidates {
      for pocket in Self.pockets {
        let toPocketX = pocket.x - coin.x
        let toPocketY = pocket.y - coin.y
        let pocketDist = (toPocketX * toPocketX + toPocketY * toPocketY).squareRoot()
        guard pocketDist > 1e-6 else { continue }
        let px = toPocketX / pocketDist
        let py = toPocketY / pocketDist
        // Ghost position: where the striker's center must be at impact to
        // knock the coin straight at the pocket.
        let ghostX = coin.x - px * (Self.strikerRadius + coin.radius)
        let ghostY = coin.y - py * (Self.strikerRadius + coin.radius)
        if pathBlocked(
          ax: coin.x, ay: coin.y, bx: pocket.x, by: pocket.y,
          radius: coin.radius - 2, excludeIds: [coin.id, Self.strikerId]
        ) {
          continue
        }
        for sample in 0...14 {
          let x = Self.baselineMargin
            + (Self.boardSize - 2 * Self.baselineMargin) * Double(sample) / 14
          let shotX = ghostX - x
          let shotY = ghostY - baseY
          let shotDist = (shotX * shotX + shotY * shotY).squareRoot()
          guard shotDist > Self.strikerRadius else { continue }
          // Alignment: the striker must push the coin pocketward.
          let align = shotX / shotDist * px + shotY / shotDist * py
          guard align >= 0.3 else { continue }
          if pathBlocked(
            ax: x, ay: baseY, bx: ghostX, by: ghostY,
            radius: Self.strikerRadius - 1, excludeIds: [coin.id, Self.strikerId]
          ) {
            continue
          }
          let travel = shotDist + pocketDist
          let queenBonus = coin.kind == .queen && pocketedCount(of: own) > 0 ? 0.3 : 0.0
          let score = align * 2 - travel / (Self.boardSize * 2) + queenBonus
          if best == nil || score > best!.score {
            best = (score, x, atan2(shotY, shotX), travel)
          }
        }
      }
    }

    if let best {
      let angle = best.angle + gaussian() * level.aimStdDev
      let power01 = max(
        0.25,
        min(1, (260 + best.travel * 1.9) / Self.maxShotSpeed + gaussian() * level.powerStdDev)
      )
      return (best.x, angle, power01)
    }

    // Fallback: smash toward the nearest candidate (or board center).
    let target = candidates.min { a, b in
      let da = (a.x - Self.center) * (a.x - Self.center) + (a.y - baseY) * (a.y - baseY)
      let db = (b.x - Self.center) * (b.x - Self.center) + (b.y - baseY) * (b.y - baseY)
      return da < db
    }
    let tx = target?.x ?? Self.center
    let ty = target?.y ?? Self.center
    let angle = atan2(ty - baseY, tx - Self.center) + gaussian() * level.aimStdDev
    return (Self.center, angle, 0.7)
  }

  /// Segment sweep test: does a disk of `radius` moving a→b hit any piece?
  private func pathBlocked(
    ax: Double, ay: Double, bx: Double, by: Double,
    radius: Double, excludeIds: [Int]
  ) -> Bool {
    let abx = bx - ax
    let aby = by - ay
    let lengthSq = abx * abx + aby * aby
    for piece in pieces {
      guard piece.onBoard, !excludeIds.contains(piece.id) else { continue }
      let t = lengthSq == 0
        ? 0
        : max(0, min(1, ((piece.x - ax) * abx + (piece.y - ay) * aby) / lengthSq))
      let cx = ax + abx * t
      let cy = ay + aby * t
      let dx = piece.x - cx
      let dy = piece.y - cy
      if (dx * dx + dy * dy).squareRoot() < radius + piece.radius {
        return true
      }
    }
    return false
  }

  /// Standard normal via Box-Muller on the injected RNG (two draws).
  private func gaussian() -> Double {
    let u1 = 1 - random()
    let u2 = random()
    return (-2 * Foundation.log(u1)).squareRoot() * cos(2 * Double.pi * u2)
  }
}
