package com.baseapp.android.view.games.astro

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * Neon cockpit palette mirroring the web AstroGame draw() colors. The field
 * keeps its own near-black space look on both light and dark app themes
 * (why: the web playfield is hardcoded dark too — it is part of the game's
 * identity).
 */
private object AstroColors {
    val space = Color(0xFF05030F)
    val asteroid = Color(0xFFB98CFF)
    val asteroidGlow = Color(0x40B98CFF)
    val bullet = Color(0xFF7CF29C)
    val ship = Color(0xFF57C8FF)
    val shipGlow = Color(0x4057C8FF)
    val flame = Color(0xFFFFB347)
    val asteroidDebris = Color(0xFFFF9D5C)
    val hudAmber = Color(0xFFFFD166)
    val gameOverScrim = Color(0xBF05030F) // rgba(5,3,15,0.75)
    val pausedScrim = Color(0x9905030F) // rgba(5,3,15,0.6)
}

/** One background star (render-only; the web builds these in `makeStars`). */
private class AstroStar(val x: Float, val y: Float, val depth: Float)

/**
 * Home surface for the `astro` pack — the native twin of the web AstroPage.
 * Rendering and touch input only: all rules live in [AstroEngine] so the
 * physics stay JVM-testable and in lockstep with the web game. No network,
 * no stores.
 *
 * A `withFrameNanos` loop drives the engine; the Canvas reads the frame
 * clock so it redraws every frame while HUD text recomposes only when its
 * value actually changes.
 *
 * Touch controls (an intentional divergence from the web's keyboard): the
 * web maps ←/→/↑/space to held keys, so the natural touch translation is
 * four hold-to-activate pads — ◀ ▶ turn pads for the left thumb, THRUST and
 * FIRE for the right. Pads were chosen over a virtual stick because the
 * ship only has three digital inputs (turn is a fixed rate, thrust is
 * on/off); a stick would fake analog control the engine doesn't have. Each
 * pad is its own pointer surface, so multi-touch chords (turn + thrust +
 * fire) work.
 */
