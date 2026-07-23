package com.baseapp.android.view.games.chimney

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
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Night-street palette mirroring the web ChimneyPage draw() colors. The
 * rooftops keep their own dark look on both light and dark app themes (why:
 * the web playfield is hardcoded dark too — it is part of the game's
 * identity).
 */
private object ChimneyColors {
    val skyTop = Color(0xFF0A1030)
    val skyBottom = Color(0xFF1A2247)
    val moon = Color(0xFFFDF3C9)
    val moonGlow = Color(0x40FDF3C9)
    val star = Color(0xB3FDF3C9) // rgba(253,243,201,0.7)
    val skyline = Color(0xE610162E) // rgba(16,22,46,0.9)
    val streetGlow = Color(0x38FFBE55) // rgba(255,190,85,0.22)
    val roof = Color(0xFF1C2338)
    val brick = Color(0xFFA2543C)
    val brickDark = Color(0xFF7C3F2D)
    val chimneyOpening = Color(0xFF0A0D18)
    val smoke = Color(0x47DFE4FF) // rgba(223,228,255,0.28)
    val windowLit = Color(0xFFFFD98A)
    val windowDark = Color(0xFF131A30)
    val robot = Color(0xFF8DF2B6)
    val robotGlow = Color(0x408DF2B6)
    val robotEye = Color(0xFF08130F)
    val hudAmber = Color(0xFFFFBE55)
    val hudMint = Color(0xFF8DF2B6)
    val hudEmber = Color(0xFFFF7761)
    val modalText = Color(0xFFDFE4FF)
    val modalScrim = Color(0xD104060C) // rgba(4,6,12,0.82)

    /** Facade paint jobs by house index — same palette as the web WALL_COLORS. */
    val walls = listOf(
        Color(0xFF33405F), Color(0xFF3C3357), Color(0xFF2F4A55), Color(0xFF45384F),
    )
}

/** Best-run persistence, mirroring the web page's localStorage key. */
private class ChimneyHighScoreStore(context: Context) {
    private val prefs =
        context.applicationContext.getSharedPreferences("chimneybot", Context.MODE_PRIVATE)

    fun load(): Int = prefs.getInt("high-score", 0)

    fun save(score: Int) {
        prefs.edit().putInt("high-score", score).apply()
    }
}

/** Game-over card copy — the same lines as the web endingTitle map. */
private fun endingTitle(ending: ChimneyEngine.EventKind): String = when (ending) {
    ChimneyEngine.EventKind.COOKED -> "YOU GOT COOKED"
    ChimneyEngine.EventKind.FELL -> "YOU FELL"
    ChimneyEngine.EventKind.BONKED -> "BONKED"
    ChimneyEngine.EventKind.HOP -> "" // Unreachable: a hop never ends a run.
}

/** Game-over card copy — the same lines as the web endingLine map. */
private fun endingLine(ending: ChimneyEngine.EventKind): String = when (ending) {
    ChimneyEngine.EventKind.COOKED ->
        "Straight down the chimney and onto the family's dinner stove. Tonight's special: you."
    ChimneyEngine.EventKind.FELL ->
        "You missed the next roof and dropped into the alley. The street is not a house."
    ChimneyEngine.EventKind.BONKED ->
        "Face first into the bricks. The chimney won that one."
    ChimneyEngine.EventKind.HOP -> "" // Unreachable: a hop never ends a run.
}

/**
 * Home surface for the `chimney` pack — the native twin of the web
 * ChimneyPage. Rendering and touch input only: all rules live in
 * [ChimneyEngine] so the running stays JVM-testable and in lockstep with the
 * web game. No network, no stores.
 *
 * A `withFrameNanos` loop drives the engine; the Canvas reads the frame
 * clock so it redraws every frame while HUD text recomposes only when its
 * value actually changes.
 *
 * Touch controls (an intentional divergence from the web's keyboard): the
 * web holds Space/↑ to jump, so the natural touch translation is press
 * anywhere on the street (plus a big jump pad) with the release wired to
 * the jump cut — a tap hops, a hold soars, exactly like the held key.
 */
