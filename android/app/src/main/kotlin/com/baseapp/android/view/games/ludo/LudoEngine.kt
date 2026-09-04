package com.baseapp.android.view.games.ludo

import kotlin.random.Random

/** Who controls a seat. [OFF] seats have no tokens and are skipped entirely. */
enum class LudoSeatKind { HUMAN, BOT, OFF }

/**
 * A cell on the classic 15x15 cross-shaped grid (col/row, 0-based).
 * Fractional coordinates are used for the yard resting spots.
 */
data class LudoCell(val col: Float, val row: Float)

/** One legal move for the current seat with the pending roll. */
data class LudoMove(
    /** Token index (0..3) within the current seat. */
    val token: Int,
    /** Progress before the move (-1 when exiting the yard). */
    val from: Int,
    /** Progress after the move. */
    val to: Int,
    /** True when the landing square holds capturable opponent tokens. */
    val captures: Boolean,
)

/**
 * Full match state. Immutable so Compose state updates are automatic and the
 * engine functions stay pure, exactly like the web engine.
 */
data class LudoGameState(
    /** Who controls each seat, in red/green/yellow/blue order. Fixed per match. */
    val seats: List<LudoSeatKind>,
    /** Progress of each token: tokens[seat][token], -1..56 (see [LudoEngine]). */
    val tokens: List<List<Int>>,
    /** Seat whose turn it is. */
    val current: Int,
    /** The pending roll awaiting a move choice, or null awaiting a roll. */
    val dice: Int?,
    /** Consecutive sixes rolled this turn (3 forfeits the turn). */
    val sixStreak: Int,
    /** Seats in finishing order; play continues for placings after a win. */
    val placings: List<Int>,
    /** True once every placing is decided. */
    val over: Boolean,
)

/**
 * Pure Kotlin port of the web Ludo rules engine
 * (`web/app/src/View/Games/Ludo/engine.ts`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `LudoGameView`. The constants
 * and rules must stay in sync with the web engine (and the iOS
 * `LudoEngine.swift`) — change them together.
 *
 * Token positions are stored as "progress" along the seat's own path:
 * ```
 *   -1        in the yard (home base), waiting for a six
 *   0..50     on the 52-square shared ring, at ring index (start + p) % 52
 *   51..55    in the seat's private 5-square home column
 *   56        home — the token has finished
 * ```
 *
 * Randomness (the bot's tie-break jitter) goes through an injected lambda so
 * tests can make move selection fully deterministic; dice values are
 * supplied by the caller for the same reason.
 */
object LudoEngine {
    // Rules constants — must stay in sync with the web engine.ts.
    const val SEAT_COUNT = 4
    const val TOKENS_PER_SEAT = 4
    const val RING_SIZE = 52

    /** Last progress value that is still on the shared ring. */
    const val RING_LAST_PROGRESS = 50

    /** First progress value inside the private home column. */
    const val HOME_COLUMN_START = 51

    /** Progress of a finished token; home-column moves need an exact roll. */
    const val HOME_PROGRESS = 56

    /** Rolling this exits the yard and grants an extra roll. */
    const val EXIT_ROLL = 6

    /** Rolling this many sixes in a row forfeits the turn. */
    const val SIX_STREAK_LIMIT = 3

    /** Ring index of each seat's start square (also its yard exit). */
    val START_RING_INDEX = listOf(0, 13, 26, 39)

    /**
     * The 8 safe squares where captures never happen: the 4 start squares
     * plus the 4 star squares 8 ahead of each start.
     */
    val SAFE_RING_INDEXES = setOf(0, 8, 13, 21, 26, 34, 39, 47)

    /** Star squares only (safe squares that are not a seat's start). */
    val STAR_RING_INDEXES = setOf(8, 21, 34, 47)

