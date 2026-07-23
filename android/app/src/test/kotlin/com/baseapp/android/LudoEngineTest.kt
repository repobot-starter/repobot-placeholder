package com.baseapp.android

import com.baseapp.android.view.games.ludo.LudoEngine
import com.baseapp.android.view.games.ludo.LudoGameState
import com.baseapp.android.view.games.ludo.LudoSeatKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure Ludo rules engine against the web engine.ts rules it
 * mirrors: six-to-exit, captures and safe squares, exact home-column rolls,
 * the triple-six forfeit, and win/placings detection. Dice values are
 * injected directly and the bot takes a fixed random source, so every test
 * is deterministic.
 */
class LudoEngineTest {
    /** Two-racer match (red human, green bot) with every token in its yard. */
    private fun game(): LudoGameState = LudoEngine.createGame(
        listOf(LudoSeatKind.HUMAN, LudoSeatKind.BOT, LudoSeatKind.OFF, LudoSeatKind.OFF),
    )

    /** Convenience builder for mid-game red-vs-green positions. */
    private fun state(
        redTokens: List<Int>,
        greenTokens: List<Int> = listOf(-1, -1, -1, -1),
        current: Int = 0,
        dice: Int? = null,
        sixStreak: Int = 0,
    ): LudoGameState = LudoGameState(
        seats = listOf(LudoSeatKind.HUMAN, LudoSeatKind.BOT, LudoSeatKind.OFF, LudoSeatKind.OFF),
        tokens = listOf(redTokens, greenTokens, listOf(-1, -1, -1, -1), listOf(-1, -1, -1, -1)),
        current = current,
        dice = dice,
        sixStreak = sixStreak,
        placings = emptyList(),
        over = false,
    )

    @Test
    fun exitingTheYardRequiresASix() {
        // A non-six with everyone in the yard has no legal move: turn passes.
        val blocked = LudoEngine.applyRoll(game(), 3)
        assertNull(blocked.dice)
        assertEquals(1, blocked.current)

        // A six offers all four yard exits (to progress 0, the start square).
        val rolled = LudoEngine.applyRoll(game(), 6)
        assertEquals(6, rolled.dice)
        val moves = LudoEngine.legalMoves(rolled)
        assertEquals(4, moves.size)
        assertTrue(moves.all { it.from == -1 && it.to == 0 && !it.captures })

        // Playing the exit grants the extra roll: same seat, awaiting a roll.
        val moved = LudoEngine.applyMove(rolled, 0)
        assertEquals(0, moved.tokens[0][0])
        assertEquals(0, moved.current)
        assertNull(moved.dice)
    }

    @Test
    fun landingOnAnOpponentCapturesIt() {
        // Green progress 44 sits on ring index (13 + 44) % 52 = 5, which red
        // reaches from progress 3 with a roll of 2. Ring 5 is not safe.
        val rolled = LudoEngine.applyRoll(
            state(redTokens = listOf(3, -1, -1, -1), greenTokens = listOf(44, -1, -1, -1)),
            2,
        )
        val moves = LudoEngine.legalMoves(rolled)
        assertEquals(1, moves.size)
        assertTrue(moves[0].captures)

        val moved = LudoEngine.applyMove(rolled, 0)
        assertEquals(5, moved.tokens[0][0])
        assertEquals("captured token returns to its yard", -1, moved.tokens[1][0])
        assertEquals("a non-six move passes the turn", 1, moved.current)
    }

    @Test
    fun safeSquaresBlockCapture() {
        // Green progress 47 sits on ring index (13 + 47) % 52 = 8 — a safe
        // star. Red lands on it from progress 6 with a roll of 2; both stay.
        val rolled = LudoEngine.applyRoll(
            state(redTokens = listOf(6, -1, -1, -1), greenTokens = listOf(47, -1, -1, -1)),
            2,
        )
        val moves = LudoEngine.legalMoves(rolled)
        assertEquals(1, moves.size)
        assertFalse(moves[0].captures)

        val moved = LudoEngine.applyMove(rolled, 0)
        assertEquals(8, moved.tokens[0][0])
        assertEquals("tokens on safe squares are never captured", 47, moved.tokens[1][0])
    }

    @Test
    fun homeColumnRequiresAnExactRoll() {
        // Progress 54 needs exactly 2 to finish (56). A 4 overshoots, and
        // with no other movable token the turn passes.
        val position = state(redTokens = listOf(54, -1, -1, -1), greenTokens = listOf(10, -1, -1, -1))
        val overshoot = LudoEngine.applyRoll(position, 4)
        assertNull(overshoot.dice)
        assertEquals(1, overshoot.current)

        val exact = LudoEngine.applyRoll(position, 2)
        val moves = LudoEngine.legalMoves(exact)
        assertEquals(1, moves.size)
        assertEquals(LudoEngine.HOME_PROGRESS, moves[0].to)
        assertEquals(LudoEngine.HOME_PROGRESS, LudoEngine.applyMove(exact, 0).tokens[0][0])
    }

    @Test
    fun threeConsecutiveSixesForfeitTheTurn() {
        // Two sixes already rolled this turn; a token on the ring guarantees
        // the third six would otherwise have a legal move.
        val position = state(
            redTokens = listOf(5, -1, -1, -1),
            greenTokens = listOf(30, -1, -1, -1),
            sixStreak = 2,
        )
        val forfeited = LudoEngine.applyRoll(position, 6)
        assertNull("the third six is void — no move is offered", forfeited.dice)
        assertEquals(1, forfeited.current)
        assertEquals(0, forfeited.sixStreak)
        assertEquals("no token moves on a forfeit", 5, forfeited.tokens[0][0])

        // One and two sixes keep the turn alive.
        val second = LudoEngine.applyRoll(position.copy(sixStreak = 1), 6)
        assertEquals(6, second.dice)
        assertEquals(2, second.sixStreak)
    }

    @Test
    fun bringingTheLastTokenHomeWinsAndFillsPlacings() {
        val position = state(
            redTokens = listOf(56, 56, 56, 55),
            greenTokens = listOf(10, -1, -1, -1),
        )
        val rolled = LudoEngine.applyRoll(position, 1)
        val finished = LudoEngine.applyMove(rolled, 3)

        assertTrue(LudoEngine.isSeatFinished(finished, 0))
        assertTrue(finished.over)
        assertEquals("the last remaining racer takes the final placing", listOf(0, 1), finished.placings)

        // A finished match is inert.
        assertEquals(finished, LudoEngine.applyRoll(finished, 6))
    }

    @Test
    fun botPrefersCaptureOverPlainAdvance() {
        // Token 0 can capture (green on ring 5); token 1 just advances. With
        // a fixed random source the capture priority must win.
        val position = state(
            redTokens = listOf(3, 20, -1, -1),
            greenTokens = listOf(44, -1, -1, -1),
            dice = 2,
        )
        assertEquals(0, LudoEngine.chooseBotMove(position) { 0.5 })
    }
}
