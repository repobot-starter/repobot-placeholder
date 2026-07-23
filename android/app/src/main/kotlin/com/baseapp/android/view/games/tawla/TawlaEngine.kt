package com.baseapp.android.view.games.tawla

import kotlin.math.max
import kotlin.random.Random

/**
 * Pure Kotlin port of the web tawla (backgammon) engine
 * (`web/app/src/View/Games/Tawla/engine.ts`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `TawlaGameView`.
 *
 * Move legality (bar entry, blot hitting, exact-or-higher bear-off, the
 * forced-move rules: play as many dice as possible and, when only one can be
 * played, the higher), win detection (single/gammon/backgammon), the
 * heuristic weights, and the three bot levels must stay in lockstep with the
 * web implementation. Randomness (dice, easy-bot noise) goes through an
 * injected [Random] so tests can be deterministic.
 *
 * Board representation: `points[i]` is the signed checker count on board
 * index `i` (positive = white, negative = black). Index 0 is White's 1-point
 * (the deepest point of White's home board), index 23 is White's 24-point.
 * White races 23 -> 0, Black races 0 -> 23 — identical to the web `Position`.
 */
object TawlaEngine {
    /** [Move.from] when a checker enters from the bar. */
    const val BAR = -1

    /** [Move.to] when a checker bears off the board. */
    const val OFF = -2

    const val CHECKERS_PER_PLAYER = 15

    /** First to this many points wins the match (gammons 2, backgammons 3). */
    const val MATCH_TARGET = 5

    // Heuristic weights — must stay in sync with the web `HEURISTIC` table.
    const val HEURISTIC_PIP = 1.0
    const val HEURISTIC_OFF = 12.0
    const val HEURISTIC_POINT = 4.0
    const val HEURISTIC_HOME_POINT = 6.0
    const val HEURISTIC_BLOT = 2.0
    const val HEURISTIC_BLOT_SHOT = 3.0
    const val HEURISTIC_EASY_NOISE = 20.0
    const val HEURISTIC_HIT_BONUS = 15.0
    const val HEURISTIC_PRIME_BONUS = 5.0

    /** Safety valve for pathological double rolls, same cap as the web engine. */
    private const val SEQUENCE_CAP = 20000

    enum class Player {
        WHITE,
        BLACK,
        ;

        val opponent: Player
            get() = if (this == WHITE) BLACK else WHITE
    }

    enum class BotLevel { EASY, MEDIUM, HARD }

    /** Terminal result kinds: single (1 point), gammon (2), backgammon (3). */
    enum class ResultKind { SINGLE, GAMMON, BACKGAMMON }

    /**
     * One checker move with the die that paid for it. [from] is a board
     * index or [BAR]; [to] is a board index or [OFF]. [hit] is true when the
     * move lands on an enemy blot and sends it to the bar.
     */
    data class Move(val from: Int, val to: Int, val die: Int, val hit: Boolean)

    /** A complete legal turn: a maximal move sequence and the position after it. */
    data class Turn(val moves: List<Move>, val result: Position)

    data class GameResult(val winner: Player, val points: Int, val kind: ResultKind)

    /** An immutable position; all engine functions return new instances. */
    data class Position(
        val points: List<Int>,
        val whiteBar: Int,
        val blackBar: Int,
        val whiteOff: Int,
        val blackOff: Int,
    ) {
        fun bar(player: Player): Int = if (player == Player.WHITE) whiteBar else blackBar

        fun off(player: Player): Int = if (player == Player.WHITE) whiteOff else blackOff
    }

    /** Standard backgammon starting position. */
    fun initialPosition(): Position {
        val points = IntArray(24)
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
        return Position(points.toList(), 0, 0, 0, 0)
    }

    /** Number of [player]'s checkers on board index [index] (never negative). */
    fun checkersAt(position: Position, player: Player, index: Int): Int {
        val signed = position.points[index]
        return if (player == Player.WHITE) max(0, signed) else max(0, -signed)
    }

    /** True when [index] lies inside [player]'s home board. */
    fun isHomeIndex(player: Player, index: Int): Boolean =
        if (player == Player.WHITE) index <= 5 else index >= 18

    /** Board index a bar checker enters on for a given die. */
    fun entryIndex(player: Player, die: Int): Int =
        if (player == Player.WHITE) 24 - die else die - 1

