import XCTest
@testable import AppIOS

/// Exercises the pure chess engine against the web `engine.ts` rules it
/// mirrors: perft node counts from the start position, castling legality
/// (blocked / through check), en passant, promotion, mate and stalemate
/// detection, and bot move legality.
final class ChessEngineTests: XCTestCase {
  // MARK: - Perft

  /// Classic perft counts from the starting position. Any divergence from
  /// 20 / 400 / 8902 means the move generator disagrees with real chess
  /// (and with the web engine).
  func testPerftFromStartPosition() {
    let start = ChessEngine.initialState()
    XCTAssertEqual(perft(start, depth: 1), 20)
    XCTAssertEqual(perft(start, depth: 2), 400)
    XCTAssertEqual(perft(start, depth: 3), 8902)
  }

  // MARK: - Castling

  func testCastlingBlockedByOwnPiecesIsIllegal() {
    // In the start position every castle path is occupied.
    let castles = ChessEngine.legalMoves(ChessEngine.initialState()).filter { $0.castle != nil }
    XCTAssertTrue(castles.isEmpty)

    // Bishop parked on f1 blocks kingside only; queenside stays available.
    let state = makeState(
      pieces: [
        ("e1", .king, .white), ("a1", .rook, .white), ("h1", .rook, .white),
        ("f1", .bishop, .white), ("e8", .king, .black),
      ]
    )
    let sides = ChessEngine.legalMoves(state).compactMap { $0.castle }
    XCTAssertEqual(sides, [.queenside])
  }

  func testCastlingThroughOrOutOfCheckIsIllegal() {
    // Black rook on f4 covers f1: the king may not pass through an attacked
    // square, so kingside is out while queenside remains legal.
    let throughCheck = makeState(
      pieces: [
        ("e1", .king, .white), ("a1", .rook, .white), ("h1", .rook, .white),
        ("f4", .rook, .black), ("h8", .king, .black),
      ]
    )
    let sides = ChessEngine.legalMoves(throughCheck).compactMap { $0.castle }
    XCTAssertEqual(sides, [.queenside])

    // Black rook on e5 gives check: castling is never legal while in check.
    let inCheck = makeState(
      pieces: [
        ("e1", .king, .white), ("a1", .rook, .white), ("h1", .rook, .white),
        ("e5", .rook, .black), ("h8", .king, .black),
      ]
    )
    XCTAssertTrue(ChessEngine.isInCheck(inCheck, color: .white))
    XCTAssertTrue(ChessEngine.legalMoves(inCheck).allSatisfy { $0.castle == nil })
  }

  func testCastlingMovesKingAndRookTogether() {
    let state = makeState(
      pieces: [
        ("e1", .king, .white), ("h1", .rook, .white), ("e8", .king, .black),
      ],
      castling: ChessCastlingRights(
        whiteKingside: true, whiteQueenside: false, blackKingside: false, blackQueenside: false
      )
    )
    guard let castle = ChessEngine.legalMoves(state).first(where: { $0.castle == .kingside }) else {
      return XCTFail("Expected kingside castling to be legal")
    }
    let next = ChessEngine.applyMove(state, castle)
    XCTAssertEqual(next.board[ChessEngine.parseSquare("g1")], ChessPiece(type: .king, color: .white))
    XCTAssertEqual(next.board[ChessEngine.parseSquare("f1")], ChessPiece(type: .rook, color: .white))
    XCTAssertNil(next.board[ChessEngine.parseSquare("e1")])
    XCTAssertNil(next.board[ChessEngine.parseSquare("h1")])
    XCTAssertFalse(next.castling.whiteKingside)
  }

  // MARK: - En passant

  func testEnPassantCaptureRemovesTheDoublePushedPawn() {
    // 1. e4 a6 2. e5 d5 sets the en passant target on d6.
    var state = ChessEngine.initialState()
    state = play(state, from: "e2", to: "e4")
    state = play(state, from: "a7", to: "a6")
    state = play(state, from: "e4", to: "e5")
    state = play(state, from: "d7", to: "d5")
    XCTAssertEqual(state.enPassant, ChessEngine.parseSquare("d6"))

    guard let capture = ChessEngine.legalMoves(state)
      .first(where: { $0.isEnPassant && $0.to == ChessEngine.parseSquare("d6") }) else {
      return XCTFail("Expected exd6 en passant to be legal")
    }
    XCTAssertEqual(capture.captured, .pawn)

    let next = ChessEngine.applyMove(state, capture)
    XCTAssertEqual(next.board[ChessEngine.parseSquare("d6")], ChessPiece(type: .pawn, color: .white))
    // The captured pawn sat behind the target square and must be gone.
    XCTAssertNil(next.board[ChessEngine.parseSquare("d5")])
    XCTAssertNil(next.board[ChessEngine.parseSquare("e5")])
    XCTAssertNil(next.enPassant)
  }

