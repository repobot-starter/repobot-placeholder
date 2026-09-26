import XCTest
@testable import AppIOS

/// Exercises the pure Gomoku engine. The bot takes an injectable random
/// source used only to break ties between equally scored cells, so every
/// test below is deterministic: `random = { 0 }` always picks the first of
/// the tied best cells.
final class GomokuEngineTests: XCTestCase {
  private let size = GomokuEngine.boardSize

  func testHorizontalWinIsDetected() {
    var board = emptyBoard()
    // Black stones on row 7, columns 3-7.
    let line = (3...7).map { GomokuEngine.cellAt(row: 7, col: $0) }
    line.forEach { board[$0] = .black }

    // Any stone of the run finds the same sorted five.
    XCTAssertEqual(GomokuEngine.findWinLine(board: board, cell: line[2]), line)
    XCTAssertEqual(GomokuEngine.findWinLine(board: board, cell: line[0]), line)
  }

  func testVerticalWinIsDetected() {
    var board = emptyBoard()
    let line = (2...6).map { GomokuEngine.cellAt(row: $0, col: 10) }
    line.forEach { board[$0] = .white }

    XCTAssertEqual(GomokuEngine.findWinLine(board: board, cell: line[4]), line)
  }

  func testDiagonalWinsAreDetectedBothWays() {
    // Down-right diagonal.
    var board = emptyBoard()
    let diagonal = (0..<5).map { GomokuEngine.cellAt(row: 4 + $0, col: 4 + $0) }
    diagonal.forEach { board[$0] = .black }
    XCTAssertEqual(GomokuEngine.findWinLine(board: board, cell: diagonal[2]), diagonal.sorted())

    // Down-left (anti) diagonal.
    var antiBoard = emptyBoard()
    let anti = (0..<5).map { GomokuEngine.cellAt(row: 3 + $0, col: 9 - $0) }
    anti.forEach { antiBoard[$0] = .white }
    XCTAssertEqual(GomokuEngine.findWinLine(board: antiBoard, cell: anti[0]), anti.sorted())
  }

  func testFourInARowIsNotAWin() {
    var board = emptyBoard()
    (3...6).forEach { board[GomokuEngine.cellAt(row: 7, col: $0)] = .black }

    XCTAssertNil(GomokuEngine.findWinLine(board: board, cell: GomokuEngine.cellAt(row: 7, col: 4)))
  }

  func testOverlineOfSixCountsAsAWin() {
    // Freestyle rules: six or more in a row still wins.
    var board = emptyBoard()
    let line = (3...8).map { GomokuEngine.cellAt(row: 0, col: $0) }
    line.forEach { board[$0] = .black }

    XCTAssertEqual(GomokuEngine.findWinLine(board: board, cell: line[3]), line)
  }

  func testFullBoardWithNoFiveIsADraw() {
    // Tile the board so no color ever runs five: color by ((col + 2*row) mod 4)
    // gives maximum runs of two on every axis.
    var board = emptyBoard()
    for row in 0..<size {
      for col in 0..<size {
        board[GomokuEngine.cellAt(row: row, col: col)] =
          (col + 2 * row) % 4 < 2 ? .black : .white
      }
    }

    XCTAssertTrue(GomokuEngine.isBoardFull(board))
    for cell in 0..<GomokuEngine.cellCount {
      XCTAssertNil(GomokuEngine.findWinLine(board: board, cell: cell))
    }
    // A full board offers the bot no move.
    XCTAssertNil(GomokuEngine.findBotMove(board: board, stone: .black, level: .hard, random: { 0 }))
  }

  func testBotBlocksAnOpenFour() {
    // Black has an open four on row 7, columns 4-7: white must take one of
    // the two winning ends (columns 3 or 8) or lose next move.
    var board = emptyBoard()
    (4...7).forEach { board[GomokuEngine.cellAt(row: 7, col: $0)] = .black }
    board[GomokuEngine.cellAt(row: 2, col: 2)] = .white

    let ends = Set([GomokuEngine.cellAt(row: 7, col: 3), GomokuEngine.cellAt(row: 7, col: 8)])
    for level in [GomokuBotLevel.medium, .hard] {
      let move = GomokuEngine.findBotMove(board: board, stone: .white, level: level, random: { 0 })
      XCTAssertNotNil(move)
      XCTAssertTrue(ends.contains(move!), "\(level) bot must block the open four, played \(move!)")
    }
  }

  func testBotCompletesItsOwnFive() {
    // White has four on column 5, rows 4-7 (open at rows 3 and 8), while
    // black also threatens with four on row 0. Winning now beats blocking.
    var board = emptyBoard()
    (4...7).forEach { board[GomokuEngine.cellAt(row: $0, col: 5)] = .white }
    (0...3).forEach { board[GomokuEngine.cellAt(row: 0, col: $0)] = .black }

    let completions = Set([GomokuEngine.cellAt(row: 3, col: 5), GomokuEngine.cellAt(row: 8, col: 5)])
    for level in GomokuBotLevel.allCases {
      let move = GomokuEngine.findBotMove(board: board, stone: .white, level: level, random: { 0 })
      XCTAssertNotNil(move)
      XCTAssertTrue(
        completions.contains(move!),
        "\(level) bot must complete its five, played \(move!)"
      )
      var next = board
      next[move!] = .white
      XCTAssertNotNil(GomokuEngine.findWinLine(board: next, cell: move!))
    }
  }

  func testGameFlowTracksTurnsWinnerAndUndo() {
    let engine = GomokuEngine(level: .easy, random: { 0 })
    XCTAssertEqual(engine.turn, .black)

    // Black builds a horizontal five while white wanders on row 14.
    for offset in 0..<4 {
      XCTAssertTrue(engine.place(cell: GomokuEngine.cellAt(row: 7, col: 3 + offset)))
      XCTAssertTrue(engine.place(cell: GomokuEngine.cellAt(row: 14, col: offset)))
    }
    XCTAssertNil(engine.winner)

    // Undo reverts the last human+bot pair (even move count drops two).
    engine.undoPair()
    XCTAssertEqual(engine.moves.count, 6)
    XCTAssertEqual(engine.turn, .black)

    XCTAssertTrue(engine.place(cell: GomokuEngine.cellAt(row: 7, col: 6)))
    XCTAssertTrue(engine.place(cell: GomokuEngine.cellAt(row: 14, col: 3)))
    XCTAssertTrue(engine.place(cell: GomokuEngine.cellAt(row: 7, col: 7)))

    XCTAssertEqual(engine.winner, .black)
    XCTAssertTrue(engine.isOver)
    XCTAssertFalse(engine.isDraw)
    // A finished game rejects further placements.
    XCTAssertFalse(engine.place(cell: GomokuEngine.cellAt(row: 0, col: 0)))
  }

  // MARK: - Helpers

  private func emptyBoard() -> [GomokuStone?] {
    Array(repeating: nil, count: GomokuEngine.cellCount)
  }
}
