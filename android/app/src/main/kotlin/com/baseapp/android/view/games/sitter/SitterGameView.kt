package com.baseapp.android.view.games.sitter

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.ceil

/**
 * Warm "cardboard house" palette echoing the web SitterPage's
 * parchment-and-wood look. The house keeps its own colors on both light and
 * dark app themes — like the Pong field, the game surface is part of the
 * game's identity.
 */
private object SitterColors {
    val wall = Color(0xFF4A3826)
    val floor = Color(0xFFF7ECD7)
    val floodedFloor = Color(0xFFBCD9E8)
    val roomLabel = Color(0xFF6B563D)
    val ringTrack = Color(0x2E4A3826) // rgba(74,56,38,0.18)
    val holdRing = Color(0xFF2F8F83)
    val messBg = Color(0xFFFFD9D0)
    val urgent = Color(0xFFC73E2E)
    val bannerBg = Color(0xFFFFE3A6)
    val bannerText = Color(0xFF7A3B12)
    val card = Color(0xFFFFF6E5)
    val cardText = Color(0xFF4A3826)
    val stars = Color(0xFFD99A26)
    val scrim = Color(0x73000000) // rgba(0,0,0,0.45)
}

private enum class SitterPhase { IDLE, PLAYING, RATING }

/**
 * Home surface for the `sitter` pack — the native twin of the web SitterPage.
 * Rendering and touch input only: all rules live in [SitterEngine] so the
 * game stays JVM-testable and in lockstep with the web game. No network, no
 * stores.
 *
 * Art approach: like the web page, the whole game is drawn with emoji — the
 * rooms are parchment panels with emoji furniture, kids and mishaps are emoji
 * sprites, and the tool tray is emoji buttons. The web's conic severity ring
 * becomes a `drawArc` sweep that shifts yellow → red as a mishap ages; visual
 * parity with the web CSS is a non-goal, matching its silliness is the goal.
 *
 * A `withFrameNanos` loop drives `SitterEngine.step` with real frame dt while
 * a shift is playing; reading the frame clock recomposes the tree each frame,
 * the same pattern as PongGameView.
 */
