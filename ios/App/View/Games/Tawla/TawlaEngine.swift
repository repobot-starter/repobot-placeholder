import Foundation

/// Checker color. In the shipped app the human is always `white`; the bot
/// plays `black`. White races from index 23 down to 0, Black the other way —
/// identical to the web engine's `Player`.
enum TawlaPlayer: String, Equatable {
  case white
  case black

  var opponent: TawlaPlayer { self == .white ? .black : .white }
}

/// One checker move with the die that paid for it. `from == TawlaEngine.barIndex`
/// means entering from the bar; `to == TawlaEngine.offIndex` means bearing off.
/// Mirrors the web `Move` interface.
struct TawlaMove: Equatable {
  var from: Int
  var to: Int
  var die: Int
  /// True when the move lands on an enemy blot and sends it to the bar.
  var hit: Bool
}

/// A complete legal turn: a maximal move sequence and the position after it.
struct TawlaTurn: Equatable {
  var moves: [TawlaMove]
  var result: TawlaPosition
}

/// A position. `points[i]` is the signed checker count on board index `i`:
/// positive = white, negative = black. Index 0 is White's 1-point (deepest
/// point of White's home board), index 23 is White's 24-point — identical to
/// the web `Position`.
struct TawlaPosition: Equatable {
  var points: [Int]
  var whiteBar: Int
  var blackBar: Int
  var whiteOff: Int
  var blackOff: Int

  func bar(_ player: TawlaPlayer) -> Int {
    player == .white ? whiteBar : blackBar
  }

  func off(_ player: TawlaPlayer) -> Int {
    player == .white ? whiteOff : blackOff
  }

  mutating func addBar(_ player: TawlaPlayer, _ delta: Int) {
    if player == .white { whiteBar += delta } else { blackBar += delta }
  }

  mutating func addOff(_ player: TawlaPlayer, _ delta: Int) {
    if player == .white { whiteOff += delta } else { blackOff += delta }
  }
}

/// Terminal result of a game: single (1 point), gammon (2), backgammon (3).
enum TawlaResultKind: String, Equatable {
  case single
  case gammon
  case backgammon
}

struct TawlaGameResult: Equatable {
  var winner: TawlaPlayer
  /// Match points earned: 1 (single), 2 (gammon), or 3 (backgammon).
  var points: Int
  var kind: TawlaResultKind
}

enum TawlaBotLevel: String, CaseIterable, Identifiable {
  case easy
  case medium
  case hard

  var id: String { rawValue }
}

/// Pure port of the web tawla (backgammon) engine
/// (`web/app/src/View/Games/Tawla/engine.ts`). Everything is a static pure
/// function over `TawlaPosition` — no SwiftUI, no I/O — so the exact same
/// rules run on every platform and can be unit-tested headlessly.
///
/// Move legality (bar entry, blot hitting, exact-or-higher bear-off, the
/// forced-move rules: play as many dice as possible and, when only one can
/// be played, the higher), win detection (single/gammon/backgammon), the
/// heuristic weights, and the three bot levels must stay in lockstep with
/// the web implementation. Randomness (dice, easy-bot noise) goes through an
/// injected closure so tests can be deterministic.
enum TawlaEngine {
  /// `TawlaMove.from` when a checker enters from the bar.
  static let barIndex = -1
  /// `TawlaMove.to` when a checker bears off the board.
  static let offIndex = -2

  static let checkersPerPlayer = 15
  /// First to this many points wins the match (gammons 2, backgammons 3).
  static let matchTarget = 5

  // Heuristic weights — must stay in sync with the web `HEURISTIC` table.
  static let heuristicPip = 1.0
  static let heuristicOff = 12.0
  static let heuristicPoint = 4.0
  static let heuristicHomePoint = 6.0
  static let heuristicBlot = 2.0
  static let heuristicBlotShot = 3.0
  static let heuristicEasyNoise = 20.0
  static let heuristicHitBonus = 15.0
  static let heuristicPrimeBonus = 5.0

  /// Safety valve for pathological double rolls, same cap as the web engine.
  private static let sequenceCap = 20000

  // MARK: - Position basics

  /// Standard backgammon starting position.
  static func initialPosition() -> TawlaPosition {
    var points = [Int](repeating: 0, count: 24)
    // White: 2 on the 24-point, 5 on the 13-point, 3 on the 8-point, 5 on the 6-point.
    points[23] = 2
    points[12] = 5
    points[7] = 3
    points[5] = 5
    // Black mirrors White exactly.
    points[0] = -2
    points[11] = -5
    points[16] = -3
    points[18] = -5
    return TawlaPosition(points: points, whiteBar: 0, blackBar: 0, whiteOff: 0, blackOff: 0)
  }