    /**
     * Pip count: total dice pips [player] still needs to bear everything
     * off. Bar checkers count the full 25-pip trip.
     */
    fun pipCount(position: Position, player: Player): Int {
        var pips = position.bar(player) * 25
        for (index in 0 until 24) {
            val count = checkersAt(position, player, index)
            pips += count * (if (player == Player.WHITE) index + 1 else 24 - index)
        }
        return pips
    }

    /** True when every checker is in the home board (bear-off precondition). */
    fun allInHome(position: Position, player: Player): Boolean {
        if (position.bar(player) > 0) {
            return false
        }
        for (index in 0 until 24) {
            if (checkersAt(position, player, index) > 0 && !isHomeIndex(player, index)) {
                return false
            }
        }
        return true
    }

    /** A point is blocked when the opponent holds it with two or more checkers. */
    private fun isBlocked(position: Position, player: Player, index: Int): Boolean =
        checkersAt(position, player.opponent, index) >= 2

    /** Landing here hits when the opponent has exactly one checker (a blot). */
    private fun landsOnBlot(position: Position, player: Player, index: Int): Boolean =
        checkersAt(position, player.opponent, index) == 1

    /**
     * Every legal single move for one die. Bar checkers must enter first;
     * bearing off requires all checkers home and follows the exact-or-higher
     * rule (a die larger than the point only bears off when no checker sits
     * further back).
     */
    fun legalSingleMoves(position: Position, player: Player, die: Int): List<Move> {
        val moves = mutableListOf<Move>()

        if (position.bar(player) > 0) {
            val to = entryIndex(player, die)
            if (!isBlocked(position, player, to)) {
                moves.add(Move(BAR, to, die, landsOnBlot(position, player, to)))
            }
            return moves
        }

        val canBearOff = allInHome(position, player)
        for (from in 0 until 24) {
            if (checkersAt(position, player, from) == 0) {
                continue
            }
            val to = if (player == Player.WHITE) from - die else from + die
            if (to in 0..23) {
                if (!isBlocked(position, player, to)) {
                    moves.add(Move(from, to, die, landsOnBlot(position, player, to)))
                }
            } else if (canBearOff) {
                // Past the edge: exact roll always bears off; a bigger die only
                // bears off the rearmost checker (none may sit further back).
                val exact = if (player == Player.WHITE) to == -1 else to == 24
                val overshoot = if (player == Player.WHITE) to < -1 else to > 24
                if (exact || (overshoot && !hasCheckerBehind(position, player, from))) {
                    moves.add(Move(from, OFF, die, hit = false))
                }
            }
        }
        return moves
    }

    /** True when [player] has a checker further from bearing off than [from]. */
    private fun hasCheckerBehind(position: Position, player: Player, from: Int): Boolean {
        if (player == Player.WHITE) {
            for (index in from + 1..5) {
                if (checkersAt(position, player, index) > 0) {
                    return true
                }
            }
        } else {
            for (index in 18 until from) {
                if (checkersAt(position, player, index) > 0) {
                    return true
                }
            }
        }
        return false
    }

    /** Applies one move and returns the new position. Pure — input untouched. */
    fun applyMove(position: Position, player: Player, move: Move): Position {
        val points = position.points.toIntArray()
        var whiteBar = position.whiteBar
        var blackBar = position.blackBar
        var whiteOff = position.whiteOff
        var blackOff = position.blackOff
        val sign = if (player == Player.WHITE) 1 else -1

        if (move.from == BAR) {
            if (player == Player.WHITE) whiteBar-- else blackBar--
        } else {
            points[move.from] -= sign
        }

        if (move.to == OFF) {
            if (player == Player.WHITE) whiteOff++ else blackOff++
        } else {
            if (move.hit) {
                points[move.to] = 0
                if (player == Player.WHITE) blackBar++ else whiteBar++
            }
            points[move.to] += sign
        }
        return Position(points.toList(), whiteBar, blackBar, whiteOff, blackOff)
    }

    /** Replays a move sequence from a starting position (used for undo). */
    fun positionAfter(position: Position, player: Player, moves: List<Move>): Position =
        moves.fold(position) { current, move -> applyMove(current, player, move) }