@Composable
fun ChimneyGameView() {
    val theme = LocalUiTheme.current
    val context = LocalContext.current
    val engine = remember { ChimneyEngine().apply { newGame() } }
    val highScores = remember { ChimneyHighScoreStore(context) }
    var paused by remember { mutableStateOf(false) }
    var ending by remember { mutableStateOf<ChimneyEngine.EventKind?>(null) }
    var houses by remember { mutableIntStateOf(0) }
    var pace by remember { mutableIntStateOf(0) }
    var bestScore by remember { mutableIntStateOf(highScores.load()) }

    LaunchedEffect(engine) {
        var lastNanos = 0L
        while (true) {
            withFrameNanos { now ->
                if (lastNanos != 0L && !paused && ending == null) {
                    // Same 50 ms dt clamp as the web page, so a dropped frame
                    // never teleports the runner through a chimney.
                    val events = engine.step(min(0.05f, (now - lastNanos) / 1_000_000_000f))
                    // Same-value writes to snapshot state skip recomposition,
                    // so mirroring the HUD every frame is cheap.
                    houses = engine.housesCleared
                    pace = engine.speed.roundToInt()
                    for (event in events) {
                        if (event.kind != ChimneyEngine.EventKind.HOP) {
                            ending = event.kind
                            if (event.value > bestScore) {
                                bestScore = event.value
                                highScores.save(event.value)
                            }
                        }
                    }
                }
                lastNanos = now
            }
        }
    }

    fun newGame() {
        engine.newGame()
        ending = null
        paused = false
        houses = 0
        pace = 0
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
            text = "CHIMNEYBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            RetroButton(label = "🤖 RESTART RUN", onClick = ::newGame)
            RetroButton(
                label = if (paused) "▶ RESUME" else "❚❚ CATCH BREATH",
                onClick = { if (ending == null) paused = !paused },
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
                    .aspectRatio(ChimneyEngine.FIELD_WIDTH / ChimneyEngine.FIELD_HEIGHT)
                    .clip(RoundedCornerShape(theme.radius.md))
                    // Press anywhere on the street to jump; raw pointer
                    // events (not `clickable`) because the jump cut needs
                    // the release too.
                    .pointerInput(Unit) {
                        awaitPointerEventScope {
                            var held = false
                            while (true) {
                                val event = awaitPointerEvent()
                                val pressed = event.changes.any { it.pressed }
                                if (pressed != held) {
                                    held = pressed
                                    if (pressed) engine.pressJump() else engine.releaseJump()
                                }
                            }
                        }
                    },
            ) {
                ChimneyFieldCanvas(
                    engine = engine,
                    modifier = Modifier.matchParentSize(),
                )
                HudReadout(houses = houses, best = max(bestScore, houses), pace = pace)
                ending?.let { kind ->
                    EndingOverlay(
                        ending = kind,
                        score = houses,
                        bestScore = bestScore,
                        onRestart = ::newGame,
                    )
                }
                if (ending == null && paused) {
                    PausedOverlay(onResume = { paused = false })
                }
            }
        }

        JumpPad(engine = engine)

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            StatusText(text = if (paused) "● CATCHING BREATH." else "● NIGHT RUN — STOVEPIPE ROW.")
            StatusText(
                text = if (pace > 300) "⚠ FULL SPRINT — MIND THE CHIMNEYS"
                else "NEVER LAND IN A CHIMNEY",
            )
        }
    }
}

/**
 * The street. Draws in field coordinates under a uniform scale (the parent
 * enforces the 720x420 aspect ratio, so width-based scale fits both axes):
 * night sky, star field, moon, parallax skyline, street glow, row houses
 * with their chimneys and smoke, and the runner robot — the web draw() beat
 * for beat. Translucent halo shapes stand in for the web's canvas
 * shadowBlur glows.
 */
