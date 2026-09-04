package com.baseapp.android

import com.baseapp.android.view.games.tawla.TawlaEngine
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure tawla (backgammon) engine against the web engine.ts
 * rules it mirrors: move generation, doubles, hitting, bar entry, bear-off
 * legality, the forced higher-die rule, and gammon/backgammon scoring. Dice
 * go through an injected [Random] so every test is deterministic.
 */
class TawlaEngineTest {
    /** An empty board with the given bar/off tallies; tests place checkers. */
    private fun emptyPosition(
        whiteBar: Int = 0,
        blackBar: Int = 0,
        whiteOff: Int = 0,
        blackOff: Int = 0,
    ): TawlaEngine.Position =
        TawlaEngine.Position(List(24) { 0 }, whiteBar, blackBar, whiteOff, blackOff)

    private fun TawlaEngine.Position.withPoint(index: Int, signedCount: Int): TawlaEngine.Position =
        copy(points = points.toMutableList().also { it[index] = signedCount })

    @Test
    fun legalTurnsForAKnownRollFromTheStart() {
        // White 3-1 from the start: every turn plays both dice, and the
        // classic "make the 5-point" play (8/5 6/5) is available.
        val turns = TawlaEngine.legalTurns(
            TawlaEngine.initialPosition(),
            TawlaEngine.Player.WHITE,
            3 to 1,
        )

        assertFalse(turns.isEmpty())
        assertTrue(turns.all { it.moves.size == 2 })
        assertTrue(
            turns.any {
                TawlaEngine.checkersAt(it.result, TawlaEngine.Player.WHITE, 4) == 2
            },
        )
    }

    @Test
    fun doublesPlayFourMoves() {
        val turns = TawlaEngine.legalTurns(
            TawlaEngine.initialPosition(),
            TawlaEngine.Player.WHITE,
            2 to 2,
        )

        assertFalse(turns.isEmpty())
        assertTrue(turns.all { it.moves.size == 4 })
    }

    @Test
    fun hittingABlotSendsItToTheBar() {
        // Black blot on index 20 (White's 21-point): 24/21 with the 3 hits.
        val position = TawlaEngine.initialPosition().withPoint(20, -1)

        val turns = TawlaEngine.legalTurns(position, TawlaEngine.Player.WHITE, 3 to 4)
        val hit = turns.firstOrNull { turn -> turn.moves.any { it.hit && it.to == 20 } }

        assertNotNull(hit)
        assertEquals(1, hit!!.result.blackBar)
        assertEquals(1, TawlaEngine.checkersAt(hit.result, TawlaEngine.Player.WHITE, 20))
    }

    @Test
    fun mustEnterFromTheBarFirst() {
        // Entry with the 6 lands on index 18 (blocked by five black
        // checkers), so every turn must start by entering with the 3.
        val position = TawlaEngine.initialPosition()
            .withPoint(23, 1)
            .copy(whiteBar = 1)

        val turns = TawlaEngine.legalTurns(position, TawlaEngine.Player.WHITE, 6 to 3)

        assertFalse(turns.isEmpty())
        assertTrue(turns.all { it.moves[0].from == TawlaEngine.BAR })
        assertTrue(turns.all { it.moves[0].to == 21 && it.moves[0].die == 3 })
    }

    @Test
    fun bearOffLegality() {
        // White home: two on the 4-point (index 3), one on the 2-point
        // (index 1). A 6 overshoots, so only the rearmost checkers bear
        // off; a 2 bears off the 2-point checker exactly.
        var position = emptyPosition(whiteOff = 12)
            .withPoint(3, 2)
            .withPoint(1, 1)
            .withPoint(0, -2)

        val sixes = TawlaEngine.legalSingleMoves(position, TawlaEngine.Player.WHITE, 6)
        assertFalse(sixes.isEmpty())
        assertTrue(sixes.all { it.to == TawlaEngine.OFF && it.from == 3 })

        val twos = TawlaEngine.legalSingleMoves(position, TawlaEngine.Player.WHITE, 2)
        assertTrue(twos.any { it.from == 1 && it.to == TawlaEngine.OFF })

        // A checker outside the home board forbids bearing off entirely.
        position = position.withPoint(10, 1)
        val blocked = TawlaEngine.legalSingleMoves(position, TawlaEngine.Player.WHITE, 6)
        assertTrue(blocked.all { it.to != TawlaEngine.OFF })
    }

