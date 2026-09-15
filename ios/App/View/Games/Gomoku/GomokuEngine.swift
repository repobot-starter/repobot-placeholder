import Foundation

/// Stone colors. Black always moves first, matching the web game.
enum GomokuStone: Equatable {
  case black
  case white

  var opposite: GomokuStone { self == .black ? .white : .black }
}

/// Bot levels. The evaluator weights and policies mirror the web engine's
/// `easy` / `medium` / `hard` exactly so both platforms play identically.
enum GomokuBotLevel: String, CaseIterable, Identifiable {
  case easy
  case medium
  case hard

  var id: String { rawValue }
}

/// Pure port of the web Gomoku engine
/// (`web/app/src/View/Games/Gomoku/engine.ts`). No SwiftUI here: the static
/// functions are pure over a board array and the instance layer is a plain
/// move-list state machine, so everything can be unit-tested headlessly and
/// rendered by any frontend.
///
/// The pattern weights (`PatternScores`), the 0.9 defense discount, the
/// candidate radius of 2, and the three bot policies must stay in sync with
/// the web engine so the bot feels identical on every platform.
///
/// Randomness (tie-breaking between equally good cells) goes through an
/// injected closure so tests can make the bot fully deterministic.
final class GomokuEngine {
  static let boardSize = 15
  static let cellCount = boardSize * boardSize

  /// Heuristic value of a line reaching a stone count with a given number of
  /// open ends — the web `PATTERN_SCORES` table verbatim.
  enum PatternScores {
    static let five = 1_000_000.0
    static let openFour = 100_000.0
    static let closedFour = 12_000.0
    static let openThree = 8_000.0
    static let closedThree = 600.0
    static let openTwo = 400.0
    static let closedTwo = 60.0
    static let openOne = 20.0
    static let closedOne = 4.0
  }

  /// Defense is worth slightly less than attack (web `DEFENSE_WEIGHT`).
  static let defenseWeight = 0.9
  /// Chebyshev distance from existing stones the bots consider (web `CANDIDATE_RADIUS`).
  static let candidateRadius = 2
  /// Top-ranked candidates the hard bot expands (web `HARD_CANDIDATE_LIMIT`).
  static let hardCandidateLimit = 12

  /// The four line axes as (dRow, dCol); the reverse of each is walked separately.
  private static let directions: [(Int, Int)] = [(0, 1), (1, 0), (1, 1), (1, -1)]

  // MARK: - Instance state (drives the SwiftUI view)

  private(set) var board: [GomokuStone?]
  /// Cells in play order; the board is derived from it so undo is just slicing.
  private(set) var moves: [Int]
  var level: GomokuBotLevel

  private let random: () -> Double

  init(
    level: GomokuBotLevel = .medium,
    random: @escaping () -> Double = { Double.random(in: 0..<1) }
  ) {
    self.level = level
    self.random = random
    board = Array(repeating: nil, count: Self.cellCount)
    moves = []
  }

  var turn: GomokuStone { moves.count % 2 == 0 ? .black : .white }
  var lastMove: Int? { moves.last }

  /// The completed five-plus through the last move, or nil while play continues.
  var winLine: [Int]? {
    guard let last = moves.last else { return nil }
    return Self.findWinLine(board: board, cell: last)
  }

  var winner: GomokuStone? {
    guard let line = winLine, let first = line.first else { return nil }
    return board[first]
  }

  var isDraw: Bool { winner == nil && Self.isBoardFull(board) }
  var isOver: Bool { winner != nil || isDraw }

  func newGame() {
    board = Array(repeating: nil, count: Self.cellCount)
    moves = []
  }

  /// Places the current turn's stone. Returns false when the cell is taken
  /// or the game is over (the tap is ignored, like a click on the web board).
  @discardableResult
  func place(cell: Int) -> Bool {
    guard !isOver, board[cell] == nil else { return false }
    board[cell] = turn
    moves.append(cell)
    return true
  }

  /// Picks and plays the bot's stone for the side to move. Returns the cell,
  /// or nil when the game is already over or the board is full.
  @discardableResult
  func playBotMove() -> Int? {
    guard !isOver else { return nil }
    guard let cell = Self.findBotMove(board: board, stone: turn, level: level, random: random) else {
      return nil
    }
    place(cell: cell)
    return cell
  }

