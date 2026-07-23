package com.baseapp.android.view.games.salon

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.hypot

/**
 * Pastel salon palette shared by the whole screen. Hair/skin/eye colors come
 * from the engine's content tables; these are the fixed art colors from the
 * web `ClientHead.tsx` (ink outline, shirt, bubble blues, sparkle gold).
 */
private object SalonColors {
    val ink = Color(0xFF4A3B45)
    val shirt = Color(0xFFB7E0F2)
    val mirror = Color(0xFFFDEEF7)
    val bubbleFill = Color(0xCCD6F2FF) // rgba(214,242,255,0.8)
    val bubbleEdge = Color(0xFF8FCDEA)
    val blush = Color(0x80F7A8BD)
    val mouth = Color(0xFFA3505F)
    val gum = Color(0xFFFF8FC0)
    val sparkle = Color(0xFFFFD76E)
    val meter = Color(0xFF58C9A2)
}

/**
 * Home surface for the `salon` pack — the native twin of the web `SalonPage`.
 * Rendering and touch input only: all rules live in [SalonEngine] so the game
 * stays JVM-testable and in lockstep with the web game. No network, no stores.
 *
 * ART APPROACH: the web draws the client as hand-authored SVG paths
 * (`ClientHead.tsx`). This port re-draws the same character on a Compose
 * Canvas in the web's 320x360 coordinate space with the same landmarks (face
 * ellipse, dome curve, fringe, per-length hair bottoms, updo bun / braid
 * beads), so the silhouette parameterization matches the web
 * `buildHairdo({length, texture})`. Simplifications: emoji (accessories,
 * debris, scissors, sparkles) render as positioned [Text] overlays instead of
 * canvas text, and the web's CSS saturate/brightness "dull hair" filter is
 * approximated with a translucent ink overlay. Cute and readable over pixel
 * parity.
 *
 * The engine is a plain class (not snapshot state); every mutation goes
 * through `act {}`, which bumps [revision] to recompose the reader tree.
 */
@Composable
fun SalonGameView() {
    val theme = LocalUiTheme.current
    val engine = remember { SalonEngine() }
    var revision by remember { mutableIntStateOf(0) }

    fun act(mutation: () -> Unit) {
        mutation()
        revision += 1
    }

    // Reading revision here makes every engine read below recompose-fresh.
    @Suppress("UNUSED_EXPRESSION")
    revision

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(theme.spacing.lg),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
    ) {
        Text(
            text = "🤖 SALONBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            SalonButton(label = "💺 NEW CLIENT", onClick = { act { engine.nextClient() } })
            Text(
                text = "💇 STREAK: ${engine.streak}",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.sm,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
        }

        val score = engine.score
        if (engine.station == SalonEngine.Station.REVEAL && score != null) {
            RevealStage(engine = engine)
            Scorecard(score = score, onNextClient = { act { engine.nextClient() } })
        } else {
            RequestCard(engine = engine)
            Stage(engine = engine, act = ::act)
            StationStrip(engine = engine)
            StationPanel(engine = engine, act = ::act)
        }

        StatusBar(engine = engine)
    }
}

// MARK: - Request card

@Composable
private fun RequestCard(engine: SalonEngine) {
    val request = engine.client.request
    SalonPanel(title = "💌 Request Card") {
        RequestRow(icon = "📏", label = request.length.label)
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .width(14.dp)
                    .height(14.dp)
                    .clip(CircleShape)
                    .background(Color(request.color.fill)),
            )
            PanelText(text = request.color.label)
        }
        RequestRow(icon = request.texture.emoji, label = request.texture.label)
        request.accessory?.let { accessory ->
            RequestRow(icon = accessory.emoji, label = "${accessory.label}, please!")
        }
        MutedText(
            text = "…and a good scrub! ✨ — ${engine.client.name}, " +
                if (engine.client.debris == SalonEngine.Debris.LEAF) {
                    "leaf in hair 🍂"
                } else {
                    "gum in hair 🍬"
                },
        )
    }
}

@Composable
private fun RequestRow(icon: String, label: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        PanelText(text = icon)
        PanelText(text = label)
    }
}

// MARK: - Stage (client in the mirror)

