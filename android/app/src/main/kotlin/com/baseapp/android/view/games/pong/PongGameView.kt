package com.baseapp.android.view.games.pong

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.roundToInt

/**
 * Retro cabinet palette mirroring the web PongGame draw() colors. The field
 * keeps its own dark arcade look on both light and dark app themes (why: the
 * web playfield is hardcoded dark too — it is part of the game's identity).
 */
private object PongColors {
    val field = Color(0xFF0A0A0F)
    val centerLine = Color(0x808C96FF) // rgba(140,150,255,0.5)
    val player = Color(0xFF57C8FF)
    val bot = Color(0xFFA98FFB)
    val ball = Color(0xFFFFFFFF)
    val ballTrail = Color(0x40FFFFFF) // rgba(255,255,255,0.25)
    val win = Color(0xFF7CF29C)
    val paused = Color(0xFFFFD166)
    val gameOverScrim = Color(0xBF0A0A0F) // rgba(10,10,15,0.75)
    val pausedScrim = Color(0x990A0A0F) // rgba(10,10,15,0.6)
}

/**
 * Home surface for the `pong` pack — the native twin of the web PongPage.
 * Rendering and touch input only: all rules live in [PongEngine] so the
 * physics stay JVM-testable and in lockstep with the web game. No network,
 * no stores.
 *
 * A `withFrameNanos` loop drives the engine; the Canvas reads the frame
 * clock so it redraws every frame while score/status text recomposes only
 * on engine events.
 */
