import Foundation

/// Piece color. `white` moves first, exactly like the web engine.
enum ChessColor: String, Equatable {
  case white
  case black

  var opposite: ChessColor { self == .white ? .black : .white }
}

/// The six piece kinds. `centipawns` mirrors the web `PIECE_VALUES` table
/// exactly so both platforms evaluate positions identically.
enum ChessPieceType: String, CaseIterable, Equatable {
  case pawn
  case knight
  case bishop
  case rook
  case queen
  case king

  /// Centipawn piece values used by the evaluation and the bots — must stay
  /// in sync with the web `PIECE_VALUES`.
  var centipawns: Int {
    switch self {
    case .pawn: return 100
    case .knight: return 320
    case .bishop: return 330
    case .rook: return 500
    case .queen: return 900
    case .king: return 0
    }
  }
}

struct ChessPiece: Equatable {
  var type: ChessPieceType
  var color: ChessColor
}

/// Which castling rights each side still has. Rights are lost forever when
/// the king or the relevant rook moves (or the rook is captured on its
/// corner), matching the web `CastlingRights`.
struct ChessCastlingRights: Equatable {
  var whiteKingside: Bool
  var whiteQueenside: Bool
  var blackKingside: Bool
  var blackQueenside: Bool
}

enum ChessCastleSide: String, Equatable {
  case kingside
  case queenside
}

/// One move, fully described so it can be applied, undone (by replaying the
/// history), and rendered in SAN. Mirrors the web `Move` interface.
struct ChessMove: Equatable {
  var from: Int
  var to: Int
  var piece: ChessPieceType
  var captured: ChessPieceType?
  var promotion: ChessPieceType?
  var castle: ChessCastleSide?
  var isEnPassant: Bool = false
}

/// Full position: board, side to move, castling rights, en passant target,
/// and the move clocks. Squares are indexed 0-63 as `rank * 8 + file`;
/// a1 = 0, h1 = 7, a8 = 56, h8 = 63 — identical to the web `GameState`.
struct ChessGameState: Equatable {
  /// 64 optional pieces, index = `rank * 8 + file`.
  var board: [ChessPiece?]
  var turn: ChessColor
  var castling: ChessCastlingRights
  /// Square a pawn just skipped with a double push (the en passant target), or nil.
  var enPassant: Int?
  /// Plies since the last pawn move or capture (fifty-move rule fuel for extensions).
  var halfmoveClock: Int
  var fullmove: Int
}

/// Terminal result of a position; nil (from `getOutcome`) means the game continues.
enum ChessOutcome: Equatable {
  case checkmate
  case stalemate
  case insufficientMaterial
}

enum ChessBotDifficulty: String, CaseIterable, Identifiable {
  case easy
  case medium
  case hard

  var id: String { rawValue }
}

/// Pure port of the web chess engine
/// (`web/app/src/View/Games/Chess/engine.ts`). Everything is a static pure
/// function over `ChessGameState` — no SwiftUI, no I/O — so the exact same
/// rules run on every platform and can be unit-tested headlessly.
///
/// Move legality (castling rights tracking, en passant, promotion), outcome
/// detection, the evaluation weights, and the three bot difficulties must
/// stay in lockstep with the web implementation. Randomness (easy bot picks,
/// greedy tie-breaks, hard-bot root shuffle) goes through an injectable
/// closure so tests can be deterministic.
enum ChessEngine {
  // MARK: - Geometry

  private static let rookDirections: [(Int, Int)] = [(1, 0), (-1, 0), (0, 1), (0, -1)]
  private static let bishopDirections: [(Int, Int)] = [(1, 1), (1, -1), (-1, 1), (-1, -1)]
  private static let kingDirections: [(Int, Int)] = rookDirections + bishopDirections
  private static let knightJumps: [(Int, Int)] = [
    (1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2),
  ]
  private static let promotionPieces: [ChessPieceType] = [.queen, .rook, .bishop, .knight]
  private static let backRank: [ChessPieceType] = [
    .rook, .knight, .bishop, .queen, .king, .bishop, .knight, .rook,
  ]
  private static let fileNames = ["a", "b", "c", "d", "e", "f", "g", "h"]

  static func fileOf(_ square: Int) -> Int { square % 8 }

  static func rankOf(_ square: Int) -> Int { square / 8 }

  static func squareAt(file: Int, rank: Int) -> Int { rank * 8 + file }

