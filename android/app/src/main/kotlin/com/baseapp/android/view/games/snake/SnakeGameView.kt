package com.baseapp.android.view.games.snake

import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.abs
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

// Board geometry in field units: the web board is GRID_COLS x GRID_ROWS cells
// of 24px each. The view scales the whole board to the device uniformly.
private const val CELL = 24f
private const val BOARD_WIDTH = SnakeEngine.GRID_COLS * CELL
private const val BOARD_HEIGHT = SnakeEngine.GRID_ROWS * CELL

/**
 * Green-phosphor palette mirroring the web SnakePage.styles.css.ts / draw()
 * colors. The board keeps its own terminal look on both light and dark app
 * themes (why: the web playfield is hardcoded dark too — it is part of the
 * game's identity).
 */
private object SnakeColors {
    val ink = Color(0xFF020B04)
    val green = Color(0xFF42F578)
    val greenDim = Color(0xFF1D7A3C)
    val greenSoft = Color(0xFFB8FFD0)
    val amber = Color(0xFFFFD166)
    val gridLine = Color(0x1442F578) // rgba(66,245,120,0.08)
    val headGlow = Color(0x4042F578) // soft halo standing in for canvas shadowBlur
    val scanline = Color(0x08FFFFFF) // rgba(255,255,255,0.03)
    val crashScrim = Color(0xD1020B04) // rgba(2,11,4,0.82)
}

/** One saved high-score row, serialized to the same JSON shape as the web. */
@Serializable
internal data class SnakeHighScoreEntry(val name: String, val score: Int)

/**
 * High-score persistence via SharedPreferences, mirroring the web page's
 * localStorage table: key `snakebot-high-scores`, JSON array of
 * `{ name, score }`, top 10 by score. Unlike web there is no initials prompt
 * on touch — qualifying scores are recorded automatically as "BOT" (the web
 * page's default initials).
 */