@Composable
private fun ChimneyFieldCanvas(
    engine: ChimneyEngine,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier = modifier) {
        val fieldScale = size.width / ChimneyEngine.FIELD_WIDTH
        scale(scale = fieldScale, pivot = Offset.Zero) {
            val camera = engine.playerWorldX - ChimneyEngine.PLAYER_X

            // Night sky.
            drawRect(
                brush = Brush.verticalGradient(
                    colors = listOf(ChimneyColors.skyTop, ChimneyColors.skyBottom),
                    startY = 0f,
                    endY = ChimneyEngine.FIELD_HEIGHT,
                ),
                size = Size(ChimneyEngine.FIELD_WIDTH, ChimneyEngine.FIELD_HEIGHT),
            )

            // Stars: fixed star field, slow parallax so pausing freezes it.
            for (index in 0 until 40) {
                val starX = (index * 173 + 61 - camera * 0.08f).mod(ChimneyEngine.FIELD_WIDTH)
                val starY = ((index * 97 + 23) % 170).toFloat()
                val starSize = if (index % 5 == 0) 2f else 1f
                drawRect(
                    color = ChimneyColors.star,
                    topLeft = Offset(starX, starY),
                    size = Size(starSize, starSize),
                )
            }

            // Moon with a soft halo (the web's shadowBlur).
            val moonCenter = Offset(ChimneyEngine.FIELD_WIDTH - 92f, 66f)
            drawCircle(color = ChimneyColors.moonGlow, radius = 38f, center = moonCenter)
            drawCircle(color = ChimneyColors.moon, radius = 26f, center = moonCenter)

            // Distant skyline, half-speed parallax.
            for (index in 0 until 12) {
                val towerWidth = 90f + (index % 4) * 34f
                val towerHeight = 70f + (index % 5) * 26f
                val wrapped = (index * 160 - camera * 0.4f) % (ChimneyEngine.FIELD_WIDTH + 240f)
                val towerX =
                    if (wrapped < -towerWidth) wrapped + ChimneyEngine.FIELD_WIDTH + 240f
                    else wrapped
                drawRect(
                    color = ChimneyColors.skyline,
                    topLeft = Offset(towerX - 120f, ChimneyEngine.FIELD_HEIGHT - towerHeight - 60f),
                    size = Size(towerWidth, towerHeight + 60f),
                )
            }

            // Street glow at the bottom of the canyon.
            drawRect(
                brush = Brush.verticalGradient(
                    colors = listOf(ChimneyColors.streetGlow.copy(alpha = 0f), ChimneyColors.streetGlow),
                    startY = ChimneyEngine.FIELD_HEIGHT - 70f,
                    endY = ChimneyEngine.FIELD_HEIGHT,
                ),
                topLeft = Offset(0f, ChimneyEngine.FIELD_HEIGHT - 70f),
                size = Size(ChimneyEngine.FIELD_WIDTH, 70f),
            )

            // Houses.
            for (house in engine.houses) {
                val screenX = house.x - camera
                if (screenX > ChimneyEngine.FIELD_WIDTH || screenX + house.width < 0f) {
                    continue
                }
                drawHouse(
                    x = screenX,
                    roofY = house.roofY,
                    width = house.width,
                    index = house.index,
                    chimneyOffset = house.chimneyOffset,
                    camera = camera,
                )
            }

            // The runner robot.
            drawRunner(engine)
        }
    }
}