  /// "e4"-style name for a square index.
  static func squareName(_ square: Int) -> String {
    fileNames[fileOf(square)] + String(rankOf(square) + 1)
  }

  /// Square index for an "e4"-style name.
  static func parseSquare(_ name: String) -> Int {
    let scalars = Array(name.unicodeScalars)
    let file = Int(scalars[0].value) - 97
    let rank = Int(scalars[1].value) - 49
    return squareAt(file: file, rank: rank)
  }

  // MARK: - Setup

  /// Standard starting position, white to move.
  static func initialState() -> ChessGameState {
    var board = [ChessPiece?](repeating: nil, count: 64)
    for file in 0..<8 {
      board[squareAt(file: file, rank: 0)] = ChessPiece(type: backRank[file], color: .white)
      board[squareAt(file: file, rank: 1)] = ChessPiece(type: .pawn, color: .white)
      board[squareAt(file: file, rank: 6)] = ChessPiece(type: .pawn, color: .black)
      board[squareAt(file: file, rank: 7)] = ChessPiece(type: backRank[file], color: .black)
    }
    return ChessGameState(
      board: board,
      turn: .white,
      castling: ChessCastlingRights(
        whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true
      ),
      enPassant: nil,
      halfmoveClock: 0,
      fullmove: 1
    )
  }

  // MARK: - Attack detection

  /// True when `byColor` attacks `square` on this board (ignores pins — raw attack).
  static func isSquareAttacked(board: [ChessPiece?], square: Int, byColor: ChessColor) -> Bool {
    let file = fileOf(square)
    let rank = rankOf(square)

    // Pawns attack diagonally toward the enemy, so look one rank "behind" the square.
    let pawnRank = rank - (byColor == .white ? 1 : -1)
    if pawnRank >= 0 && pawnRank <= 7 {
      for df in [-1, 1] {
        let f = file + df
        if f < 0 || f > 7 { continue }
        if let piece = board[squareAt(file: f, rank: pawnRank)],
           piece.color == byColor, piece.type == .pawn {
          return true
        }
      }
    }

    for (df, dr) in knightJumps {
      let f = file + df
      let r = rank + dr
      if f < 0 || f > 7 || r < 0 || r > 7 { continue }
      if let piece = board[squareAt(file: f, rank: r)],
         piece.color == byColor, piece.type == .knight {
        return true
      }
    }

    for (df, dr) in kingDirections {
      let diagonal = df != 0 && dr != 0
      var f = file + df
      var r = rank + dr
      var distance = 1
      while f >= 0 && f <= 7 && r >= 0 && r <= 7 {
        if let piece = board[squareAt(file: f, rank: r)] {
          if piece.color == byColor {
            if piece.type == .queen { return true }
            if piece.type == (diagonal ? .bishop : .rook) { return true }
            if piece.type == .king && distance == 1 { return true }
          }
          break
        }
        f += df
        r += dr
        distance += 1
      }
    }

    return false
  }

  /// True when `color`'s king is attacked in this position.
  static func isInCheck(_ state: ChessGameState, color: ChessColor) -> Bool {
    guard let king = state.board.firstIndex(where: { $0?.type == .king && $0?.color == color })
    else { return false }
    return isSquareAttacked(board: state.board, square: king, byColor: color.opposite)
  }

  // MARK: - Move generation

  private static func pawnMoves(
    _ state: ChessGameState, from: Int, color: ChessColor, into out: inout [ChessMove]
  ) {
    let board = state.board
    let direction = color == .white ? 1 : -1
    let file = fileOf(from)
    let rank = rankOf(from)
    let promotionRank = color == .white ? 7 : 0
    let startRank = color == .white ? 1 : 6

    func push(to: Int, captured: ChessPieceType?) {
      if rankOf(to) == promotionRank {
        for promotion in promotionPieces {
          out.append(ChessMove(from: from, to: to, piece: .pawn, captured: captured, promotion: promotion))
        }
      } else {
        out.append(ChessMove(from: from, to: to, piece: .pawn, captured: captured))
      }
    }

    let oneUp = squareAt(file: file, rank: rank + direction)
    if board[oneUp] == nil {
      push(to: oneUp, captured: nil)
      if rank == startRank {
        let twoUp = squareAt(file: file, rank: rank + 2 * direction)
        if board[twoUp] == nil {
          out.append(ChessMove(from: from, to: twoUp, piece: .pawn))
        }
      }
    }

    for df in [-1, 1] {
      let f = file + df
      if f < 0 || f > 7 { continue }
      let to = squareAt(file: f, rank: rank + direction)
      if let target = board[to] {
        if target.color != color {
          push(to: to, captured: target.type)
        }
      } else if to == state.enPassant {
        out.append(ChessMove(from: from, to: to, piece: .pawn, captured: .pawn, isEnPassant: true))
      }
    }
  }

