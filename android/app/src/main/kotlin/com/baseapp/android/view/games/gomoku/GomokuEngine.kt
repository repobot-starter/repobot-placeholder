package com.baseapp.android.view.games.gomoku

import kotlin.math.max
import kotlin.random.Random

/**
 * Pure Kotlin port of the web Gomoku engine
 * (`web/app/src/View/Games/Gomoku/engine.ts`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `GomokuGameView`.
 *
 * The pattern weights ([PatternScores]), the 0.9 defense discount, the
 * candidate radius of 2, and the three bot policies must stay in sync with
 * the web engine so the bot feels identical on every platform.
 *
 * Randomness (tie-breaking between equally good cells) goes through an
 * injected [Random] so tests can make the bot fully deterministic.
 */
class GomokuEngine(
    var level: BotLevel = BotLevel.MEDIUM,
    private val random: Random = Random.Default,
) {
    /** Stone colors. Black always moves first, matching the web game. */
    enum class Stone {
        BLACK,
        WHITE;

        val opposite: Stone
            get() = if (this == BLACK) WHITE else BLACK
    }

    /**
     * Bot levels — the same three policies as the web `findBotMove`:
     * - EASY: greedy on its own attack only (it never blocks)
     * - MEDIUM: full pattern scoring for attack and discounted defense
     * - HARD: immediate win/block detection, then a 2-ply minimax over the
     *   top candidates where each move is charged with the opponent's best
     *   evaluator reply
     */
    enum class BotLevel { EASY, MEDIUM, HARD }

    /**
     * Heuristic value of a line reaching a stone count with a given number
     * of open ends — the web `PATTERN_SCORES` table verbatim.
     */
    object PatternScores {
        const val FIVE = 1_000_000.0
        const val OPEN_FOUR = 100_000.0
        const val CLOSED_FOUR = 12_000.0
        const val OPEN_THREE = 8_000.0
        const val CLOSED_THREE = 600.0
        const val OPEN_TWO = 400.0
        const val CLOSED_TWO = 60.0
        const val OPEN_ONE = 20.0
        const val CLOSED_ONE = 4.0
    }

    /** Board state; index = row * 15 + col, row 0 at the top, null = empty. */
    val board: Array<Stone?> = arrayOfNulls(CELL_COUNT)

    /** Cells in play order; the board derives from it so undo is just popping. */
    private val moves = mutableListOf<Int>()

    val moveCount: Int
        get() = moves.size

    val turn: Stone
        get() = if (moves.size % 2 == 0) Stone.BLACK else Stone.WHITE

    val lastMove: Int?
        get() = moves.lastOrNull()

    /** The completed five-plus through the last move, or null while play continues. */
    val winLine: List<Int>?
        get() = lastMove?.let { findWinLine(board, it) }

    val winner: Stone?
        get() = winLine?.firstOrNull()?.let { board[it] }

    val isDraw: Boolean
        get() = winner == null && board.none { it == null }

    val isOver: Boolean
        get() = winner != null || isDraw

    fun newGame() {
        board.fill(null)
        moves.clear()
    }

    /**
     * Places the current turn's stone. Returns false when the cell is taken
     * or the game is over (the tap is ignored, like a click on the web board).
     */
    fun place(cell: Int): Boolean {
        if (isOver || board[cell] != null) {
            return false
        }
        board[cell] = turn
        moves.add(cell)
        return true
    }

    /**
     * Picks and plays the bot's stone for the side to move. Returns the cell,
     * or null when the game is already over or the board is full.
     */
    fun playBotMove(): Int? {
        if (isOver) {
            return null
        }
        val cell = findBotMove(board, turn, level, random) ?: return null
        place(cell)
        return cell
    }

    /**
     * Reverts a full human+bot pair when the bot (white) has replied, so it
     * is the human's turn again — the same policy as the web page's Undo.
     */
    fun undoPair() {
        val drop = if (moves.size % 2 == 0 && moves.size >= 2) 2 else 1
        repeat(minOf(drop, moves.size)) {
            board[moves.removeAt(moves.size - 1)] = null
        }
    }

    companion object {
        const val BOARD_SIZE = 15
        const val CELL_COUNT = BOARD_SIZE * BOARD_SIZE

        /** Defense is worth slightly less than attack (web `DEFENSE_WEIGHT`). */
        const val DEFENSE_WEIGHT = 0.9

        /** Chebyshev distance the bots consider around stones (web `CANDIDATE_RADIUS`). */
        const val CANDIDATE_RADIUS = 2

        /** Top-ranked candidates the hard bot expands (web `HARD_CANDIDATE_LIMIT`). */
        const val HARD_CANDIDATE_LIMIT = 12

        /** The four line axes as (dRow, dCol); the reverse of each is walked separately. */
        private val DIRECTIONS = listOf(0 to 1, 1 to 0, 1 to 1, 1 to -1)

        fun rowOf(cell: Int): Int = cell / BOARD_SIZE

        fun colOf(cell: Int): Int = cell % BOARD_SIZE

        fun cellAt(row: Int, col: Int): Int = row * BOARD_SIZE + col

        fun isBoardFull(board: Array<Stone?>): Boolean = board.none { it == null }

        private fun inBounds(row: Int, col: Int): Boolean =
            row in 0 until BOARD_SIZE && col in 0 until BOARD_SIZE

        /**
         * The completed run of five or more through the stone at [cell], as
         * sorted cell indices, or null when that stone is not part of a five.
         * Only lines through [cell] are checked, so call it with the last
         * move played.
         */
        fun findWinLine(board: Array<Stone?>, cell: Int): List<Int>? {
            val stone = board[cell] ?: return null
            for ((dRow, dCol) in DIRECTIONS) {
                val line = mutableListOf(cell)
                for (sign in intArrayOf(1, -1)) {
                    var row = rowOf(cell) + dRow * sign
                    var col = colOf(cell) + dCol * sign
                    while (inBounds(row, col) && board[cellAt(row, col)] == stone) {
                        line.add(cellAt(row, col))
                        row += dRow * sign
                        col += dCol * sign
                    }
                }
                if (line.size >= 5) {
                    return line.sorted()
                }
            }
            return null
        }

        /**
         * Contiguous same-color stones walking away from the cell, plus
         * whether the cell just past the run is empty (the line can grow).
         */
        private fun runFrom(
            board: Array<Stone?>,
            cell: Int,
            stone: Stone,
            dRow: Int,
            dCol: Int,
        ): Pair<Int, Boolean> {
            var row = rowOf(cell) + dRow
            var col = colOf(cell) + dCol
            var count = 0
            while (inBounds(row, col) && board[cellAt(row, col)] == stone) {
                count += 1
                row += dRow
                col += dCol
            }
            return count to (inBounds(row, col) && board[cellAt(row, col)] == null)
        }

        private fun lineScore(count: Int, openEnds: Int): Double {
            if (count >= 5) {
                return PatternScores.FIVE
            }
            if (openEnds == 0) {
                return 0.0
            }
            return when (count) {
                4 -> if (openEnds == 2) PatternScores.OPEN_FOUR else PatternScores.CLOSED_FOUR
                3 -> if (openEnds == 2) PatternScores.OPEN_THREE else PatternScores.CLOSED_THREE
                2 -> if (openEnds == 2) PatternScores.OPEN_TWO else PatternScores.CLOSED_TWO
                else -> if (openEnds == 2) PatternScores.OPEN_ONE else PatternScores.CLOSED_ONE
            }
        }

        /**
         * Pattern value of placing [stone] on the empty [cell]: the sum over
         * the four axes of the score of the line that placement would create.
         */
        fun cellScore(board: Array<Stone?>, cell: Int, stone: Stone): Double {
            var total = 0.0
            for ((dRow, dCol) in DIRECTIONS) {
                val (forwardCount, forwardOpen) = runFrom(board, cell, stone, dRow, dCol)
                val (backwardCount, backwardOpen) = runFrom(board, cell, stone, -dRow, -dCol)
                total += lineScore(
                    count = 1 + forwardCount + backwardCount,
                    openEnds = (if (forwardOpen) 1 else 0) + (if (backwardOpen) 1 else 0),
                )
            }
            return total
        }

        /** True when placing [stone] on the empty [cell] makes five or more in a row. */
        fun makesFive(board: Array<Stone?>, cell: Int, stone: Stone): Boolean {
            for ((dRow, dCol) in DIRECTIONS) {
                val (forwardCount, _) = runFrom(board, cell, stone, dRow, dCol)
                val (backwardCount, _) = runFrom(board, cell, stone, -dRow, -dCol)
                if (1 + forwardCount + backwardCount >= 5) {
                    return true
                }
            }
            return false
        }

        /**
         * Empty cells worth considering: everything within [CANDIDATE_RADIUS]
         * of an existing stone. An empty board yields just the center.
         */
        fun candidateCells(board: Array<Stone?>): List<Int> {
            val near = BooleanArray(CELL_COUNT)
            var hasStone = false
            for (cell in 0 until CELL_COUNT) {
                if (board[cell] == null) {
                    continue
                }
                hasStone = true
                val row = rowOf(cell)
                val col = colOf(cell)
                for (dRow in -CANDIDATE_RADIUS..CANDIDATE_RADIUS) {
                    for (dCol in -CANDIDATE_RADIUS..CANDIDATE_RADIUS) {
                        if (inBounds(row + dRow, col + dCol)) {
                            near[cellAt(row + dRow, col + dCol)] = true
                        }
                    }
                }
            }
            if (!hasStone) {
                return listOf(cellAt(BOARD_SIZE / 2, BOARD_SIZE / 2))
            }
            return (0 until CELL_COUNT).filter { near[it] && board[it] == null }
        }

        /** Every empty cell where [stone] would immediately complete five in a row. */
        fun winningCells(board: Array<Stone?>, stone: Stone): List<Int> =
            candidateCells(board).filter { makesFive(board, it, stone) }

        /** Attack + discounted defense: how much a cell is worth to [stone] right now. */
        private fun combinedScore(board: Array<Stone?>, cell: Int, stone: Stone): Double =
            cellScore(board, cell, stone) + DEFENSE_WEIGHT * cellScore(board, cell, stone.opposite)

        /** Highest-scoring cells (all ties), so the caller can pick one at random. */
        private fun bestCells(cells: List<Int>, score: (Int) -> Double): List<Int> {
            val best = mutableListOf<Int>()
            var bestScore = Double.NEGATIVE_INFINITY
            for (cell in cells) {
                val value = score(cell)
                if (value > bestScore) {
                    bestScore = value
                    best.clear()
                    best.add(cell)
                } else if (value == bestScore) {
                    best.add(cell)
                }
            }
            return best
        }

        /**
         * Picks the bot's cell for [stone] on the current board, or null when
         * the board is full. See [BotLevel] for the three policies.
         */
        fun findBotMove(
            board: Array<Stone?>,
            stone: Stone,
            level: BotLevel,
            random: Random = Random.Default,
        ): Int? {
            val candidates = candidateCells(board)
            if (candidates.isEmpty()) {
                return null
            }
            return when (level) {
                BotLevel.EASY ->
                    bestCells(candidates) { cellScore(board, it, stone) }.random(random)

                BotLevel.MEDIUM ->
                    bestCells(candidates) { combinedScore(board, it, stone) }.random(random)

                BotLevel.HARD -> {
                    val wins = winningCells(board, stone)
                    if (wins.isNotEmpty()) {
                        return wins.random(random)
                    }
                    val blocks = winningCells(board, stone.opposite)
                    if (blocks.isNotEmpty()) {
                        return blocks.random(random)
                    }

                    val ranked = candidates
                        .map { cell -> cell to combinedScore(board, cell, stone) }
                        .sortedByDescending { it.second }
                        .take(HARD_CANDIDATE_LIMIT)

                    val valueOf = HashMap<Int, Double>()
                    for ((cell, score) in ranked) {
                        val next = board.copyOf()
                        next[cell] = stone
                        var enemyBest = 0.0
                        for (reply in candidateCells(next)) {
                            enemyBest = max(enemyBest, combinedScore(next, reply, stone.opposite))
                        }
                        valueOf[cell] = score - DEFENSE_WEIGHT * enemyBest
                    }
                    bestCells(ranked.map { it.first }) {
                        valueOf[it] ?: Double.NEGATIVE_INFINITY
                    }.random(random)
                }
            }
        }
    }
}
