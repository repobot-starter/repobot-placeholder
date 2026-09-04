package com.baseapp.android

import com.baseapp.android.view.games.pong.PongEngine
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure game engine against the web PongGame.tsx rules it
 * mirrors: serve direction, scoring/re-serve, bot clamping, win-at-7, and
 * strike-position paddle deflection.
 */
class PongEngineTest {
    // Deterministic dt small enough that a single step never crosses a paddle.
    private val dt = 0.001f

    private fun engine(difficulty: PongEngine.BotLevel = PongEngine.BotLevel.HARD): PongEngine =
        PongEngine(difficulty = difficulty, random = Random(seed = 7))

    @Test
    fun serveSendsBallTowardTheRequestedSide() {
        val engine = engine()

        engine.newGame(serveDirection = 1)
        // Serve angle is within ±45°, so the horizontal component dominates.
        assertTrue(engine.ball.vx >= cos(0.25f * Math.PI.toFloat()))
        engine.step(dt)
        assertTrue(engine.ball.x > PongEngine.FIELD_WIDTH / 2f)

        engine.newGame(serveDirection = -1)
        assertTrue(engine.ball.vx <= -cos(0.25f * Math.PI.toFloat()))
        engine.step(dt)
        assertTrue(engine.ball.x < PongEngine.FIELD_WIDTH / 2f)
    }

    @Test
    fun missScoresForTheOpponentAndReServes() {
        val engine = engine()
        // Ball fully past the left goal line and still moving out.
        engine.placeBall(x = -PongEngine.BALL_SIZE - 0.5f, y = 100f, vx = -1f, vy = 0f)

        val result = engine.step(dt)

        assertEquals(PongEngine.Side.RIGHT, result.scoredBy)
        assertNull(result.gameWinner)
        assertEquals(1, engine.rightScore)
        assertEquals(0, engine.leftScore)
        // Re-served from center, toward the loser's side (web: direction 1).
        assertEquals(PongEngine.FIELD_WIDTH / 2f, engine.ball.x, 0.001f)
        assertEquals(PongEngine.FIELD_HEIGHT / 2f, engine.ball.y, 0.001f)
        assertTrue(engine.ball.vx > 0f)
    }

    @Test
    fun botPaddleStaysWithinTheField() {
        val engine = engine(difficulty = PongEngine.BotLevel.IMPOSSIBLE)
        // Ball hugging the top edge and approaching: the bot chases a target
        // above its clamp range and must stop at half a paddle from the edge.
        engine.placeBall(x = 100f, y = 10f, vx = 1f, vy = 0f)

        val half = PongEngine.PADDLE_HEIGHT / 2f
        repeat(30) {
            engine.step(0.016f)
            assertTrue(engine.rightPaddleY >= half)
            assertTrue(engine.rightPaddleY <= PongEngine.FIELD_HEIGHT - half)
        }
        // The impossible bot (620 px/s, no jitter) has had time to reach the clamp.
        assertEquals(half, engine.rightPaddleY, 0.001f)
    }

    @Test
    fun reachingWinScoreEndsTheGameWithTheCorrectWinner() {
        val engine = engine()

        repeat(PongEngine.WIN_SCORE) { pointIndex ->
            // Ball fully past the right goal line: a point for the left player.
            engine.placeBall(
                x = PongEngine.FIELD_WIDTH + PongEngine.BALL_SIZE + 0.5f,
                y = PongEngine.FIELD_HEIGHT / 2f,
                vx = 1f,
                vy = 0f,
            )
            val result = engine.step(dt)
            assertEquals(PongEngine.Side.LEFT, result.scoredBy)
            val isMatchPoint = pointIndex == PongEngine.WIN_SCORE - 1
            assertEquals(if (isMatchPoint) PongEngine.Side.LEFT else null, result.gameWinner)
        }

        assertTrue(engine.isOver)
        assertEquals(PongEngine.Side.LEFT, engine.winner)
        assertEquals(PongEngine.WIN_SCORE, engine.leftScore)

        // A finished game is inert: further steps change nothing.
        val after = engine.step(dt)
        assertNull(after.scoredBy)
        assertEquals(PongEngine.WIN_SCORE, engine.leftScore)
    }

    @Test
    fun paddleDeflectionFollowsStrikePosition() {
        // Strike 30px below the paddle center: offset 2/3 → angle 0.5 rad,
        // matching the web bounceOffPaddle math exactly.
        val below = engine()
        below.placeBall(x = 42.2f, y = 310f, vx = -1f, vy = 0f)
        below.step(dt)
        assertEquals(sin(0.5f), below.ball.vy, 0.001f)
        assertEquals(cos(0.5f), below.ball.vx, 0.001f)
        assertEquals(1, below.rallyHits)

        // Mirror strike above center deflects upward (negative vy).
        val above = engine()
        above.placeBall(x = 42.2f, y = 250f, vx = -1f, vy = 0f)
        above.step(dt)
        assertEquals(-sin(0.5f), above.ball.vy, 0.001f)

        // Dead-center strike returns the ball flat.
        val center = engine()
        center.placeBall(x = 42.2f, y = PongEngine.FIELD_HEIGHT / 2f, vx = -1f, vy = 0f)
        center.step(dt)
        assertTrue(abs(center.ball.vy) < 0.001f)
        assertEquals(1f, center.ball.vx, 0.001f)
    }
}