  private static func leaperMoves(
    board: [ChessPiece?], from: Int, color: ChessColor, piece: ChessPieceType,
    offsets: [(Int, Int)], into out: inout [ChessMove]
  ) {
    let file = fileOf(from)
    let rank = rankOf(from)
    for (df, dr) in offsets {
      let f = file + df
      let r = rank + dr
      if f < 0 || f > 7 || r < 0 || r > 7 { continue }
      let to = squareAt(file: f, rank: r)
      if let target = board[to] {
        if target.color != color {
          out.append(ChessMove(from: from, to: to, piece: piece, captured: target.type))
        }
      } else {
        out.append(ChessMove(from: from, to: to, piece: piece))
      }
    }
  }

  private static func sliderMoves(
    board: [ChessPiece?], from: Int, color: ChessColor, piece: ChessPieceType,
    directions: [(Int, Int)], into out: inout [ChessMove]
  ) {
    let file = fileOf(from)
    let rank = rankOf(from)
    for (df, dr) in directions {
      var f = file + df
      var r = rank + dr
      while f >= 0 && f <= 7 && r >= 0 && r <= 7 {
        let to = squareAt(file: f, rank: r)
        if let target = board[to] {
          if target.color != color {
            out.append(ChessMove(from: from, to: to, piece: piece, captured: target.type))
          }
          break
        }
        out.append(ChessMove(from: from, to: to, piece: piece))
        f += df
        r += dr
      }
    }
  }

  private static func castlingMoves(
    _ state: ChessGameState, color: ChessColor, into out: inout [ChessMove]
  ) {
    let board = state.board
    let rank = color == .white ? 0 : 7
    let kingFrom = squareAt(file: 4, rank: rank)
    let enemy = color.opposite
    let kingside = color == .white ? state.castling.whiteKingside : state.castling.blackKingside
    let queenside = color == .white ? state.castling.whiteQueenside : state.castling.blackQueenside
    if !kingside && !queenside { return }
    guard let king = board[kingFrom], king.type == .king, king.color == color else { return }
    // Castling is never legal while in check.
    if isSquareAttacked(board: board, square: kingFrom, byColor: enemy) { return }
    if kingside {
      let f1 = squareAt(file: 5, rank: rank)
      let g1 = squareAt(file: 6, rank: rank)
      let rook = board[squareAt(file: 7, rank: rank)]
      if rook?.type == .rook, rook?.color == color,
         board[f1] == nil, board[g1] == nil,
         !isSquareAttacked(board: board, square: f1, byColor: enemy),
         !isSquareAttacked(board: board, square: g1, byColor: enemy) {
        out.append(ChessMove(from: kingFrom, to: g1, piece: .king, castle: .kingside))
      }
    }
    if queenside {
      let b1 = squareAt(file: 1, rank: rank)
      let c1 = squareAt(file: 2, rank: rank)
      let d1 = squareAt(file: 3, rank: rank)
      let rook = board[squareAt(file: 0, rank: rank)]
      if rook?.type == .rook, rook?.color == color,
         board[b1] == nil, board[c1] == nil, board[d1] == nil,
         !isSquareAttacked(board: board, square: c1, byColor: enemy),
         !isSquareAttacked(board: board, square: d1, byColor: enemy) {
        out.append(ChessMove(from: kingFrom, to: c1, piece: .king, castle: .queenside))
      }
    }
  }

  /// Every move a color could make ignoring whether it leaves its own king in
  /// check. Castling is the exception: its through-check conditions are part
  /// of the move's definition, so they are enforced here.
  private static func pseudoMoves(for state: ChessGameState, color: ChessColor) -> [ChessMove] {
    var moves: [ChessMove] = []
    moves.reserveCapacity(48)
    for square in 0..<64 {
      guard let piece = state.board[square], piece.color == color else { continue }
      switch piece.type {
      case .pawn:
        pawnMoves(state, from: square, color: color, into: &moves)
      case .knight:
        leaperMoves(board: state.board, from: square, color: color, piece: .knight, offsets: knightJumps, into: &moves)
      case .bishop:
        sliderMoves(board: state.board, from: square, color: color, piece: .bishop, directions: bishopDirections, into: &moves)
      case .rook:
        sliderMoves(board: state.board, from: square, color: color, piece: .rook, directions: rookDirections, into: &moves)
      case .queen:
        sliderMoves(board: state.board, from: square, color: color, piece: .queen, directions: kingDirections, into: &moves)
      case .king:
        leaperMoves(board: state.board, from: square, color: color, piece: .king, offsets: kingDirections, into: &moves)
        castlingMoves(state, color: color, into: &moves)
      }
    }
    return moves
  }