    /**
     * All complete legal turns for a roll. Doubles play the die four times;
     * otherwise both die orders are explored. Only maximal sequences survive
     * (you must play as many dice as possible), and when only a single die
     * can be played the higher one is forced. Empty when fully blocked.
     */
    fun legalTurns(position: Position, player: Player, dice: Pair<Int, Int>): List<Turn> {
        val isDoubles = dice.first == dice.second
        val orders: List<List<Int>> = if (isDoubles) {
            listOf(List(4) { dice.first })
        } else {
            listOf(listOf(dice.first, dice.second), listOf(dice.second, dice.first))
        }

        val sequences = mutableListOf<Turn>()
        val seen = mutableSetOf<String>()
        var maxLength = 0

        fun record(moves: List<Move>, result: Position) {
            if (moves.size < maxLength || sequences.size >= SEQUENCE_CAP) {
                return
            }
            val key = moves.joinToString(",") { "${it.from}>${it.to}#${it.die}" }
            if (!seen.add(key)) {
                return
            }
            maxLength = max(maxLength, moves.size)
            sequences.add(Turn(moves, result))
        }

        fun walk(current: Position, remaining: List<Int>, played: List<Move>) {
            if (remaining.isEmpty()) {
                record(played, current)
                return
            }
            val candidates = legalSingleMoves(current, player, remaining[0])
            if (candidates.isEmpty()) {
                record(played, current)
                return
            }
            val rest = remaining.subList(1, remaining.size)
            for (move in candidates) {
                walk(applyMove(current, player, move), rest, played + move)
            }
        }

        for (order in orders) {
            walk(position, order, emptyList())
        }

        if (maxLength == 0) {
            return emptyList()
        }
        var best = sequences.filter { it.moves.size == maxLength }
        if (maxLength == 1 && !isDoubles) {
            // Forced-die rule: when only one die can be played, the higher wins.
            val higher = max(dice.first, dice.second)
            val higherOnly = best.filter { it.moves[0].die == higher }
            if (higherOnly.isNotEmpty()) {
                best = higherOnly
            }
        }
        return best
    }

    /** Longest maximal turn length (0 when the roll is fully blocked). */
    fun maxTurnLength(turns: List<Turn>): Int = turns.firstOrNull()?.moves?.size ?: 0

    /**
     * The distinct legal next moves after [prefix] has been played this
     * turn. Prefix-matching against the full turn list enforces the
     * forced-move rules move-by-move: a move is only offered if some maximal
     * sequence starts this way, so the player can never strand a playable die.
     */
    fun nextMoves(turns: List<Turn>, prefix: List<Move>): List<Move> {
        val moves = mutableListOf<Move>()
        for (turn in turns) {
            if (turn.moves.size <= prefix.size) {
                continue
            }
            if (turn.moves.subList(0, prefix.size) != prefix) {
                continue
            }
            val candidate = turn.moves[prefix.size]
            if (candidate !in moves) {
                moves.add(candidate)
            }
        }
        return moves
    }

    /**
     * Terminal result of the position, or null while the game continues.
     * Gammon (2 points): the loser has borne off nothing. Backgammon (3):
     * additionally a losing checker sits on the bar or in the winner's home.
     */
    fun winResult(position: Position): GameResult? {
        for (winner in Player.entries) {
            if (position.off(winner) < CHECKERS_PER_PLAYER) {
                continue
            }
            val loser = winner.opponent
            if (position.off(loser) > 0) {
                return GameResult(winner, 1, ResultKind.SINGLE)
            }
            var inWinnerHome = position.bar(loser) > 0
            for (index in 0 until 24) {
                if (isHomeIndex(winner, index) && checkersAt(position, loser, index) > 0) {
                    inWinnerHome = true
                }
            }
            return if (inWinnerHome) {
                GameResult(winner, 3, ResultKind.BACKGAMMON)
            } else {
                GameResult(winner, 2, ResultKind.GAMMON)
            }
        }
        return null
    }

    /**
     * Enemy checkers a direct shot (a single die, 1-6 pips) away from an own
     * blot on [index], including enemy bar checkers that could enter onto it.
     */
    fun directShots(position: Position, player: Player, index: Int): Int {
        val enemy = player.opponent
        var shots = 0
        for (distance in 1..6) {
            // The enemy moves toward the blot from its own direction of travel.
            val from = if (player == Player.WHITE) index - distance else index + distance
            if (from in 0..23) {
                shots += checkersAt(position, enemy, from)
            }
        }
        // Enemy bar checkers enter in this player's home board and can hit there.
        if (isHomeIndex(player, index)) {
            shots += position.bar(enemy)
        }
        return shots
    }