@Composable
private fun Stage(engine: SalonEngine, act: (() -> Unit) -> Unit) {
    val theme = LocalUiTheme.current
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.spacing.sm),
    ) {
        SalonHeadCanvas(
            client = engine.client,
            look = engine.look,
            messiness = engine.messiness,
            bubbles = if (engine.station == SalonEngine.Station.WASH) {
                engine.bubbles.filter { !it.isPopped }
            } else {
                emptyList()
            },
            strays = if (engine.station == SalonEngine.Station.CUT) engine.strays else emptyList(),
            sparkles = if (engine.station == SalonEngine.Station.FINISH) {
                engine.sparkles
            } else {
                emptyList()
            },
            engine = engine,
            onMutate = { act {} },
            modifier = Modifier
                .fillMaxWidth(0.8f)
                .aspectRatio(SalonEngine.HEAD_VIEW_WIDTH / SalonEngine.HEAD_VIEW_HEIGHT),
        )
        MutedText(text = engine.station.hint)
    }
}

@Composable
private fun RevealStage(engine: SalonEngine) {
    val theme = LocalUiTheme.current
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.spacing.sm),
    ) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(theme.radius.md))
                .background(theme.colors.surfaceAlt)
                .padding(theme.spacing.sm),
        ) {
            Text(
                text = "${engine.mood.emoji} “${engine.reactionLine}”",
                color = theme.colors.textPrimary,
                fontSize = theme.typography.sizes.md,
                fontWeight = FontWeight.SemiBold,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.md)) {
            RevealCard(
                engine = engine,
                label = "Before 😱",
                look = engine.client.startLook,
                messiness = 1f,
                sparkles = emptyList(),
                modifier = Modifier.weight(1f),
            )
            RevealCard(
                engine = engine,
                label = "After ✨",
                look = engine.look,
                messiness = 0f,
                sparkles = engine.sparkles,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun RevealCard(
    engine: SalonEngine,
    label: String,
    look: SalonEngine.HairLook,
    messiness: Float,
    sparkles: List<SalonEngine.Sparkle>,
    modifier: Modifier = Modifier,
) {
    val theme = LocalUiTheme.current
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.spacing.xs),
    ) {
        Text(
            text = label,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
        )
        SalonHeadCanvas(
            client = engine.client,
            look = look,
            messiness = messiness,
            bubbles = emptyList(),
            strays = emptyList(),
            sparkles = sparkles,
            engine = null,
            onMutate = {},
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(SalonEngine.HEAD_VIEW_WIDTH / SalonEngine.HEAD_VIEW_HEIGHT),
        )
    }
}

// MARK: - Station strip and panels

@Composable
private fun StationStrip(engine: SalonEngine) {
    val theme = LocalUiTheme.current
    val workflow = listOf(
        SalonEngine.Station.WASH,
        SalonEngine.Station.CUT,
        SalonEngine.Station.COLOR,
        SalonEngine.Station.STYLE,
        SalonEngine.Station.FINISH,
    )
    val currentIndex = workflow.indexOf(engine.station).let { if (it < 0) workflow.size else it }
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(theme.spacing.xs, Alignment.CenterHorizontally),
    ) {
        workflow.forEachIndexed { index, entry ->
            val active = index == currentIndex
            val done = index < currentIndex
            val state = if (done) " ✔" else if (active) " ▶" else ""
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(theme.radius.pill))
                    .background(
                        when {
                            active -> theme.colors.accent
                            done -> theme.colors.hover
                            else -> theme.colors.surfaceAlt
                        },
                    )
                    .padding(horizontal = theme.spacing.sm, vertical = theme.spacing.xs),
            ) {
                Text(
                    text = "${entry.emoji} ${entry.label}$state",
                    color = if (active) theme.colors.accentText else theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.xs,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun StationPanel(engine: SalonEngine, act: (() -> Unit) -> Unit) {
    when (engine.station) {
        SalonEngine.Station.WASH -> WashPanel(engine)
        SalonEngine.Station.CUT -> CutPanel(engine, act)
        SalonEngine.Station.COLOR -> ColorPanel(engine, act)
        SalonEngine.Station.STYLE -> StylePanel(engine, act)
        SalonEngine.Station.FINISH -> FinishPanel(engine, act)
        SalonEngine.Station.REVEAL -> Unit
    }
}

@Composable
private fun WashPanel(engine: SalonEngine) {
    val theme = LocalUiTheme.current
    SalonPanel(title = "🫧 Wash") {
        MutedText(text = "Cleanliness")
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(12.dp)
                .clip(RoundedCornerShape(theme.radius.pill))
                .background(theme.colors.surfaceAlt),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(engine.cleanliness)
                    .height(12.dp)
                    .clip(RoundedCornerShape(theme.radius.pill))
                    .background(SalonColors.meter),
            )
        }
        MutedText(text = "Pop every bubble to fill the meter.")
    }
}