  /// All strictly legal moves for the side to move.
  static func legalMoves(_ state: ChessGameState) -> [ChessMove] {
    pseudoMoves(for: state, color: state.turn).filter { move in
      !isInCheck(applyMove(state, move), color: state.turn)
    }
  }

  /// Legal moves for the piece on one square (empty array if none).
  static func legalMoves(_ state: ChessGameState, from square: Int) -> [ChessMove] {
    legalMoves(state).filter { $0.from == square }
  }

  // MARK: - Applying moves

  private static func clearedRights(_ rights: ChessCastlingRights, square: Int) -> ChessCastlingRights {
    var rights = rights
    switch square {
    case 0: rights.whiteQueenside = false
    case 7: rights.whiteKingside = false
    case 56: rights.blackQueenside = false
    case 63: rights.blackKingside = false
    default: break
    }
    return rights
  }

  /// Applies a move and returns the new state. Pure — the input state is untouched.
  static func applyMove(_ state: ChessGameState, _ move: ChessMove) -> ChessGameState {
    var board = state.board
    guard let piece = board[move.from] else {
      preconditionFailure("No piece on \(squareName(move.from))")
    }
    let color = piece.color

    board[move.from] = nil
    if move.isEnPassant {
      board[move.to + (color == .white ? -8 : 8)] = nil
    }
    board[move.to] = move.promotion.map { ChessPiece(type: $0, color: color) } ?? piece

    if let castle = move.castle {
      let rank = rankOf(move.from)
      let rookFrom = squareAt(file: castle == .kingside ? 7 : 0, rank: rank)
      let rookTo = squareAt(file: castle == .kingside ? 5 : 3, rank: rank)
      board[rookTo] = board[rookFrom]
      board[rookFrom] = nil
    }

    var castling = state.castling
    if piece.type == .king {
      if color == .white {
        castling.whiteKingside = false
        castling.whiteQueenside = false
      } else {
        castling.blackKingside = false
        castling.blackQueenside = false
      }
    }
    // Moving a rook off its corner, or capturing one on it, kills that right.
    castling = clearedRights(castling, square: move.from)
    castling = clearedRights(castling, square: move.to)

    let isDoublePush = piece.type == .pawn && abs(move.to - move.from) == 16

    return ChessGameState(
      board: board,
      turn: color.opposite,
      castling: castling,
      enPassant: isDoublePush ? (move.from + move.to) / 2 : nil,
      halfmoveClock: piece.type == .pawn || move.captured != nil ? 0 : state.halfmoveClock + 1,
      fullmove: color == .black ? state.fullmove + 1 : state.fullmove
    )
  }

  // MARK: - Outcomes

  /// K vs K, K+B vs K, and K+N vs K can never be won.
  static func hasInsufficientMaterial(board: [ChessPiece?]) -> Bool {
    var minorCount = 0
    for piece in board {
      guard let piece, piece.type != .king else { continue }
      if piece.type != .bishop && piece.type != .knight { return false }
      minorCount += 1
      if minorCount > 1 { return false }
    }
    return true
  }

  /// Terminal result of the position, or nil if the game continues.
  static func getOutcome(_ state: ChessGameState) -> ChessOutcome? {
    if legalMoves(state).isEmpty {
      return isInCheck(state, color: state.turn) ? .checkmate : .stalemate
    }
    if hasInsufficientMaterial(board: state.board) {
      return .insufficientMaterial
    }
    return nil
  }

  // MARK: - SAN

  private static func sanLetter(_ type: ChessPieceType) -> String {
    switch type {
    case .pawn: return ""
    case .knight: return "N"
    case .bishop: return "B"
    case .rook: return "R"
    case .queen: return "Q"
    case .king: return "K"
    }
  }