    // Bot heuristic weights — must stay in sync with the web engine.ts.
    private const val BOT_CAPTURE_SCORE = 1000.0
    private const val BOT_ESCAPE_SCORE = 600.0
    private const val BOT_EXIT_SCORE = 400.0
    private const val BOT_FINISH_BONUS = 160.0
    private const val BOT_SAFE_LANDING_BONUS = 90.0
    private const val BOT_THREATENED_LANDING_PENALTY = 140.0
    private const val BOT_RANDOM_JITTER = 45.0

    // -----------------------------------------------------------------------
    // Board topology (shared with the renderer)
    // -----------------------------------------------------------------------

    /**
     * Grid cell of every ring index (52 entries; index 0 is red's start,
     * running clockwise). Mirrors the web `RING_CELLS`.
     */
    val RING_CELLS: List<LudoCell> = buildList {
        for (col in 1..5) add(LudoCell(col.toFloat(), 6f))
        for (row in 5 downTo 0) add(LudoCell(6f, row.toFloat()))
        add(LudoCell(7f, 0f))
        for (row in 0..5) add(LudoCell(8f, row.toFloat()))
        for (col in 9..14) add(LudoCell(col.toFloat(), 6f))
        add(LudoCell(14f, 7f))
        for (col in 14 downTo 9) add(LudoCell(col.toFloat(), 8f))
        for (row in 9..14) add(LudoCell(8f, row.toFloat()))
        add(LudoCell(7f, 14f))
        for (row in 14 downTo 9) add(LudoCell(6f, row.toFloat()))
        for (col in 5 downTo 0) add(LudoCell(col.toFloat(), 8f))
        add(LudoCell(0f, 7f))
        add(LudoCell(0f, 6f))
    }

    /** Grid origin (top-left) of each seat's 6x6 yard. */
    val YARD_ORIGINS = listOf(
        LudoCell(0f, 0f),
        LudoCell(9f, 0f),
        LudoCell(9f, 9f),
        LudoCell(0f, 9f),
    )

    /** The 5 home-column cells for a seat, ordered from ring exit to center. */
    fun homeColumnCells(seat: Int): List<LudoCell> = when (seat) {
        0 -> (1..5).map { LudoCell(it.toFloat(), 7f) }
        1 -> (1..5).map { LudoCell(7f, it.toFloat()) }
        2 -> (13 downTo 9).map { LudoCell(it.toFloat(), 7f) }
        else -> (13 downTo 9).map { LudoCell(7f, it.toFloat()) }
    }

    /** Resting spots (grid coords) for the 4 tokens inside a seat's yard. */
    fun yardCells(seat: Int): List<LudoCell> {
        val origin = YARD_ORIGINS[seat]
        return listOf(
            LudoCell(origin.col + 1.5f, origin.row + 1.5f),
            LudoCell(origin.col + 3.5f, origin.row + 1.5f),
            LudoCell(origin.col + 1.5f, origin.row + 3.5f),
            LudoCell(origin.col + 3.5f, origin.row + 3.5f),
        )
    }

    /** Ring index a seat's token occupies at ring progress 0..50. */
    fun ringIndex(seat: Int, progress: Int): Int =
        (START_RING_INDEX[seat] + progress) % RING_SIZE

    // -----------------------------------------------------------------------
    // Turn state machine
    // -----------------------------------------------------------------------

    /** Fresh match: all tokens in their yards, first active seat to roll. */
    fun createGame(seats: List<LudoSeatKind>): LudoGameState = LudoGameState(
        seats = seats,
        tokens = seats.map { List(TOKENS_PER_SEAT) { -1 } },
        current = seats.indexOfFirst { it != LudoSeatKind.OFF }.coerceAtLeast(0),
        dice = null,
        sixStreak = 0,
        placings = emptyList(),
        over = false,
    )

    /** True once every token of the seat has reached home. */
    fun isSeatFinished(state: LudoGameState, seat: Int): Boolean =
        state.tokens[seat].all { it == HOME_PROGRESS }

