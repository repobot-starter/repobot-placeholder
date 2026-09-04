import Foundation

/// Who controls a seat. `.off` seats have no tokens and are skipped entirely.
enum LudoSeatKind: String, CaseIterable, Identifiable {
  case human
  case bot
  case off

  var id: String { rawValue }
}

/// A cell on the classic 15x15 cross-shaped grid (col/row, 0-based).
/// Fractional coordinates are used for the yard resting spots.
struct LudoCell: Equatable {
  let col: Double
  let row: Double
}

/// One legal move for the current seat with the pending roll.
struct LudoMove: Equatable {
  /// Token index (0..3) within the current seat.
  let token: Int
  /// Progress before the move (-1 when exiting the yard).
  let from: Int
  /// Progress after the move.
  let to: Int
  /// True when the landing square holds capturable opponent tokens.
  let captures: Bool
}

/// Full match state. A value type so SwiftUI state updates are automatic and
/// the engine functions stay pure, exactly like the web engine.
struct LudoGameState: Equatable {
  /// Who controls each seat, in red/green/yellow/blue order. Fixed per match.
  var seats: [LudoSeatKind]
  /// Progress of each token: tokens[seat][token], -1..56 (see LudoEngine).
  var tokens: [[Int]]
  /// Seat whose turn it is.
  var current: Int
  /// The pending roll awaiting a move choice, or nil awaiting a roll.
  var dice: Int?
  /// Consecutive sixes rolled this turn (3 forfeits the turn).
  var sixStreak: Int
  /// Seats in finishing order; play continues for placings after a win.
  var placings: [Int]
  /// True once every placing is decided.
  var over: Bool
}

/// Pure port of the web Ludo rules engine
/// (`web/app/src/View/Games/Ludo/engine.ts`). No SwiftUI here: everything is
/// a pure function over `LudoGameState`, so the rules can be unit-tested
/// headlessly and rendered by any frontend. The constants and rules must stay
/// in sync with the web engine (and the Android `LudoEngine.kt`) — change
/// them together.
///
/// Token positions are stored as "progress" along the seat's own path:
///   -1        in the yard (home base), waiting for a six
///   0..50     on the 52-square shared ring, at ring index (start + p) % 52
///   51..55    in the seat's private 5-square home column
///   56        home — the token has finished
///
/// Randomness (the bot's tie-break jitter) goes through an injected closure
/// so tests can make move selection fully deterministic; dice values are
/// supplied by the caller for the same reason.
enum LudoEngine {
  // Rules constants — must stay in sync with the web engine.ts.
  static let seatCount = 4
  static let tokensPerSeat = 4
  static let ringSize = 52
  /// Last progress value that is still on the shared ring.
  static let ringLastProgress = 50
  /// First progress value inside the private home column.
  static let homeColumnStart = 51
  /// Progress of a finished token; home-column moves need an exact roll.
  static let homeProgress = 56
  /// Rolling this exits the yard and grants an extra roll.
  static let exitRoll = 6
  /// Rolling this many sixes in a row forfeits the turn.
  static let sixStreakLimit = 3

  /// Ring index of each seat's start square (also its yard exit).
  static let startRingIndex = [0, 13, 26, 39]

  /// The 8 safe squares where captures never happen: the 4 start squares
  /// plus the 4 star squares 8 ahead of each start.
  static let safeRingIndexes: Set<Int> = [0, 8, 13, 21, 26, 34, 39, 47]

  /// Star squares only (safe squares that are not a seat's start).
  static let starRingIndexes: Set<Int> = [8, 21, 34, 47]

  // MARK: - Board topology (shared with the renderer)

  /// Grid cell of every ring index (52 entries; index 0 is red's start,
  /// running clockwise). Mirrors the web `RING_CELLS`.
  static let ringCells: [LudoCell] = {
    var cells: [LudoCell] = []
    for col in 1...5 { cells.append(LudoCell(col: Double(col), row: 6)) }
    for row in stride(from: 5, through: 0, by: -1) { cells.append(LudoCell(col: 6, row: Double(row))) }
    cells.append(LudoCell(col: 7, row: 0))
    for row in 0...5 { cells.append(LudoCell(col: 8, row: Double(row))) }
    for col in 9...14 { cells.append(LudoCell(col: Double(col), row: 6)) }
    cells.append(LudoCell(col: 14, row: 7))
    for col in stride(from: 14, through: 9, by: -1) { cells.append(LudoCell(col: Double(col), row: 8)) }
    for row in 9...14 { cells.append(LudoCell(col: 8, row: Double(row))) }
    cells.append(LudoCell(col: 7, row: 14))
    for row in stride(from: 14, through: 9, by: -1) { cells.append(LudoCell(col: 6, row: Double(row))) }
    for col in stride(from: 5, through: 0, by: -1) { cells.append(LudoCell(col: Double(col), row: 8)) }
    cells.append(LudoCell(col: 0, row: 7))
    cells.append(LudoCell(col: 0, row: 6))
    return cells
  }()