@Composable
fun SitterGameView() {
    val theme = LocalUiTheme.current
    val context = LocalContext.current
    val engine = remember { SitterEngine() }
    val preferences = remember(context) {
        context.applicationContext.getSharedPreferences("base.android.sitter", Context.MODE_PRIVATE)
    }

    var phase by remember { mutableStateOf(SitterPhase.IDLE) }
    var difficulty by remember { mutableStateOf(SitterEngine.Difficulty.NORMAL) }
    var selectedTool by remember { mutableStateOf<SitterEngine.ToolKey?>(null) }
    var bestPay by remember {
        mutableIntStateOf(preferences.getInt(SitterEngine.BEST_PAY_KEY, 0))
    }
    var frameTimeNanos by remember { mutableLongStateOf(0L) }

    // Game clock: step the engine with real frame dt while playing. Reading
    // frameTimeNanos below keeps the whole surface recomposing per frame.
    LaunchedEffect(phase) {
        if (phase != SitterPhase.PLAYING) {
            return@LaunchedEffect
        }
        var lastNanos = 0L
        while (phase == SitterPhase.PLAYING) {
            withFrameNanos { now ->
                if (lastNanos != 0L) {
                    val events = engine.step((now - lastNanos) / 1_000_000_000.0)
                    for (event in events) {
                        if (event is SitterEngine.Event.ShiftEnded) {
                            phase = SitterPhase.RATING
                            if (event.result.pay > bestPay) {
                                bestPay = event.result.pay
                                preferences.edit()
                                    .putInt(SitterEngine.BEST_PAY_KEY, event.result.pay)
                                    .apply()
                            }
                        }
                    }
                }
                lastNanos = now
                frameTimeNanos = now
            }
        }
    }

    fun startShift() {
        engine.difficulty = difficulty
        if (phase == SitterPhase.RATING) {
            engine.babysitAgain()
        } else {
            engine.startShift()
        }
        selectedTool = null
        phase = SitterPhase.PLAYING
    }

    // Reading the frame clock here re-reads the (non-snapshot) engine state
    // every animation frame while a shift is running.
    @Suppress("UNUSED_EXPRESSION")
    frameTimeNanos

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .statusBarsPadding()
            .padding(theme.spacing.md),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.sm),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "🤖 SitterBot",
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.xl,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            Text(
                text = "💰 BEST PAY \$$bestPay",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            SitterChunkyButton(
                label = "🔔 Start Shift",
                enabled = phase != SitterPhase.PLAYING,
                onClick = ::startShift,
            )
            SitterEngine.Difficulty.entries.forEach { level ->
                SitterChunkyButton(
                    label = level.label,
                    isLit = level == difficulty,
                    enabled = phase != SitterPhase.PLAYING,
                    onClick = { difficulty = level },
                )
            }
        }

        if (phase == SitterPhase.PLAYING &&
            engine.overflowStage == SitterEngine.OverflowStage.ACTIVE
        ) {
            Text(
                text = "UH OH! THE TUB IS OVERFLOWING — TAP IT ×${SitterEngine.OVERFLOW_CLICKS}!",
                color = SitterColors.bannerText,
                fontSize = theme.typography.sizes.xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(theme.radius.sm))
                    .background(SitterColors.bannerBg)
                    .padding(vertical = 6.dp),
            )
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(theme.radius.md))
                .background(SitterColors.wall)
                .border(3.dp, SitterColors.wall, RoundedCornerShape(theme.radius.md)),
        ) {
            HouseGrid(
                engine = engine,
                onMishapPress = { id -> engine.applyTool(selectedTool, id) },
                onMishapRelease = { engine.releaseHold() },
                onOverflowTap = { engine.tapOverflow() },
            )
            when (phase) {
                SitterPhase.IDLE -> IdleOverlay(onStart = ::startShift)
                SitterPhase.RATING -> engine.result?.let { result ->
                    RatingOverlay(result = result, bestPay = bestPay, onReplay = ::startShift)
                }
                SitterPhase.PLAYING -> Unit
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.xs)) {
            SitterEngine.TOOLS.forEach { tool ->
                val selected = selectedTool == tool.key
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(theme.radius.sm))
                        .background(if (selected) theme.colors.accent else theme.colors.surfaceAlt)
                        .border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.sm))
                        .clickable { selectedTool = tool.key }
                        .padding(vertical = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(text = tool.emoji, fontSize = 20.sp)
                    Text(
                        text = tool.label.uppercase(),
                        color = if (selected) theme.colors.accentText else theme.colors.textPrimary,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    )
                }
            }
        }

        val remainingMs = when (phase) {
            SitterPhase.PLAYING -> engine.remainingMs
            SitterPhase.RATING -> 0.0
            SitterPhase.IDLE -> SitterEngine.SHIFT_LENGTH_MS
        }
        val status = when (phase) {
            SitterPhase.PLAYING -> engine.statusMessage
            SitterPhase.RATING -> "SHIFT OVER. THE PARENTS ARE HOME."
            SitterPhase.IDLE -> "READY. PICK A DIFFICULTY AND RING THE BELL."
        }
        val urgent = phase == SitterPhase.PLAYING && remainingMs <= 15_000
        Text(
            text = status,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Monospace,
            maxLines = 1,
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = "● SHIFT ${engine.shiftNumber} · ${difficulty.label.uppercase()}",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                fontFamily = FontFamily.Monospace,
            )
            Text(
                text = "PARENTS HOME IN ${formatClock(remainingMs)}",
                color = if (urgent) SitterColors.urgent else theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                fontWeight = if (urgent) FontWeight.Black else FontWeight.Normal,
                fontFamily = FontFamily.Monospace,
            )
        }
    }
}