  /// Reverts a full human+bot pair when the bot (white) has replied, so it is
  /// the human's turn again — the same policy as the web page's Undo in 1P.
  func undoPair() {
    let drop = moves.count % 2 == 0 && moves.count >= 2 ? 2 : 1
    for _ in 0..<min(drop, moves.count) {
      board[moves.removeLast()] = nil
    }
  }

  // MARK: - Pure board functions (mirror the web engine one-for-one)

  static func rowOf(_ cell: Int) -> Int { cell / boardSize }
  static func colOf(_ cell: Int) -> Int { cell % boardSize }
  static func cellAt(row: Int, col: Int) -> Int { row * boardSize + col }

  static func isBoardFull(_ board: [GomokuStone?]) -> Bool {
    !board.contains(nil)
  }

  private static func inBounds(row: Int, col: Int) -> Bool {
    row >= 0 && row < boardSize && col >= 0 && col < boardSize
  }

  /// The completed run of five or more through the stone at `cell`, as sorted
  /// cell indices, or nil when that stone is not part of a five. Only lines
  /// through `cell` are checked, so call it with the last move played.
  static func findWinLine(board: [GomokuStone?], cell: Int) -> [Int]? {
    guard let stone = board[cell] else { return nil }
    for (dRow, dCol) in directions {
      var line = [cell]
      for sign in [1, -1] {
        var row = rowOf(cell) + dRow * sign
        var col = colOf(cell) + dCol * sign
        while inBounds(row: row, col: col), board[cellAt(row: row, col: col)] == stone {
          line.append(cellAt(row: row, col: col))
          row += dRow * sign
          col += dCol * sign
        }
      }
      if line.count >= 5 {
        return line.sorted()
      }
    }
    return nil
  }

  /// Contiguous same-color stones walking away from the cell, plus whether
  /// the cell just past the run is empty (the line can still grow).
  private static func runFrom(
    board: [GomokuStone?], cell: Int, stone: GomokuStone, dRow: Int, dCol: Int
  ) -> (count: Int, open: Bool) {
    var row = rowOf(cell) + dRow
    var col = colOf(cell) + dCol
    var count = 0
    while inBounds(row: row, col: col), board[cellAt(row: row, col: col)] == stone {
      count += 1
      row += dRow
      col += dCol
    }
    let open = inBounds(row: row, col: col) && board[cellAt(row: row, col: col)] == nil
    return (count, open)
  }

  private static func lineScore(count: Int, openEnds: Int) -> Double {
    if count >= 5 { return PatternScores.five }
    if openEnds == 0 { return 0 }
    switch count {
    case 4: return openEnds == 2 ? PatternScores.openFour : PatternScores.closedFour
    case 3: return openEnds == 2 ? PatternScores.openThree : PatternScores.closedThree
    case 2: return openEnds == 2 ? PatternScores.openTwo : PatternScores.closedTwo
    default: return openEnds == 2 ? PatternScores.openOne : PatternScores.closedOne
    }
  }

  /// Pattern value of placing `stone` on the empty `cell`: the sum over the
  /// four axes of the score of the line that placement would create.
  static func cellScore(board: [GomokuStone?], cell: Int, stone: GomokuStone) -> Double {
    var total = 0.0
    for (dRow, dCol) in directions {
      let forward = runFrom(board: board, cell: cell, stone: stone, dRow: dRow, dCol: dCol)
      let backward = runFrom(board: board, cell: cell, stone: stone, dRow: -dRow, dCol: -dCol)
      total += lineScore(
        count: 1 + forward.count + backward.count,
        openEnds: (forward.open ? 1 : 0) + (backward.open ? 1 : 0)
      )
    }
    return total
  }

  /// True when placing `stone` on the empty `cell` makes five or more in a row.
  static func makesFive(board: [GomokuStone?], cell: Int, stone: GomokuStone) -> Bool {
    for (dRow, dCol) in directions {
      let forward = runFrom(board: board, cell: cell, stone: stone, dRow: dRow, dCol: dCol)
      let backward = runFrom(board: board, cell: cell, stone: stone, dRow: -dRow, dCol: -dCol)
      if 1 + forward.count + backward.count >= 5 { return true }
    }
    return false
  }

