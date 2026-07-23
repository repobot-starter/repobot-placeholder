package com.baseapp.android.view.games.blackjack

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Pacing of the dealer choreography, matching the web constants (ms).
private const val REVEAL_PAUSE_MS = 550L
private const val DEALER_DRAW_MS = 700L
private const val SHUFFLE_NOTE_MS = 2_600L

/**
 * Casino palette mirroring the web BlackjackPage.styles.css constants. The
 * felt keeps its own green-and-gold look on both light and dark app themes
 * (why: the web table is hardcoded too — it is part of the game's identity).
 */
private object BlackjackColors {
    val feltLight = Color(0xFF2F8F54)
    val feltDark = Color(0xFF12492A)
    val woodDark = Color(0xFF38220F)
    val gold = Color(0xFFD4AF37)
    val goldSoft = Color(0xFFE8CF7A)
    val cream = Color(0xFFF3EAD2)
    val ink = Color(0xFF1A1108)
    val red = Color(0xFFC0392B)
    val chipGreen = Color(0xFF1E8449)
    val chipBlack = Color(0xFF20242C)
    val cardFace = Color(0xFFFFFFFF)
    val cardBack = Color(0xFF7B1E2B)
    val cardBackDark = Color(0xFF5D1620)
    val loseText = Color(0xFFE08A7C)
    val loseBorder = Color(0xFFA24D3F)
    val creditGreen = Color(0xFF3F9D5F)
    val bannerBg = Color(0xE00A140C) // rgba(10,20,12,0.88)
}

/**
 * Home surface for the `blackjack` pack — the native twin of the web
 * BlackjackPage. Rendering, pacing, and persistence only: all rules live in
 * [BlackjackEngine] so they stay JVM-testable and in lockstep with the web
 * game. No network, no stores.
 *
 * The engine is deliberately not snapshot state; every mutation goes through
 * `commit`, which bumps a revision counter (that is what recomposes the
 * screen), persists the bankroll to SharedPreferences under the web's
 * localStorage key name (`blackjack.bankroll`), and flashes the shuffle note.
 * The dealer's paced draws (the web's setTimeout choreography) run in a
 * coroutine off the composition scope.
 */
@Composable
fun BlackjackGameView() {
    val theme = LocalUiTheme.current
    val context = LocalContext.current
    val preferences = remember(context) {
        context.applicationContext.getSharedPreferences(
            "base.android.blackjack",
            Context.MODE_PRIVATE,
        )
    }
    val engine = remember { BlackjackEngine(bankroll = loadBankroll(preferences)) }
    var revision by remember { mutableIntStateOf(0) }
    var shuffling by remember { mutableStateOf(false) }
    var lastShuffleCount by remember { mutableIntStateOf(engine.shuffleCount) }
    val scope = rememberCoroutineScope()

    /** Runs an engine mutation, then recomposes, persists, and shuffles. */
    fun commit(action: () -> Unit) {
        action()
        revision += 1
        preferences.edit()
            .putString(BlackjackEngine.BANKROLL_STORAGE_KEY, engine.bankroll.toString())
            .apply()
        if (engine.shuffleCount != lastShuffleCount) {
            lastShuffleCount = engine.shuffleCount
            shuffling = true
            scope.launch {
                delay(SHUFFLE_NOTE_MS)
                shuffling = false
            }
        }
    }

    /** Paces the dealer's draws: hole flip pause, then one card per beat. */
    fun runDealerTurnIfNeeded() {
        if (engine.phase != BlackjackEngine.Phase.DEALER) {
            return
        }
        scope.launch {
            delay(REVEAL_PAUSE_MS)
            while (engine.phase == BlackjackEngine.Phase.DEALER) {
                var drew = false
                commit { drew = engine.dealerStep() }
                if (drew) {
                    delay(DEALER_DRAW_MS)
                }
            }
        }
    }

    // Reading `revision` here makes every engine mutation recompose the tree.
    @Suppress("UNUSED_EXPRESSION")
    revision

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .statusBarsPadding()
            .padding(theme.spacing.lg),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
    ) {
        Text(
            text = "BLACKJACKBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        FeltTable(
            engine = engine,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            onHit = {
                commit { engine.hit() }
                runDealerTurnIfNeeded()
            },
            onStand = {
                commit { engine.stand() }
                runDealerTurnIfNeeded()
            },
            onDouble = {
                commit { engine.doubleDown() }
                runDealerTurnIfNeeded()
            },
        )

        MoneyRow(engine = engine)

        ChipRow(engine = engine, onChip = { commit { engine.addChip(it) } })

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            GoldButton(
                label = "DEAL 🃏",
                enabled = engine.phase == BlackjackEngine.Phase.BETTING && engine.bet > 0,
                onClick = { commit { engine.deal() } },
            )
            OutlineButton(
                label = "CLEAR BET",
                enabled = engine.phase == BlackjackEngine.Phase.BETTING && engine.bet > 0,
                onClick = { commit { engine.clearBet() } },
            )
            OutlineButton(
                label = "⟳ NEW HAND",
                enabled = engine.phase == BlackjackEngine.Phase.SETTLED,
                onClick = { commit { engine.newHand() } },
            )
            if (engine.isBroke && engine.phase == BlackjackEngine.Phase.BETTING) {
                GoldButton(
                    label = "🏦 CREDIT",
                    background = BlackjackColors.creditGreen,
                    onClick = { commit { engine.takeHouseCredit() } },
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = statusMessage(engine),
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            if (shuffling) {
                Text(
                    text = "🔀 shuffling…",
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.xs,
                    fontFamily = FontFamily.Monospace,
                )
            }
        }
    }
}