    /** Longest run of consecutive made points (a prime blocks enemy runners). */
    fun longestPrime(position: Position, player: Player): Int {
        var best = 0
        var run = 0
        for (index in 0 until 24) {
            if (checkersAt(position, player, index) >= 2) {
                run += 1
                best = max(best, run)
            } else {
                run = 0
            }
        }
        return best
    }

    /**
     * Static evaluation of a position for [player]; higher is better. Terms
     * and weights mirror the web `evaluate` exactly: race lead in pips,
     * bear-off progress, made points (home points extra), and blots
     * penalized by the enemy direct shots that bear on them.
     */
    fun evaluate(position: Position, player: Player): Double {
        val enemy = player.opponent
        var score = (pipCount(position, enemy) - pipCount(position, player)) * HEURISTIC_PIP
        score += position.off(player) * HEURISTIC_OFF
        for (index in 0 until 24) {
            val count = checkersAt(position, player, index)
            if (count >= 2) {
                score += HEURISTIC_POINT
                if (isHomeIndex(player, index)) {
                    score += HEURISTIC_HOME_POINT
                }
            } else if (count == 1) {
                score -= HEURISTIC_BLOT +
                    HEURISTIC_BLOT_SHOT * directShots(position, player, index)
            }
        }
        return score
    }

    /**
     * Picks the bot's full turn for a roll, or null when the roll is
     * blocked. Every level enumerates all legal turns and scores the results
     * with [evaluate], deduping candidates by final position:
     * - EASY: greedy plus per-candidate random noise.
     * - MEDIUM: pure greedy on the heuristic.
     * - HARD: greedy plus prioritized hitting (opponent bar checkers) and
     *   priming (longest consecutive point run) bonuses.
     */
    fun findBotTurn(
        position: Position,
        player: Player,
        dice: Pair<Int, Int>,
        level: BotLevel,
        random: Random = Random.Default,
    ): Turn? {
        val turns = legalTurns(position, player, dice)
        if (turns.isEmpty()) {
            return null
        }
        val seen = mutableSetOf<Position>()
        var best: Turn? = null
        var bestScore = Double.NEGATIVE_INFINITY
        for (turn in turns) {
            if (!seen.add(turn.result)) {
                continue
            }
            var score = evaluate(turn.result, player)
            when (level) {
                BotLevel.EASY ->
                    score += (random.nextDouble() * 2 - 1) * HEURISTIC_EASY_NOISE
                BotLevel.MEDIUM -> Unit
                BotLevel.HARD -> {
                    score += turn.result.bar(player.opponent) * HEURISTIC_HIT_BONUS
                    score += max(0, longestPrime(turn.result, player) - 1) * HEURISTIC_PRIME_BONUS
                }
            }
            if (score > bestScore) {
                bestScore = score
                best = turn
            }
        }
        return best
    }

    fun rollDie(random: Random = Random.Default): Int = random.nextInt(1, 7)

    /**
     * Opening roll-off: each player rolls one die, ties re-roll, and the
     * higher roller starts the game playing both dice as their first roll.
     */
    fun rollOpening(random: Random = Random.Default): Triple<Int, Int, Player> {
        var whiteDie = rollDie(random)
        var blackDie = rollDie(random)
        while (whiteDie == blackDie) {
            whiteDie = rollDie(random)
            blackDie = rollDie(random)
        }
        val starter = if (whiteDie > blackDie) Player.WHITE else Player.BLACK
        return Triple(whiteDie, blackDie, starter)
    }

    /** The mover's own point number for a board index (1-24). */
    fun pointNumber(player: Player, index: Int): Int =
        if (player == Player.WHITE) index + 1 else 24 - index

    /** Classic notation for a move, e.g. "24/18", "bar/22", "6/off", "13/7*". */
    fun formatMove(player: Player, move: Move): String {
        val from = if (move.from == BAR) "bar" else pointNumber(player, move.from).toString()
        val to = if (move.to == OFF) "off" else pointNumber(player, move.to).toString()
        return "$from/$to${if (move.hit) "*" else ""}"
    }

    /** Convenience for tests: total checkers of one color anywhere. */
    fun totalCheckers(position: Position, player: Player): Int {
        var total = position.bar(player) + position.off(player)
        for (index in 0 until 24) {
            total += checkersAt(position, player, index)
        }
        return total
    }
}
