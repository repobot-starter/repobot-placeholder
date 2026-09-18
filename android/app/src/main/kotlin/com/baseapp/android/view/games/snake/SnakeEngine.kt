package com.baseapp.android.view.games.snake

import kotlin.random.Random

/**
 * Pure Kotlin port of the web SnakeBot rules
 * (`web/app/src/View/Games/Snake/SnakeGame.tsx`) so the exact same game runs
 * on every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `SnakeGameView`.
 *
 * The caller owns the clock: it should call [step] once whenever [tickMs] has
 * elapsed, which reproduces the web's fixed-timestep loop (the tick shrinks
 * as the level rises).
 *
 * Randomness (food position and kind) goes through an injected [Random] so
 * tests can make food spawning fully deterministic; spawning draws
 * `nextDouble()` three times per attempt (x, y, kind) exactly like the web's
 * `Math.random()` calls.
 */
class SnakeEngine(
    private val random: Random = Random.Default,
) {
    /** One grid cell; also doubles as a direction vector (x/y in {-1, 0, 1}). */
    data class Cell(val x: Int, val y: Int)

    /** The current food pellet: a grid cell plus the emoji drawn on it. */
    data class Food(val x: Int, val y: Int, val kind: String)

    /**
     * Events produced by one [step] call — the native twin of the web game's
     * onScore / onGameOver callbacks. Zero/null/false fields mean "nothing
     * happened".
     */
    data class StepResult(
        val pointsScored: Int = 0,
        val leveledUpTo: Int? = null,
        val crashed: Boolean = false,
    )

    private val body = ArrayDeque<Cell>()

    /** Snake segments, head first (read-only view of the internal deque). */
    val snake: List<Cell>
        get() = body

    /**
     * Direction applied on the most recent tick. Steering input is compared
     * against this (not [nextDirection]) when rejecting reversals, same as web.
     */
    var direction: Cell = Cell(1, 0)
        private set

    /**
     * Direction that will be applied on the next tick (the web `nextDirection`
     * buffer, so multiple inputs between ticks resolve to the last one).
     */
    var nextDirection: Cell = Cell(1, 0)
        private set

    var food: Food = Food(0, 0, FOOD_KINDS[0])
        private set
    var score: Int = 0
        private set
    var cellsEaten: Int = 0
        private set
    var level: Int = 1
        private set
    var isOver: Boolean = false
        private set

    /**
     * Milliseconds between ticks at the current level — the web pacing curve
     * `max(MIN_TICK_MS, BASE_TICK_MS - (level - 1) * TICK_DECREASE_PER_LEVEL)`.
     */
    val tickMs: Long
        get() = tickMsForLevel(level)

    init {
        newGame()
    }

    /**
     * Full reset (the web resetToken effect): 3-segment snake on the middle
     * row heading right, level 1, fresh food.
     */
    fun newGame() {
        val middleRow = GRID_ROWS / 2
        body.clear()
        body.addAll(listOf(Cell(8, middleRow), Cell(7, middleRow), Cell(6, middleRow)))
        direction = Cell(1, 0)
        nextDirection = direction
        score = 0
        cellsEaten = 0
        level = 1
        isOver = false
        food = spawnFood()
    }

    /**
     * Steering input (the web keydown handler). A reversal straight into the
     * snake's own neck — the exact opposite of the last *applied* direction —
     * is ignored; anything else replaces the buffered direction.
     */
    fun setDirection(dx: Int, dy: Int) {
        if (dx == -direction.x && dy == -direction.y) {
            return
        }
        nextDirection = Cell(dx, dy)
    }

    /**
     * Advance the simulation by one grid tick. Mirrors the web `step`
     * line-for-line: apply the buffered direction, move the head, die on wall
     * or self contact (checked against the pre-move body, tail included),
     * then grow on food or drop the tail.
     */
    fun step(): StepResult {
        if (isOver) {
            return StepResult()
        }
        direction = nextDirection
        val head = Cell(body.first().x + direction.x, body.first().y + direction.y)

        val hitWall = head.x < 0 || head.y < 0 || head.x >= GRID_COLS || head.y >= GRID_ROWS
        val hitSelf = body.contains(head)
        if (hitWall || hitSelf) {
            isOver = true
            return StepResult(crashed = true)
        }

        body.addFirst(head)

        if (head.x == food.x && head.y == food.y) {
            cellsEaten += 1
            val points = POINTS_PER_FOOD * level
            score += points
            var leveledUpTo: Int? = null
            if (cellsEaten % CELLS_PER_LEVEL == 0) {
                level += 1
                leveledUpTo = level
            }
            food = spawnFood()
            return StepResult(pointsScored = points, leveledUpTo = leveledUpTo)
        }

        body.removeLast()
        return StepResult()
    }

    /**
     * Web `spawnFood`: keep proposing (x, y, kind) triples — three RNG draws
     * per attempt, in that order — until the cell is off the snake body.
     */
    private fun spawnFood(): Food {
        while (true) {
            val candidate = Food(
                x = (random.nextDouble() * GRID_COLS).toInt(),
                y = (random.nextDouble() * GRID_ROWS).toInt(),
                kind = FOOD_KINDS[(random.nextDouble() * FOOD_KINDS.size).toInt()],
            )
            if (body.none { it.x == candidate.x && it.y == candidate.y }) {
                return candidate
            }
        }
    }

    /**
     * Test hook: replace the body and travel direction to set up collision
     * scenarios without scripting dozens of ticks.
     */
    internal fun placeSnake(cells: List<Cell>, direction: Cell) {
        body.clear()
        body.addAll(cells)
        this.direction = direction
        nextDirection = direction
    }

    /** Test hook: pin the food so movement tests are independent of the RNG. */
    internal fun placeFood(x: Int, y: Int, kind: String = FOOD_KINDS[0]) {
        food = Food(x, y, kind)
    }

    companion object {
        // Grid geometry and pacing — must stay byte-for-byte in sync with the
        // web constants in SnakeGame.tsx.
        const val GRID_COLS = 28
        const val GRID_ROWS = 22
        const val CELLS_PER_LEVEL = 5
        const val BASE_TICK_MS = 150L
        const val TICK_DECREASE_PER_LEVEL_MS = 12L
        const val MIN_TICK_MS = 55L

        /** Points per food are multiplied by the current level, like web. */
        const val POINTS_PER_FOOD = 100

        /** Food emoji, in the web's array order (index = floor(random * size)). */
        val FOOD_KINDS = listOf("⚡", "💾", "🔋", "💎")

        /** The web tick pacing curve, exposed for tests. */
        fun tickMsForLevel(level: Int): Long =
            maxOf(MIN_TICK_MS, BASE_TICK_MS - (level - 1) * TICK_DECREASE_PER_LEVEL_MS)
    }
}
