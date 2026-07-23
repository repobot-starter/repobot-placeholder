package com.baseapp.android.view.games.style

import android.content.Context
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Backstage palette lifted from the web `StylePage.styles.css.ts` constants
 * so the native game keeps the same velvet-and-gold fashion-console look on
 * both light and dark app themes (the web page is hardcoded dark too — it is
 * part of the game's identity).
 */
private object StyleColors {
    val bgDeep = Color(0xFF1D0631)
    val shell = Color(0xFF33104F)
    val shellDark = Color(0xFF270B3E)
    val ink = Color(0xFF140420)
    val hotPink = Color(0xFFFF4FA3)
    val violet = Color(0xFF8B2FC9)
    val gold = Color(0xFFFFD166)
    val cream = Color(0xFFFFF0FA)
    val mutedText = Color(0xFFC9A8E0)
    val stageTop = Color(0xFF2A0A44)
    val stageMid = Color(0xFF3D1160)
    val backstage = Color(0xFF1A0529)
    val runwayMid = Color(0xFFB32B73)
    val runwayDark = Color(0xFF6E1A49)
    val overlayScrim = Color(0xD1140420) // rgba(20,4,32,0.82)
}

/** Countdown turns urgent from this many seconds left (web TICK_FROM_SECONDS). */
private const val URGENT_FROM_SECONDS = 10

/** SharedPreferences file for this game's local scores. */
private const val PREFS_NAME = "base.android.style"

/**
 * Home surface for the `style` pack — the native twin of the web StylePage.
 * Rendering and touch input only: all rules live in [StyleEngine] so the
 * scoring stays JVM-testable and in lockstep with the web game. No network,
 * no stores. Best season score persists in SharedPreferences under the same
 * key name as the web localStorage entry.
 *
 * A `withFrameNanos` loop feeds real elapsed time into the tick-driven
 * engine; a revision counter recomposes the UI only when the engine reports
 * an event or an interaction mutates it (the engine is not snapshot state).
 *
 * Art approach: like the web `DressUpStage`, the model is a dress-up doll
 * composed from stacked emoji layers (base 🧍 plus one emoji per worn slot,
 * offset onto head/torso/legs/feet), strutting across a vector runway —
 * gradient backdrop, gold marquee dots, hot-pink catwalk strip. No image
 * assets; visual parity with the web CSS art is not attempted, but the
 * palette and layout language match.
 */
@Composable
fun StyleGameView() {
    val context = LocalContext.current
    val prefs = remember {
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
    val engine = remember { StyleEngine() }
    var revision by remember { mutableIntStateOf(0) }
    var bestScore by remember { mutableIntStateOf(prefs.getInt(StyleWardrobe.BEST_SCORE_KEY, 0)) }
    var activeSlot by remember { mutableStateOf(StyleSlotId.HAT) }

    // Reading the revision counter makes this composable recompose whenever
    // the engine changes (mirrors PongGameView's frame-clock read).
    @Suppress("UNUSED_EXPRESSION")
    revision

    /** Runs an engine mutation and invalidates the UI. */
    fun mutate(action: () -> Unit) {
        action()
        revision += 1
    }

    // The view owns the clock; the engine is purely tick-driven. Recompose
    // only when a tick produced an event (1Hz countdown, walk end) so the
    // closet grid is not rebuilt at 60fps.
    LaunchedEffect(engine) {
        var lastNanos = 0L
        while (true) {
            withFrameNanos { now ->
                if (lastNanos != 0L) {
                    val events = engine.tick((now - lastNanos) / 1_000_000_000f)
                    if (events.isNotEmpty()) {
                        revision += 1
                    }
                }
                lastNanos = now
            }
        }
    }

    val dressing = engine.phase == StyleEngine.Phase.DRESSING

    /** Advances past the verdict; persists a new best when the season ends. */
    fun dismissVerdict() {
        mutate { engine.dismissVerdict() }
        if (engine.phase == StyleEngine.Phase.SEASON_OVER && engine.seasonTotal > bestScore) {
            bestScore = engine.seasonTotal
            prefs.edit().putInt(StyleWardrobe.BEST_SCORE_KEY, engine.seasonTotal).apply()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StyleColors.bgDeep)
            .statusBarsPadding()
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        HeaderRow(engine = engine, dressing = dressing)
        CountdownBar(engine = engine, dressing = dressing)
        ThemeBanner(
            engine = engine,
            dressing = dressing,
            onDone = { mutate { engine.finishRound() } },
        )

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .border(2.dp, StyleColors.gold, RoundedCornerShape(14.dp)),
        ) {
            RunwayStage(engine = engine)
            when (engine.phase) {
                StyleEngine.Phase.IDLE -> StageOverlay {
                    Text(
                        text = "✨ STYLEBOT ✨",
                        color = StyleColors.gold,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    )
                    Text(
                        text = "${StyleWardrobe.ROUNDS_PER_SEASON} rounds. " +
                            "${StyleWardrobe.ROUND_SECONDS} seconds each. " +
                            "Dress to impress the judges!",
                        color = StyleColors.cream,
                        fontSize = 13.sp,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center,
                    )
                    ChunkyButton(label = "💃 Start Season", background = StyleColors.hotPink) {
                        mutate {
                            engine.startSeason()
                            activeSlot = StyleSlotId.HAT
                        }
                    }
                }
                StyleEngine.Phase.VERDICT -> engine.verdict?.let { verdict ->
                    StageOverlay {
                        Text(
                            text = "★".repeat(verdict.score.stars) +
                                "☆".repeat(5 - verdict.score.stars),
                            color = StyleColors.gold,
                            fontSize = 28.sp,
                        )
                        Text(
                            text = "+${verdict.score.total} pts",
                            color = StyleColors.cream,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                        )
                        Text(
                            text = "“${verdict.line}”",
                            color = StyleColors.mutedText,
                            fontSize = 13.sp,
                            fontFamily = FontFamily.Monospace,
                            textAlign = TextAlign.Center,
                        )
                        Text(
                            text = verdictDetail(verdict.score),
                            color = StyleColors.mutedText,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                        )
                        ChunkyButton(
                            label = if (engine.isFinalRound) "🏁 Finish Season" else "▶ Next Round",
                            background = StyleColors.hotPink,
                            onClick = ::dismissVerdict,
                        )
                    }
                }
                StyleEngine.Phase.SEASON_OVER -> StageOverlay {
                    Text(
                        text = "SEASON OVER",
                        color = StyleColors.gold,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    )
                    Text(
                        text = "${engine.seasonTotal} pts",
                        color = StyleColors.cream,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    )
                    Text(
                        text = if (engine.seasonTotal >= bestScore && engine.seasonTotal > 0) {
                            "🌟 New best score!"
                        } else {
                            "Best season: $bestScore pts"
                        },
                        color = StyleColors.mutedText,
                        fontSize = 13.sp,
                        fontFamily = FontFamily.Monospace,
                    )
                    ChunkyButton(label = "⟳ New Season", background = StyleColors.hotPink) {
                        mutate {
                            engine.startSeason()
                            activeSlot = StyleSlotId.HAT
                        }
                    }
                }
                StyleEngine.Phase.DRESSING, StyleEngine.Phase.WALKING -> Unit
            }
        }

        Closet(
            engine = engine,
            dressing = dressing,
            activeSlot = activeSlot,
            onSlotSelected = { activeSlot = it },
            onPick = { item -> mutate { engine.pick(item, activeSlot) } },
            onShuffle = { mutate { engine.shuffleOutfit() } },
            onClear = { mutate { engine.clearOutfit() } },
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            StatusText(text = "💎 TOTAL ${engine.seasonTotal}")
            StatusText(text = "🏆 BEST $bestScore")
            StatusText(text = "MAX ${StyleWardrobe.MAX_ROUND_SCORE} PTS / ROUND")
        }
    }
}

// ---------------------------------------------------------------------------
// Header + timer
// ---------------------------------------------------------------------------

@Composable
private fun HeaderRow(engine: StyleEngine, dressing: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = "🤖 STYLEBOT",
            color = StyleColors.cream,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.weight(1f),
        )
        Badge(
            text = if (engine.phase == StyleEngine.Phase.IDLE) {
                "ROUND —"
            } else {
                "ROUND ${engine.roundIndex + 1}/${StyleWardrobe.ROUNDS_PER_SEASON}"
            },
            color = StyleColors.gold,
        )
        Badge(
            text = "⏱ 0:" + engine.secondsLeft.toString().padStart(2, '0'),
            color = if (dressing && engine.secondsLeft <= URGENT_FROM_SECONDS) {
                StyleColors.hotPink
            } else {
                StyleColors.gold
            },
        )
    }
}

