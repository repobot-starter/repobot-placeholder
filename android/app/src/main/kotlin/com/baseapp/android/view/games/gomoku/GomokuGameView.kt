package com.baseapp.android.view.games.gomoku

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.delay

/**
 * Wooden goban palette mirroring the web GomokuPage styles. The board keeps
 * its own warm wood look on both light and dark app themes (why: the web
 * playing surface is hardcoded wood too — it is part of the game's identity).
 */
private object GomokuColors {
    val wood = Color(0xFFDEB26A)
    val woodEdge = Color(0xFFB98A45)
    val gridLine = Color(0xBF3B2812) // rgba(59,40,18,0.75)
    val stoneShadow = Color(0x731E1004) // rgba(30,16,4,0.45)
    val blackHighlight = Color(0xFF5C5C60)
    val blackBody = Color(0xFF0A0A0C)
    val whiteHighlight = Color(0xFFFFFFFF)
    val whiteBody = Color(0xFFC9C2AE)
    val lastMove = Color(0xFFE05C3A)
    val winGlow = Color(0xFFFFD97A)
}

/** Milliseconds the bot "thinks" before replying, like the web page. */
private const val BOT_THINK_DELAY_MS = 300L

/**
 * Home surface for the `gomoku` pack — the native twin of the web GomokuPage.
 * Rendering and touch input only: all rules live in [GomokuEngine] so the
 * game stays JVM-testable and in lockstep with the web engine. No network,
 * no stores.
 *
 * Vs-bot only (the web 2P hotseat mode is dropped on mobile — tap-to-place
 * with the same three bot levels covers the core game). The human plays
 * black and always moves first.
 */