  /// Grid origin (top-left) of each seat's 6x6 yard.
  static let yardOrigins: [LudoCell] = [
    LudoCell(col: 0, row: 0),
    LudoCell(col: 9, row: 0),
    LudoCell(col: 9, row: 9),
    LudoCell(col: 0, row: 9),
  ]

  /// The 5 home-column cells for a seat, ordered from ring exit to center.
  static func homeColumnCells(seat: Int) -> [LudoCell] {
    switch seat {
    case 0: return [1, 2, 3, 4, 5].map { LudoCell(col: Double($0), row: 7) }
    case 1: return [1, 2, 3, 4, 5].map { LudoCell(col: 7, row: Double($0)) }
    case 2: return [13, 12, 11, 10, 9].map { LudoCell(col: Double($0), row: 7) }
    default: return [13, 12, 11, 10, 9].map { LudoCell(col: 7, row: Double($0)) }
    }
  }

  /// Resting spots (grid coords) for the 4 tokens inside a seat's yard.
  static func yardCells(seat: Int) -> [LudoCell] {
    let origin = yardOrigins[seat]
    return [
      LudoCell(col: origin.col + 1.5, row: origin.row + 1.5),
      LudoCell(col: origin.col + 3.5, row: origin.row + 1.5),
      LudoCell(col: origin.col + 1.5, row: origin.row + 3.5),
      LudoCell(col: origin.col + 3.5, row: origin.row + 3.5),
    ]
  }

  /// Ring index a seat's token occupies at ring progress 0..50.
  static func ringIndex(seat: Int, progress: Int) -> Int {
    (startRingIndex[seat] + progress) % ringSize
  }

  // MARK: - Turn state machine

  /// Fresh match: all tokens in their yards, first active seat to roll.
  static func createGame(seats: [LudoSeatKind]) -> LudoGameState {
    LudoGameState(
      seats: seats,
      tokens: seats.map { _ in Array(repeating: -1, count: tokensPerSeat) },
      current: seats.firstIndex { $0 != .off } ?? 0,
      dice: nil,
      sixStreak: 0,
      placings: [],
      over: false
    )
  }

  /// True once every token of the seat has reached home.
  static func isSeatFinished(_ state: LudoGameState, seat: Int) -> Bool {
    state.tokens[seat].allSatisfy { $0 == homeProgress }
  }

  /// Seats that are in the game (not off), in play order.
  static func activeSeats(_ state: LudoGameState) -> [Int] {
    (0..<seatCount).filter { state.seats[$0] != .off }
  }

  /// True when an opponent token on the ring could reach `ringIndex` with a
  /// single roll (1..6) without overshooting into its own home column. Used
  /// by the bot to spot threats; tokens still in yards are ignored.
  static func isRingIndexThreatened(_ state: LudoGameState, seat: Int, ringIndex target: Int) -> Bool {
    for other in 0..<seatCount where other != seat && state.seats[other] != .off {
      for progress in state.tokens[other] where progress >= 0 && progress <= ringLastProgress {
        let distance = (target - ringIndex(seat: other, progress: progress) + ringSize) % ringSize
        if distance >= 1 && distance <= 6 && progress + distance <= ringLastProgress {
          return true
        }
      }
    }
    return false
  }

  private static func capturableAt(_ state: LudoGameState, seat: Int, ringIndex target: Int) -> Bool {
    if safeRingIndexes.contains(target) {
      return false
    }
    for other in 0..<seatCount where other != seat {
      for progress in state.tokens[other]
      where progress >= 0 && progress <= ringLastProgress
        && ringIndex(seat: other, progress: progress) == target {
        return true
      }
    }
    return false
  }

  /// Every move the current seat may play with the pending roll (state.dice).
  static func legalMoves(_ state: LudoGameState) -> [LudoMove] {
    guard let dice = state.dice, !state.over else { return [] }
    let seat = state.current
    var moves: [LudoMove] = []
    for (token, from) in state.tokens[seat].enumerated() {
      if from == homeProgress {
        continue
      }
      if from == -1 {
        // Exiting the yard requires a six; the start square is safe, so an
        // exit never captures.
        if dice == exitRoll {
          moves.append(LudoMove(token: token, from: from, to: 0, captures: false))
        }
        continue
      }
      let to = from + dice
      // Home needs an exact roll; overshooting keeps the token in place.
      if to > homeProgress {
        continue
      }
      let captures = to <= ringLastProgress
        && capturableAt(state, seat: seat, ringIndex: ringIndex(seat: seat, progress: to))
      moves.append(LudoMove(token: token, from: from, to: to, captures: captures))
    }
    return moves
  }

  /// Advances to the next active, unfinished seat and awaits its roll.
  private static func advanceTurn(_ state: LudoGameState) -> LudoGameState {
    var next = state
    next.dice = nil
    next.sixStreak = 0
    for step in 1...seatCount {
      let candidate = (state.current + step) % seatCount
      if state.seats[candidate] != .off && !isSeatFinished(state, seat: candidate) {
        next.current = candidate
        break
      }
    }
    return next
  }