@Composable
private fun CutPanel(engine: SalonEngine, act: (() -> Unit) -> Unit) {
    val theme = LocalUiTheme.current
    SalonPanel(title = "✂️ Cut") {
        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            SalonEngine.HairLength.entries.forEach { length ->
                SalonButton(
                    label = length.label,
                    isLit = engine.lengthChosen && engine.look.length == length,
                    onClick = { act { engine.chooseLength(length) } },
                )
            }
        }
        MutedText(
            text = when {
                !engine.lengthChosen -> "Choose a target length."
                engine.straysLeft > 0 ->
                    "Snip ${engine.straysLeft} stray strand${if (engine.straysLeft == 1) "" else "s"}!"
                else -> "Clean cut! ✂️"
            },
        )
        SalonButton(
            label = "NEXT: COLOR →",
            isEnabled = engine.cutDone,
            onClick = { act { engine.advanceToColor() } },
        )
    }
}

@Composable
private fun ColorPanel(engine: SalonEngine, act: (() -> Unit) -> Unit) {
    val theme = LocalUiTheme.current
    SalonPanel(title = "🎨 Color") {
        SalonEngine.HairColor.entries.chunked(4).forEach { rowColors ->
            Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
                rowColors.forEach { color ->
                    val selected = engine.hasDyed && engine.look.color == color
                    Box(
                        modifier = Modifier
                            .width(44.dp)
                            .height(36.dp)
                            .clip(RoundedCornerShape(theme.radius.sm))
                            .background(Color(color.fill))
                            .border(
                                width = if (selected) 3.dp else 1.dp,
                                color = if (selected) theme.colors.accent else theme.colors.border,
                                shape = RoundedCornerShape(theme.radius.sm),
                            )
                            .clickable { act { engine.applyDye(color) } },
                    )
                }
            }
        }
        SalonButton(
            label = "NEXT: STYLE →",
            isEnabled = engine.hasDyed,
            onClick = { act { engine.advanceToStyle() } },
        )
    }
}

@Composable
private fun StylePanel(engine: SalonEngine, act: (() -> Unit) -> Unit) {
    val theme = LocalUiTheme.current
    SalonPanel(title = "💈 Style") {
        SalonEngine.HairTexture.entries.chunked(3).forEach { rowTextures ->
            Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
                rowTextures.forEach { texture ->
                    SalonButton(
                        label = "${texture.emoji} ${texture.label}",
                        isLit = engine.hasStyled && engine.look.texture == texture,
                        onClick = { act { engine.chooseTexture(texture) } },
                    )
                }
            }
        }
        SalonButton(
            label = "NEXT: FINISH →",
            isEnabled = engine.hasStyled,
            onClick = { act { engine.advanceToFinish() } },
        )
    }
}

@Composable
private fun FinishPanel(engine: SalonEngine, act: (() -> Unit) -> Unit) {
    val theme = LocalUiTheme.current
    SalonPanel(title = "✨ Finish") {
        SalonEngine.Accessory.entries.chunked(3).forEach { rowAccessories ->
            Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
                rowAccessories.forEach { accessory ->
                    SalonButton(
                        label = "${accessory.emoji} ${accessory.label}",
                        isLit = engine.look.accessory == accessory,
                        onClick = { act { engine.chooseAccessory(accessory) } },
                    )
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            SalonButton(label = "💦 SPRITZ", onClick = { act { engine.spritz() } })
            SalonButton(label = "🪞 THE BIG REVEAL!", onClick = { act { engine.reveal() } })
        }
    }
}

@Composable
private fun Scorecard(score: SalonEngine.Score, onNextClient: () -> Unit) {
    SalonPanel(title = "🪞 Scorecard") {
        ScoreRow(label = "📏 Length", matched = score.lengthMatch)
        ScoreRow(label = "🎨 Color", matched = score.colorMatch)
        ScoreRow(label = "💈 Style", matched = score.textureMatch)
        score.accessoryMatch?.let { ScoreRow(label = "🎀 Accessory", matched = it) }
        ScoreLine(label = "🫧 Wash bonus", value = "+${score.washBonus}")
        ScoreLine(label = "Total", value = "${score.total} / ${score.max}", bold = true)
        SalonButton(label = "💺 NEXT CLIENT →", onClick = onNextClient)
    }
}

@Composable
private fun ScoreRow(label: String, matched: Boolean) {
    val theme = LocalUiTheme.current
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        PanelText(text = label)
        Text(
            text = if (matched) "✔ +${SalonEngine.POINTS_PER_MATCH}" else "✘ 0",
            color = if (matched) theme.colors.statusSuccess else theme.colors.statusError,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun ScoreLine(label: String, value: String, bold: Boolean = false) {
    val theme = LocalUiTheme.current
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(
            text = label,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
        )
        Text(
            text = value,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
        )
    }
}

@Composable
private fun StatusBar(engine: SalonEngine) {
    val theme = LocalUiTheme.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(theme.radius.sm))
            .background(theme.colors.surfaceAlt)
            .padding(theme.spacing.sm),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        MutedText(text = "● ${engine.station.name}")
        MutedText(text = engine.status)
        MutedText(text = "BEST: ${engine.bestStreak}")
    }
}