  /// Empty cells worth considering: everything within `candidateRadius` of an
  /// existing stone. An empty board yields just the center.
  static func candidateCells(board: [GomokuStone?]) -> [Int] {
    var near = Array(repeating: false, count: cellCount)
    var hasStone = false
    for cell in 0..<cellCount where board[cell] != nil {
      hasStone = true
      let row = rowOf(cell)
      let col = colOf(cell)
      for dRow in -candidateRadius...candidateRadius {
        for dCol in -candidateRadius...candidateRadius
        where inBounds(row: row + dRow, col: col + dCol) {
          near[cellAt(row: row + dRow, col: col + dCol)] = true
        }
      }
    }
    if !hasStone {
      return [cellAt(row: boardSize / 2, col: boardSize / 2)]
    }
    return (0..<cellCount).filter { near[$0] && board[$0] == nil }
  }

  /// Every empty cell where `stone` would immediately complete five in a row.
  static func winningCells(board: [GomokuStone?], stone: GomokuStone) -> [Int] {
    candidateCells(board: board).filter { makesFive(board: board, cell: $0, stone: stone) }
  }

  /// Attack + discounted defense: how much a cell is worth to `stone` right now.
  private static func combinedScore(
    board: [GomokuStone?], cell: Int, stone: GomokuStone
  ) -> Double {
    cellScore(board: board, cell: cell, stone: stone)
      + defenseWeight * cellScore(board: board, cell: cell, stone: stone.opposite)
  }

  /// Highest-scoring cells (all ties), so the caller can pick one at random.
  private static func bestCells(_ cells: [Int], score: (Int) -> Double) -> [Int] {
    var best: [Int] = []
    var bestScore = -Double.infinity
    for cell in cells {
      let value = score(cell)
      if value > bestScore {
        bestScore = value
        best = [cell]
      } else if value == bestScore {
        best.append(cell)
      }
    }
    return best
  }

  private static func randomOf(_ cells: [Int], random: () -> Double) -> Int {
    cells[min(Int(random() * Double(cells.count)), cells.count - 1)]
  }

  /// Picks the bot's cell for `stone` on the current board, or nil when the
  /// board is full. Same three policies as the web `findBotMove`:
  /// - easy: greedy on its own attack only (it never blocks)
  /// - medium: full pattern scoring for attack and discounted defense
  /// - hard: immediate win/block detection, then a 2-ply minimax over the
  ///   top candidates where each move is charged with the opponent's best
  ///   evaluator reply
  static func findBotMove(
    board: [GomokuStone?],
    stone: GomokuStone,
    level: GomokuBotLevel,
    random: () -> Double = { Double.random(in: 0..<1) }
  ) -> Int? {
    let candidates = candidateCells(board: board)
    if candidates.isEmpty { return nil }

    switch level {
    case .easy:
      return randomOf(
        bestCells(candidates) { cellScore(board: board, cell: $0, stone: stone) },
        random: random
      )
    case .medium:
      return randomOf(
        bestCells(candidates) { combinedScore(board: board, cell: $0, stone: stone) },
        random: random
      )
    case .hard:
      let wins = winningCells(board: board, stone: stone)
      if !wins.isEmpty { return randomOf(wins, random: random) }
      let blocks = winningCells(board: board, stone: stone.opposite)
      if !blocks.isEmpty { return randomOf(blocks, random: random) }

      let ranked = candidates
        .map { (cell: $0, score: combinedScore(board: board, cell: $0, stone: stone)) }
        .sorted { $0.score > $1.score }
        .prefix(hardCandidateLimit)

      var valueOf: [Int: Double] = [:]
      for entry in ranked {
        var next = board
        next[entry.cell] = stone
        var enemyBest = 0.0
        for reply in candidateCells(board: next) {
          enemyBest = max(enemyBest, combinedScore(board: next, cell: reply, stone: stone.opposite))
        }
        valueOf[entry.cell] = entry.score - defenseWeight * enemyBest
      }
      return randomOf(
        bestCells(ranked.map(\.cell)) { valueOf[$0] ?? -.infinity },
        random: random
      )
    }
  }
}