@Composable
fun PongGameView() {
    val theme = LocalUiTheme.current
    val engine = remember { PongEngine() }
    var difficulty by remember { mutableStateOf(PongEngine.BotLevel.HARD) }
    var paused by remember { mutableStateOf(false) }
    var winner by remember { mutableStateOf<PongEngine.Side?>(null) }
    var leftScore by remember { mutableIntStateOf(0) }
    var rightScore by remember { mutableIntStateOf(0) }
    var ballSpeedReadout by remember { mutableIntStateOf((engine.ballSpeed / 40f).roundToInt()) }
    var frameTimeNanos by remember { mutableLongStateOf(0L) }

    LaunchedEffect(engine) {
        var lastNanos = 0L
        while (true) {
            withFrameNanos { now ->
                if (lastNanos != 0L && !paused && winner == null) {
                    val result = engine.step((now - lastNanos) / 1_000_000_000f)
                    if (result.scoredBy != null) {
                        leftScore = engine.leftScore
                        rightScore = engine.rightScore
                    }
                    result.gameWinner?.let { winner = it }
                    ballSpeedReadout = (engine.ballSpeed / 40f).roundToInt()
                }
                lastNanos = now
                frameTimeNanos = now
            }
        }
    }

    fun newGame() {
        engine.newGame()
        winner = null
        paused = false
        leftScore = 0
        rightScore = 0
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .statusBarsPadding()
            .padding(theme.spacing.lg),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
    ) {
        Text(
            text = "PONGBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            RetroButton(label = "⟳ NEW GAME", onClick = ::newGame)
            RetroButton(
                label = if (paused) "▶ RESUME" else "❚❚ PAUSE",
                onClick = { paused = !paused },
            )
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .aspectRatio(PongEngine.FIELD_WIDTH / PongEngine.FIELD_HEIGHT)
                    .clip(RoundedCornerShape(theme.radius.md)),
            ) {
                PongFieldCanvas(
                    engine = engine,
                    frameTimeNanos = frameTimeNanos,
                    modifier = Modifier.matchParentSize(),
                )
                ScoreReadout(leftScore = leftScore, rightScore = rightScore)
                winner?.let { side ->
                    FieldOverlay(
                        scrim = PongColors.gameOverScrim,
                        title = if (side == PongEngine.Side.LEFT) "PLAYER WINS" else "BOT WINS",
                        subtitle = "PRESS NEW GAME",
                        color = PongColors.win,
                    )
                }
                if (winner == null && paused) {
                    FieldOverlay(
                        scrim = PongColors.pausedScrim,
                        title = "PAUSED",
                        subtitle = null,
                        color = PongColors.paused,
                    )
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            PongEngine.BotLevel.entries.forEach { level ->
                RetroButton(
                    label = level.name,
                    isLit = level == difficulty,
                    onClick = {
                        difficulty = level
                        engine.difficulty = level
                    },
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            StatusText(text = if (paused) "● PAUSED." else "● READY.")
            StatusText(text = "BALL SPEED: $ballSpeedReadout")
            StatusText(text = "FIRST TO ${PongEngine.WIN_SCORE}")
        }
    }
}

/**
 * The playfield. Draws in field coordinates under a uniform scale (the parent
 * enforces the 800x560 aspect ratio, so width-based scale fits both axes) and
 * maps touch y back into field space to drive the player paddle.
 */
@Composable
private fun PongFieldCanvas(
    engine: PongEngine,
    frameTimeNanos: Long,
    modifier: Modifier = Modifier,
) {
    Canvas(
        modifier = modifier.pointerInput(engine) {
            // Any press or drag on the field steers the paddle; the target
            // persists after release, matching the web's sticky mouse target.
            awaitPointerEventScope {
                while (true) {
                    val event = awaitPointerEvent()
                    event.changes.firstOrNull { it.pressed }?.let { change ->
                        change.consume()
                        engine.setPlayerTarget(
                            change.position.y / size.height * PongEngine.FIELD_HEIGHT,
                        )
                    }
                }
            }
        },
    ) {
        // Reading the frame clock invalidates the canvas every animation
        // frame; the engine itself is not snapshot state.
        @Suppress("UNUSED_EXPRESSION")
        frameTimeNanos

        val fieldScale = size.width / PongEngine.FIELD_WIDTH
        scale(scale = fieldScale, pivot = Offset.Zero) {
            drawRect(
                color = PongColors.field,
                size = Size(PongEngine.FIELD_WIDTH, PongEngine.FIELD_HEIGHT),
            )
            drawLine(
                color = PongColors.centerLine,
                start = Offset(PongEngine.FIELD_WIDTH / 2f, 10f),
                end = Offset(PongEngine.FIELD_WIDTH / 2f, PongEngine.FIELD_HEIGHT - 10f),
                strokeWidth = 3f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 14f)),
            )
            drawRect(
                color = PongColors.player,
                topLeft = Offset(
                    PongEngine.PADDLE_MARGIN,
                    engine.leftPaddleY - PongEngine.PADDLE_HEIGHT / 2f,
                ),
                size = Size(PongEngine.PADDLE_WIDTH, PongEngine.PADDLE_HEIGHT),
            )
            drawRect(
                color = PongColors.bot,
                topLeft = Offset(
                    PongEngine.FIELD_WIDTH - PongEngine.PADDLE_MARGIN - PongEngine.PADDLE_WIDTH,
                    engine.rightPaddleY - PongEngine.PADDLE_HEIGHT / 2f,
                ),
                size = Size(PongEngine.PADDLE_WIDTH, PongEngine.PADDLE_HEIGHT),
            )
            // Ball with a short motion trail, like the web draw().
            val ball = engine.ball
            drawCircle(
                color = PongColors.ballTrail,
                radius = PongEngine.BALL_SIZE / 2.6f,
                center = Offset(ball.x - ball.vx * 14f, ball.y - ball.vy * 14f),
            )
            drawCircle(
                color = PongColors.ball,
                radius = PongEngine.BALL_SIZE / 2f,
                center = Offset(ball.x, ball.y),
            )
        }
    }
}

/**
 * Score header rendered as composables over the canvas (instead of canvas
 * text) so font scaling stays density-correct without manual sp math.
 */
@Composable
private fun ScoreReadout(leftScore: Int, rightScore: Int) {
    Row(modifier = Modifier.fillMaxWidth().padding(top = 10.dp)) {
        ScoreColumn(label = "PLAYER", score = leftScore, color = PongColors.player)
        ScoreColumn(label = "BOT", score = rightScore, color = PongColors.bot)
    }
}

@Composable
private fun RowScope.ScoreColumn(
    label: String,
    score: Int,
    color: Color,
) {
    Column(
        modifier = Modifier.weight(1f),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = label,
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = score.toString().padStart(2, '0'),
            color = color,
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun BoxScope.FieldOverlay(
    scrim: Color,
    title: String,
    subtitle: String?,
    color: Color,
) {
    Box(
        modifier = Modifier.matchParentSize().background(scrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = title,
                color = color,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            subtitle?.let {
                Text(
                    text = it,
                    color = color,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.Monospace,
                )
            }
        }
    }
}

/** Chunky monospace control button echoing the web console's toolbar. */
@Composable
private fun RetroButton(label: String, isLit: Boolean = false, onClick: () -> Unit) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(if (isLit) theme.colors.accent else theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, shape)
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            color = if (isLit) theme.colors.accentText else theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun StatusText(text: String) {
    val theme = LocalUiTheme.current
    Text(
        text = text,
        color = theme.colors.textSecondary,
        fontSize = theme.typography.sizes.xs,
        fontFamily = FontFamily.Monospace,
    )
}