/** The web statusMessage, minus the transient "dealing" phase. */
private fun statusMessage(engine: BlackjackEngine): String = when (engine.phase) {
    BlackjackEngine.Phase.BETTING ->
        when {
            engine.isBroke -> "BANKROLL EMPTY — TAKE HOUSE CREDIT"
            engine.bet > 0 ->
                "BET ${BlackjackEngine.formatMoney(engine.bet.toDouble())} — PRESS DEAL"
            else -> "PLACE YOUR BET"
        }
    BlackjackEngine.Phase.PLAYER -> "YOUR MOVE — HIT, STAND, OR DOUBLE"
    BlackjackEngine.Phase.DEALER -> "DEALER PLAYS..."
    BlackjackEngine.Phase.SETTLED ->
        when (engine.result?.kind) {
            BlackjackEngine.ResultKind.BLACKJACK -> "BLACKJACK! PAID 3:2"
            BlackjackEngine.ResultKind.WIN -> "YOU WIN"
            BlackjackEngine.ResultKind.PUSH -> "PUSH — BET RETURNED"
            BlackjackEngine.ResultKind.BUST -> "BUST"
            BlackjackEngine.ResultKind.LOSE -> "DEALER WINS"
            null -> "HAND OVER"
        }
}

/**
 * Mirrors the web `loadBankroll`: any missing or unparseable stored value
 * falls back to the starting bankroll. The value is stored as a string, like
 * the web's localStorage entry.
 */
private fun loadBankroll(preferences: SharedPreferences): Double {
    val raw = preferences.getString(BlackjackEngine.BANKROLL_STORAGE_KEY, null)
    val value = raw?.toDoubleOrNull()
    return if (value != null && value.isFinite() && value >= 0) {
        value
    } else {
        BlackjackEngine.STARTING_BANKROLL
    }
}

// ---------------------------------------------------------------------------
// Felt table
// ---------------------------------------------------------------------------

/**
 * The green felt: both hands with live totals, the motto, the bet spot, the
 * player action buttons, and the pop-in result banner.
 */
@Composable
private fun FeltTable(
    engine: BlackjackEngine,
    modifier: Modifier = Modifier,
    onHit: () -> Unit,
    onStand: () -> Unit,
    onDouble: () -> Unit,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.radialGradient(
                    colors = listOf(BlackjackColors.feltLight, BlackjackColors.feltDark),
                ),
            )
            // Wood rail around the felt with a gold inline just inside it,
            // like the web table's border + inset gold box-shadow.
            .border(8.dp, BlackjackColors.woodDark, RoundedCornerShape(18.dp))
            .padding(8.dp)
            .border(2.dp, BlackjackColors.gold, RoundedCornerShape(10.dp))
            .padding(horizontal = 12.dp, vertical = 14.dp),
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            HandArea(
                label = "🤖 DEALER",
                badge = dealerTotalText(engine),
                cards = engine.dealerCards,
                holeHidden = engine.holeHidden,
                labelAbove = true,
            )

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "BLACKJACK PAYS 3 TO 2 · DEALER STANDS ON ALL 17S",
                    color = BlackjackColors.goldSoft.copy(alpha = 0.65f),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(6.dp))
                BetSpot(bet = engine.bet)
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                HandArea(
                    label = "👤 YOU",
                    badge = playerTotalText(engine),
                    cards = engine.playerCards,
                    holeHidden = false,
                    labelAbove = false,
                )
                Row(
                    modifier = Modifier.heightIn(min = 44.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    if (engine.phase == BlackjackEngine.Phase.PLAYER) {
                        GoldButton(label = "HIT", onClick = onHit)
                        GoldButton(label = "STAND", onClick = onStand)
                        GoldButton(
                            label = "DOUBLE",
                            enabled = engine.canDouble,
                            onClick = onDouble,
                        )
                    }
                }
            }
        }

        val result = engine.result
        if (engine.phase == BlackjackEngine.Phase.SETTLED && result != null) {
            ResultBanner(result = result, modifier = Modifier.align(Alignment.Center))
        }
    }
}