    /** Seats that are in the game (not off), in play order. */
    fun activeSeats(state: LudoGameState): List<Int> =
        (0 until SEAT_COUNT).filter { state.seats[it] != LudoSeatKind.OFF }

    /**
     * True when an opponent token on the ring could reach [target] with a
     * single roll (1..6) without overshooting into its own home column. Used
     * by the bot to spot threats; tokens still in yards are ignored.
     */
    fun isRingIndexThreatened(state: LudoGameState, seat: Int, target: Int): Boolean {
        for (other in 0 until SEAT_COUNT) {
            if (other == seat || state.seats[other] == LudoSeatKind.OFF) {
                continue
            }
            for (progress in state.tokens[other]) {
                if (progress < 0 || progress > RING_LAST_PROGRESS) {
                    continue
                }
                val distance = (target - ringIndex(other, progress) + RING_SIZE) % RING_SIZE
                if (distance in 1..6 && progress + distance <= RING_LAST_PROGRESS) {
                    return true
                }
            }
        }
        return false
    }

    private fun capturableAt(state: LudoGameState, seat: Int, target: Int): Boolean {
        if (target in SAFE_RING_INDEXES) {
            return false
        }
        for (other in 0 until SEAT_COUNT) {
            if (other == seat) {
                continue
            }
            for (progress in state.tokens[other]) {
                if (progress in 0..RING_LAST_PROGRESS && ringIndex(other, progress) == target) {
                    return true
                }
            }
        }
        return false
    }

    /** Every move the current seat may play with the pending roll (state.dice). */
    fun legalMoves(state: LudoGameState): List<LudoMove> {
        val dice = state.dice ?: return emptyList()
        if (state.over) {
            return emptyList()
        }
        val seat = state.current
        val moves = mutableListOf<LudoMove>()
        state.tokens[seat].forEachIndexed { token, from ->
            if (from == HOME_PROGRESS) {
                return@forEachIndexed
            }
            if (from == -1) {
                // Exiting the yard requires a six; the start square is safe,
                // so an exit never captures.
                if (dice == EXIT_ROLL) {
                    moves.add(LudoMove(token = token, from = from, to = 0, captures = false))
                }
                return@forEachIndexed
            }
            val to = from + dice
            // Home needs an exact roll; overshooting keeps the token in place.
            if (to > HOME_PROGRESS) {
                return@forEachIndexed
            }
            val captures = to <= RING_LAST_PROGRESS && capturableAt(state, seat, ringIndex(seat, to))
            moves.add(LudoMove(token = token, from = from, to = to, captures = captures))
        }
        return moves
    }

    /** Advances to the next active, unfinished seat and awaits its roll. */
    private fun advanceTurn(state: LudoGameState): LudoGameState {
        var next = state.current
        for (step in 1..SEAT_COUNT) {
            val candidate = (state.current + step) % SEAT_COUNT
            if (state.seats[candidate] != LudoSeatKind.OFF && !isSeatFinished(state, candidate)) {
                next = candidate
                break
            }
        }
        return state.copy(current = next, dice = null, sixStreak = 0)
    }

    /**
     * Applies a die roll for the current seat. The result either awaits a
     * move choice (dice set, same seat), grants a re-roll (six with no legal
     * move: dice null, same seat), or passes the turn (no legal move, or the
     * three-sixes forfeit: dice null, next seat).
     */
    fun applyRoll(state: LudoGameState, value: Int): LudoGameState {
        if (state.over || state.dice != null) {
            return state
        }
        val sixStreak = if (value == EXIT_ROLL) state.sixStreak + 1 else 0
        if (sixStreak >= SIX_STREAK_LIMIT) {
            // Third six in a row: the roll is void and the turn is forfeited.
            return advanceTurn(state)
        }
        val pending = state.copy(dice = value, sixStreak = sixStreak)
        if (legalMoves(pending).isEmpty()) {
            // A six still earns a re-roll even when nothing can move.
            if (value == EXIT_ROLL) {
                return pending.copy(dice = null)
            }
            return advanceTurn(pending)
        }
        return pending
    }