@Composable
fun AstroGameView() {
    val theme = LocalUiTheme.current
    val engine = remember { AstroEngine() }
    val stars = remember {
        List(90) {
            AstroStar(
                x = Random.nextFloat() * AstroEngine.FIELD_WIDTH,
                y = Random.nextFloat() * AstroEngine.FIELD_HEIGHT,
                depth = 0.3f + Random.nextFloat() * 0.7f,
            )
        }
    }
    var paused by remember { mutableStateOf(false) }
    var gameOver by remember { mutableStateOf(false) }
    var score by remember { mutableIntStateOf(0) }
    var lives by remember { mutableIntStateOf(AstroEngine.STARTING_LIVES) }
    var level by remember { mutableIntStateOf(1) }
    var frameTimeNanos by remember { mutableLongStateOf(0L) }

    LaunchedEffect(engine) {
        var lastNanos = 0L
        while (true) {
            withFrameNanos { now ->
                if (lastNanos != 0L && !paused && !gameOver) {
                    val result = engine.step((now - lastNanos) / 1_000_000_000f)
                    // Same-value writes to snapshot state skip recomposition,
                    // so mirroring the HUD every frame is cheap.
                    score = engine.score
                    lives = engine.lives
                    level = engine.level
                    if (result.isGameOver) {
                        gameOver = true
                    }
                }
                lastNanos = now
                frameTimeNanos = now
            }
        }
    }

    fun newGame() {
        engine.newGame()
        gameOver = false
        paused = false
        score = 0
        lives = AstroEngine.STARTING_LIVES
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
            text = "ASTROBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            RetroButton(label = "⟳ NEW GAME", onClick = ::newGame)
            RetroButton(
                label = if (paused) "▶ RESUME" else "❚❚ PAUSE",
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
                    .aspectRatio(AstroEngine.FIELD_WIDTH / AstroEngine.FIELD_HEIGHT)
                    .clip(RoundedCornerShape(theme.radius.md)),
            ) {
                AstroFieldCanvas(
                    engine = engine,
                    stars = stars,
                    frameTimeNanos = frameTimeNanos,
                    modifier = Modifier.matchParentSize(),
                )
                HudReadout(score = score, lives = lives, level = level)
                if (gameOver) {
                    FieldOverlay(
                        scrim = AstroColors.gameOverScrim,
                        title = "SHIP DESTROYED",
                        subtitle = "FINAL SCORE ${score.toString().padStart(8, '0')}",
                        color = AstroColors.asteroidDebris,
                        actionLabel = "⟳ NEW GAME",
                        onAction = ::newGame,
                    )
                }
                if (!gameOver && paused) {
                    FieldOverlay(
                        scrim = AstroColors.pausedScrim,
                        title = "PAUSED",
                        subtitle = null,
                        color = AstroColors.hudAmber,
                        actionLabel = "▶ RESUME",
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
            StatusText(text = if (paused) "● PAUSED." else "● BOT ONLINE.")
            StatusText(text = "SECTOR BONUS +${AstroEngine.SECTOR_BONUS}")
        }
    }
}

/**
 * The playfield. Draws in field coordinates under a uniform scale (the
 * parent enforces the 820x620 aspect ratio, so width-based scale fits both
 * axes): parallax starfield, lumpy asteroid outlines, bullets, debris
 * particles and the ship with its thrust flame — the web draw() beat for
 * beat. A translucent wide stroke under each neon outline stands in for the
 * web's canvas shadowBlur glow.
 */
@Composable
private fun AstroFieldCanvas(
    engine: AstroEngine,
    stars: List<AstroStar>,
    frameTimeNanos: Long,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier = modifier) {
        val fieldScale = size.width / AstroEngine.FIELD_WIDTH
        scale(scale = fieldScale, pivot = Offset.Zero) {
            drawRect(
                color = AstroColors.space,
                size = Size(AstroEngine.FIELD_WIDTH, AstroEngine.FIELD_HEIGHT),
            )

            // Parallax starfield drifting slowly right, like the web draw().
            val seconds = frameTimeNanos / 1_000_000_000f
            for (star in stars) {
                val drift = seconds * 4f * star.depth
                val x = (star.x + drift).mod(AstroEngine.FIELD_WIDTH)
                val dot = if (star.depth > 0.75f) 2f else 1f
                drawRect(
                    color = Color.White.copy(alpha = 0.25f + star.depth * 0.55f),
                    topLeft = Offset(x, star.y),
                    size = Size(dot, dot),
                )
            }

            for (asteroid in engine.asteroids) {
                drawAsteroid(asteroid)
            }

            for (bullet in engine.bullets) {
                drawRect(
                    color = AstroColors.bullet,
                    topLeft = Offset(bullet.x - 2f, bullet.y - 2f),
                    size = Size(4f, 4f),
                )
            }

            // Particles fade out with remaining life, exactly like the web.
            for (particle in engine.particles) {
                val base = when (particle.kind) {
                    AstroEngine.ParticleKind.ASTEROID_DEBRIS -> AstroColors.asteroidDebris
                    AstroEngine.ParticleKind.SHIP_DEBRIS -> AstroColors.ship
                }
                drawRect(
                    color = base.copy(alpha = particle.life.coerceIn(0f, 1f)),
                    topLeft = Offset(particle.x, particle.y),
                    size = Size(3f, 3f),
                )
            }

            // Ship (blinks at ~8Hz while the respawn shield is up, like the
            // web's `Math.floor(now / 120) % 2`). Uses the engine clock so
            // pausing pauses the blink too.
            val blinkOn = (engine.elapsed / 0.12f).toInt() % 2 == 0
            if (!engine.isOver && (!engine.isShipInvulnerable || blinkOn)) {
                drawShip(engine.ship)
            }
        }
    }
}

/**
 * Lumpy neon outline rotated by the rock's spin — the web bakes the lump
 * multipliers once per asteroid, so the silhouette is stable while it spins.
 */
private fun DrawScope.drawAsteroid(asteroid: AstroEngine.Asteroid) {
    val path = Path()
    asteroid.lumps.forEachIndexed { index, lump ->
        val angle = index.toFloat() / asteroid.lumps.size * PI.toFloat() * 2f + asteroid.rotation
        val radius = asteroid.radius * lump
        val px = asteroid.x + cos(angle) * radius
        val py = asteroid.y + sin(angle) * radius
        if (index == 0) {
            path.moveTo(px, py)
        } else {
            path.lineTo(px, py)
        }
    }
    path.close()
    drawPath(path, color = AstroColors.asteroidGlow, style = Stroke(width = 6f))
    drawPath(path, color = AstroColors.asteroid, style = Stroke(width = 2f))
}

/**
 * Ship silhouette from the web draw(): nose at (0,-16), wings at (±11,13),
 * tail notch at (0,7), rotated so the heading faces the nose, plus the
 * flickering thrust flame. Points are rotated by hand so no canvas
 * transforms are needed.
 */
private fun DrawScope.drawShip(ship: AstroEngine.Ship) {
    val rotation = ship.angle + PI.toFloat() / 2f
    fun local(x: Float, y: Float): Offset = Offset(
        ship.x + x * cos(rotation) - y * sin(rotation),
        ship.y + x * sin(rotation) + y * cos(rotation),
    )

    if (ship.thrusting) {
        val flame = Path()
        val tip = local(0f, 24f + Random.nextFloat() * 8f)
        val left = local(-5f, 14f)
        val right = local(5f, 14f)
        flame.moveTo(left.x, left.y)
        flame.lineTo(tip.x, tip.y)
        flame.lineTo(right.x, right.y)
        flame.close()
        drawPath(flame, color = AstroColors.flame)
    }

    val hull = Path()
    val nose = local(0f, -16f)
    val wingRight = local(11f, 13f)
    val tail = local(0f, 7f)
    val wingLeft = local(-11f, 13f)
    hull.moveTo(nose.x, nose.y)
    hull.lineTo(wingRight.x, wingRight.y)
    hull.lineTo(tail.x, tail.y)
    hull.lineTo(wingLeft.x, wingLeft.y)
    hull.close()
    drawPath(hull, color = AstroColors.shipGlow, style = Stroke(width = 6f))
    drawPath(hull, color = AstroColors.ship, style = Stroke(width = 2f))
}

/**
 * Score / sector / lives header rendered as composables over the canvas
 * (instead of canvas text) so font scaling stays density-correct — the
 * native stand-in for the web's cockpit side panels.
 */
@Composable
private fun HudReadout(score: Int, lives: Int, level: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = "SCORE ${score.toString().padStart(8, '0')}",
            color = AstroColors.bullet,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = sectorLabel(level),
            color = AstroColors.hudAmber,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "SHIPS ${"▲".repeat(maxOf(0, lives)).ifEmpty { "—" }}",
            color = AstroColors.ship,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** "01 SECTOR A" style label, mirroring the web status panel. */
private fun sectorLabel(level: Int): String {
    val letter = 'A' + (minOf(26, level) - 1)
    return "${level.toString().padStart(2, '0')} SECTOR $letter"
}

/**
 * Turn pads on the left thumb, thrust/fire on the right thumb. Every pad is
 * hold-to-activate and simply toggles the matching engine input flag.
 */
@Composable
private fun TouchControls(engine: AstroEngine) {
    val theme = LocalUiTheme.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            HoldPad(label = "◀") { pressed -> engine.isTurningLeft = pressed }
            HoldPad(label = "▶") { pressed -> engine.isTurningRight = pressed }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            HoldPad(label = "▲") { pressed -> engine.isThrusting = pressed }
            HoldPad(label = "●") { pressed -> engine.isFiring = pressed }
        }
    }
}

/**
 * A hold-to-activate control pad. Watches raw pointer events (not
 * `clickable`) because we need press *and* release, and each pad must track
 * its own finger so several pads can be held at once.
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
                    fontSize = 13.sp,
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