/** One row house: facade, roof cap, warm window grid, and its chimney. */
private fun DrawScope.drawHouse(
    x: Float,
    roofY: Float,
    width: Float,
    index: Int,
    chimneyOffset: Float?,
    camera: Float,
) {
    // Facade.
    drawRect(
        color = ChimneyColors.walls[index % ChimneyColors.walls.size],
        topLeft = Offset(x, roofY),
        size = Size(width, ChimneyEngine.FIELD_HEIGHT - roofY),
    )

    // Roof cap.
    drawRect(
        color = ChimneyColors.roof,
        topLeft = Offset(x - 3f, roofY - 6f),
        size = Size(width + 6f, 8f),
    )

    // Windows: a deterministic grid, most lit warm, some dark.
    val cols = floor((width - 24f) / 42f).toInt().coerceAtLeast(1)
    val rows = floor((ChimneyEngine.FIELD_HEIGHT - roofY - 30f) / 52f).toInt().coerceAtLeast(1)
    for (row in 0 until rows) {
        for (col in 0 until cols) {
            val lit = (index * 7 + row * 3 + col * 5) % 4 != 0
            drawRect(
                color = if (lit) ChimneyColors.windowLit else ChimneyColors.windowDark,
                topLeft = Offset(x + 14f + col * 42f, roofY + 18f + row * 52f),
                size = Size(20f, 26f),
            )
        }
    }

    // Chimney with its dark opening and a drifting smoke puff.
    if (chimneyOffset != null) {
        val chimneyX = x + chimneyOffset
        val chimneyTop = roofY - ChimneyEngine.CHIMNEY_HEIGHT
        drawRect(
            color = ChimneyColors.brick,
            topLeft = Offset(chimneyX, chimneyTop),
            size = Size(ChimneyEngine.CHIMNEY_WIDTH, ChimneyEngine.CHIMNEY_HEIGHT),
        )
        drawRect(
            color = ChimneyColors.brickDark,
            topLeft = Offset(chimneyX - 2f, chimneyTop),
            size = Size(ChimneyEngine.CHIMNEY_WIDTH + 4f, 5f),
        )
        // The opening — the part that cooks you.
        drawRect(
            color = ChimneyColors.chimneyOpening,
            topLeft = Offset(chimneyX + ChimneyEngine.CHIMNEY_LIP, chimneyTop + 2f),
            size = Size(ChimneyEngine.CHIMNEY_OPENING, 6f),
        )

        // Smoke drifts on world position so it freezes when paused.
        val drift = (chimneyX + camera) * 0.7f
        for (puff in 0 until 3) {
            val wobble = sin((drift + puff * 40f) / 26f) * 6f
            drawCircle(
                color = ChimneyColors.smoke,
                radius = 5f + puff * 2f,
                center = Offset(
                    chimneyX + ChimneyEngine.CHIMNEY_WIDTH / 2f + wobble,
                    chimneyTop - 12f - puff * 16f,
                ),
            )
        }
    }
}

/** The mint runner: glowing body, head, forward eye, and striding legs. */
private fun DrawScope.drawRunner(engine: ChimneyEngine) {
    val x = ChimneyEngine.PLAYER_X
    val y = engine.playerY

    // Soft glow behind the bot (the web's shadowBlur).
    drawRoundRect(
        color = ChimneyColors.robotGlow,
        topLeft = Offset(x, y + 8f),
        size = Size(ChimneyEngine.PLAYER_WIDTH, ChimneyEngine.PLAYER_HEIGHT - 14f),
        cornerRadius = CornerRadius(3f, 3f),
        style = Stroke(width = 6f),
    )

    // Body.
    drawRect(
        color = ChimneyColors.robot,
        topLeft = Offset(x, y + 8f),
        size = Size(ChimneyEngine.PLAYER_WIDTH, ChimneyEngine.PLAYER_HEIGHT - 14f),
    )
    // Head.
    drawRect(
        color = ChimneyColors.robot,
        topLeft = Offset(x + 3f, y),
        size = Size(ChimneyEngine.PLAYER_WIDTH - 6f, 10f),
    )
    // Eye, looking ahead.
    drawRect(
        color = ChimneyColors.robotEye,
        topLeft = Offset(x + ChimneyEngine.PLAYER_WIDTH - 10f, y + 3f),
        size = Size(5f, 4f),
    )
    // Legs: mid-air tuck vs alternating stride from world distance.
    if (engine.velocityY != 0f) {
        drawRect(
            color = ChimneyColors.robot,
            topLeft = Offset(x + 3f, y + ChimneyEngine.PLAYER_HEIGHT - 6f),
            size = Size(8f, 6f),
        )
        drawRect(
            color = ChimneyColors.robot,
            topLeft = Offset(x + ChimneyEngine.PLAYER_WIDTH - 11f, y + ChimneyEngine.PLAYER_HEIGHT - 8f),
            size = Size(8f, 6f),
        )
    } else {
        val stride = floor(engine.playerWorldX / 18f).toInt() % 2 == 0
        drawRect(
            color = ChimneyColors.robot,
            topLeft = Offset(x + if (stride) 2f else 6f, y + ChimneyEngine.PLAYER_HEIGHT - 6f),
            size = Size(7f, 6f),
        )
        drawRect(
            color = ChimneyColors.robot,
            topLeft = Offset(
                x + if (stride) ChimneyEngine.PLAYER_WIDTH - 9f else ChimneyEngine.PLAYER_WIDTH - 13f,
                y + ChimneyEngine.PLAYER_HEIGHT - 6f,
            ),
            size = Size(7f, 6f),
        )
    }
}

