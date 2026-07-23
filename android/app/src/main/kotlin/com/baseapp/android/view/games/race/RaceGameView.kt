package com.baseapp.android.view.games.race

import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.roundToInt

/**
 * Night-race palette mirroring the web RacePage draw() colors. The road
 * keeps its own dark look on both light and dark app themes (why: the web
 * playfield is hardcoded dark too — it is part of the game's identity).
 */
private object RaceColors {
    val grass = Color(0xFF08130A)
    val asphalt = Color(0xFF14141D)
    val laneDash = Color(0xFF3C3C52)
    val rumblePink = Color(0xFFFF6B81)
    val rumbleWhite = Color(0xFFF4F4F8)
    val player = Color(0xFF57C8FF)
    val playerGlow = Color(0x4057C8FF)
    val nitro = Color(0xFFFFB347)
    val hudAmber = Color(0xFFFFD166)
    val hudGreen = Color(0xFF7CF29C)
    val cabin = Color(0xC7080A12)
    val headlight = Color(0xFFFDF6C9)
    val taillight = Color(0xFFFF3B30)
    val gameOverScrim = Color(0xCC08130A) // rgba(8,19,10,0.8)
    val pausedScrim = Color(0x9908130A) // rgba(8,19,10,0.6)

    /** Traffic paint jobs by `kind` — same palette as the web TRAFFIC_COLORS. */
    val traffic = listOf(
        Color(0xFFFF6B81), Color(0xFFFFD166), Color(0xFFB98CFF), Color(0xFF7CF29C),
    )
}

/** High-score persistence, mirroring the web page's localStorage key. */
private class RaceHighScoreStore(context: Context) {
    private val prefs =
        context.applicationContext.getSharedPreferences("racebot", Context.MODE_PRIVATE)

    fun load(): Int = prefs.getInt("high-score", 0)

    fun save(score: Int) {
        prefs.edit().putInt("high-score", score).apply()
    }
}

/**
 * Home surface for the `race` pack — the native twin of the web RacePage.
 * Rendering and touch input only: all rules live in [RaceEngine] so the
 * driving stays JVM-testable and in lockstep with the web game. No network,
 * no stores.
 *
 * A `withFrameNanos` loop drives the engine; the Canvas reads the frame
 * clock so it redraws every frame while HUD text recomposes only when its
 * value actually changes.
 *
 * Touch controls (an intentional divergence from the web's keyboard): the
 * web taps ←/→ to change lane and holds ↑/Shift for nitro, so the natural
 * touch translation is two tap pads for steering plus one hold pad for
 * nitro. Tap pads (not swipes) because a lane change is a discrete input
 * the engine consumes instantly; the nitro pad is hold-to-activate because
 * the gauge drains while held, exactly like the held key.
 */
@Composable
fun RaceGameView() {
    val theme = LocalUiTheme.current
    val context = LocalContext.current
    val engine = remember { RaceEngine() }
    val highScores = remember { RaceHighScoreStore(context) }
    var paused by remember { mutableStateOf(false) }
    var gameOver by remember { mutableStateOf(false) }
    var score by remember { mutableIntStateOf(0) }
    var kph by remember { mutableIntStateOf(0) }
    var nitro by remember { mutableFloatStateOf(1f) }
    var bestScore by remember { mutableIntStateOf(highScores.load()) }

    LaunchedEffect(engine) {
        var lastNanos = 0L
        while (true) {
            withFrameNanos { now ->
                if (lastNanos != 0L && !paused && !gameOver) {
                    val result = engine.step((now - lastNanos) / 1_000_000_000f)
                    // Same-value writes to snapshot state skip recomposition,
                    // so mirroring the HUD every frame is cheap.
                    score = engine.score
                    kph = (engine.effectiveSpeed / RaceEngine.UNITS_PER_METER * 3.6f).roundToInt()
                    nitro = engine.nitro
                    if (result.isGameOver) {
                        gameOver = true
                        if (engine.score > bestScore) {
                            bestScore = engine.score
                            highScores.save(engine.score)
                        }
                    }
                }
                lastNanos = now
            }
        }
    }

    fun newGame() {
        engine.newGame()
        gameOver = false
        paused = false
        score = 0
        kph = 0
        nitro = 1f
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
            text = "RACEBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            RetroButton(label = "⟳ RESTART", onClick = ::newGame)
            RetroButton(
                label = if (paused) "▶ RESUME" else "❚❚ PIT STOP",
                onClick = { if (!gameOver) paused = !paused },
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
                    .aspectRatio(RaceEngine.FIELD_WIDTH / RaceEngine.FIELD_HEIGHT)
                    .clip(RoundedCornerShape(theme.radius.md)),
            ) {
                RaceFieldCanvas(
                    engine = engine,
                    modifier = Modifier.matchParentSize(),
                )
                HudReadout(score = score, kph = kph, nitro = nitro)
                if (gameOver) {
                    FieldOverlay(
                        scrim = RaceColors.gameOverScrim,
                        title = "WRECKED",
                        subtitle = "FINAL SCORE ${score.toString().padStart(8, '0')}" +
                            if (score >= bestScore && score > 0) " · ★ NEW LAP RECORD ★"
                            else " · BEST ${bestScore.toString().padStart(8, '0')}",
                        color = RaceColors.rumblePink,
                        actionLabel = "⟳ RESTART RACE",
                        onAction = ::newGame,
                    )
                }
                if (!gameOver && paused) {
                    FieldOverlay(
                        scrim = RaceColors.pausedScrim,
                        title = "PIT STOP",
                        subtitle = null,
                        color = RaceColors.hudAmber,
                        actionLabel = "▶ BACK TO THE TRACK",
                        onAction = { paused = false },
                    )
                }
            }
        }

        TouchControls(engine = engine)

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            StatusText(text = if (paused) "● IN THE PITS." else "● BOT ON TRACK.")
            StatusText(text = "OVERTAKE +${RaceEngine.OVERTAKE_BONUS}")
        }
    }
}

