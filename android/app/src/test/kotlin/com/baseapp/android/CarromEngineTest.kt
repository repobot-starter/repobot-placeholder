package com.baseapp.android

import com.baseapp.android.view.games.carrom.CarromEngine
import kotlin.math.hypot
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure carrom engine against the web engine.ts physics and
 * rules it mirrors: friction, elastic collision, pocket capture, striker
 * fouls, the queen cover rule, and board/match win detection. The injected
 * seeded [Random] (only consumed by the bot's aim error) plus the test
 * hooks make every scenario deterministic.
 */
class CarromEngineTest {
    private fun engine(): CarromEngine = CarromEngine(random = Random(seed = 7))

    /** Pump the simulation until the strike resolves, collecting events. */
    private fun settle(engine: CarromEngine, maxSeconds: Double = 12.0): List<CarromEngine.Event> {
        val events = mutableListOf<CarromEngine.Event>()
        var elapsed = 0.0
        while (engine.phase == CarromEngine.Phase.ROLLING && elapsed < maxSeconds) {
            events.addAll(engine.step(1.0 / 60.0))
            elapsed += 1.0 / 60.0
        }
        assertTrue("simulation failed to settle", engine.phase != CarromEngine.Phase.ROLLING)
        return events
    }

    @Test
    fun openingRackHasNineCoinsEachAndQueenCentered() {
        val engine = engine()

        assertEquals(9, engine.pieces.count { it.kind == CarromEngine.PieceKind.WHITE })
        assertEquals(9, engine.pieces.count { it.kind == CarromEngine.PieceKind.BLACK })
        assertEquals(CarromEngine.CENTER, engine.queen.x, 0.001)
        assertEquals(CarromEngine.CENTER, engine.queen.y, 0.001)
        assertEquals(CarromEngine.baselineY(0), engine.striker.y, 0.001)
        assertEquals(CarromEngine.Phase.AIMING, engine.phase)
    }

    @Test
    fun struckCoinDeceleratesToRestUnderFriction() {
        val engine = engine()

        // Send the striker along the empty bottom lane; exponential friction
        // must bring it to a stop well before the far wall. Track its
        // position while rolling, because resolution respots the striker.
        engine.placePiece(id = 0, x = 150.0, y = 500.0, vx = 200.0, vy = 0.0)
        engine.beginRollingForTesting()
        var restingX = 150.0
        var elapsed = 0.0
        while (engine.phase == CarromEngine.Phase.ROLLING && elapsed < 12.0) {
            engine.step(1.0 / 60.0)
            elapsed += 1.0 / 60.0
            if (engine.phase == CarromEngine.Phase.ROLLING) {
                restingX = engine.striker.x
            }
        }

        assertEquals(CarromEngine.Phase.AIMING, engine.phase)
        // v0/k is the theoretical travel bound for pure exponential damping.
        assertTrue(restingX < 150.0 + 200.0 / CarromEngine.FRICTION + 1.0)
        assertTrue(restingX > 150.0 + 50.0)
        // Nothing pocketed: the turn passes to the opponent.
        assertEquals(1, engine.currentPlayer)
    }

    @Test
    fun headOnElasticCollisionTransfersMomentum() {
        val engine = engine()
        val coinId = engine.firstPieceId(CarromEngine.PieceKind.WHITE)!!

        // Striker (mass 1.5) hurtles head-on at a resting coin (mass 1) in
        // the open bottom lane, just touching so the impulse lands at once.
        val gap = CarromEngine.STRIKER_RADIUS + CarromEngine.COIN_RADIUS + 0.5
        engine.placePiece(id = 0, x = 200.0, y = 500.0, vx = 400.0, vy = 0.0)
        engine.placePiece(id = coinId, x = 200.0 + gap, y = 500.0)
        engine.beginRollingForTesting()

        val events = engine.step(4 * CarromEngine.PHYSICS_STEP)
        assertTrue(events.any { it is CarromEngine.Event.Collision })

        val striker = engine.striker
        val coin = engine.pieces[coinId]
        // The light coin flies off faster than the striker arrived, scaled
        // by (1+e)·mA/(mA+mB) = 1.152; the heavy striker keeps rolling.
        assertTrue(coin.vx > 350.0)
        assertTrue(striker.vx > 0.0)
        assertTrue(striker.vx < 150.0)
        // Momentum along the impact normal is conserved (friction over a
        // few substeps only shaves a small fraction).
        val momentum = striker.mass * striker.vx + coin.mass * coin.vx
        assertEquals(1.5 * 400.0, momentum, 1.5 * 400.0 * 0.05)
    }

    @Test
    fun coinOverPocketIsCapturedAndShooterKeepsTurn() {
        val engine = engine()
        val coinId = engine.firstPieceId(CarromEngine.PieceKind.WHITE)!!

        // Park a white coin inside the top-left pocket circle and settle.
        engine.placePiece(id = coinId, x = 35.0, y = 35.0)
        engine.beginRollingForTesting()
        val events = settle(engine)

        assertTrue(events.contains(CarromEngine.Event.Pocket(CarromEngine.PieceKind.WHITE)))
        assertFalse(engine.pieces[coinId].onBoard)
        assertEquals(1, engine.pocketedCount(CarromEngine.PieceKind.WHITE))
        // Pocketing your own color keeps the turn.
        assertEquals(0, engine.currentPlayer)
        assertEquals(true, engine.lastSummary?.keptTurn)
    }

    @Test
    fun strikerFoulReturnsACoinAndPassesTheTurn() {
        val engine = engine()
        val coinId = engine.firstPieceId(CarromEngine.PieceKind.WHITE)!!

        // Player 0 already banked one coin; then they sink the striker.
        engine.pocketForTesting(coinId)
        assertEquals(1, engine.pocketedCount(CarromEngine.PieceKind.WHITE))
        engine.placePiece(id = 0, x = 35.0, y = 35.0)
        engine.beginRollingForTesting()
        val events = settle(engine)

        assertTrue(events.contains(CarromEngine.Event.Pocket(CarromEngine.PieceKind.STRIKER)))
        assertEquals(true, engine.lastSummary?.foul)
        // The banked coin came back onto the wood and the turn passed.
        assertEquals(0, engine.pocketedCount(CarromEngine.PieceKind.WHITE))
        assertTrue(engine.pieces[coinId].onBoard)
        assertEquals(1, engine.currentPlayer)
        // The striker is respotted for the next shooter.
        assertTrue(engine.striker.onBoard)
    }

    @Test
    fun queenCoverRule() {
        // Covered: queen and an own coin fall on the same strike.
        val covered = engine()
        val coveredCoin = covered.firstPieceId(CarromEngine.PieceKind.WHITE)!!
        covered.placePiece(id = CarromEngine.QUEEN_ID, x = 35.0, y = 35.0)
        covered.placePiece(id = coveredCoin, x = CarromEngine.BOARD_SIZE - 35.0, y = 35.0)
        covered.beginRollingForTesting()
        settle(covered)
        assertEquals(0, covered.queenOwner)
        assertEquals(CarromEngine.QueenOutcome.COVERED, covered.lastSummary?.queenOutcome)
        assertEquals(0, covered.currentPlayer)

        // Pending then returned: queen alone, then a dry follow-up strike.
        val pending = engine()
        pending.placePiece(id = CarromEngine.QUEEN_ID, x = 35.0, y = 35.0)
        pending.beginRollingForTesting()
        settle(pending)
        assertNull(pending.queenOwner)
        assertEquals(0, pending.queenPendingBy)
        assertEquals(CarromEngine.QueenOutcome.PENDING, pending.lastSummary?.queenOutcome)
        // Queen taken: shooter must shoot again to attempt the cover.
        assertEquals(0, pending.currentPlayer)
        assertFalse(pending.queen.onBoard)

        // The cover strike pockets nothing: the queen returns to the board
        // and the turn passes.
        pending.beginRollingForTesting()
        settle(pending)
        assertNull(pending.queenPendingBy)
        assertTrue(pending.queen.onBoard)
        assertEquals(CarromEngine.QueenOutcome.RETURNED, pending.lastSummary?.queenOutcome)
        assertEquals(1, pending.currentPlayer)
    }

    @Test
    fun clearingAllCoinsWinsTheBoardAndScoresRemainingOpponentCoins() {
        val engine = engine()

        // Pocket eight whites off-screen, then sink the ninth for real.
        engine.pieces
            .filter { it.kind == CarromEngine.PieceKind.WHITE }
            .take(8)
            .forEach { engine.pocketForTesting(it.id) }
        val lastWhite = engine.firstPieceId(CarromEngine.PieceKind.WHITE)!!
        engine.placePiece(id = lastWhite, x = 35.0, y = 35.0)
        engine.beginRollingForTesting()
        val events = settle(engine)

        // All 9 black coins remain and the queen was never covered → 9 points.
        assertTrue(events.contains(CarromEngine.Event.BoardOver(winner = 0, points = 9)))
        assertEquals(0, engine.boardWinner)
        assertEquals(9, engine.matchScore[0])
        assertEquals(CarromEngine.Phase.BOARD_OVER, engine.phase)
        assertNull(engine.matchWinner)

        // The board winner breaks the next board.
        engine.nextBoard()
        assertEquals(CarromEngine.Phase.AIMING, engine.phase)
        assertEquals(0, engine.currentPlayer)
        assertEquals(0, engine.pocketedCount(CarromEngine.PieceKind.WHITE))
    }

    @Test
    fun matchEndsAtTwentyFivePoints() {
        val engine = engine()

        // Player 0 sweeps three boards at 9 points each (all opponent coins
        // left, queen uncovered): 9 + 9 + 9 = 27 crosses the 25-point
        // target on the third board and ends the match.
        for (board in 0 until 3) {
            engine.pieces
                .filter { it.kind == CarromEngine.PieceKind.WHITE }
                .take(8)
                .forEach { engine.pocketForTesting(it.id) }
            val lastWhite = engine.firstPieceId(CarromEngine.PieceKind.WHITE)!!
            engine.placePiece(id = lastWhite, x = 35.0, y = 35.0)
            engine.beginRollingForTesting()
            settle(engine)
            assertEquals((board + 1) * 9, engine.matchScore[0])
            if (engine.matchWinner == null) {
                engine.nextBoard()
            }
        }

        assertEquals(0, engine.matchWinner)
        assertEquals(CarromEngine.Phase.MATCH_OVER, engine.phase)
        assertTrue(engine.matchScore[0] >= CarromEngine.MATCH_TARGET)
    }

    @Test
    fun botStrikePutsTheStrikerInMotion() {
        val engine = engine()

        // Hand the turn to the bot by fouling out player 0's opening strike.
        engine.placePiece(id = 0, x = 35.0, y = 35.0)
        engine.beginRollingForTesting()
        settle(engine)
        assertEquals(1, engine.currentPlayer)

        engine.botStrike(CarromEngine.BotLevel.HARD)
        assertEquals(CarromEngine.Phase.ROLLING, engine.phase)
        assertTrue(hypot(engine.striker.vx, engine.striker.vy) > CarromEngine.MIN_SHOT_SPEED - 1)
        // The bot flicks from its own (top) baseline.
        assertEquals(CarromEngine.baselineY(1), engine.striker.y, 0.001)
        settle(engine)
    }
}
