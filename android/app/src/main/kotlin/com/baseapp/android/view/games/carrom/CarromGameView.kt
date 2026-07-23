package com.baseapp.android.view.games.carrom

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.min
import kotlin.math.sin

/**
 * Warm parlor palette mirroring the web CarromGame draw() colors. The board
 * keeps its plywood look on both light and dark app themes (why: the web
 * board is hardcoded warm wood too — it is part of the game's identity).
 */
private object CarromColors {
    val woodLight = Color(0xFFE8C48A)
    val woodMid = Color(0xFFDCB271)
    val woodLine = Color(0xFF8A5A28)
    val frame = Color(0xFF5B3A1C)
    val pocket = Color(0xFF241408)
    val whiteCoin = Color(0xFFF5E9D0)
    val whiteCoinRim = Color(0xFFC8B48D)
    val blackCoin = Color(0xFF3D2A1E)
    val blackCoinRim = Color(0xFF241811)
    val queenCoin = Color(0xFFB3232A)
    val queenCoinRim = Color(0xFF7D1218)
    val strikerBody = Color(0xFFF0E7D4)
    val strikerRing = Color(0xFF4A6FA5)
    val guide = Color(0xBFFFFFFF) // rgba(255,255,255,0.75)
    val band = Color(0x8C3C2814) // rgba(60,40,20,0.55)
    val powerOk = Color(0xFF2E7D32)
    val powerHot = Color(0xFFC0392B)
    val baselineGlow = Color(0x1F4A6FA5) // rgba(74,111,165,0.12)
    val scrim = Color(0x9E241408) // rgba(36,20,8,0.62)
    val scrimText = Color(0xFFF5E9D0)
}

/** Pull-back distance (board units) mapping to a full-power flick. */
private const val MAX_PULL = 220.0

/** The bot "thinks" for this long before flicking, in ms. */
private const val BOT_DELAY_MS = 900L

/** Pause on the board-over scrim before the next board racks itself, in ms. */
private const val NEXT_BOARD_DELAY_MS = 2600L

/**
 * Home surface for the `carrom` pack — the native twin of the web
 * CarromPage. Rendering and touch input only: all physics and rules live in
 * [CarromEngine] so the sim stays JVM-testable and in lockstep with the web
 * game. No network, no stores. Mobile is vs-bot only, like the Pong port.
 *
 * A `withFrameNanos` loop drives the engine; the Canvas reads the frame
 * clock so it redraws every frame while the score/message chrome
 * recomposes only on engine events.
 */
@Composable
fun CarromGameView() {
    val theme = LocalUiTheme.current
    val engine = remember { CarromEngine() }
    val input = remember { CarromInputState() }
    var botLevel by remember { mutableStateOf(CarromEngine.BotLevel.MEDIUM) }
    var message by remember { mutableStateOf("You break. Drag back from the striker to flick.") }
    var playerScore by remember { mutableStateOf(0) }
    var botScore by remember { mutableStateOf(0) }
    var frameTimeNanos by remember { mutableLongStateOf(0L) }

    LaunchedEffect(engine) {
        var lastNanos = 0L
        var botStrikeAtMs: Long? = null
        var nextBoardAtMs: Long? = null
        while (true) {
            withFrameNanos { now ->
                val nowMs = now / 1_000_000
                if (lastNanos != 0L) {
                    // Bot turn: think briefly, then flick.
                    if (engine.phase == CarromEngine.Phase.AIMING && engine.currentPlayer == 1) {
                        val strikeAt = botStrikeAtMs
                        if (strikeAt == null) {
                            botStrikeAtMs = nowMs + BOT_DELAY_MS
                        } else if (nowMs >= strikeAt) {
                            botStrikeAtMs = null
                            engine.botStrike(botLevel)
                        }
                    } else {
                        botStrikeAtMs = null
                    }

                    // Auto-rack the next board after the win scrim showed.
                    if (engine.phase == CarromEngine.Phase.BOARD_OVER) {
                        val rackAt = nextBoardAtMs
                        if (rackAt == null) {
                            nextBoardAtMs = nowMs + NEXT_BOARD_DELAY_MS
                        } else if (nowMs >= rackAt) {
                            nextBoardAtMs = null
                            engine.nextBoard()
                            message = if (engine.currentPlayer == 0) {
                                "New board. You break."
                            } else {
                                "New board. Bot breaks."
                            }
                        }
                    } else {
                        nextBoardAtMs = null
                    }

                    // Clamp dt like the web loop so backgrounding never
                    // teleports pieces.
                    val dt = min(0.05, (now - lastNanos) / 1_000_000_000.0)
                    for (event in engine.step(dt)) {
                        when (event) {
                            is CarromEngine.Event.StrikeResolved -> {
                                message = summaryMessage(event.summary)
                            }
                            is CarromEngine.Event.BoardOver -> {
                                playerScore = engine.matchScore[0]
                                botScore = engine.matchScore[1]
                                message = if (event.winner == 0) {
                                    "You clear the board for ${event.points}!"
                                } else {
                                    "Bot clears the board for ${event.points}."
                                }
                            }
                            is CarromEngine.Event.MatchOver -> {
                                message = if (event.winner == 0) {
                                    "You win the match!"
                                } else {
                                    "Bot wins the match."
                                }
                            }
                            else -> Unit
                        }
                    }
                }
                lastNanos = now
                frameTimeNanos = now
            }
        }
    }

    fun newMatch() {
        engine.newMatch()
        input.aimDrag = null
        playerScore = 0
        botScore = 0
        message = "You break. Drag back from the striker to flick."
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
            text = "CARROMBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            ScoreText(label = "YOU", score = playerScore)
            ScoreText(label = "BOT", score = botScore)
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentAlignment = Alignment.Center,
        ) {
            CarromBoardCanvas(
                engine = engine,
                input = input,
                frameTimeNanos = frameTimeNanos,
                modifier = Modifier
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(theme.radius.md)),
            )
        }

        Text(
            text = message,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontFamily = FontFamily.Serif,
            modifier = Modifier.fillMaxWidth(),
        )

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            ParlorButton(label = "⟳ NEW MATCH", onClick = ::newMatch)
            CarromEngine.BotLevel.entries.forEach { level ->
                ParlorButton(
                    label = level.name,
                    isLit = level == botLevel,
                    onClick = { botLevel = level },
                )
            }
        }

        Text(
            text = "Press the baseline to place the striker · drag back from it to flick · match to ${CarromEngine.MATCH_TARGET}",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.xs,
            fontFamily = FontFamily.Serif,
        )
    }
}