/**
 * The road. Draws in field coordinates under a uniform scale (the parent
 * enforces the 420x720 aspect ratio, so width-based scale fits both axes):
 * grass shoulders, rumble strips, dashed lane dividers, traffic, and the
 * player car with its nitro flame — the web draw() beat for beat. A
 * translucent wide stroke under the player body stands in for the web's
 * canvas shadowBlur glow.
 */
@Composable
private fun RaceFieldCanvas(
    engine: RaceEngine,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier = modifier) {
        val fieldScale = size.width / RaceEngine.FIELD_WIDTH
        scale(scale = fieldScale, pivot = Offset.Zero) {
            drawRect(
                color = RaceColors.grass,
                size = Size(RaceEngine.FIELD_WIDTH, RaceEngine.FIELD_HEIGHT),
            )
            drawRect(
                color = RaceColors.asphalt,
                topLeft = Offset(RaceEngine.ROAD_LEFT, 0f),
                size = Size(RaceEngine.ROAD_WIDTH, RaceEngine.FIELD_HEIGHT),
            )

            // Everything painted on the road scrolls by distance traveled.
            val scroll = engine.distanceMeters * RaceEngine.UNITS_PER_METER

            // Rumble strips on both road edges.
            val stripePeriod = 48f
            val stripeOffset = scroll.mod(stripePeriod)
            var stripeY = -stripePeriod
            var stripeIndex = 0
            while (stripeY < RaceEngine.FIELD_HEIGHT + stripePeriod) {
                val color = if (stripeIndex % 2 == 0) RaceColors.rumblePink else RaceColors.rumbleWhite
                drawRect(
                    color = color,
                    topLeft = Offset(RaceEngine.ROAD_LEFT - 10f, stripeY + stripeOffset),
                    size = Size(10f, stripePeriod / 2f),
                )
                drawRect(
                    color = color,
                    topLeft = Offset(
                        RaceEngine.ROAD_LEFT + RaceEngine.ROAD_WIDTH,
                        stripeY + stripeOffset,
                    ),
                    size = Size(10f, stripePeriod / 2f),
                )
                stripeY += stripePeriod
                stripeIndex += 1
            }

            // Dashed lane dividers.
            val dashPeriod = 68f
            val dashOffset = scroll.mod(dashPeriod)
            for (lane in 1 until RaceEngine.LANE_COUNT) {
                val x = RaceEngine.ROAD_LEFT + RaceEngine.LANE_WIDTH * lane
                var dashY = -dashPeriod
                while (dashY < RaceEngine.FIELD_HEIGHT + dashPeriod) {
                    drawRect(
                        color = RaceColors.laneDash,
                        topLeft = Offset(x - 3f, dashY + dashOffset),
                        size = Size(6f, 40f),
                    )
                    dashY += dashPeriod
                }
            }

            // Traffic (tail lights face the player — everyone drives the
            // same way).
            for (car in engine.traffic) {
                drawCar(
                    centerX = car.x,
                    topY = car.y,
                    color = RaceColors.traffic[car.kind % RaceColors.traffic.size],
                    isPlayer = false,
                )
            }

            // Player car with the nitro flame behind the rear bumper.
            if (engine.isNitroActive) {
                val flame = Path()
                flame.moveTo(engine.playerX - 10f, RaceEngine.PLAYER_Y + RaceEngine.CAR_LENGTH - 4f)
                flame.lineTo(
                    engine.playerX,
                    RaceEngine.PLAYER_Y + RaceEngine.CAR_LENGTH + 26f + scroll.mod(9f),
                )
                flame.lineTo(engine.playerX + 10f, RaceEngine.PLAYER_Y + RaceEngine.CAR_LENGTH - 4f)
                flame.close()
                drawPath(flame, color = RaceColors.nitro)
            }
            drawCar(
                centerX = engine.playerX,
                topY = RaceEngine.PLAYER_Y,
                color = RaceColors.player,
                isPlayer = true,
            )
        }
    }
}