  /// Standard algebraic notation for a move about to be played from `state`
  /// (e.g. "e4", "Nxf6+", "O-O", "e8=Q#"), including disambiguation and
  /// check/checkmate suffixes.
  static func moveToSan(_ state: ChessGameState, _ move: ChessMove) -> String {
    var san: String
    if let castle = move.castle {
      san = castle == .kingside ? "O-O" : "O-O-O"
    } else if move.piece == .pawn {
      san = move.captured != nil
        ? "\(fileNames[fileOf(move.from)])x\(squareName(move.to))"
        : squareName(move.to)
      if let promotion = move.promotion {
        san += "=\(sanLetter(promotion))"
      }
    } else {
      let rivals = legalMoves(state).filter {
        $0.piece == move.piece && $0.to == move.to && $0.from != move.from
      }
      var disambiguation = ""
      if !rivals.isEmpty {
        let sameFile = rivals.contains { fileOf($0.from) == fileOf(move.from) }
        let sameRank = rivals.contains { rankOf($0.from) == rankOf(move.from) }
        if !sameFile {
          disambiguation = fileNames[fileOf(move.from)]
        } else if !sameRank {
          disambiguation = String(rankOf(move.from) + 1)
        } else {
          disambiguation = squareName(move.from)
        }
      }
      san = sanLetter(move.piece) + disambiguation + (move.captured != nil ? "x" : "") + squareName(move.to)
    }

    let next = applyMove(state, move)
    if isInCheck(next, color: next.turn) {
      san += legalMoves(next).isEmpty ? "#" : "+"
    }
    return san
  }

  // MARK: - Evaluation