@Composable
private fun Badge(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(StyleColors.ink)
            .border(2.dp, color, RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/**
 * The dressing clock as a draining bar — gold, flipping to hot pink for the
 * last urgent seconds.
 */
@Composable
private fun CountdownBar(engine: StyleEngine, dressing: Boolean) {
    val fraction = engine.secondsLeft.toFloat() / StyleWardrobe.ROUND_SECONDS
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(999.dp))
            .background(StyleColors.ink),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(fraction)
                .fillMaxHeight()
                .clip(RoundedCornerShape(999.dp))
                .background(
                    if (dressing && engine.secondsLeft <= URGENT_FROM_SECONDS) {
                        StyleColors.hotPink
                    } else {
                        StyleColors.gold
                    },
                ),
        )
    }
}

@Composable
private fun ThemeBanner(engine: StyleEngine, dressing: Boolean, onDone: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(StyleColors.shellDark)
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        val theme = engine.theme
        if (theme != null && engine.phase != StyleEngine.Phase.IDLE) {
            Text(text = theme.emoji, fontSize = 26.sp)
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "TONIGHT'S THEME",
                    color = StyleColors.mutedText,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
                Text(
                    text = theme.name,
                    color = StyleColors.gold,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
            }
        } else {
            Text(
                text = "Start a season to reveal the theme.",
                color = StyleColors.mutedText,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.weight(1f),
            )
        }
        ChunkyButton(
            label = "✔ Done!",
            background = StyleColors.gold,
            foreground = StyleColors.ink,
            enabled = dressing,
            onClick = onDone,
        )
    }
}

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