@Composable
fun GomokuGameView() {
    val theme = LocalUiTheme.current
    val engine = remember { GomokuEngine() }
    var level by remember { mutableStateOf(GomokuEngine.BotLevel.MEDIUM) }
    // Bumped after every board mutation so the Canvas and status recompose.
    var moveCount by remember { mutableIntStateOf(0) }
    var botThinking by remember { mutableStateOf(false) }

    // Bot reply: deferred so the player's stone paints first, like the web.
    LaunchedEffect(botThinking) {
        if (botThinking) {
            delay(BOT_THINK_DELAY_MS)
            engine.playBotMove()
            botThinking = false
            moveCount = engine.moveCount
        }
    }

    fun newGame() {
        engine.newGame()
        botThinking = false
        moveCount = engine.moveCount
    }

    val statusText = when {
        engine.winner == GomokuEngine.Stone.BLACK -> "YOU WIN — FIVE IN A ROW"
        engine.winner == GomokuEngine.Stone.WHITE -> "BOT WINS — FIVE IN A ROW"
        engine.isDraw -> "DRAW — BOARD FULL"
        botThinking -> "BOT THINKING…"
        else -> "YOUR MOVE (BLACK)"
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
            text = "GOMOKUBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            RetroButton(label = "⟳ NEW GAME", onClick = ::newGame)
            RetroButton(
                label = "↩ UNDO",
                onClick = {
                    if (engine.moveCount > 0 && !botThinking) {
                        engine.undoPair()
                        moveCount = engine.moveCount
                    }
                },
            )
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentAlignment = Alignment.Center,
        ) {
            GomokuBoardCanvas(
                engine = engine,
                moveCount = moveCount,
                onTapCell = { cell ->
                    if (!botThinking &&
                        engine.turn == GomokuEngine.Stone.BLACK &&
                        engine.place(cell)
                    ) {
                        moveCount = engine.moveCount
                        if (!engine.isOver) {
                            botThinking = true
                        }
                    }
                },
                modifier = Modifier
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(theme.radius.md))
                    .border(2.dp, GomokuColors.woodEdge, RoundedCornerShape(theme.radius.md)),
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            GomokuEngine.BotLevel.entries.forEach { option ->
                RetroButton(
                    label = option.name,
                    isLit = option == level,
                    onClick = {
                        level = option
                        engine.level = option
                    },
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            StatusText(text = statusText)
            StatusText(text = "MOVE $moveCount")
        }
    }
}

/**
 * The goban: draws wood, grid lines, star points, stones with a subtle drop
 * shadow, the last-move marker, and the winning-line glow. Taps are mapped
 * back to the nearest intersection.
 */
@Composable
private fun GomokuBoardCanvas(
    engine: GomokuEngine,
    moveCount: Int,
    onTapCell: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    // Star-point (hoshi) rows/columns of a 15x15 goban.
    val starLines = remember { listOf(3, 7, 11) }

    Canvas(
        modifier = modifier.pointerInput(engine) {
            detectTapGestures { position ->
                val cellSize = size.width / GomokuEngine.BOARD_SIZE.toFloat()
                val col = (position.x / cellSize).toInt()
                val row = (position.y / cellSize).toInt()
                if (row in 0 until GomokuEngine.BOARD_SIZE &&
                    col in 0 until GomokuEngine.BOARD_SIZE
                ) {
                    onTapCell(GomokuEngine.cellAt(row, col))
                }
            }
        },
    ) {
        // Reading moveCount invalidates the canvas after every placement; the
        // engine itself is not snapshot state.
        @Suppress("UNUSED_EXPRESSION")
        moveCount

        val cellSize = size.width / GomokuEngine.BOARD_SIZE
        val inset = cellSize / 2f
        val far = size.width - inset

        drawRect(color = GomokuColors.wood)

        // Grid lines: intersections sit at cell centers, like the web board.
        for (index in 0 until GomokuEngine.BOARD_SIZE) {
            val offset = (index + 0.5f) * cellSize
            drawLine(
                color = GomokuColors.gridLine,
                start = Offset(inset, offset),
                end = Offset(far, offset),
                strokeWidth = 1.5f,
            )
            drawLine(
                color = GomokuColors.gridLine,
                start = Offset(offset, inset),
                end = Offset(offset, far),
                strokeWidth = 1.5f,
            )
        }

        // Star points (hoshi).
        for (row in starLines) {
            for (col in starLines) {
                if (engine.board[GomokuEngine.cellAt(row, col)] == null) {
                    drawCircle(
                        color = GomokuColors.gridLine,
                        radius = cellSize * 0.09f,
                        center = intersectionCenter(row, col, cellSize),
                    )
                }
            }
        }

        // Stones, then the win glow / last-move marker.
        val winCells = engine.winLine?.toSet() ?: emptySet()
        val stoneRadius = cellSize * 0.42f
        for (cell in 0 until GomokuEngine.CELL_COUNT) {
            val stone = engine.board[cell] ?: continue
            val center = intersectionCenter(GomokuEngine.rowOf(cell), GomokuEngine.colOf(cell), cellSize)

            drawCircle(
                color = GomokuColors.stoneShadow,
                radius = stoneRadius,
                center = center + Offset(cellSize * 0.04f, cellSize * 0.06f),
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = if (stone == GomokuEngine.Stone.BLACK) {
                        listOf(GomokuColors.blackHighlight, GomokuColors.blackBody)
                    } else {
                        listOf(GomokuColors.whiteHighlight, GomokuColors.whiteBody)
                    },
                    center = center + Offset(-stoneRadius * 0.35f, -stoneRadius * 0.4f),
                    radius = stoneRadius * 1.6f,
                ),
                radius = stoneRadius,
                center = center,
            )

            if (cell in winCells) {
                drawCircle(
                    color = GomokuColors.winGlow,
                    radius = stoneRadius + cellSize * 0.05f,
                    center = center,
                    style = Stroke(width = cellSize * 0.08f),
                )
            } else if (cell == engine.lastMove) {
                drawCircle(
                    color = GomokuColors.lastMove,
                    radius = cellSize * 0.1f,
                    center = center,
                )
            }
        }
    }
}

private fun intersectionCenter(row: Int, col: Int, cellSize: Float): Offset =
    Offset((col + 0.5f) * cellSize, (row + 0.5f) * cellSize)

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