/** One car: glowing rounded body, cabin glass, and head/tail lights. */
private fun DrawScope.drawCar(centerX: Float, topY: Float, color: Color, isPlayer: Boolean) {
    val left = centerX - RaceEngine.CAR_WIDTH / 2f
    val bodySize = Size(RaceEngine.CAR_WIDTH, RaceEngine.CAR_LENGTH)
    if (isPlayer) {
        // Soft glow behind the hero car (the web's shadowBlur).
        drawRoundRect(
            color = RaceColors.playerGlow,
            topLeft = Offset(left, topY),
            size = bodySize,
            cornerRadius = CornerRadius(12f, 12f),
            style = Stroke(width = 8f),
        )
    }
    drawRoundRect(
        color = color,
        topLeft = Offset(left, topY),
        size = bodySize,
        cornerRadius = CornerRadius(12f, 12f),
    )

    // Cabin glass.
    val cabinY = topY + if (isPlayer) 18f else RaceEngine.CAR_LENGTH - 52f
    drawRoundRect(
        color = RaceColors.cabin,
        topLeft = Offset(left + 8f, cabinY),
        size = Size(RaceEngine.CAR_WIDTH - 16f, 34f),
        cornerRadius = CornerRadius(7f, 7f),
    )

    // Player shows headlights up the road; traffic shows tail lights.
    val lightColor = if (isPlayer) RaceColors.headlight else RaceColors.taillight
    val lightY = if (isPlayer) topY + 2f else topY + RaceEngine.CAR_LENGTH - 6f
    drawRect(color = lightColor, topLeft = Offset(left + 6f, lightY), size = Size(12f, 4f))
    drawRect(
        color = lightColor,
        topLeft = Offset(left + RaceEngine.CAR_WIDTH - 18f, lightY),
        size = Size(12f, 4f),
    )
}

/**
 * Score / speed / nitro header rendered as composables over the canvas
 * (instead of canvas text) so font scaling stays density-correct — the
 * native stand-in for the web's pit-wall side panels.
 */
@Composable
private fun HudReadout(score: Int, kph: Int, nitro: Float) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "SCORE ${score.toString().padStart(8, '0')}",
            color = RaceColors.hudGreen,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "$kph KM/H",
            color = RaceColors.hudAmber,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        // Nitro gauge.
        Box(
            modifier = Modifier
                .width(64.dp)
                .height(12.dp)
                .border(1.dp, RaceColors.nitro),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(2.dp),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(nitro.coerceIn(0f, 1f))
                        .fillMaxSize()
                        .background(RaceColors.nitro),
                )
            }
        }
    }
}

/**
 * Steering tap pads on the left thumb, the nitro hold pad on the right. The
 * steer pads fire once per press (a lane change is discrete); the nitro pad
 * toggles the engine flag on press and release.
 */
@Composable
private fun TouchControls(engine: RaceEngine) {
    val theme = LocalUiTheme.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            HoldPad(label = "◀") { pressed -> if (pressed) engine.steerLeft() }
            HoldPad(label = "▶") { pressed -> if (pressed) engine.steerRight() }
        }
        HoldPad(label = "🔥") { pressed -> engine.isBoosting = pressed }
    }
}

/**
 * A press-aware control pad. Watches raw pointer events (not `clickable`)
 * because we need press *and* release, and each pad must track its own
 * finger so steering and nitro can be worked at the same time.
 */
@Composable
private fun HoldPad(label: String, onHold: (Boolean) -> Unit) {
    val theme = LocalUiTheme.current
    var held by remember { mutableStateOf(false) }
    Box(
        modifier = Modifier
            .size(64.dp)
            .clip(CircleShape)
            .background(if (held) theme.colors.hover else theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, CircleShape)
            // Keyed on Unit: the pad outlives recompositions and the lambda
            // only mutates the long-lived engine, so restarts are never
            // needed and would only drop an in-flight press.
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        val event = awaitPointerEvent()
                        val pressed = event.changes.any { it.pressed }
                        if (pressed != held) {
                            held = pressed
                            onHold(pressed)
                        }
                    }
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = theme.colors.textPrimary,
            fontSize = 20.sp,
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
    actionLabel: String,
    onAction: () -> Unit,
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
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.Monospace,
                )
            }
            RetroButton(label = actionLabel, onClick = onAction)
        }
    }
}

/** Chunky monospace control button echoing the web cockpit's toolbar. */
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
