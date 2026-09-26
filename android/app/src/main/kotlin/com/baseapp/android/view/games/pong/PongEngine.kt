package com.baseapp.android.view.games.pong

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sign
import kotlin.math.sin
import kotlin.random.Random

/**
 * Pure Kotlin port of the web Pong physics
 * (`web/app/src/View/Games/Pong/PongGame.tsx`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `PongGameView`.
 *
 * This port is 1-player-vs-bot only: touch devices have no second keyboard
 * player, so the web game's 2P arrow-key mode is intentionally dropped.
 *
 * All coordinates are in field units (800x560, y growing downward); the view
 * scales the field to the device while preserving the aspect ratio.
 */
class PongEngine(
    var difficulty: BotLevel = BotLevel.HARD,
    /** Matches the web speed slider (0.6..1.8); 1.0 is the default. */
    var speedMultiplier: Float = 1f,
    private val random: Random = Random.Default,
) {
    /**
     * Bot tracking speed (px/s) and aim jitter per difficulty — the same
     * table as the web BOT_LEVELS so the bot feels identical on both apps.
     */
    enum class BotLevel(val speed: Float, val jitter: Float) {
        EASY(180f, 60f),
        MEDIUM(280f, 34f),
        HARD(380f, 16f),
        IMPOSSIBLE(620f, 0f),
    }

    enum class Side { LEFT, RIGHT }

    /**
     * Ball position plus a unit direction vector. Speed is applied separately
     * (see [ballSpeed]) exactly like the web game, so rally speed-ups never
     * distort the direction.
     */
    data class Ball(val x: Float, val y: Float, val vx: Float, val vy: Float)

    /** Events produced by one [step] call; null fields mean "nothing happened". */
    data class StepResult(
        val scoredBy: Side? = null,
        val gameWinner: Side? = null,
    )

    var leftPaddleY: Float = FIELD_HEIGHT / 2f
        private set
    var rightPaddleY: Float = FIELD_HEIGHT / 2f
        private set
    var leftScore: Int = 0
        private set
    var rightScore: Int = 0
        private set
    var ball: Ball = Ball(FIELD_WIDTH / 2f, FIELD_HEIGHT / 2f, 0f, 0f)
        private set
    var rallyHits: Int = 0
        private set
    var isOver: Boolean = false
        private set
    var winner: Side? = null
        private set

    private var playerTargetY: Float? = null

    /** Current ball speed in px/s: base speed plus the web's per-rally ramp. */
    val ballSpeed: Float
        get() = BASE_BALL_SPEED * speedMultiplier + rallyHits * RALLY_SPEED_STEP

    init {
        newGame()
    }

    /** Full match reset; the web equivalent is the resetToken effect. */
    fun newGame(serveDirection: Int = if (random.nextFloat() < 0.5f) 1 else -1) {
        leftPaddleY = FIELD_HEIGHT / 2f
        rightPaddleY = FIELD_HEIGHT / 2f
        leftScore = 0
        rightScore = 0
        rallyHits = 0
        isOver = false
        winner = null
        playerTargetY = null
        serve(serveDirection)
    }

    /**
     * Touch input: field-space y the player paddle should glide toward, or
     * null when there is no active touch (the paddle then holds position).
     */
    fun setPlayerTarget(y: Float?) {
        playerTargetY = y?.coerceIn(0f, FIELD_HEIGHT)
    }

    /**
     * Advance the simulation by [dtSeconds] (clamped to 50ms like the web
     * loop, so a background pause never produces a huge tunnel-through step).
     */
    fun step(dtSeconds: Float): StepResult {
        if (isOver) {
            return StepResult()
        }
        val dt = min(dtSeconds, MAX_STEP_SECONDS)

        // Player (left): glide toward the touch target, capped at the same
        // 420 px/s as the web keyboard controls — a fast drag cannot teleport
        // the paddle through the ball.
        playerTargetY?.let { target ->
            val delta = target - leftPaddleY
            leftPaddleY += sign(delta) * min(abs(delta), PLAYER_PADDLE_SPEED * dt)
        }

        // Bot (right): only chases while the ball approaches; drifts back to
        // the middle otherwise, matching the web bot.
        val botTarget = if (ball.vx > 0) {
            ball.y + (random.nextFloat() - 0.5f) * difficulty.jitter
        } else {
            FIELD_HEIGHT / 2f
        }
        val botDelta = botTarget - rightPaddleY
        rightPaddleY += sign(botDelta) * min(abs(botDelta), difficulty.speed * dt)

        val half = PADDLE_HEIGHT / 2f
        leftPaddleY = leftPaddleY.coerceIn(half, FIELD_HEIGHT - half)
        rightPaddleY = rightPaddleY.coerceIn(half, FIELD_HEIGHT - half)

        // Ball movement and wall bounce.
        val speed = ballSpeed
        var x = ball.x + ball.vx * speed * dt
        var y = ball.y + ball.vy * speed * dt
        var vx = ball.vx
        var vy = ball.vy

        if (y < BALL_SIZE / 2f || y > FIELD_HEIGHT - BALL_SIZE / 2f) {
            vy = -vy
            y = y.coerceIn(BALL_SIZE / 2f, FIELD_HEIGHT - BALL_SIZE / 2f)
        }

        // Paddle collision: hit position controls the return angle, like the
        // arcade original (offset in [-1, 1] maps to ±0.75 rad).
        val leftEdge = PADDLE_MARGIN + PADDLE_WIDTH
        val rightEdge = FIELD_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH
        if (
            vx < 0 &&
            x - BALL_SIZE / 2f <= leftEdge &&
            x > PADDLE_MARGIN &&
            abs(y - leftPaddleY) <= PADDLE_HEIGHT / 2f + BALL_SIZE / 2f
        ) {
            x = leftEdge + BALL_SIZE / 2f
            val angle = deflectionAngle(y, leftPaddleY)
            vx = cos(angle)
            vy = sin(angle)
            rallyHits += 1
        }
        if (
            vx > 0 &&
            x + BALL_SIZE / 2f >= rightEdge &&
            x < FIELD_WIDTH - PADDLE_MARGIN &&
            abs(y - rightPaddleY) <= PADDLE_HEIGHT / 2f + BALL_SIZE / 2f
        ) {
            x = rightEdge - BALL_SIZE / 2f
            val angle = deflectionAngle(y, rightPaddleY)
            vx = -cos(angle)
            vy = sin(angle)
            rallyHits += 1
        }

        ball = Ball(x, y, vx, vy)

        // Scoring: the ball must fully leave the field, then the loser serves.
        if (x < -BALL_SIZE || x > FIELD_WIDTH + BALL_SIZE) {
            val leftScored = x > FIELD_WIDTH
            val scorer = if (leftScored) Side.LEFT else Side.RIGHT
            if (leftScored) {
                leftScore += 1
            } else {
                rightScore += 1
            }
            if (leftScore >= WIN_SCORE || rightScore >= WIN_SCORE) {
                isOver = true
                winner = if (leftScore > rightScore) Side.LEFT else Side.RIGHT
                return StepResult(scoredBy = scorer, gameWinner = winner)
            }
            serve(if (leftScored) -1 else 1)
            return StepResult(scoredBy = scorer)
        }

        return StepResult()
    }

    /** Serve from center toward [direction] within ±45°, like the web serveBall. */
    private fun serve(direction: Int) {
        val angle = (random.nextFloat() * 0.5f - 0.25f) * PI.toFloat()
        ball = Ball(
            x = FIELD_WIDTH / 2f,
            y = FIELD_HEIGHT / 2f,
            vx = cos(angle) * direction,
            vy = sin(angle),
        )
        rallyHits = 0
    }

    private fun deflectionAngle(ballY: Float, paddleY: Float): Float {
        val offset = (ballY - paddleY) / (PADDLE_HEIGHT / 2f)
        return offset * 0.75f
    }

    /** Test hook: pin the ball for deterministic physics assertions. */
    internal fun placeBall(x: Float, y: Float, vx: Float, vy: Float) {
        ball = Ball(x, y, vx, vy)
    }

    companion object {
        const val FIELD_WIDTH = 800f
        const val FIELD_HEIGHT = 560f
        const val PADDLE_HEIGHT = 90f
        const val PADDLE_WIDTH = 12f
        const val PADDLE_MARGIN = 24f
        const val BALL_SIZE = 12f
        const val PLAYER_PADDLE_SPEED = 420f
        const val WIN_SCORE = 7
        const val BASE_BALL_SPEED = 260f
        const val RALLY_SPEED_STEP = 18f
        const val MAX_STEP_SECONDS = 0.05f
    }
}