/** The 2×2 room grid in the web's order: living/kitchen over bedroom/bathroom. */
@Composable
private fun HouseGrid(
    engine: SitterEngine,
    onMishapPress: (Int) -> Unit,
    onMishapRelease: () -> Unit,
    onOverflowTap: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(3.dp),
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        listOf(
            SitterEngine.ROOMS.subList(0, 2),
            SitterEngine.ROOMS.subList(2, 4),
        ).forEach { rowRooms ->
            Row(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                rowRooms.forEach { room ->
                    RoomPanel(
                        room = room,
                        engine = engine,
                        onMishapPress = onMishapPress,
                        onMishapRelease = onMishapRelease,
                        onOverflowTap = onOverflowTap,
                        modifier = Modifier.weight(1f).fillMaxHeight(),
                    )
                }
            }
        }
    }
}

/**
 * One room panel: parchment floor, faded emoji furniture, kids, and live
 * mishap badges — all placed by the engine's percent offsets, like the web's
 * absolutely-positioned spans.
 */
@Composable
private fun RoomPanel(
    room: SitterEngine.Room,
    engine: SitterEngine,
    onMishapPress: (Int) -> Unit,
    onMishapRelease: () -> Unit,
    onOverflowTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val flooded = room.key == SitterEngine.RoomKey.BATHROOM &&
        engine.overflowStage == SitterEngine.OverflowStage.FLOODED

    BoxWithConstraints(
        modifier = modifier.background(if (flooded) SitterColors.floodedFloor else SitterColors.floor),
    ) {
        val panelWidth = maxWidth
        val panelHeight = maxHeight

        Text(
            text = "${room.emoji} ${room.name}",
            color = SitterColors.roomLabel,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.padding(4.dp),
        )

        room.furniture.forEach { item ->
            Text(
                text = item.emoji,
                fontSize = 18.sp,
                modifier = Modifier.offset(
                    x = panelWidth * (item.x / 100).toFloat() - 10.dp,
                    y = panelHeight * (item.y / 100).toFloat() - 10.dp,
                ),
            )
        }

        if (flooded) {
            Text(
                text = "💦",
                fontSize = 28.sp,
                modifier = Modifier.align(Alignment.Center),
            )
        }

        engine.kids.filter { it.room == room.key }.forEach { kid ->
            Text(
                text = kid.emoji,
                fontSize = 22.sp,
                modifier = Modifier.offset(
                    x = panelWidth * (kid.x / 100).toFloat() - 11.dp,
                    y = panelHeight * (kid.y / 100).toFloat() - 11.dp,
                ),
            )
        }

        engine.mishaps.filter { it.room == room.key }.forEach { mishap ->
            MishapBadge(
                mishap = mishap,
                severity = ((engine.elapsedMs - mishap.spawnedAtMs) / SitterEngine.MISHAP_TIMER_MS)
                    .coerceIn(0.0, 1.0)
                    .toFloat(),
                holdProgress = if (engine.holdingMishapId == mishap.id) {
                    engine.holdProgress.toFloat()
                } else {
                    null
                },
                onPress = { onMishapPress(mishap.id) },
                onRelease = onMishapRelease,
                modifier = Modifier.offset(
                    x = panelWidth * (mishap.x / 100).toFloat() - 22.dp,
                    y = panelHeight * (mishap.y / 100).toFloat() - 22.dp,
                ),
            )
        }

        if (room.key == SitterEngine.RoomKey.BATHROOM &&
            engine.overflowStage == SitterEngine.OverflowStage.ACTIVE
        ) {
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .clip(RoundedCornerShape(8.dp))
                    .background(SitterColors.bannerBg)
                    .clickable(onClick = onOverflowTap)
                    .padding(6.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(text = "🛁💦", fontSize = 24.sp)
                Text(
                    text = "${SitterEngine.OVERFLOW_CLICKS - engine.overflowClicksDone} TAPS!",
                    color = SitterColors.bannerText,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                )
            }
        }
    }
}

/**
 * One tappable mishap. Fresh mishaps show a sweeping severity ring that
 * shifts yellow → red as the 12s escalation timer runs down (the web's conic
 * gradient); a hug in progress swaps it for a teal hold-progress ring; a
 * hardened MESS gets an angry red badge. Press starts tap fixes and holds;
 * release cancels an unfinished hold.
 */
