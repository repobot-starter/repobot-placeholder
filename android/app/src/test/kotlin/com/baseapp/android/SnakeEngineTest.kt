package com.baseapp.android

import com.baseapp.android.view.games.snake.SnakeEngine
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure game engine against the web SnakeGame.tsx rules it
 * mirrors: growth/scoring on food, wall and self collision, the no-reverse
 * rule, level/speed thresholds, and deterministic snake-avoiding food spawn.
 *
 * The engine draws food positions from an injected [Random], so every test
 * uses [ScriptedRandom]: it replays a fixed queue of [0, 1) doubles (three
 * per spawn attempt: x, y, kind) and then settles on 0.5, which maps to the
 * free cell (14, 11) on a fresh board.
 */
class SnakeEngineTest {
    /** Deterministic stand-in for Math.random(): scripted values, then 0.5. */
    private class ScriptedRandom(values: List<Double>) : Random() {
        private val queue = ArrayDeque(values)
        override fun nextBits(bitCount: Int): Int = 0
        override fun nextDouble(): Double = queue.removeFirstOrNull() ?: 0.5
    }

    private fun engine(scripted: List<Double> = emptyList()): SnakeEngine =
        SnakeEngine(random = ScriptedRandom(scripted))

    @Test
    fun snakeGrowsAndScoresOnFood() {
        val engine = engine()
        assertEquals(3, engine.snake.size)

        // Food directly in the snake's path (it starts at x=8 heading right).
        engine.placeFood(x = 9, y = 11)
        val result = engine.step()

        assertEquals(100, result.pointsScored)
        assertNull(result.leveledUpTo)
        assertEquals(4, engine.snake.size)
        assertEquals(100, engine.score)
        assertEquals(1, engine.cellsEaten)
        // Fresh food was spawned off the eaten cell and off the body.
        assertFalse(engine.food.x == 9 && engine.food.y == 11)
        assertFalse(engine.snake.any { it.x == engine.food.x && it.y == engine.food.y })

        // A plain move (no food) keeps the length constant.
        engine.placeFood(x = 0, y = 0)
        engine.step()
        assertEquals(4, engine.snake.size)
    }

    @Test
    fun snakeDiesOnWallHit() {
        val engine = engine()
        engine.placeFood(x = 0, y = 0)

        // Head straight up from (8, 11): 11 safe steps to reach y=0, then the
        // 12th crosses the wall and must end the game.
        engine.setDirection(0, -1)
        repeat(11) {
            assertFalse(engine.step().crashed)
            assertFalse(engine.isOver)
        }
        val result = engine.step()

        assertTrue(result.crashed)
        assertTrue(engine.isOver)
        // A crashed game is inert until newGame(), like the web `over` flag.
        assertFalse(engine.step().crashed)
        assertEquals(0, engine.score)
    }

    @Test
    fun snakeDiesOnSelfHit() {
        val engine = engine()
        engine.placeFood(x = 0, y = 0)
        // Long straight body heading right; a down-left-up hook turns the
        // head back into the body's third segment.
        engine.placeSnake(
            cells = listOf(
                SnakeEngine.Cell(10, 10),
                SnakeEngine.Cell(9, 10),
                SnakeEngine.Cell(8, 10),
                SnakeEngine.Cell(7, 10),
                SnakeEngine.Cell(6, 10),
            ),
            direction = SnakeEngine.Cell(1, 0),
        )

        engine.setDirection(0, 1)
        assertFalse(engine.step().crashed)
        engine.setDirection(-1, 0)
        assertFalse(engine.step().crashed)
        engine.setDirection(0, -1)
        val result = engine.step()

        assertTrue(result.crashed)
        assertTrue(engine.isOver)
    }

    @Test
    fun cannotReverseIntoItself() {
        val engine = engine()
        engine.placeFood(x = 0, y = 0)

        // Heading right; a left input is a straight reversal and is ignored.
        engine.setDirection(-1, 0)
        engine.step()
        assertEquals(SnakeEngine.Cell(9, 11), engine.snake.first())
        assertEquals(SnakeEngine.Cell(1, 0), engine.direction)
        assertFalse(engine.isOver)

        // Web parity: reversal is checked against the last *applied*
        // direction, so up-then-down between two ticks resolves to down (both
        // inputs are perpendicular to the current rightward travel).
        engine.setDirection(0, -1)
        engine.setDirection(0, 1)
        engine.step()
        assertEquals(SnakeEngine.Cell(9, 12), engine.snake.first())
    }

    @Test
    fun levelAndSpeedProgressionThresholds() {
        val engine = engine()

        // Five foods advance one level; points are 100 x the level at eat time.
        for (offset in 0 until 5) {
            engine.placeFood(x = 9 + offset, y = 11)
            val result = engine.step()
            assertEquals(100, result.pointsScored)
            if (offset < 4) {
                assertEquals(1, engine.level)
                assertNull(result.leveledUpTo)
            } else {
                assertEquals(2, result.leveledUpTo)
            }
        }
        assertEquals(2, engine.level)
        assertEquals(500, engine.score)
        assertEquals(138L, engine.tickMs)

        // The tick curve matches the web constants: 150ms base, -12ms per
        // level, clamped at 55ms (level 9 would otherwise be 54ms).
        assertEquals(150L, SnakeEngine.tickMsForLevel(1))
        assertEquals(138L, SnakeEngine.tickMsForLevel(2))
        assertEquals(66L, SnakeEngine.tickMsForLevel(8))
        assertEquals(55L, SnakeEngine.tickMsForLevel(9))
        assertEquals(55L, SnakeEngine.tickMsForLevel(20))
    }

    @Test
    fun foodSpawnIsDeterministicAndAvoidsSnakeBody() {
        // Script the initial spawn: the first (x, y, kind) attempt lands on
        // the snake's head (floor(0.3 * 28) = 8, floor(0.5 * 22) = 11) and
        // must be rejected; the second attempt lands on free cell (14, 11)
        // with kind index floor(0.25 * 4) = 1.
        val engine = engine(scripted = listOf(0.3, 0.5, 0.0, 0.5, 0.5, 0.25))

        assertEquals(SnakeEngine.Food(14, 11, "💾"), engine.food)
        assertFalse(engine.snake.any { it.x == engine.food.x && it.y == engine.food.y })
    }
}