  /// Applies a die roll for the current seat. The result either awaits a
  /// move choice (dice set, same seat), grants a re-roll (six with no legal
  /// move: dice nil, same seat), or passes the turn (no legal move, or the
  /// three-sixes forfeit: dice nil, next seat).
  static func applyRoll(_ state: LudoGameState, value: Int) -> LudoGameState {
    if state.over || state.dice != nil {
      return state
    }
    let sixStreak = value == exitRoll ? state.sixStreak + 1 : 0
    if sixStreak >= sixStreakLimit {
      // Third six in a row: the roll is void and the turn is forfeited.
      return advanceTurn(state)
    }
    var pending = state
    pending.dice = value
    pending.sixStreak = sixStreak
    if legalMoves(pending).isEmpty {
      // A six still earns a re-roll even when nothing can move.
      if value == exitRoll {
        pending.dice = nil
        return pending
      }
      return advanceTurn(pending)
    }
    return pending
  }

  /// Plays one of the current legal moves (by token index), resolving
  /// captures, finish detection, and the next turn. A six keeps the turn
  /// (extra roll); anything else passes it. Pure — the input is untouched.
  static func applyMove(_ state: LudoGameState, token: Int) -> LudoGameState {
    guard let move = legalMoves(state).first(where: { $0.token == token }) else {
      return state
    }
    let seat = state.current
    var next = state
    next.tokens[seat][move.token] = move.to
    next.dice = nil

    // Capture: landing on opponents outside the 8 safe squares sends every
    // opponent token on that square back to its yard.
    if move.to <= ringLastProgress {
      let landing = ringIndex(seat: seat, progress: move.to)
      if !safeRingIndexes.contains(landing) {
        for other in 0..<seatCount where other != seat {
          next.tokens[other] = next.tokens[other].map { progress in
            progress >= 0 && progress <= ringLastProgress
              && ringIndex(seat: other, progress: progress) == landing ? -1 : progress
          }
        }
      }
    }

    // Placings: a seat that just brought its last token home is recorded,
    // and when only one racer remains it takes the final placing.
    if isSeatFinished(next, seat: seat) && !next.placings.contains(seat) {
      next.placings.append(seat)
    }
    let remaining = activeSeats(next).filter { !isSeatFinished(next, seat: $0) }
    if remaining.count <= 1 {
      next.placings.append(contentsOf: remaining)
      next.over = true
      next.sixStreak = 0
      return next
    }

    // A six grants an extra roll — unless the roller just finished.
    if state.dice == exitRoll && !isSeatFinished(next, seat: seat) {
      return next
    }
    return advanceTurn(next)
  }

  // MARK: - Bot

  // Heuristic weights — must stay in sync with the web engine.ts.
  private static let botCaptureScore = 1000.0
  private static let botEscapeScore = 600.0
  private static let botExitScore = 400.0
  private static let botFinishBonus = 160.0
  private static let botSafeLandingBonus = 90.0
  private static let botThreatenedLandingPenalty = 140.0
  private static let botRandomJitter = 45.0

  /// Heuristic bot: capture when possible, escape a threatened token, bring
  /// a token out on a six, otherwise advance the leader while avoiding
  /// threatened landing squares. `random` (0..1) adds a jitter so bots are
  /// not identical; inject a fixed value for deterministic tests. Returns
  /// the token to move, or nil when there is no legal move.
  static func chooseBotMove(
    _ state: LudoGameState,
    random: () -> Double = { Double.random(in: 0..<1) }
  ) -> Int? {
    let moves = legalMoves(state)
    guard !moves.isEmpty else { return nil }
    let seat = state.current
    var bestToken = moves[0].token
    var bestScore = -Double.infinity
    for move in moves {
      // Advancing the most developed token is the baseline preference.
      var score = Double(move.to)
      if move.captures {
        score += botCaptureScore
      }
      if move.from >= 0 && move.from <= ringLastProgress {
        let fromRing = ringIndex(seat: seat, progress: move.from)
        if !safeRingIndexes.contains(fromRing)
          && isRingIndexThreatened(state, seat: seat, ringIndex: fromRing) {
          score += botEscapeScore
        }
      }
      if move.from == -1 {
        score += botExitScore
      }
      if move.to == homeProgress {
        score += botFinishBonus
      }
      if move.to <= ringLastProgress {
        let landing = ringIndex(seat: seat, progress: move.to)
        if safeRingIndexes.contains(landing) {
          score += botSafeLandingBonus
        } else if isRingIndexThreatened(state, seat: seat, ringIndex: landing) {
          score -= botThreatenedLandingPenalty
        }
      }
      score += random() * botRandomJitter
      if score > bestScore {
        bestScore = score
        bestToken = move.token
      }
    }
    return bestToken
  }
}