/**
 * The catwalk scenery: violet stage gradient, a row of gold marquee dots
 * along the top, the hot-pink runway strip across the bottom, and the emoji
 * doll — strutting off stage-right during the walk phase, with camera-flash
 * sparkles riding along.
 */
@Composable
private fun RunwayStage(engine: StyleEngine) {
    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val stageWidth = maxWidth
        val stageHeight = maxHeight

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            StyleColors.stageTop,
                            StyleColors.stageMid,
                            StyleColors.backstage,
                        ),
                    ),
                ),
        )

        // Marquee lights along the top edge.
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            repeat((stageWidth.value / 28).toInt().coerceAtLeast(1)) {
                Box(
                    modifier = Modifier
                        .size(5.dp)
                        .clip(CircleShape)
                        .background(StyleColors.gold),
                )
            }
        }

        // The runway strip.
        Column(modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .background(StyleColors.gold),
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(stageHeight * 0.3f)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                StyleColors.hotPink,
                                StyleColors.runwayMid,
                                StyleColors.runwayDark,
                            ),
                        ),
                    ),
            )
        }

        // The doll: strut out over the engine's walk window; snap back
        // instantly when the walk ends so the next round starts centered.
        val walking = engine.phase == StyleEngine.Phase.WALKING
        val walkFraction by animateFloatAsState(
            targetValue = if (walking) 1f else 0f,
            animationSpec = if (walking) {
                tween(
                    durationMillis = (StyleEngine.WALK_DURATION_SECONDS * 1000).toInt(),
                    easing = FastOutSlowInEasing,
                )
            } else {
                snap()
            },
            label = "runwayWalk",
        )
        DressUpDoll(
            outfit = engine.outfit,
            modifier = Modifier
                .align(Alignment.Center)
                .offset(x = stageWidth * 0.75f * walkFraction, y = stageHeight * 0.18f),
        )

        if (walking) {
            SparkleLayer(stageWidth = stageWidth, stageHeight = stageHeight)
        }
    }
}

/**
 * The dress-up doll: a base 🧍 with each worn item's emoji layered onto the
 * matching body zone (hat on head, top on torso, bottom on legs, shoes at
 * the feet, accessory held to the side). Same layering idea as the web
 * `DressUpStage`, with dp offsets standing in for the CSS `bottom` offsets.
 */
@Composable
private fun DressUpDoll(outfit: Map<StyleSlotId, StyleItem>, modifier: Modifier = Modifier) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Text(text = "🧍", fontSize = 96.sp)
        outfit[StyleSlotId.BOTTOM]?.let {
            Text(text = it.emoji, fontSize = 34.sp, modifier = Modifier.offset(y = 24.dp))
        }
        outfit[StyleSlotId.TOP]?.let {
            Text(text = it.emoji, fontSize = 42.sp, modifier = Modifier.offset(y = (-6).dp))
        }
        outfit[StyleSlotId.SHOES]?.let {
            Text(text = it.emoji, fontSize = 24.sp, modifier = Modifier.offset(y = 50.dp))
        }
        outfit[StyleSlotId.HAT]?.let {
            Text(text = it.emoji, fontSize = 30.sp, modifier = Modifier.offset(y = (-52).dp))
        }
        outfit[StyleSlotId.ACCESSORY]?.let {
            Text(text = it.emoji, fontSize = 28.sp, modifier = Modifier.offset(x = 38.dp, y = (-2).dp))
        }
    }
}