internal class SnakeHighScoreStore(context: Context) {
    private val preferences =
        context.applicationContext.getSharedPreferences("snakebot", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    fun load(): List<SnakeHighScoreEntry> {
        val raw = preferences.getString(HIGH_SCORES_KEY, null) ?: return emptyList()
        return try {
            json.decodeFromString<List<SnakeHighScoreEntry>>(raw)
        } catch (_: Exception) {
            emptyList()
        }
    }

    /**
     * Records [score] if it qualifies (web rule: non-zero, and either the
     * table has room or it beats the current last place). Returns the table.
     */
    fun record(score: Int): List<SnakeHighScoreEntry> {
        var entries = load()
        val qualifies =
            score > 0 && (entries.size < MAX_HIGH_SCORES || score > (entries.lastOrNull()?.score ?: 0))
        if (!qualifies) {
            return entries
        }
        entries = (entries + SnakeHighScoreEntry(DEFAULT_NAME, score))
            .sortedByDescending { it.score }
            .take(MAX_HIGH_SCORES)
        preferences.edit().putString(HIGH_SCORES_KEY, json.encodeToString(entries)).apply()
        return entries
    }

    private companion object {
        const val HIGH_SCORES_KEY = "snakebot-high-scores"
        const val MAX_HIGH_SCORES = 10
        const val DEFAULT_NAME = "BOT"
    }
}

/**
 * Home surface for the `snake` pack — the native twin of the web SnakePage.
 * Rendering and touch input only: all rules live in [SnakeEngine] so the game
 * stays JVM-testable and in lockstep with the web version. No network, no
 * stores.
 *
 * A `withFrameNanos` loop drives the engine at the web's fixed tick pace (the
 * tick shrinks as the level rises); the Canvas reads the frame clock so it
 * redraws every frame while score/status text recomposes only on engine
 * events. Swipe on the board to steer.
 */
@Composable
fun SnakeGameView() {
    val theme = LocalUiTheme.current
    val context = LocalContext.current
    val engine = remember { SnakeEngine() }
    val highScores = remember { SnakeHighScoreStore(context) }
    var paused by remember { mutableStateOf(false) }
    var crashed by remember { mutableStateOf(false) }
    var score by remember { mutableIntStateOf(0) }
    var level by remember { mutableIntStateOf(1) }
    var bestScore by remember { mutableIntStateOf(highScores.load().firstOrNull()?.score ?: 0) }
    var frameTimeNanos by remember { mutableLongStateOf(0L) }

    LaunchedEffect(engine) {
        var lastTickNanos = 0L
        while (true) {
            withFrameNanos { now ->
                if (paused || crashed) {
                    // Drop the tick anchor so resuming waits one fresh tick
                    // instead of bursting through the missed time.
                    lastTickNanos = 0L
                } else if (lastTickNanos == 0L) {
                    lastTickNanos = now
                } else if ((now - lastTickNanos) / 1_000_000 >= engine.tickMs) {
                    lastTickNanos = now
                    val result = engine.step()
                    if (result.pointsScored > 0) {
                        score = engine.score
                        level = engine.level
                    }
                    if (result.crashed) {
                        crashed = true
                        val table = highScores.record(engine.score)
                        bestScore = maxOf(bestScore, table.firstOrNull()?.score ?: 0)
                    }
                }
                frameTimeNanos = now
            }
        }
    }

    fun newGame() {
        engine.newGame()
        crashed = false
        paused = false
        score = 0
        level = 1
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
            text = "SNAKEBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            RetroButton(label = "⟳ NEW GAME", onClick = ::newGame)
            RetroButton(
                label = if (paused) "▶ RESUME" else "❚❚ PAUSE",
                onClick = { if (!crashed) paused = !paused },
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
                    .aspectRatio(BOARD_WIDTH / BOARD_HEIGHT)
                    .clip(RoundedCornerShape(theme.radius.md))
                    .border(2.dp, SnakeColors.green, RoundedCornerShape(theme.radius.md)),
            ) {
                SnakeBoardCanvas(
                    engine = engine,
                    frameTimeNanos = frameTimeNanos,
                    modifier = Modifier.matchParentSize(),
                )
                if (crashed) {
                    TerminalOverlay(
                        title = "SYSTEM CRASH",
                        subtitle = "SCORE ${paddedScore(engine.score)}",
                        restartLabel = "⟳ RESTART",
                        onRestart = ::newGame,
                    )
                } else if (paused) {
                    TerminalOverlay(
                        title = "PAUSED",
                        subtitle = null,
                        restartLabel = null,
                        onRestart = null,
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            StatusText(text = "SCORE ${paddedScore(score)}")
            StatusText(text = "HI ${paddedScore(maxOf(bestScore, score))}")
            StatusText(text = "LV ${level.toString().padStart(2, '0')}")
        }

        StatusText(text = "SWIPE TO STEER · EAT CELLS, AVOID WALLS AND YOUR TAIL")
    }
}

/**
 * The terminal board. Draws in field coordinates under a uniform scale (the
 * parent enforces the 28x22-cell aspect ratio, so width-based scale fits both
 * axes). Swipes anywhere on the board pick one of the four directions from
 * the dominant drag axis; the engine rejects reversals itself, like the web
 * key handler.
 */
@Composable
private fun SnakeBoardCanvas(
    engine: SnakeEngine,
    frameTimeNanos: Long,
    modifier: Modifier = Modifier,
) {
    val textMeasurer = rememberTextMeasurer()
    Canvas(
        modifier = modifier.pointerInput(engine) {
            // Steering fires as soon as the accumulated drag crosses the
            // threshold (then re-arms), so a held finger can chain several
            // swipes without lifting.
            val threshold = 24.dp.toPx()
            var dragX = 0f
            var dragY = 0f
            detectDragGestures(
                onDragStart = {
                    dragX = 0f
                    dragY = 0f
                },
                onDrag = { change, amount ->
                    change.consume()
                    dragX += amount.x
                    dragY += amount.y
                    if (abs(dragX) >= threshold || abs(dragY) >= threshold) {
                        if (abs(dragX) > abs(dragY)) {
                            engine.setDirection(if (dragX > 0) 1 else -1, 0)
                        } else {
                            engine.setDirection(0, if (dragY > 0) 1 else -1)
                        }
                        dragX = 0f
                        dragY = 0f
                    }
                },
            )
        },
    ) {
        // Reading the frame clock invalidates the canvas every animation
        // frame; the engine itself is not snapshot state.
        @Suppress("UNUSED_EXPRESSION")
        frameTimeNanos

        val fieldScale = size.width / BOARD_WIDTH
        scale(scale = fieldScale, pivot = Offset.Zero) {
            drawRect(color = SnakeColors.ink, size = Size(BOARD_WIDTH, BOARD_HEIGHT))

            // Phosphor grid, same 8% green as the web draw().
            for (x in 0..SnakeEngine.GRID_COLS) {
                drawLine(
                    color = SnakeColors.gridLine,
                    start = Offset(x * CELL + 0.5f, 0f),
                    end = Offset(x * CELL + 0.5f, BOARD_HEIGHT),
                    strokeWidth = 1f,
                )
            }
            for (y in 0..SnakeEngine.GRID_ROWS) {
                drawLine(
                    color = SnakeColors.gridLine,
                    start = Offset(0f, y * CELL + 0.5f),
                    end = Offset(BOARD_WIDTH, y * CELL + 0.5f),
                    strokeWidth = 1f,
                )
            }

            // Snake: rounded segments with the bot face on the head, matching
            // the web draw() geometry (insets, corner radii, eye/mouth rects).
            // The web's canvas shadowBlur glow becomes a translucent halo.
            engine.snake.forEachIndexed { index, segment ->
                val isHead = index == 0
                val inset = if (isHead) 1f else 2f
                val originX = segment.x * CELL
                val originY = segment.y * CELL
                if (isHead) {
                    drawRoundRect(
                        color = SnakeColors.headGlow,
                        topLeft = Offset(originX - 2f, originY - 2f),
                        size = Size(CELL + 4f, CELL + 4f),
                        cornerRadius = CornerRadius(9f, 9f),
                    )
                }
                drawRoundRect(
                    color = if (isHead) SnakeColors.greenSoft else SnakeColors.green,
                    topLeft = Offset(originX + inset, originY + inset),
                    size = Size(CELL - inset * 2f, CELL - inset * 2f),
                    cornerRadius = if (isHead) CornerRadius(7f, 7f) else CornerRadius(8f, 8f),
                )
                if (isHead) {
                    val cx = originX + CELL / 2f
                    val cy = originY + CELL / 2f
                    drawRect(SnakeColors.ink, Offset(cx - 6f, cy - 3f), Size(4f, 4f))
                    drawRect(SnakeColors.ink, Offset(cx + 2f, cy - 3f), Size(4f, 4f))
                    drawRect(SnakeColors.ink, Offset(cx - 4f, cy + 3f), Size(8f, 2f))
                }
            }

            // CRT scanlines, the native stand-in for the web crtOverlay CSS.
            var scanY = 0f
            while (scanY < BOARD_HEIGHT) {
                drawRect(SnakeColors.scanline, Offset(0f, scanY), Size(BOARD_WIDTH, 1f))
                scanY += 3f
            }
        }

        // Food emoji at its cell center, sized like the web (CELL - 4). Text
        // is measured in device pixels, so it is drawn outside the field-unit
        // scale block at pre-scaled coordinates.
        val food = engine.food
        val foodLayout = textMeasurer.measure(
            text = food.kind,
            style = TextStyle(fontSize = ((CELL - 4f) * fieldScale).toSp()),
        )
        drawText(
            textLayoutResult = foodLayout,
            topLeft = Offset(
                (food.x * CELL + CELL / 2f) * fieldScale - foodLayout.size.width / 2f,
                (food.y * CELL + CELL / 2f + 1f) * fieldScale - foodLayout.size.height / 2f,
            ),
        )
    }
}

/** Web modal twin: amber headline over an ink scrim, optional restart button. */
@Composable
private fun BoxScope.TerminalOverlay(
    title: String,
    subtitle: String?,
    restartLabel: String?,
    onRestart: (() -> Unit)?,
) {
    Box(
        modifier = Modifier.matchParentSize().background(SnakeColors.crashScrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                text = title,
                color = SnakeColors.amber,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            subtitle?.let {
                Text(
                    text = it,
                    color = SnakeColors.green,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.Monospace,
                )
            }
            if (restartLabel != null && onRestart != null) {
                PhosphorButton(label = restartLabel, onClick = onRestart)
            }
        }
    }
}

/** Solid-green restart button echoing the web modal's primary button. */
@Composable
private fun PhosphorButton(label: String, onClick: () -> Unit) {
    val shape = RoundedCornerShape(4.dp)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(SnakeColors.green)
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            color = SnakeColors.ink,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
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

private fun paddedScore(score: Int): String = score.toString().padStart(6, '0')