  /// Number of `player`'s checkers on board index `index` (never negative).
  static func checkers(_ position: TawlaPosition, _ player: TawlaPlayer, at index: Int) -> Int {
    let signed = position.points[index]
    return player == .white ? max(0, signed) : max(0, -signed)
  }

  /// True when `index` lies inside `player`'s home board.
  static func isHomeIndex(_ player: TawlaPlayer, _ index: Int) -> Bool {
    player == .white ? index <= 5 : index >= 18
  }

  /// Board index a bar checker enters on for a given die.
  static func entryIndex(_ player: TawlaPlayer, die: Int) -> Int {
    player == .white ? 24 - die : die - 1
  }

  /// Pip count: total dice pips `player` still needs to bear everything off.
  /// Bar checkers count the full 25-pip trip.
  static func pipCount(_ position: TawlaPosition, _ player: TawlaPlayer) -> Int {
    var pips = position.bar(player) * 25
    for index in 0..<24 {
      let count = checkers(position, player, at: index)
      pips += count * (player == .white ? index + 1 : 24 - index)
    }
    return pips
  }

  /// True when every checker is in the home board (bear-off precondition).
  static func allInHome(_ position: TawlaPosition, _ player: TawlaPlayer) -> Bool {
    if position.bar(player) > 0 { return false }
    for index in 0..<24 where checkers(position, player, at: index) > 0 {
      if !isHomeIndex(player, index) { return false }
    }
    return true
  }

  /// A point is blocked when the opponent holds it with two or more checkers.
  private static func isBlocked(_ position: TawlaPosition, _ player: TawlaPlayer, _ index: Int) -> Bool {
    checkers(position, player.opponent, at: index) >= 2
  }

  /// Landing here hits when the opponent has exactly one checker (a blot).
  private static func landsOnBlot(_ position: TawlaPosition, _ player: TawlaPlayer, _ index: Int) -> Bool {
    checkers(position, player.opponent, at: index) == 1
  }

  // MARK: - Move generation

  /// Every legal single move for one die. Bar checkers must enter first;
  /// bearing off requires all checkers home and follows the exact-or-higher
  /// rule (a die larger than the point only bears off when no checker sits
  /// further back).
  static func legalSingleMoves(
    _ position: TawlaPosition, _ player: TawlaPlayer, die: Int
  ) -> [TawlaMove] {
    var moves: [TawlaMove] = []

    if position.bar(player) > 0 {
      let to = entryIndex(player, die: die)
      if !isBlocked(position, player, to) {
        moves.append(
          TawlaMove(from: barIndex, to: to, die: die, hit: landsOnBlot(position, player, to)))
      }
      return moves
    }

    let canBearOff = allInHome(position, player)
    for from in 0..<24 where checkers(position, player, at: from) > 0 {
      let to = player == .white ? from - die : from + die
      if to >= 0 && to <= 23 {
        if !isBlocked(position, player, to) {
          moves.append(
            TawlaMove(from: from, to: to, die: die, hit: landsOnBlot(position, player, to)))
        }
      } else if canBearOff {
        // Past the edge: exact roll always bears off; a bigger die only
        // bears off the rearmost checker (none may sit further back).
        let exact = player == .white ? to == -1 : to == 24
        let overshoot = player == .white ? to < -1 : to > 24
        if exact || (overshoot && !hasCheckerBehind(position, player, from)) {
          moves.append(TawlaMove(from: from, to: offIndex, die: die, hit: false))
        }
      }
    }
    return moves
  }

  /// True when `player` has a checker further from bearing off than `from`.
  private static func hasCheckerBehind(
    _ position: TawlaPosition, _ player: TawlaPlayer, _ from: Int
  ) -> Bool {
    if player == .white {
      for index in stride(from: from + 1, through: 5, by: 1)
      where checkers(position, player, at: index) > 0 {
        return true
      }
    } else {
      for index in stride(from: 18, to: from, by: 1)
      where checkers(position, player, at: index) > 0 {
        return true
      }
    }
    return false
  }

  /// Applies one move and returns the new position. Pure — input untouched.
  static func apply(_ position: TawlaPosition, _ player: TawlaPlayer, _ move: TawlaMove)
    -> TawlaPosition
  {
    var next = position
    let sign = player == .white ? 1 : -1

    if move.from == barIndex {
      next.addBar(player, -1)
    } else {
      next.points[move.from] -= sign
    }

    if move.to == offIndex {
      next.addOff(player, 1)
    } else {
      if move.hit {
        next.points[move.to] = 0
        next.addBar(player.opponent, 1)
      }
      next.points[move.to] += sign
    }
    return next
  }