/**
 * Camera flashes + sparkles shown during the runway walk. Positions mirror
 * the web `SPARKLES` table; they appear for the walk and vanish with it.
 */
@Composable
private fun SparkleLayer(stageWidth: Dp, stageHeight: Dp) {
    val sparkles = listOf(
        Triple("📸", 0.08f, 0.22f),
        Triple("✨", 0.22f, 0.48f),
        Triple("📸", 0.88f, 0.30f),
        Triple("✨", 0.70f, 0.14f),
        Triple("📸", 0.45f, 0.10f),
        Triple("✨", 0.92f, 0.60f),
    )
    sparkles.forEach { (emoji, x, y) ->
        Text(
            text = emoji,
            fontSize = 20.sp,
            modifier = Modifier.offset(x = stageWidth * x, y = stageHeight * y),
        )
    }
}

@Composable
private fun BoxScope.StageOverlay(content: @Composable ColumnScope.() -> Unit) {
    Box(
        modifier = Modifier.matchParentSize().background(StyleColors.overlayScrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .padding(20.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(StyleColors.shellDark)
                .border(2.dp, StyleColors.gold, RoundedCornerShape(14.dp))
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            content = content,
        )
    }
}

private fun verdictDetail(score: StyleRoundScore): String {
    var detail = "${score.matches}/5 on-theme"
    if (score.fullMatch) {
        detail += " · full-theme bonus!"
    }
    if (score.complete) {
        detail += " · complete outfit"
    }
    return detail
}

// ---------------------------------------------------------------------------
// Closet
// ---------------------------------------------------------------------------

@Composable
private fun Closet(
    engine: StyleEngine,
    dressing: Boolean,
    activeSlot: StyleSlotId,
    onSlotSelected: (StyleSlotId) -> Unit,
    onPick: (StyleItem) -> Unit,
    onShuffle: () -> Unit,
    onClear: () -> Unit,
) {
    val activeSlotData = StyleWardrobe.SLOTS.first { it.id == activeSlot }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(StyleColors.shell)
            .padding(8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        // Slot tabs.
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            StyleWardrobe.SLOTS.forEach { slot ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(6.dp))
                        .background(
                            if (slot.id == activeSlot) StyleColors.violet else StyleColors.shellDark,
                        )
                        .clickable { onSlotSelected(slot.id) }
                        .padding(vertical = 6.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(text = slot.icon, fontSize = 18.sp)
                }
            }
        }

        // Item grid: four columns, rows chunked from the active rack.
        activeSlotData.items.chunked(4).forEach { rowItems ->
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                rowItems.forEach { item ->
                    val selected = engine.outfit[activeSlot]?.id == item.id
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (selected) StyleColors.violet else StyleColors.shellDark)
                            .border(
                                width = if (selected) 2.dp else 1.dp,
                                color = if (selected) StyleColors.gold else StyleColors.violet,
                                shape = RoundedCornerShape(6.dp),
                            )
                            .clickable(enabled = dressing) { onPick(item) }
                            .padding(vertical = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(text = item.emoji, fontSize = 22.sp)
                        Text(
                            text = item.name,
                            color = StyleColors.cream,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.Monospace,
                            maxLines = 1,
                        )
                    }
                }
                // Pad short rows so cells keep a constant width.
                repeat(4 - rowItems.size) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ChunkyButton(label = "🎲 Shuffle", background = StyleColors.violet, enabled = dressing, onClick = onShuffle)
            ChunkyButton(label = "🧺 Clear", background = StyleColors.violet, enabled = dressing, onClick = onClear)
        }
    }
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

/** Chunky candy-pill control button echoing the web console's toolbar. */
@Composable
private fun ChunkyButton(
    label: String,
    background: Color,
    foreground: Color = StyleColors.cream,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (enabled) background else StyleColors.shellDark)
            .border(2.dp, StyleColors.ink, RoundedCornerShape(999.dp))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            color = if (enabled) foreground else StyleColors.mutedText,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun StatusText(text: String) {
    Text(
        text = text,
        color = StyleColors.mutedText,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        fontFamily = FontFamily.Monospace,
    )
}