/**
 * Touch state that the render loop reads but that must not trigger
 * recomposition: the active slingshot drag point in board units.
 */
private class CarromInputState {
    var aimDrag: Offset? = null
}

/**
 * The board. Draws in board units under a uniform scale (the parent
 * enforces the square aspect ratio) and maps touches back into board space:
 * a drag starting near the striker aims slingshot-style, a press along the
 * baseline slides the striker.
 */
@Composable
private fun CarromBoardCanvas(
    engine: CarromEngine,
    input: CarromInputState,
    frameTimeNanos: Long,
    modifier: Modifier = Modifier,
) {
    Canvas(
        modifier = modifier.pointerInput(engine) {
            awaitPointerEventScope {
                var aiming = false
                while (true) {
                    val event = awaitPointerEvent()
                    val change = event.changes.firstOrNull() ?: continue
                    val boardScale = CarromEngine.BOARD_SIZE / size.width
                    val x = change.position.x * boardScale
                    val y = change.position.y * boardScale
                    val humanTurn = engine.phase == CarromEngine.Phase.AIMING && engine.currentPlayer == 0

                    if (change.pressed && humanTurn) {
                        change.consume()
                        val striker = engine.striker
                        if (!aiming && input.aimDrag == null) {
                            // First touch decides the gesture: grab the
                            // striker to aim, or slide it along the baseline.
                            if (hypot(x - striker.x, y - striker.y) <= CarromEngine.STRIKER_RADIUS * 2.4) {
                                aiming = true
                                input.aimDrag = Offset(x.toFloat(), y.toFloat())
                            } else if (abs(y - CarromEngine.baselineY(0)) < 44) {
                                engine.setStrikerX(x)
                            }
                        } else if (aiming) {
                            input.aimDrag = Offset(x.toFloat(), y.toFloat())
                        }
                    } else {
                        // Release: fire the slingshot if it was pulled.
                        val drag = input.aimDrag
                        if (aiming && drag != null && humanTurn) {
                            val striker = engine.striker
                            val pullX = drag.x - striker.x
                            val pullY = drag.y - striker.y
                            val power = min(1.0, hypot(pullX, pullY) / MAX_PULL)
                            if (power > 0.06) {
                                engine.strike(-pullX, -pullY, power)
                            }
                        }
                        aiming = false
                        input.aimDrag = null
                    }
                }
            }
        },
    ) {
        // Reading the frame clock invalidates the canvas every animation
        // frame; the engine itself is not snapshot state.
        @Suppress("UNUSED_EXPRESSION")
        frameTimeNanos

        val fieldScale = (size.width / CarromEngine.BOARD_SIZE).toFloat()
        scale(scale = fieldScale, pivot = Offset.Zero) {
            drawBoard()
            for ((pocketX, pocketY) in CarromEngine.POCKETS) {
                drawCircle(
                    color = CarromColors.pocket,
                    radius = CarromEngine.POCKET_RADIUS.toFloat(),
                    center = Offset(pocketX.toFloat(), pocketY.toFloat()),
                )
            }
            for (piece in engine.pieces) {
                if (piece.onBoard && piece.kind != CarromEngine.PieceKind.STRIKER) {
                    drawCoin(piece)
                }
            }
            val showStriker = engine.striker.onBoard &&
                engine.phase != CarromEngine.Phase.BOARD_OVER &&
                engine.phase != CarromEngine.Phase.MATCH_OVER
            if (showStriker) {
                drawStriker(engine.striker)
            }
            if (engine.phase == CarromEngine.Phase.AIMING) {
                drawBaselineHighlight(engine.currentPlayer)
                val drag = input.aimDrag
                if (engine.currentPlayer == 0 && drag != null) {
                    drawAimOverlay(engine, drag)
                }
            }
            if (engine.phase == CarromEngine.Phase.BOARD_OVER ||
                engine.phase == CarromEngine.Phase.MATCH_OVER
            ) {
                drawRect(
                    color = CarromColors.scrim,
                    size = Size(CarromEngine.BOARD_SIZE.toFloat(), CarromEngine.BOARD_SIZE.toFloat()),
                )
            }
        }
    }
}