    /**
     * Plays one of the current legal moves (by token index), resolving
     * captures, finish detection, and the next turn. A six keeps the turn
     * (extra roll); anything else passes it. Pure — the input is untouched.
     */
    fun applyMove(state: LudoGameState, token: Int): LudoGameState {
        val move = legalMoves(state).firstOrNull { it.token == token } ?: return state
        val seat = state.current
        val tokens = state.tokens.map { it.toMutableList() }
        tokens[seat][move.token] = move.to

        // Capture: landing on opponents outside the 8 safe squares sends
        // every opponent token on that square back to its yard.
        if (move.to <= RING_LAST_PROGRESS) {
            val landing = ringIndex(seat, move.to)
            if (landing !in SAFE_RING_INDEXES) {
                for (other in 0 until SEAT_COUNT) {
                    if (other == seat) {
                        continue
                    }
                    for (index in tokens[other].indices) {
                        val progress = tokens[other][index]
                        if (progress in 0..RING_LAST_PROGRESS && ringIndex(other, progress) == landing) {
                            tokens[other][index] = -1
                        }
                    }
                }
            }
        }

        var next = state.copy(tokens = tokens.map { it.toList() }, dice = null)

        // Placings: a seat that just brought its last token home is recorded,
        // and when only one racer remains it takes the final placing.
        if (isSeatFinished(next, seat) && seat !in next.placings) {
            next = next.copy(placings = next.placings + seat)
        }
        val remaining = activeSeats(next).filter { !isSeatFinished(next, it) }
        if (remaining.size <= 1) {
            return next.copy(placings = next.placings + remaining, over = true, sixStreak = 0)
        }

        // A six grants an extra roll — unless the roller just finished.
        if (state.dice == EXIT_ROLL && !isSeatFinished(next, seat)) {
            return next
        }
        return advanceTurn(next)
    }

    // -----------------------------------------------------------------------
    // Bot
    // -----------------------------------------------------------------------

    /**
     * Heuristic bot: capture when possible, escape a threatened token, bring
     * a token out on a six, otherwise advance the leader while avoiding
     * threatened landing squares. [random] (0..1) adds a jitter so bots are
     * not identical; inject a fixed value for deterministic tests. Returns
     * the token to move, or null when there is no legal move.
     */
    fun chooseBotMove(
        state: LudoGameState,
        random: () -> Double = { Random.nextDouble() },
    ): Int? {
        val moves = legalMoves(state)
        if (moves.isEmpty()) {
            return null
        }
        val seat = state.current
        var bestToken = moves.first().token
        var bestScore = Double.NEGATIVE_INFINITY
        for (move in moves) {
            // Advancing the most developed token is the baseline preference.
            var score = move.to.toDouble()
            if (move.captures) {
                score += BOT_CAPTURE_SCORE
            }
            if (move.from in 0..RING_LAST_PROGRESS) {
                val fromRing = ringIndex(seat, move.from)
                if (fromRing !in SAFE_RING_INDEXES && isRingIndexThreatened(state, seat, fromRing)) {
                    score += BOT_ESCAPE_SCORE
                }
            }
            if (move.from == -1) {
                score += BOT_EXIT_SCORE
            }
            if (move.to == HOME_PROGRESS) {
                score += BOT_FINISH_BONUS
            }
            if (move.to <= RING_LAST_PROGRESS) {
                val landing = ringIndex(seat, move.to)
                if (landing in SAFE_RING_INDEXES) {
                    score += BOT_SAFE_LANDING_BONUS
                } else if (isRingIndexThreatened(state, seat, landing)) {
                    score -= BOT_THREATENED_LANDING_PENALTY
                }
            }
            score += random() * BOT_RANDOM_JITTER
            if (score > bestScore) {
                bestScore = score
                bestToken = move.token
            }
        }
        return bestToken
    }
}