  /// Replays a move sequence from a starting position (used for undo).
  static func position(after moves: [TawlaMove], from position: TawlaPosition, player: TawlaPlayer)
    -> TawlaPosition
  {
    moves.reduce(position) { apply($0, player, $1) }
  }

  /// All complete legal turns for a roll. Doubles play the die four times;
  /// otherwise both die orders are explored. Only maximal sequences survive
  /// (you must play as many dice as possible), and when only a single die
  /// can be played the higher one is forced. Empty when fully blocked.
  static func legalTurns(_ position: TawlaPosition, _ player: TawlaPlayer, dice: [Int])
    -> [TawlaTurn]
  {
    let isDoubles = dice[0] == dice[1]
    let orders: [[Int]] =
      isDoubles
      ? [[dice[0], dice[0], dice[0], dice[0]]]
      : [[dice[0], dice[1]], [dice[1], dice[0]]]

    var sequences: [TawlaTurn] = []
    var seen = Set<String>()
    var maxLength = 0

    func record(_ moves: [TawlaMove], _ result: TawlaPosition) {
      if moves.count < maxLength || sequences.count >= sequenceCap { return }
      let key = moves.map { "\($0.from)>\($0.to)#\($0.die)" }.joined(separator: ",")
      if seen.contains(key) { return }
      seen.insert(key)
      maxLength = max(maxLength, moves.count)
      sequences.append(TawlaTurn(moves: moves, result: result))
    }

    func walk(_ current: TawlaPosition, _ remaining: ArraySlice<Int>, _ played: [TawlaMove]) {
      guard let die = remaining.first else {
        record(played, current)
        return
      }
      let candidates = legalSingleMoves(current, player, die: die)
      if candidates.isEmpty {
        record(played, current)
        return
      }
      for move in candidates {
        walk(apply(current, player, move), remaining.dropFirst(), played + [move])
      }
    }

    for order in orders {
      walk(position, order[...], [])
    }

    if maxLength == 0 { return [] }
    var best = sequences.filter { $0.moves.count == maxLength }
    if maxLength == 1 && !isDoubles {
      // Forced-die rule: when only one die can be played, the higher wins.
      let higher = max(dice[0], dice[1])
      let higherOnly = best.filter { $0.moves[0].die == higher }
      if !higherOnly.isEmpty { best = higherOnly }
    }
    return best
  }

  /// Longest maximal turn length (0 when the roll is fully blocked).
  static func maxTurnLength(_ turns: [TawlaTurn]) -> Int {
    turns.first?.moves.count ?? 0
  }

  /// The distinct legal next moves after `prefix` has been played this turn.
  /// Prefix-matching against the full turn list enforces the forced-move
  /// rules move-by-move: a move is only offered if some maximal sequence
  /// starts this way, so the player can never strand a playable die.
  static func nextMoves(_ turns: [TawlaTurn], prefix: [TawlaMove]) -> [TawlaMove] {
    var moves: [TawlaMove] = []
    for turn in turns where turn.moves.count > prefix.count {
      guard Array(turn.moves.prefix(prefix.count)) == prefix else { continue }
      let candidate = turn.moves[prefix.count]
      if !moves.contains(candidate) {
        moves.append(candidate)
      }
    }
    return moves
  }

  // MARK: - Win detection

  /// Terminal result of the position, or nil while the game continues.
  /// Gammon (2 points): the loser has borne off nothing. Backgammon (3):
  /// additionally a losing checker sits on the bar or in the winner's home.
  static func winResult(_ position: TawlaPosition) -> TawlaGameResult? {
    for winner in [TawlaPlayer.white, .black] where position.off(winner) >= checkersPerPlayer {
      let loser = winner.opponent
      if position.off(loser) > 0 {
        return TawlaGameResult(winner: winner, points: 1, kind: .single)
      }
      var inWinnerHome = position.bar(loser) > 0
      for index in 0..<24
      where isHomeIndex(winner, index) && checkers(position, loser, at: index) > 0 {
        inWinnerHome = true
      }
      return inWinnerHome
        ? TawlaGameResult(winner: winner, points: 3, kind: .backgammon)
        : TawlaGameResult(winner: winner, points: 2, kind: .gammon)
    }
    return nil
  }

  // MARK: - Evaluation and the bot

  /// Enemy checkers a direct shot (a single die, 1-6 pips) away from an own
  /// blot on `index`, including enemy bar checkers that could enter onto it.
  static func directShots(_ position: TawlaPosition, _ player: TawlaPlayer, at index: Int) -> Int {
    let enemy = player.opponent
    var shots = 0
    for distance in 1...6 {
      // The enemy moves toward the blot from its own direction of travel.
      let from = player == .white ? index - distance : index + distance
      if from >= 0 && from <= 23 {
        shots += checkers(position, enemy, at: from)
      }
    }
    // Enemy bar checkers enter in this player's home board and can hit there.
    if isHomeIndex(player, index) {
      shots += position.bar(enemy)
    }
    return shots
  }