private fun summaryMessage(summary: CarromEngine.StrikeSummary): String {
    val shooter = if (summary.shooter == 0) "You" else "Bot"
    val next = if (summary.shooter == 0) "Bot" else "You"
    return when {
        summary.foul -> "Foul! $shooter sank the striker — a coin returns. $next to play."
        summary.queenOutcome == CarromEngine.QueenOutcome.COVERED -> "$shooter covered the queen!"
        summary.queenOutcome == CarromEngine.QueenOutcome.PENDING ->
            "$shooter pocketed the queen — cover it next strike!"
        summary.queenOutcome == CarromEngine.QueenOutcome.RETURNED ->
            "No cover — the queen returns to center. $next to play."
        summary.keptTurn -> "$shooter pocketed ${summary.ownPocketed} — again!"
        else -> "$next to play."
    }
}

/** Warm plywood field, frame, center rosette, pocket arrows and baselines. */
private fun DrawScope.drawBoard() {
    val board = CarromEngine.BOARD_SIZE.toFloat()
    val center = board / 2f
    drawRect(color = CarromColors.woodMid, size = Size(board, board))
    drawCircle(
        color = CarromColors.woodLight,
        radius = board * 0.62f,
        center = Offset(center, center),
    )
    drawRect(
        color = CarromColors.frame,
        topLeft = Offset(5f, 5f),
        size = Size(board - 10f, board - 10f),
        style = Stroke(width = 10f),
    )

    val lineStroke = Stroke(width = 2f)
    drawCircle(
        color = CarromColors.woodLine,
        radius = 78f,
        center = Offset(center, center),
        style = lineStroke,
    )
    drawCircle(
        color = CarromColors.woodLine,
        radius = 16f,
        center = Offset(center, center),
        style = lineStroke,
    )

    // Diagonal arrows from each pocket toward the center rosette.
    for ((pocketX, pocketY) in CarromEngine.POCKETS) {
        val dirX = if (pocketX < center) 1f else -1f
        val dirY = if (pocketY < center) 1f else -1f
        drawLine(
            color = CarromColors.woodLine,
            start = Offset(pocketX.toFloat() + dirX * 44f, pocketY.toFloat() + dirY * 44f),
            end = Offset(pocketX.toFloat() + dirX * 150f, pocketY.toFloat() + dirY * 150f),
            strokeWidth = 2f,
        )
        drawCircle(
            color = CarromColors.woodLine,
            radius = 10f,
            center = Offset(pocketX.toFloat() + dirX * 160f, pocketY.toFloat() + dirY * 160f),
            style = lineStroke,
        )
    }

    // Baselines (double rails with end rings), horizontal and vertical.
    val margin = CarromEngine.BASELINE_MARGIN.toFloat()
    val railGap = 9f
    for (y in listOf(CarromEngine.baselineY(0).toFloat(), CarromEngine.baselineY(1).toFloat())) {
        for (offset in listOf(-railGap, railGap)) {
            drawLine(
                color = CarromColors.woodLine,
                start = Offset(margin, y + offset),
                end = Offset(board - margin, y + offset),
                strokeWidth = 2f,
            )
        }
        for (x in listOf(margin, board - margin)) {
            drawCircle(
                color = CarromColors.woodLine,
                radius = railGap + 4f,
                center = Offset(x, y),
                style = lineStroke,
            )
        }
    }
    for (x in listOf(CarromEngine.baselineY(0).toFloat(), CarromEngine.baselineY(1).toFloat())) {
        for (offset in listOf(-railGap, railGap)) {
            drawLine(
                color = CarromColors.woodLine,
                start = Offset(x + offset, margin),
                end = Offset(x + offset, board - margin),
                strokeWidth = 2f,
            )
        }
        for (y in listOf(margin, board - margin)) {
            drawCircle(
                color = CarromColors.woodLine,
                radius = railGap + 4f,
                center = Offset(x, y),
                style = lineStroke,
            )
        }
    }
}