private fun dealerTotalText(engine: BlackjackEngine): String? {
    val cards = engine.dealerCards
    if (cards.isEmpty()) {
        return null
    }
    if (engine.holeHidden) {
        return "showing ${BlackjackEngine.handTotal(listOf(cards[0])).total}"
    }
    return BlackjackEngine.formatTotal(cards)
}

private fun playerTotalText(engine: BlackjackEngine): String? =
    if (engine.playerCards.isEmpty()) null else BlackjackEngine.formatTotal(engine.playerCards)

@Composable
private fun HandArea(
    label: String,
    badge: String?,
    cards: List<BlackjackEngine.Card>,
    holeHidden: Boolean,
    labelAbove: Boolean,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        if (labelAbove) {
            HandLabel(label = label, badge = badge)
            Spacer(modifier = Modifier.height(6.dp))
        }
        Row(
            modifier = Modifier.heightIn(min = 84.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            cards.forEachIndexed { index, card ->
                CardView(card = card, faceUp = index != 1 || !holeHidden)
            }
        }
        if (!labelAbove) {
            Spacer(modifier = Modifier.height(6.dp))
            HandLabel(label = label, badge = badge)
        }
    }
}

@Composable
private fun HandLabel(label: String, badge: String?) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            color = BlackjackColors.goldSoft,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        if (badge != null) {
            Text(
                text = badge,
                color = BlackjackColors.cream,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color.Black.copy(alpha = 0.35f))
                    .padding(horizontal = 8.dp, vertical = 1.dp),
            )
        }
    }
}

