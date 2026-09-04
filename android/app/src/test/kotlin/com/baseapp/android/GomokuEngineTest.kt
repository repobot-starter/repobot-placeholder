package com.baseapp.android

import com.baseapp.android.view.games.gomoku.GomokuEngine
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure Gomoku engine against the web engine.ts rules it
 * mirrors: win detection on all four axes, freestyle overlines, draw on a
 * full board, and the bot's must-block / must-win behavior. Randomness is
 * only used to break ties between equally scored cells; a seeded [Random]
 * keeps every run deterministic.
 */
class GomokuEngineTest {
    private fun emptyBoard(): Array<GomokuEngine.Stone?> = arrayOfNulls(GomokuEngine.CELL_COUNT)

    private fun rng(): Random = Random(seed = 7)

    @Test
    fun horizontalWinIsDetected() {
        val board = emptyBoard()
        // Black stones on row 7, columns 3-7.
        val line = (3..7).map { GomokuEngine.cellAt(7, it) }
        line.forEach { board[it] = GomokuEngine.Stone.BLACK }

        // Any stone of the run finds the same sorted five.
        assertEquals(line, GomokuEngine.findWinLine(board, line[2]))
        assertEquals(line, GomokuEngine.findWinLine(board, line[0]))
    }

    @Test
    fun verticalWinIsDetected() {
        val board = emptyBoard()
        val line = (2..6).map { GomokuEngine.cellAt(it, 10) }
        line.forEach { board[it] = GomokuEngine.Stone.WHITE }

        assertEquals(line, GomokuEngine.findWinLine(board, line[4]))
    }

    @Test
    fun diagonalWinsAreDetectedBothWays() {
        // Down-right diagonal.
        val board = emptyBoard()
        val diagonal = (0 until 5).map { GomokuEngine.cellAt(4 + it, 4 + it) }
        diagonal.forEach { board[it] = GomokuEngine.Stone.BLACK }
        assertEquals(diagonal.sorted(), GomokuEngine.findWinLine(board, diagonal[2]))

        // Down-left (anti) diagonal.
        val antiBoard = emptyBoard()
        val anti = (0 until 5).map { GomokuEngine.cellAt(3 + it, 9 - it) }
        anti.forEach { antiBoard[it] = GomokuEngine.Stone.WHITE }
        assertEquals(anti.sorted(), GomokuEngine.findWinLine(antiBoard, anti[0]))
    }

    @Test
    fun fourInARowIsNotAWinButSixIs() {
        val board = emptyBoard()
        (3..6).forEach { board[GomokuEngine.cellAt(7, it)] = GomokuEngine.Stone.BLACK }
        assertNull(GomokuEngine.findWinLine(board, GomokuEngine.cellAt(7, 4)))

        // Freestyle rules: six or more in a row still wins.
        val overline = emptyBoard()
        val line = (3..8).map { GomokuEngine.cellAt(0, it) }
        line.forEach { overline[it] = GomokuEngine.Stone.BLACK }
        assertEquals(line, GomokuEngine.findWinLine(overline, line[3]))
    }

    @Test
    fun fullBoardWithNoFiveIsADraw() {
        // Tile the board so no color ever runs five: color by ((col + 2*row)
        // mod 4) gives maximum runs of two on every axis.
        val board = emptyBoard()
        for (row in 0 until GomokuEngine.BOARD_SIZE) {
            for (col in 0 until GomokuEngine.BOARD_SIZE) {
                board[GomokuEngine.cellAt(row, col)] =
                    if ((col + 2 * row) % 4 < 2) GomokuEngine.Stone.BLACK else GomokuEngine.Stone.WHITE
            }
        }

        assertTrue(GomokuEngine.isBoardFull(board))
        for (cell in 0 until GomokuEngine.CELL_COUNT) {
            assertNull(GomokuEngine.findWinLine(board, cell))
        }
        // A full board offers the bot no move.
        assertNull(GomokuEngine.findBotMove(board, GomokuEngine.Stone.BLACK, GomokuEngine.BotLevel.HARD, rng()))
    }

    @Test
    fun botBlocksAnOpenFour() {
        // Black has an open four on row 7, columns 4-7: white must take one
        // of the two winning ends (columns 3 or 8) or lose next move.
        val board = emptyBoard()
        (4..7).forEach { board[GomokuEngine.cellAt(7, it)] = GomokuEngine.Stone.BLACK }
        board[GomokuEngine.cellAt(2, 2)] = GomokuEngine.Stone.WHITE

        val ends = setOf(GomokuEngine.cellAt(7, 3), GomokuEngine.cellAt(7, 8))
        for (level in listOf(GomokuEngine.BotLevel.MEDIUM, GomokuEngine.BotLevel.HARD)) {
            val move = GomokuEngine.findBotMove(board, GomokuEngine.Stone.WHITE, level, rng())
            assertTrue("$level bot must block the open four, played $move", move in ends)
        }
    }

    @Test
    fun botCompletesItsOwnFive() {
        // White has four on column 5, rows 4-7 (open at rows 3 and 8), while
        // black also threatens with four on row 0. Winning now beats blocking.
        val board = emptyBoard()
        (4..7).forEach { board[GomokuEngine.cellAt(it, 5)] = GomokuEngine.Stone.WHITE }
        (0..3).forEach { board[GomokuEngine.cellAt(0, it)] = GomokuEngine.Stone.BLACK }

        val completions = setOf(GomokuEngine.cellAt(3, 5), GomokuEngine.cellAt(8, 5))
        for (level in GomokuEngine.BotLevel.entries) {
            val move = GomokuEngine.findBotMove(board, GomokuEngine.Stone.WHITE, level, rng())
            assertTrue("$level bot must complete its five, played $move", move in completions)
            val next = board.copyOf()
            next[move!!] = GomokuEngine.Stone.WHITE
            assertEquals(GomokuEngine.Stone.WHITE, next[GomokuEngine.findWinLine(next, move)!!.first()])
        }
    }

    @Test
    fun gameFlowTracksTurnsWinnerAndUndo() {
        val engine = GomokuEngine(level = GomokuEngine.BotLevel.EASY, random = rng())
        assertEquals(GomokuEngine.Stone.BLACK, engine.turn)

        // Black builds a horizontal five while white wanders on row 14.
        for (offset in 0 until 4) {
            assertTrue(engine.place(GomokuEngine.cellAt(7, 3 + offset)))
            assertTrue(engine.place(GomokuEngine.cellAt(14, offset)))
        }
        assertNull(engine.winner)

        // Undo reverts the last human+bot pair (even move count drops two).
        engine.undoPair()
        assertEquals(6, engine.moveCount)
        assertEquals(GomokuEngine.Stone.BLACK, engine.turn)

        assertTrue(engine.place(GomokuEngine.cellAt(7, 6)))
        assertTrue(engine.place(GomokuEngine.cellAt(14, 3)))
        assertTrue(engine.place(GomokuEngine.cellAt(7, 7)))

        assertEquals(GomokuEngine.Stone.BLACK, engine.winner)
        assertTrue(engine.isOver)
        assertFalse(engine.isDraw)
        // A finished game rejects further placements.
        assertFalse(engine.place(GomokuEngine.cellAt(0, 0)))
    }
}