  // MARK: - Promotion

  func testPromotionGeneratesAllFourPiecesAndApplies() {
    let state = makeState(
      pieces: [("a7", .pawn, .white), ("e1", .king, .white), ("h7", .king, .black)]
    )
    let promotions = ChessEngine.legalMoves(state, from: ChessEngine.parseSquare("a7"))
    XCTAssertEqual(Set(promotions.compactMap { $0.promotion }), [.queen, .rook, .bishop, .knight])
    XCTAssertTrue(promotions.allSatisfy { $0.to == ChessEngine.parseSquare("a8") })

    guard let toQueen = promotions.first(where: { $0.promotion == .queen }) else {
      return XCTFail("Expected a queen promotion")
    }
    XCTAssertEqual(ChessEngine.moveToSan(state, toQueen), "a8=Q")
    let next = ChessEngine.applyMove(state, toQueen)
    XCTAssertEqual(next.board[ChessEngine.parseSquare("a8")], ChessPiece(type: .queen, color: .white))
    XCTAssertNil(next.board[ChessEngine.parseSquare("a7")])
  }

  // MARK: - Outcomes

  func testFoolsMateIsDetectedAsCheckmate() {
    // 1. f3 e5 2. g4 Qh4# — the fastest possible checkmate.
    var state = ChessEngine.initialState()
    state = play(state, from: "f2", to: "f3")
    state = play(state, from: "e7", to: "e5")
    state = play(state, from: "g2", to: "g4")

    let mate = move(state, from: "d8", to: "h4")
    XCTAssertEqual(ChessEngine.moveToSan(state, mate), "Qh4#")

    state = ChessEngine.applyMove(state, mate)
    XCTAssertTrue(ChessEngine.isInCheck(state, color: .white))
    XCTAssertTrue(ChessEngine.legalMoves(state).isEmpty)
    XCTAssertEqual(ChessEngine.getOutcome(state), .checkmate)
  }

  func testStalematePositionIsDetectedAsDraw() {
    // Black to move with king a8 boxed in by Kb6 + Qc7 — no check, no moves.
    let state = makeState(
      pieces: [("a8", .king, .black), ("b6", .king, .white), ("c7", .queen, .white)],
      turn: .black
    )
    XCTAssertFalse(ChessEngine.isInCheck(state, color: .black))
    XCTAssertTrue(ChessEngine.legalMoves(state).isEmpty)
    XCTAssertEqual(ChessEngine.getOutcome(state), .stalemate)
  }

  // MARK: - Bots

  func testEasyBotPlaysALegalMove() {
    let state = ChessEngine.initialState()
    let legal = ChessEngine.legalMoves(state)

    // Deterministic random keeps the pick reproducible; also sweep a few
    // random values to cover both the capture-bias and fallback branches.
    for value in [0.0, 0.25, 0.5, 0.75, 0.999] {
      guard let move = ChessEngine.findBotMove(state, difficulty: .easy, random: { value }) else {
        return XCTFail("Bot should find a move in the start position")
      }
      XCTAssertTrue(legal.contains(move))
    }
  }

  // MARK: - Helpers

  /// Counts leaf nodes of the legal move tree — the standard perft metric.
  private func perft(_ state: ChessGameState, depth: Int) -> Int {
    if depth == 0 { return 1 }
    var nodes = 0
    for move in ChessEngine.legalMoves(state) {
      nodes += perft(ChessEngine.applyMove(state, move), depth: depth - 1)
    }
    return nodes
  }

  /// Builds a position from a piece list. Castling rights default to "all
  /// available" so castle tests exercise the path checks, not the rights.
  private func makeState(
    pieces: [(String, ChessPieceType, ChessColor)],
    turn: ChessColor = .white,
    castling: ChessCastlingRights = ChessCastlingRights(
      whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true
    ),
    enPassant: Int? = nil
  ) -> ChessGameState {
    var board = [ChessPiece?](repeating: nil, count: 64)
    for (square, type, color) in pieces {
      board[ChessEngine.parseSquare(square)] = ChessPiece(type: type, color: color)
    }
    return ChessGameState(
      board: board, turn: turn, castling: castling,
      enPassant: enPassant, halfmoveClock: 0, fullmove: 1
    )
  }

  /// The unique legal move between two named squares (fails the test if absent).
  private func move(_ state: ChessGameState, from: String, to: String) -> ChessMove {
    let match = ChessEngine.legalMoves(state).first {
      $0.from == ChessEngine.parseSquare(from) && $0.to == ChessEngine.parseSquare(to)
    }
    guard let match else {
      XCTFail("Expected \(from)-\(to) to be legal")
      return ChessMove(from: 0, to: 0, piece: .pawn)
    }
    return match
  }

  private func play(_ state: ChessGameState, from: String, to: String) -> ChessGameState {
    ChessEngine.applyMove(state, move(state, from: from, to: to))
  }
}