  // Piece-square tables (centipawns) from white's point of view, written with
  // rank 8 at the top so they read like a board diagram. Classic "simplified
  // evaluation function" values — identical to the web tables.
  private static let pawnTable: [Int] = [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5, -10, 0,  0, -10, -5, 5,
     5, 10, 10, -20, -20, 10, 10, 5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ]
  private static let knightTable: [Int] = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,   0,   0,   0,   0, -20, -40,
    -30,   0,  10,  15,  15,  10,   0, -30,
    -30,   5,  15,  20,  20,  15,   5, -30,
    -30,   0,  15,  20,  20,  15,   0, -30,
    -30,   5,  10,  15,  15,  10,   5, -30,
    -40, -20,   0,   5,   5,   0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ]
  private static let bishopTable: [Int] = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,  10,  10,   5,   0, -10,
    -10,   5,   5,  10,  10,   5,   5, -10,
    -10,   0,  10,  10,  10,  10,   0, -10,
    -10,  10,  10,  10,  10,  10,  10, -10,
    -10,   5,   0,   0,   0,   0,   5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ]
  private static let rookTable: [Int] = [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ]
  private static let queenTable: [Int] = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10,   0,   0,  0,  0,   0,   0, -10,
    -10,   0,   5,  5,  5,   5,   0, -10,
     -5,   0,   5,  5,  5,   5,   0,  -5,
      0,   0,   5,  5,  5,   5,   0,  -5,
    -10,   5,   5,  5,  5,   5,   0, -10,
    -10,   0,   5,  0,  0,   0,   0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ]
  private static let kingTable: [Int] = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
     20,  20,   0,   0,   0,   0,  20,  20,
     20,  30,  10,   0,   0,  10,  30,  20,
  ]

  private static func pieceSquareTable(_ type: ChessPieceType) -> [Int] {
    switch type {
    case .pawn: return pawnTable
    case .knight: return knightTable
    case .bishop: return bishopTable
    case .rook: return rookTable
    case .queen: return queenTable
    case .king: return kingTable
    }
  }

  private static let mobilityWeight = 2
  private static let mateScore = 1_000_000
  private static let hardSearchDepth = 3

  private static func pieceSquareValue(_ piece: ChessPiece, square: Int) -> Int {
    let table = pieceSquareTable(piece.type)
    let file = fileOf(square)
    let rank = rankOf(square)
    // Tables are written rank 8 first, so white reads them flipped.
    return piece.color == .white ? table[(7 - rank) * 8 + file] : table[rank * 8 + file]
  }

  /// Static evaluation in centipawns; positive favors white. Material +
  /// piece-square + mobility — the same weights as the web `evaluate`.
  static func evaluate(_ state: ChessGameState) -> Int {
    var score = 0
    for square in 0..<64 {
      guard let piece = state.board[square] else { continue }
      let sign = piece.color == .white ? 1 : -1
      score += sign * (piece.type.centipawns + pieceSquareValue(piece, square: square))
    }
    score += mobilityWeight * pseudoMoves(for: state, color: .white).count
    score -= mobilityWeight * pseudoMoves(for: state, color: .black).count
    return score
  }

  // MARK: - Bots

  private static func randomElement<T>(_ items: [T], random: () -> Double) -> T {
    items[min(items.count - 1, Int(random() * Double(items.count)))]
  }

  private static func materialGain(_ move: ChessMove) -> Int {
    var gain = move.captured?.centipawns ?? 0
    if let promotion = move.promotion {
      gain += promotion.centipawns - ChessPieceType.pawn.centipawns
    }
    return gain
  }

  /// Easy: random, with a soft spot for taking something when it can.
  private static func easyMove(_ moves: [ChessMove], random: () -> Double) -> ChessMove {
    let captures = moves.filter { $0.captured != nil }
    if !captures.isEmpty && random() < 0.6 {
      return randomElement(captures, random: random)
    }
    return randomElement(moves, random: random)
  }

  /// Medium: depth-1 material greed with a one-ply safety check so it does
  /// not leave pieces hanging (the opponent's best immediate capture counts
  /// against the move).
  private static func greedyMove(
    _ state: ChessGameState, _ moves: [ChessMove], random: () -> Double
  ) -> ChessMove {
    var best: [ChessMove] = []
    var bestScore = -Double.infinity
    for move in moves {
      let next = applyMove(state, move)
      var threat = 0
      for reply in legalMoves(next) {
        if let captured = reply.captured {
          threat = max(threat, captured.centipawns)
        }
      }
      let score = Double(materialGain(move)) - Double(threat) * 0.9
      if score > bestScore {
        bestScore = score
        best = [move]
      } else if score == bestScore {
        best.append(move)
      }
    }
    return randomElement(best, random: random)
  }

  /// Captures first, biggest victim with the cheapest attacker (MVV-LVA), so
  /// alpha-beta prunes early.
  private static func orderMoves(_ moves: [ChessMove]) -> [ChessMove] {
    func score(_ move: ChessMove) -> Int {
      guard let captured = move.captured else { return 0 }
      return 10 * captured.centipawns - move.piece.centipawns
    }
    return moves.sorted { score($0) > score($1) }
  }

  /// Negamax alpha-beta. Scores are from the perspective of the side to move
  /// in `state`. Mates found closer to the root score higher so the bot
  /// prefers the fastest win and the slowest loss.
  private static func negamax(_ state: ChessGameState, depth: Int, alpha: Int, beta: Int) -> Int {
    if hasInsufficientMaterial(board: state.board) {
      return 0
    }
    if depth == 0 {
      let score = evaluate(state)
      return state.turn == .white ? score : -score
    }
    let moves = legalMoves(state)
    if moves.isEmpty {
      return isInCheck(state, color: state.turn) ? -(mateScore + depth) : 0
    }
    var alpha = alpha
    var best = Int.min
    for move in orderMoves(moves) {
      let score = -negamax(applyMove(state, move), depth: depth - 1, alpha: -beta, beta: -alpha)
      if score > best {
        best = score
      }
      if best > alpha {
        alpha = best
      }
      if alpha >= beta {
        break
      }
    }
    return best
  }

  /// Hard: full alpha-beta search. Root moves are shuffled before ordering so
  /// equal-best positions do not always play out identically.
  private static func searchMove(
    _ state: ChessGameState, depth: Int, random: () -> Double
  ) -> ChessMove {
    let shuffled = legalMoves(state)
      .map { (move: $0, key: random()) }
      .sorted { $0.key < $1.key }
      .map { $0.move }
    let moves = orderMoves(shuffled)
    var best = moves[0]
    var alpha = Int.min + 1
    for move in moves {
      let score = -negamax(applyMove(state, move), depth: depth - 1, alpha: Int.min + 1, beta: -alpha)
      if score > alpha {
        alpha = score
        best = move
      }
    }
    return best
  }

  /// Picks the bot's move for the side to move, or nil if the game is over.
  /// `random` is injectable so tests can be deterministic; the default
  /// matches the web's `Math.random()`.
  static func findBotMove(
    _ state: ChessGameState,
    difficulty: ChessBotDifficulty,
    random: () -> Double = { Double.random(in: 0..<1) }
  ) -> ChessMove? {
    let moves = legalMoves(state)
    if moves.isEmpty {
      return nil
    }
    switch difficulty {
    case .easy:
      return easyMove(moves, random: random)
    case .medium:
      return greedyMove(state, moves, random: random)
    case .hard:
      return searchMove(state, depth: hardSearchDepth, random: random)
    }
  }
}