    @Test
    fun forcedHigherDieRule() {
        // Lone white runner on the 24-point. 24/18 (the 6) and 24/19 (the 5)
        // are both open, but every continuation lands on the blocked index
        // 12 — only one die can be played, so the higher (6) is forced.
        val position = emptyPosition()
            .withPoint(23, 1)
            .withPoint(12, -2)
            .withPoint(11, -2)

        val turns = TawlaEngine.legalTurns(position, TawlaEngine.Player.WHITE, 6 to 5)

        assertFalse(turns.isEmpty())
        assertTrue(turns.all { it.moves.size == 1 })
        assertTrue(turns.all { it.moves[0].die == 6 })
    }

    @Test
    fun gammonAndBackgammonScoring() {
        // White borne off completely; Black borne off nothing: gammon (2).
        var position = emptyPosition(whiteOff = 15).withPoint(10, -15)
        assertEquals(
            TawlaEngine.GameResult(TawlaEngine.Player.WHITE, 2, TawlaEngine.ResultKind.GAMMON),
            TawlaEngine.winResult(position),
        )

        // A black checker in White's home board upgrades it to backgammon (3).
        position = emptyPosition(whiteOff = 15).withPoint(10, -14).withPoint(2, -1)
        assertEquals(
            TawlaEngine.GameResult(TawlaEngine.Player.WHITE, 3, TawlaEngine.ResultKind.BACKGAMMON),
            TawlaEngine.winResult(position),
        )

        // A black checker on the bar is a backgammon too.
        position = emptyPosition(whiteOff = 15, blackBar = 1).withPoint(10, -14)
        assertEquals(
            TawlaEngine.GameResult(TawlaEngine.Player.WHITE, 3, TawlaEngine.ResultKind.BACKGAMMON),
            TawlaEngine.winResult(position),
        )

        // Black has borne one off: just a single game (1 point).
        position = emptyPosition(whiteOff = 15, blackOff = 2).withPoint(10, -13)
        assertEquals(
            TawlaEngine.GameResult(TawlaEngine.Player.WHITE, 1, TawlaEngine.ResultKind.SINGLE),
            TawlaEngine.winResult(position),
        )

        // No winner while checkers remain on the board.
        assertNull(TawlaEngine.winResult(TawlaEngine.initialPosition()))
    }

    @Test
    fun deterministicDiceWithInjectedRandom() {
        val random = Random(seed = 7)
        val first = TawlaEngine.rollDie(random)
        val second = TawlaEngine.rollDie(random)
        // Re-seeding reproduces the exact same rolls.
        val replay = Random(seed = 7)
        assertEquals(first, TawlaEngine.rollDie(replay))
        assertEquals(second, TawlaEngine.rollDie(replay))

        val (whiteDie, blackDie, starter) = TawlaEngine.rollOpening(Random(seed = 7))
        assertTrue(whiteDie in 1..6 && blackDie in 1..6)
        assertTrue(whiteDie != blackDie)
        assertEquals(
            if (whiteDie > blackDie) TawlaEngine.Player.WHITE else TawlaEngine.Player.BLACK,
            starter,
        )
    }

    @Test
    fun startingPipCountsAndBotPicksALegalTurn() {
        val start = TawlaEngine.initialPosition()
        assertEquals(167, TawlaEngine.pipCount(start, TawlaEngine.Player.WHITE))
        assertEquals(167, TawlaEngine.pipCount(start, TawlaEngine.Player.BLACK))

        // The medium bot must return one of the enumerated legal turns and
        // conserve all thirty checkers.
        val turns = TawlaEngine.legalTurns(start, TawlaEngine.Player.BLACK, 6 to 1)
        val pick = TawlaEngine.findBotTurn(
            start,
            TawlaEngine.Player.BLACK,
            6 to 1,
            TawlaEngine.BotLevel.MEDIUM,
            Random(seed = 7),
        )
        assertNotNull(pick)
        assertTrue(turns.any { it.result == pick!!.result })
        assertEquals(15, TawlaEngine.totalCheckers(pick!!.result, TawlaEngine.Player.WHITE))
        assertEquals(15, TawlaEngine.totalCheckers(pick.result, TawlaEngine.Player.BLACK))
    }
}