/** The dashed betting circle at the table's center, like the web betSpot. */
@Composable
private fun BetSpot(bet: Int) {
    Box(
        modifier = Modifier
            .size(62.dp)
            .drawBehind {
                drawCircle(
                    color = BlackjackColors.cream.copy(alpha = 0.55f),
                    style = Stroke(
                        width = 2.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(14f, 12f)),
                    ),
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = if (bet > 0) BlackjackEngine.formatMoney(bet.toDouble()) else "BET",
            color = BlackjackColors.cream,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** Pop-in banner announcing the settled hand, in the web's banner colors. */
@Composable
private fun ResultBanner(result: BlackjackEngine.HandResult, modifier: Modifier = Modifier) {
    val isPush = result.kind == BlackjackEngine.ResultKind.PUSH
    val textColor = when {
        isPush -> BlackjackColors.cream
        result.net > 0 -> BlackjackColors.goldSoft
        else -> BlackjackColors.loseText
    }
    val borderColor = when {
        isPush -> BlackjackColors.cream
        result.net > 0 -> BlackjackColors.gold
        else -> BlackjackColors.loseBorder
    }
    val title = when (result.kind) {
        BlackjackEngine.ResultKind.BLACKJACK -> "BLACKJACK!"
        BlackjackEngine.ResultKind.WIN -> "WIN"
        BlackjackEngine.ResultKind.PUSH -> "PUSH"
        BlackjackEngine.ResultKind.BUST -> "BUST"
        BlackjackEngine.ResultKind.LOSE -> "DEALER WINS"
    }
    val net = when {
        result.net > 0 -> "+${BlackjackEngine.formatMoney(result.net)}"
        result.net < 0 -> "-${BlackjackEngine.formatMoney(-result.net)}"
        else -> "bet returned"
    }

    // Pop-in scale, like the web bannerPop keyframes.
    var shown by remember { mutableStateOf(false) }
    val pop by animateFloatAsState(
        targetValue = if (shown) 1f else 0.6f,
        animationSpec = tween(durationMillis = 250),
    )
    LaunchedEffect(Unit) { shown = true }

    Column(
        modifier = modifier
            .graphicsLayer {
                scaleX = pop
                scaleY = pop
                alpha = if (shown) 1f else 0f
            }
            .clip(RoundedCornerShape(12.dp))
            .background(BlackjackColors.bannerBg)
            .border(2.dp, borderColor, RoundedCornerShape(12.dp))
            .padding(horizontal = 28.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = title,
            color = textColor,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = net,
            color = textColor.copy(alpha = 0.9f),
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

/**
 * One playing card. Deals in with a slide/fade animation on first
 * composition and flips in 3D whenever [faceUp] changes (the dealer's
 * hole-card reveal), like the web CardView's CSS transitions.
 */
@Composable
private fun CardView(card: BlackjackEngine.Card, faceUp: Boolean) {
    var dealt by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { dealt = true }
    val dealProgress by animateFloatAsState(
        targetValue = if (dealt) 1f else 0f,
        animationSpec = tween(durationMillis = 350),
    )
    val flip by animateFloatAsState(
        targetValue = if (faceUp) 0f else 180f,
        animationSpec = tween(durationMillis = 450),
    )
    val suitColor = if (card.isRed) BlackjackColors.red else BlackjackColors.chipBlack

    Box(
        modifier = Modifier
            .size(width = 58.dp, height = 84.dp)
            .graphicsLayer {
                translationX = (1f - dealProgress) * -20.dp.toPx()
                translationY = (1f - dealProgress) * -32.dp.toPx()
                alpha = dealProgress
                rotationY = flip
                cameraDistance = 12f * density
            }
            .clip(RoundedCornerShape(7.dp)),
    ) {
        if (flip <= 90f) {
            // Face
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(BlackjackColors.cardFace)
                    .border(1.dp, Color.Black.copy(alpha = 0.35f), RoundedCornerShape(7.dp)),
            ) {
                Text(
                    text = "${card.rank.symbol}\n${card.suit.symbol}",
                    color = suitColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center,
                    lineHeight = 12.sp,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(4.dp),
                )
                Text(
                    text = card.suit.symbol,
                    color = suitColor,
                    fontSize = 26.sp,
                    modifier = Modifier.align(Alignment.Center),
                )
                Text(
                    text = "${card.rank.symbol}\n${card.suit.symbol}",
                    color = suitColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center,
                    lineHeight = 12.sp,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(4.dp)
                        .graphicsLayer { rotationZ = 180f },
                )
            }
        } else {
            // Back (mirrored under the Y rotation, so flip it back upright).
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer { rotationY = 180f }
                    .background(BlackjackColors.cardBack)
                    .border(3.dp, Color.White, RoundedCornerShape(7.dp))
                    .padding(6.dp)
                    .background(BlackjackColors.cardBackDark, RoundedCornerShape(4.dp)),
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Bankroll & betting controls
// ---------------------------------------------------------------------------

@Composable
private fun MoneyRow(engine: BlackjackEngine) {
    val theme = LocalUiTheme.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = "💰 ${BlackjackEngine.formatMoney(engine.bankroll)}",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "🎯 ${BlackjackEngine.formatMoney(engine.bet.toDouble())}",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = "SHOE: ${engine.shoeCount}",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun ChipRow(engine: BlackjackEngine, onChip: (Int) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        BlackjackEngine.CHIP_DENOMINATIONS.forEach { denomination ->
            val enabled = engine.phase == BlackjackEngine.Phase.BETTING &&
                engine.bet + denomination <= engine.bankroll
            ChipButton(
                denomination = denomination,
                enabled = enabled,
                onClick = { onChip(denomination) },
            )
        }
    }
}

/** Round casino chip with a dashed edge, colored by denomination like web. */
@Composable
private fun ChipButton(denomination: Int, enabled: Boolean, onClick: () -> Unit) {
    val background = when (denomination) {
        25 -> BlackjackColors.chipGreen
        100 -> BlackjackColors.chipBlack
        else -> BlackjackColors.red
    }
    Box(
        modifier = Modifier
            .size(52.dp)
            .alpha(if (enabled) 1f else 0.4f)
            .clip(CircleShape)
            .background(background)
            .clickable(enabled = enabled, onClick = onClick)
            .drawBehind {
                drawCircle(
                    color = Color.White.copy(alpha = 0.85f),
                    radius = size.minDimension / 2f - 5.dp.toPx(),
                    style = Stroke(
                        width = 3.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(16f, 10f)),
                    ),
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "$$denomination",
            color = Color.White,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** Gold-gradient action button echoing the web table's chunky gold buttons. */
@Composable
private fun GoldButton(
    label: String,
    enabled: Boolean = true,
    background: Color = BlackjackColors.gold,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(8.dp)
    Box(
        modifier = Modifier
            .alpha(if (enabled) 1f else 0.45f)
            .clip(shape)
            .background(
                Brush.verticalGradient(listOf(BlackjackColors.goldSoft, background)),
            )
            .border(2.dp, BlackjackColors.ink, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 9.dp),
    ) {
        Text(
            text = label,
            color = BlackjackColors.ink,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** Outlined secondary button (the web "Clear Bet" look). */
@Composable
private fun OutlineButton(label: String, enabled: Boolean = true, onClick: () -> Unit) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(8.dp)
    Box(
        modifier = Modifier
            .alpha(if (enabled) 1f else 0.4f)
            .clip(shape)
            .background(theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 9.dp),
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