private fun DrawScope.drawCoin(piece: CarromEngine.Piece) {
    val (fill, rim) = when (piece.kind) {
        CarromEngine.PieceKind.QUEEN -> CarromColors.queenCoin to CarromColors.queenCoinRim
        CarromEngine.PieceKind.WHITE -> CarromColors.whiteCoin to CarromColors.whiteCoinRim
        else -> CarromColors.blackCoin to CarromColors.blackCoinRim
    }
    val r = piece.radius.toFloat()
    drawCircle(
        color = Color(0x38000000),
        radius = r,
        center = Offset(piece.x.toFloat() + 2f, piece.y.toFloat() + 3f),
    )
    drawCircle(color = fill, radius = r, center = Offset(piece.x.toFloat(), piece.y.toFloat()))
    drawCircle(
        color = rim,
        radius = r,
        center = Offset(piece.x.toFloat(), piece.y.toFloat()),
        style = Stroke(width = 2f),
    )
    drawCircle(
        color = rim,
        radius = r * 0.55f,
        center = Offset(piece.x.toFloat(), piece.y.toFloat()),
        style = Stroke(width = 1.5f),
    )
}

private fun DrawScope.drawStriker(striker: CarromEngine.Piece) {
    val r = striker.radius.toFloat()
    val cx = striker.x.toFloat()
    val cy = striker.y.toFloat()
    drawCircle(color = Color(0x40000000), radius = r, center = Offset(cx + 2f, cy + 4f))
    drawCircle(color = CarromColors.strikerBody, radius = r, center = Offset(cx, cy))
    drawCircle(
        color = CarromColors.strikerRing,
        radius = r,
        center = Offset(cx, cy),
        style = Stroke(width = 2.5f),
    )
    // Six-point star inlay.
    for (i in 0 until 6) {
        val angle = i * PI / 3
        drawLine(
            color = CarromColors.strikerRing,
            start = Offset(cx, cy),
            end = Offset(
                cx + (cos(angle) * r * 0.7).toFloat(),
                cy + (sin(angle) * r * 0.7).toFloat(),
            ),
            strokeWidth = 1.4f,
        )
    }
}

private fun DrawScope.drawBaselineHighlight(player: Int) {
    val margin = CarromEngine.BASELINE_MARGIN.toFloat()
    drawRect(
        color = CarromColors.baselineGlow,
        topLeft = Offset(margin - 14f, CarromEngine.baselineY(player).toFloat() - 22f),
        size = Size(CarromEngine.BOARD_SIZE.toFloat() - 2f * (margin - 14f), 44f),
    )
}

/** Slingshot band, first-leg dashed guide and the power arc. */
private fun DrawScope.drawAimOverlay(
    engine: CarromEngine,
    drag: Offset,
) {
    val striker = engine.striker
    val cx = striker.x.toFloat()
    val cy = striker.y.toFloat()
    val pullX = drag.x - cx
    val pullY = drag.y - cy
    val pull = hypot(pullX, pullY)
    if (pull < 1f) {
        return
    }
    val power = min(1f, pull / MAX_PULL.toFloat())

    // Elastic band back to the finger.
    drawLine(
        color = CarromColors.band,
        start = Offset(cx, cy),
        end = drag,
        strokeWidth = 3f,
    )

    // Straight dashed guide out the opposite way (first leg of the shot).
    val guideLength = 260f
    drawLine(
        color = CarromColors.guide,
        start = Offset(cx, cy),
        end = Offset(cx - pullX / pull * guideLength, cy - pullY / pull * guideLength),
        strokeWidth = 2f,
        pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f)),
    )

    // Power arc around the striker.
    val arcRadius = CarromEngine.STRIKER_RADIUS.toFloat() + 8f
    drawArc(
        color = if (power > 0.85f) CarromColors.powerHot else CarromColors.powerOk,
        startAngle = -90f,
        sweepAngle = power * 360f,
        useCenter = false,
        topLeft = Offset(cx - arcRadius, cy - arcRadius),
        size = Size(arcRadius * 2f, arcRadius * 2f),
        style = Stroke(width = 5f),
    )
}

@Composable
private fun ScoreText(label: String, score: Int) {
    val theme = LocalUiTheme.current
    Text(
        text = "$label $score",
        color = theme.colors.textPrimary,
        fontSize = theme.typography.sizes.md,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Serif,
    )
}

/** Chunky serif control button echoing the web parlor's toolbar. */
@Composable
private fun ParlorButton(label: String, isLit: Boolean = false, onClick: () -> Unit) {
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
            fontFamily = FontFamily.Serif,
        )
    }
}