@Composable
private fun MishapBadge(
    mishap: SitterEngine.Mishap,
    severity: Float,
    holdProgress: Float?,
    onPress: () -> Unit,
    onRelease: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .size(44.dp)
            .drawBehind {
                if (mishap.isMess) {
                    drawCircle(color = SitterColors.messBg)
                    drawCircle(color = SitterColors.urgent, style = Stroke(width = 3.dp.toPx()))
                } else {
                    drawCircle(color = SitterColors.ringTrack, style = Stroke(width = 4.dp.toPx()))
                    val ringColor = if (holdProgress != null) {
                        SitterColors.holdRing
                    } else {
                        // Web ring hue: 45° (yellow) fading to 5° (red).
                        Color.hsv(hue = 45f - severity * 40f, saturation = 0.85f, value = 0.9f)
                    }
                    drawArc(
                        color = ringColor,
                        startAngle = -90f,
                        sweepAngle = (holdProgress ?: severity) * 360f,
                        useCenter = false,
                        style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round),
                    )
                }
            }
            .pointerInput(mishap.id) {
                detectTapGestures(
                    onPress = {
                        onPress()
                        tryAwaitRelease()
                        onRelease()
                    },
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = mishap.kind.emoji, fontSize = 18.sp)
            if (mishap.kind.clicksToFix > 1) {
                Text(
                    text = "●".repeat(mishap.kind.clicksToFix - mishap.clicksDone),
                    color = SitterColors.roomLabel,
                    fontSize = 6.sp,
                )
            }
        }
    }
}

/** The web's idle overlay card: how to play, plus the doorbell. */
@Composable
private fun BoxScope.IdleOverlay(onStart: () -> Unit) {
    OverlayCard {
        Text(text = "🧒 🤖 👧", fontSize = 24.sp)
        Text(
            text = "BABYSITTING NIGHT",
            color = SitterColors.cardText,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "The parents are out for two hours (okay, two minutes). Pick the right " +
                "tool from the tray, then tap each mishap before it hardens into a MESS. " +
                "Hug the criers, feed the hungry, and whatever you do — watch that bathtub.",
            color = SitterColors.cardText,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace,
            textAlign = TextAlign.Center,
        )
        SitterChunkyButton(label = "🔔 Start Shift", isLit = true, onClick = onStart)
    }
}

/** The web's rating overlay card: stars, stats, and the paycheck. */
@Composable
private fun BoxScope.RatingOverlay(
    result: SitterEngine.ShiftResult,
    bestPay: Int,
    onReplay: () -> Unit,
) {
    OverlayCard {
        Text(text = "🚗 🔑 🚪", fontSize = 24.sp)
        Text(
            text = "THE PARENTS ARE HOME!",
            color = SitterColors.cardText,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "★".repeat(result.stars) + "☆".repeat(5 - result.stars),
            color = SitterColors.stars,
            fontSize = 26.sp,
        )
        Text(
            text = "🧹 Tidiness ${result.tidiness}%   😊 Happiness ${result.happiness}%",
            color = SitterColors.cardText,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "PAYCHECK: \$${result.pay}",
            color = SitterColors.cardText,
            fontSize = 14.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
        )
        if (result.pay >= bestPay && result.pay > 0) {
            Text(
                text = "New best paycheck! 🎉",
                color = SitterColors.cardText,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
            )
        }
        SitterChunkyButton(label = "🔔 Babysit again", isLit = true, onClick = onReplay)
    }
}

@Composable
private fun BoxScope.OverlayCard(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier.matchParentSize().background(SitterColors.scrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(SitterColors.card)
                .border(2.dp, SitterColors.wall, RoundedCornerShape(10.dp))
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            content()
        }
    }
}

/** Chunky monospace control button echoing the web console's toolbar. */
@Composable
private fun SitterChunkyButton(
    label: String,
    isLit: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(if (isLit) theme.colors.accent else theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, shape)
            .clickable(enabled = enabled, onClick = onClick)
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

/** m:ss countdown, rounding up like the web `formatClock`. */
private fun formatClock(ms: Double): String {
    val totalSeconds = ceil(ms / 1_000).toInt()
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "$minutes:${seconds.toString().padStart(2, '0')}"
}