// MARK: - Shared chrome pieces

/** Pastel panel with a header, echoing the web console's side panels. */
@Composable
private fun SalonPanel(title: String, content: @Composable () -> Unit) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.md)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(theme.colors.surface)
            .border(1.dp, theme.colors.border, shape)
            .padding(theme.spacing.md),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.sm),
    ) {
        Text(
            text = title,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
        )
        content()
    }
}

/** Chunky rounded button consistent with the web page's toolbar buttons. */
@Composable
private fun SalonButton(
    label: String,
    isLit: Boolean = false,
    isEnabled: Boolean = true,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(if (isLit) theme.colors.accent else theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, shape)
            .clickable(enabled = isEnabled, onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            color = when {
                !isEnabled -> theme.colors.textSecondary
                isLit -> theme.colors.accentText
                else -> theme.colors.textPrimary
            },
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun PanelText(text: String) {
    val theme = LocalUiTheme.current
    Text(
        text = text,
        color = theme.colors.textPrimary,
        fontSize = theme.typography.sizes.sm,
        fontWeight = FontWeight.SemiBold,
    )
}

@Composable
private fun MutedText(text: String) {
    val theme = LocalUiTheme.current
    Text(
        text = text,
        color = theme.colors.textSecondary,
        fontSize = theme.typography.sizes.xs,
    )
}

// MARK: - Client head canvas

/**
 * The client in the mirror: a Canvas re-drawing of the web `ClientHead` SVG
 * in the same 320x360 coordinate space, plus emoji overlays (accessory,
 * debris, scissors, sparkles) positioned with the web's coordinates.
 *
 * Touch model (web used mouse-enter + click): dragging across a bubble scrubs
 * it once per entry — rubbing back and forth lands repeated scrubs — and a
 * plain tap scrubs once; tapping or dragging across a stray strand snips it.
 * Interactions consult [engine] live (never the captured lists, which go
 * stale between recompositions) and report through [onMutate]. Pass a null
 * engine for a non-interactive head (the reveal cards).
 */
@Composable
private fun SalonHeadCanvas(
    client: SalonEngine.Client,
    look: SalonEngine.HairLook,
    messiness: Float,
    bubbles: List<SalonEngine.WashBubble>,
    strays: List<SalonEngine.StrayStrand>,
    sparkles: List<SalonEngine.Sparkle>,
    engine: SalonEngine?,
    onMutate: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalUiTheme.current
    BoxWithConstraints(
        modifier = modifier
            .clip(RoundedCornerShape(theme.radius.md))
            .background(SalonColors.mirror),
    ) {
        val unit = maxWidth / SalonEngine.HEAD_VIEW_WIDTH
        val density = LocalDensity.current

        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(engine) {
                    if (engine == null) return@pointerInput
                    // Bubble the finger is currently inside, so one continuous
                    // press cannot machine-gun scrubs; re-entering scrubs again.
                    var hoveredBubbleId: Int? = null
                    awaitPointerEventScope {
                        while (true) {
                            val event = awaitPointerEvent()
                            val change = event.changes.firstOrNull { it.pressed }
                            if (change == null) {
                                hoveredBubbleId = null
                                continue
                            }
                            change.consume()
                            val x = change.position.x / size.width * SalonEngine.HEAD_VIEW_WIDTH
                            val y = change.position.y / size.width * SalonEngine.HEAD_VIEW_WIDTH
                            val bubble = engine.bubbles.firstOrNull {
                                !it.isPopped && hypot(x - it.x, y - it.y) <= it.r + 6f
                            }
                            if (bubble != null) {
                                if (bubble.id != hoveredBubbleId) {
                                    hoveredBubbleId = bubble.id
                                    engine.scrub(bubble.id)
                                    onMutate()
                                }
                            } else {
                                hoveredBubbleId = null
                            }
                            // Hit zone covers the strand arc and its scissors.
                            val stray = engine.strays.firstOrNull {
                                !it.snipped &&
                                    hypot(x - (it.x + 24f * it.direction), y - it.y) <= 34f
                            }
                            if (stray != null) {
                                engine.snip(stray.id)
                                onMutate()
                            }
                        }
                    }
                },
        ) {
            val headScale = size.width / SalonEngine.HEAD_VIEW_WIDTH
            scale(scale = headScale, pivot = Offset.Zero) {
                val hairdo = buildHairdo(look.length, look.texture)
                val fill = Color(look.color.fill)
                val skin = Color(client.skinTone)
                val strokeInk = Stroke(width = 3f)

                // Back hair, extra lobes (bun / braid beads), shine streak.
                drawPath(hairdo.back, fill)
                drawPath(hairdo.back, SalonColors.ink, style = strokeInk)
                hairdo.lobes.forEach { lobe ->
                    drawOval(fill, topLeft = lobe.topLeft, size = lobe.size)
                    drawOval(SalonColors.ink, topLeft = lobe.topLeft, size = lobe.size, style = strokeInk)
                }
                val streakPath = Path().apply {
                    moveTo(112f, 124f)
                    quadraticBezierTo(122f, 92f, 154f, 84f)
                }
                drawPath(
                    streakPath,
                    Color(look.color.highlight).copy(alpha = 0.75f),
                    style = Stroke(width = 10f, cap = StrokeCap.Round),
                )

                // Neck and shirt.
                drawRect(skin, topLeft = Offset(146f, 226f), size = Size(28f, 38f))
                drawRect(
                    SalonColors.ink,
                    topLeft = Offset(146f, 226f),
                    size = Size(28f, 38f),
                    style = strokeInk,
                )
                val shirtPath = Path().apply {
                    moveTo(104f, 322f)
                    quadraticBezierTo(104f, 260f, 160f, 260f)
                    quadraticBezierTo(216f, 260f, 216f, 322f)
                    close()
                }
                drawPath(shirtPath, SalonColors.shirt)
                drawPath(shirtPath, SalonColors.ink, style = strokeInk)

                // Face.
                val faceRect = Rect(160f - 62f, 172f - 72f, 160f + 62f, 172f + 72f)
                drawOval(skin, topLeft = faceRect.topLeft, size = faceRect.size)
                drawOval(SalonColors.ink, topLeft = faceRect.topLeft, size = faceRect.size, style = strokeInk)

                listOf(-1f, 1f).forEach { side ->
                    val eyeX = 160f + side * 24f
                    val brow = Path().apply {
                        moveTo(eyeX - 10f, 150f)
                        quadraticBezierTo(eyeX, 144f, eyeX + 10f, 150f)
                    }
                    drawPath(brow, SalonColors.ink, style = Stroke(width = 3f, cap = StrokeCap.Round))
                    val whiteRect = Rect(eyeX - 9f, 156f, eyeX + 9f, 176f)
                    drawOval(Color.White, topLeft = whiteRect.topLeft, size = whiteRect.size)
                    drawOval(
                        SalonColors.ink,
                        topLeft = whiteRect.topLeft,
                        size = whiteRect.size,
                        style = Stroke(width = 2f),
                    )
                    drawCircle(Color(client.eyeColor), radius = 4.5f, center = Offset(eyeX, 168f))
                    drawCircle(Color.White, radius = 1.6f, center = Offset(eyeX - 2f, 165f))
                    drawCircle(SalonColors.blush, radius = 7f, center = Offset(160f + side * 32f, 192f))
                }

                // Nose and smile.
                val nose = Path().apply {
                    moveTo(160f, 176f)
                    quadraticBezierTo(164f, 184f, 158f, 188f)
                }
                drawPath(nose, SalonColors.ink, style = Stroke(width = 2.5f, cap = StrokeCap.Round))
                if (client.smile == SalonEngine.Smile.WIDE) {
                    val smile = Path().apply {
                        moveTo(140f, 198f)
                        quadraticBezierTo(160f, 222f, 180f, 198f)
                        quadraticBezierTo(160f, 208f, 140f, 198f)
                        close()
                    }
                    drawPath(smile, SalonColors.mouth)
                } else {
                    val smile = Path().apply {
                        moveTo(146f, 200f)
                        quadraticBezierTo(160f, 211f, 174f, 200f)
                    }
                    drawPath(smile, SalonColors.ink, style = Stroke(width = 3f, cap = StrokeCap.Round))
                }

                // Fringe over the forehead.
                drawPath(hairdo.front, fill)
                drawPath(hairdo.front, SalonColors.ink, style = strokeInk)

                // Dullness: approximate the web saturate/brightness filter
                // with a translucent ink overlay, plus fading zigzag tangles.
                if (messiness > 0.02f) {
                    val dull = SalonColors.ink.copy(alpha = 0.18f * messiness)
                    drawPath(hairdo.back, dull)
                    drawPath(hairdo.front, dull)
                    hairdo.lobes.forEach { lobe ->
                        drawOval(dull, topLeft = lobe.topLeft, size = lobe.size)
                    }
                    tanglePaths.forEach { tangle ->
                        drawPath(
                            tangle,
                            Color.Black.copy(alpha = 0.35f * messiness),
                            style = Stroke(width = 3f, join = StrokeJoin.Round),
                        )
                    }
                }

                // Gum debris is vector (the leaf is an emoji overlay below).
                if (messiness > 0.45f && client.debris == SalonEngine.Debris.GUM) {
                    drawCircle(SalonColors.gum, radius = 9f, center = Offset(120f, 198f))
                    drawCircle(
                        SalonColors.ink,
                        radius = 9f,
                        center = Offset(120f, 198f),
                        style = Stroke(width = 2f),
                    )
                    drawCircle(
                        Color.White.copy(alpha = 0.8f),
                        radius = 2.5f,
                        center = Offset(117f, 195f),
                    )
                }

                // Stray strands to snip (snipped ones vanish, like the web).
                strays.filter { !it.snipped }.forEach { stray ->
                    val strand = Path().apply {
                        moveTo(stray.x, stray.y)
                        quadraticBezierTo(
                            stray.x + 12f * stray.direction, stray.y - 10f,
                            stray.x + 26f * stray.direction, stray.y - 6f,
                        )
                        quadraticBezierTo(
                            stray.x + 36f * stray.direction, stray.y - 4f,
                            stray.x + 42f * stray.direction, stray.y + 4f,
                        )
                    }
                    drawPath(strand, fill, style = Stroke(width = 4f, cap = StrokeCap.Round))
                }

                // Wash bubbles (radius shrinks per scrub, like the web).
                bubbles.filter { !it.isPopped }.forEach { bubble ->
                    val r = bubble.r * (1f - 0.2f * bubble.scrubs)
                    drawCircle(SalonColors.bubbleFill, radius = r, center = Offset(bubble.x, bubble.y))
                    drawCircle(
                        SalonColors.bubbleEdge,
                        radius = r,
                        center = Offset(bubble.x, bubble.y),
                        style = Stroke(width = 2f),
                    )
                    drawCircle(
                        Color.White.copy(alpha = 0.9f),
                        radius = r / 4f,
                        center = Offset(bubble.x - r / 3f, bubble.y - r / 3f),
                    )
                }
            }
        }

        // Emoji overlays, positioned in head coordinates. `unit` converts a
        // head-space value to dp; font sizes convert via the local density.
        fun headFontSize(px: Float) = with(density) { (unit * px).toSp() }

        if (messiness > 0.45f && client.debris == SalonEngine.Debris.LEAF) {
            Text(
                text = "🍂",
                fontSize = headFontSize(24f),
                modifier = Modifier.offset(x = unit * (204f - 12f), y = unit * (152f - 24f)),
            )
        }

        if (look.accessory != SalonEngine.Accessory.NONE) {
            // Web ACCESSORY_GLYPHS coordinates (x is the glyph center).
            val (gx, gy, gsize) = when (look.accessory) {
                SalonEngine.Accessory.BOW -> Triple(206f, 122f, 30f)
                SalonEngine.Accessory.FLOWER -> Triple(112f, 122f, 28f)
                SalonEngine.Accessory.CLIP -> Triple(200f, 106f, 24f)
                SalonEngine.Accessory.TIARA -> Triple(160f, 72f, 34f)
                SalonEngine.Accessory.NONE -> Triple(0f, 0f, 0f)
            }
            Text(
                text = look.accessory.emoji,
                fontSize = headFontSize(gsize),
                modifier = Modifier.offset(x = unit * (gx - gsize / 2f), y = unit * (gy - gsize)),
            )
        }

        strays.filter { !it.snipped }.forEach { stray ->
            Text(
                text = "✂️",
                fontSize = headFontSize(20f),
                modifier = Modifier.offset(
                    x = unit * (stray.x + 36f * stray.direction - 10f),
                    y = unit * (stray.y - 10f - 20f),
                ),
            )
        }

        sparkles.forEach { sparkle ->
            Text(
                text = "✦",
                color = SalonColors.sparkle,
                fontSize = headFontSize(sparkle.size),
                modifier = Modifier.offset(
                    x = unit * (sparkle.x - sparkle.size / 2f),
                    y = unit * (sparkle.y - sparkle.size),
                ),
            )
        }
    }
}

// MARK: - Hairdo geometry

/**
 * Hair silhouette paths for a `{length, texture}` pair — the native twin of
 * the web `buildHairdo` in `ClientHead.tsx`, with the same landmarks: side
 * edges at x 88/232 from y 150, the dome over the top of the head, the
 * per-length bottom edge, curly scallops / wavy S-curves on the edges, an
 * updo bun above the head, and braid bead columns.
 */
private class Hairdo(
    /** Main silhouette behind the face. */
    val back: Path,
    /** Fringe drawn over the forehead. */
    val front: Path,
    /** Extra blobs: updo bun or braid beads (ellipse bounding rects). */
    val lobes: List<Rect>,
)

private const val HEAD_CX = 160f
private const val SIDE_TOP = 150f
private const val DOME_TOP = 76f

private fun buildHairdo(
    length: SalonEngine.HairLength,
    texture: SalonEngine.HairTexture,
): Hairdo {
    val sideLeft = SalonEngine.HAIR_SIDE_LEFT
    val sideRight = SalonEngine.HAIR_SIDE_RIGHT
    if (texture == SalonEngine.HairTexture.UPDO) {
        val bunRadius = when (length) {
            SalonEngine.HairLength.SHORT -> 18f
            SalonEngine.HairLength.MEDIUM -> 24f
            SalonEngine.HairLength.LONG -> 30f
        }
        val bun = Rect(
            HEAD_CX - bunRadius, 58f - bunRadius * 0.85f,
            HEAD_CX + bunRadius, 58f + bunRadius * 0.85f,
        )
        return Hairdo(back = capPath(196f), front = fringePath(), lobes = listOf(bun))
    }
    if (texture == SalonEngine.HairTexture.BRAIDS) {
        val bottom = length.silhouetteBottom
        val lobes = mutableListOf<Rect>()
        for (side in listOf(-1f, 1f)) {
            var index = 0
            var y = 208f
            while (y <= bottom) {
                val beadX = HEAD_CX + side * 62f + side * (if (index % 2 == 0) 4f else -4f)
                lobes.add(Rect(beadX - 12f, y - 14f, beadX + 12f, y + 14f))
                index += 1
                y += 24f
            }
        }
        return Hairdo(back = capPath(206f), front = fringePath(), lobes = lobes)
    }

    val bottom = length.silhouetteBottom
    val path = Path()
    path.moveTo(sideLeft, bottom)
    appendTexturedV(path, sideLeft, bottom, SIDE_TOP, texture, outward = -1f)
    appendDome(path)
    appendTexturedV(path, sideRight, SIDE_TOP, bottom, texture, outward = 1f)
    appendTexturedH(path, bottom, sideRight, sideLeft, texture)
    path.close()
    return Hairdo(back = path, front = fringePath(), lobes = emptyList())
}

/** Crown of the hair, shared by every hairdo (web `DOME`). */
private fun appendDome(path: Path) {
    path.cubicTo(SalonEngine.HAIR_SIDE_LEFT, 96f, 118f, DOME_TOP, HEAD_CX, DOME_TOP)
    path.cubicTo(202f, DOME_TOP, SalonEngine.HAIR_SIDE_RIGHT, 96f, SalonEngine.HAIR_SIDE_RIGHT, SIDE_TOP)
}

/** Vertical hair edge at [x]; curly scallops or waves bulge [outward] (web `texturedV`). */
private fun appendTexturedV(
    path: Path,
    x: Float,
    fromY: Float,
    toY: Float,
    texture: SalonEngine.HairTexture,
    outward: Float,
) {
    if (texture != SalonEngine.HairTexture.CURLY && texture != SalonEngine.HairTexture.WAVES) {
        path.lineTo(x, toY)
        return
    }
    val step = if (texture == SalonEngine.HairTexture.CURLY) 20f else 36f
    val amp = if (texture == SalonEngine.HairTexture.CURLY) 14f else 9f
    val dir = if (fromY < toY) 1f else -1f
    var y = fromY
    var flip = 1f
    while (if (dir > 0f) y < toY else y > toY) {
        val next = if (dir > 0f) minOf(y + step, toY) else maxOf(y - step, toY)
        val offset = if (texture == SalonEngine.HairTexture.WAVES) amp * outward * flip else amp * outward
        path.quadraticBezierTo(x + offset, (y + next) / 2f, x, next)
        flip = -flip
        y = next
    }
}

/** Bottom hair edge at height [y], walking [fromX] to [toX] (web `texturedH`). */
private fun appendTexturedH(
    path: Path,
    y: Float,
    fromX: Float,
    toX: Float,
    texture: SalonEngine.HairTexture,
) {
    if (texture != SalonEngine.HairTexture.CURLY && texture != SalonEngine.HairTexture.WAVES) {
        path.quadraticBezierTo(HEAD_CX, y + 16f, toX, y)
        return
    }
    val step = if (texture == SalonEngine.HairTexture.CURLY) 22f else 40f
    val amp = if (texture == SalonEngine.HairTexture.CURLY) 15f else 10f
    val dir = if (fromX < toX) 1f else -1f
    var x = fromX
    var flip = 1f
    while (if (dir > 0f) x < toX else x > toX) {
        val next = if (dir > 0f) minOf(x + step, toX) else maxOf(x - step, toX)
        val offset = if (texture == SalonEngine.HairTexture.WAVES) amp * flip else amp
        path.quadraticBezierTo((x + next) / 2f, y + offset, next, y)
        flip = -flip
        x = next
    }
}

/** A short cap of hair hugging the head, used by updo and braids. */
private fun capPath(bottomY: Float): Path {
    val path = Path()
    path.moveTo(SalonEngine.HAIR_SIDE_LEFT, bottomY)
    path.lineTo(SalonEngine.HAIR_SIDE_LEFT, SIDE_TOP)
    appendDome(path)
    path.lineTo(SalonEngine.HAIR_SIDE_RIGHT, bottomY)
    path.quadraticBezierTo(HEAD_CX, bottomY + 18f, SalonEngine.HAIR_SIDE_LEFT, bottomY)
    path.close()
    return path
}

/** Fringe over the forehead (web `FRINGE` path, hand-converted). */
private fun fringePath(): Path = Path().apply {
    moveTo(98f, 150f)
    cubicTo(100f, 104f, 124f, 88f, 160f, 88f)
    cubicTo(196f, 88f, 220f, 104f, 222f, 150f)
    quadraticBezierTo(208f, 120f, 184f, 114f)
    quadraticBezierTo(174f, 134f, 160f, 132f)
    quadraticBezierTo(146f, 134f, 136f, 114f)
    quadraticBezierTo(112f, 120f, 98f, 150f)
    close()
}

/**
 * Zigzag tangle strands overlaid while the hair is messy (web `TANGLES`,
 * relative line commands resolved to absolute points).
 */
private val tanglePaths: List<Path> = listOf(
    polyline(100f to 120f, 114f to 130f, 104f to 142f, 120f to 151f, 108f to 163f),
    polyline(196f to 108f, 182f to 120f, 197f to 128f, 185f to 141f, 201f to 149f),
    polyline(92f to 210f, 104f to 224f, 90f to 234f, 103f to 248f, 92f to 260f, 106f to 272f),
    polyline(226f to 200f, 214f to 214f, 228f to 225f, 215f to 238f, 227f to 250f, 213f to 262f),
    polyline(148f to 90f, 160f to 100f, 146f to 108f, 158f to 118f),
)

private fun polyline(vararg points: Pair<Float, Float>): Path = Path().apply {
    moveTo(points.first().first, points.first().second)
    points.drop(1).forEach { (x, y) -> lineTo(x, y) }
}