/**
 * Houses / best / pace header rendered as composables over the canvas
 * (instead of canvas text) so font scaling stays density-correct — the
 * native stand-in for the web's run-log side panel.
 */
@Composable
private fun HudReadout(houses: Int, best: Int, pace: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "HOUSES ${houses.toString().padStart(6, '0')}",
            color = ChimneyColors.hudAmber,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "BEST ${best.toString().padStart(6, '0')}",
            color = ChimneyColors.hudMint,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "$pace U/S",
            color = ChimneyColors.hudEmber,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/**
 * The one-button control deck: press to jump, hold to soar, release to cut
 * the hop — the native twin of the web's held Space bar. Raw pointer events
 * (not `clickable`) because the engine needs press *and* release.
 */
@Composable
private fun JumpPad(engine: ChimneyEngine) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.md)
    var held by remember { mutableStateOf(false) }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(64.dp)
            .clip(shape)
            .background(if (held) theme.colors.hover else theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, shape)
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
                            if (pressed) engine.pressJump() else engine.releaseJump()
                        }
                    }
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "⬆ JUMP — HOLD TO SOAR",
            color = theme.colors.textPrimary,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/**
 * The game-over card: one title/line pair per ending, the stove scene for a
 * cooked run, the final tally, and restart — the web modal beat for beat.
 */
@Composable
private fun BoxScope.EndingOverlay(
    ending: ChimneyEngine.EventKind,
    score: Int,
    bestScore: Int,
    onRestart: () -> Unit,
) {
    Box(
        modifier = Modifier.matchParentSize().background(ChimneyColors.modalScrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (ending == ChimneyEngine.EventKind.COOKED) {
                Text(text = "🏠🔥🍲", fontSize = 32.sp)
            }
            Text(
                text = endingTitle(ending),
                color = ChimneyColors.hudEmber,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            Text(
                text = endingLine(ending),
                color = ChimneyColors.modalText,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.Center,
            )
            Text(
                text = "HOUSES CLEARED ${score.toString().padStart(6, '0')}",
                color = ChimneyColors.modalText,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Monospace,
            )
            if (score >= bestScore && score > 0) {
                Text(
                    text = "★ NEW NEIGHBORHOOD RECORD ★",
                    color = ChimneyColors.hudMint,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
            }
            RetroButton(label = "🤖 RUN IT BACK", onClick = onRestart)
        }
    }
}

/** The pause card — the web "CATCHING BREATH" modal. */
@Composable
private fun BoxScope.PausedOverlay(onResume: () -> Unit) {
    Box(
        modifier = Modifier.matchParentSize().background(ChimneyColors.modalScrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = "CATCHING BREATH",
                color = ChimneyColors.hudAmber,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            RetroButton(label = "▶ BACK TO THE ROOFTOPS", onClick = onResume)
        }
    }
}

/** Chunky monospace control button echoing the web cabinet's toolbar. */
@Composable
private fun RetroButton(label: String, onClick: () -> Unit) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, shape)
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            color = theme.colors.textPrimary,
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