  /// Longest run of consecutive made points (a prime blocks enemy runners).
  static func longestPrime(_ position: TawlaPosition, _ player: TawlaPlayer) -> Int {
    var best = 0
    var run = 0
    for index in 0..<24 {
      if checkers(position, player, at: index) >= 2 {
        run += 1
        best = max(best, run)
      } else {
        run = 0
      }
    }
    return best
  }

  /// Static evaluation of a position for `player`; higher is better. Terms
  /// and weights mirror the web `evaluate` exactly: race lead in pips,
  /// bear-off progress, made points (home points extra), and blots penalized
  /// by the enemy direct shots that bear on them.
  static func evaluate(_ position: TawlaPosition, _ player: TawlaPlayer) -> Double {
    let enemy = player.opponent
    var score = Double(pipCount(position, enemy) - pipCount(position, player)) * heuristicPip
    score += Double(position.off(player)) * heuristicOff
    for index in 0..<24 {
      let count = checkers(position, player, at: index)
      if count >= 2 {
        score += heuristicPoint
        if isHomeIndex(player, index) {
          score += heuristicHomePoint
        }
      } else if count == 1 {
        score -=
          heuristicBlot + heuristicBlotShot * Double(directShots(position, player, at: index))
      }
    }
    return score
  }

  /// Picks the bot's full turn for a roll, or nil when the roll is blocked.
  /// Every level enumerates all legal turns and scores the results with
  /// `evaluate`, deduping candidates by final position:
  /// - easy: greedy plus per-candidate random noise.
  /// - medium: pure greedy on the heuristic.
  /// - hard: greedy plus prioritized hitting (opponent bar checkers) and
  ///   priming (longest consecutive point run) bonuses.
  static func findBotTurn(
    _ position: TawlaPosition,
    _ player: TawlaPlayer,
    dice: [Int],
    level: TawlaBotLevel,
    random: () -> Double = { Double.random(in: 0..<1) }
  ) -> TawlaTurn? {
    let turns = legalTurns(position, player, dice: dice)
    if turns.isEmpty { return nil }
    var seen = Set<String>()
    var best: TawlaTurn?
    var bestScore = -Double.infinity
    for turn in turns {
      let key = positionKey(turn.result)
      if seen.contains(key) { continue }
      seen.insert(key)
      var score = evaluate(turn.result, player)
      switch level {
      case .easy:
        score += (random() * 2 - 1) * heuristicEasyNoise
      case .medium:
        break
      case .hard:
        score += Double(turn.result.bar(player.opponent)) * heuristicHitBonus
        score += Double(max(0, longestPrime(turn.result, player) - 1)) * heuristicPrimeBonus
      }
      if score > bestScore {
        bestScore = score
        best = turn
      }
    }
    return best
  }

  /// Stable identity for a position, used to dedupe equivalent candidates.
  private static func positionKey(_ position: TawlaPosition) -> String {
    position.points.map(String.init).joined(separator: ",")
      + "|\(position.whiteBar),\(position.blackBar)|\(position.whiteOff),\(position.blackOff)"
  }

  // MARK: - Dice

  static func rollDie(random: () -> Double = { Double.random(in: 0..<1) }) -> Int {
    Int(random() * 6) + 1
  }

  /// Opening roll-off: each player rolls one die, ties re-roll, and the
  /// higher roller starts the game playing both dice as their first roll.
  static func rollOpening(random: () -> Double = { Double.random(in: 0..<1) })
    -> (whiteDie: Int, blackDie: Int, starter: TawlaPlayer)
  {
    var whiteDie = rollDie(random: random)
    var blackDie = rollDie(random: random)
    while whiteDie == blackDie {
      whiteDie = rollDie(random: random)
      blackDie = rollDie(random: random)
    }
    return (whiteDie, blackDie, whiteDie > blackDie ? .white : .black)
  }

  /// The mover's own point number for a board index (1-24).
  static func pointNumber(_ player: TawlaPlayer, _ index: Int) -> Int {
    player == .white ? index + 1 : 24 - index
  }

  /// Classic notation for a move, e.g. "24/18", "bar/22", "6/off", "13/7*".
  static func formatMove(_ player: TawlaPlayer, _ move: TawlaMove) -> String {
    let from = move.from == barIndex ? "bar" : String(pointNumber(player, move.from))
    let to = move.to == offIndex ? "off" : String(pointNumber(player, move.to))
    return "\(from)/\(to)\(move.hit ? "*" : "")"
  }
}
