package com.baseapp.android.view.games.hanafuda

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.delay

/**
 * Lacquer-and-gold palette mirroring the web page's vanilla-extract styles.
 * The table keeps its own dark look on both app themes (why: like the web,
 * the backdrop is part of the game's identity).
 */
private object HanafudaColors {
    val table = Color(0xFF191009)
    val felt = Color(0xFF241610)
    val gold = Color(0xFFD9A441)
    val goldDim = Color(0xFF8A6A34)
    val red = Color(0xFFB53228)
    val blue = Color(0xFF3E4A8C)
    val cream = Color(0xFFF4ECD6)
    val ink = Color(0xFF221C18)
    val parchment = Color(0xFFE8DCC0)
    val parchmentDim = Color(0xFFA8916C)
    val scrim = Color(0xB8000000)
}

/** Month kanji, indexed by `month - 1` (pine through paulownia). */
private val monthKanji =
    listOf("松", "梅", "桜", "藤", "菖", "牡", "萩", "芒", "菊", "紅", "柳", "桐")

/** Motif emoji for the headline cards; plain cards show only their kanji. */
private val cardEmoji = mapOf(
    HanafudaEngine.CRANE_ID to "🕊",
    4 to "🐦", // bush warbler
    HanafudaEngine.CURTAIN_ID to "🏮",
    12 to "🐤", // cuckoo
    16 to "🌉", // eight-plank bridge
    HanafudaEngine.BUTTERFLIES_ID to "🦋",
    HanafudaEngine.BOAR_ID to "🐗",
    HanafudaEngine.MOON_ID to "🌕",
    29 to "🦆", // geese
    HanafudaEngine.SAKE_CUP_ID to "🍶",
    HanafudaEngine.DEER_ID to "🦌",
    HanafudaEngine.RAIN_MAN_ID to "☔",
    41 to "🐦", // swallow
    43 to "⚡", // lightning chaff
    HanafudaEngine.PHOENIX_ID to "🦚",
)

/** Pause before the bot acts, matching the web page's pacing. */
private const val BOT_TURN_MS = 950L

/**
 * Home surface for the `hanafuda` pack — the native twin of the web
 * HanafudaPage. Rendering and touch input only: all rules live in
 * [HanafudaEngine] (a 1:1 port of the web engine) so the game stays
 * JVM-testable and in lockstep across platforms. No network, no stores.
 *
 * Card faces use simplified native drawing — month kanji + motif emoji +
 * card-type color coding — instead of the web's full SVG art (see PACK.md).
 */
@Composable
fun HanafudaGameView() {
    val theme = LocalUiTheme.current
    val engine = remember { HanafudaEngine() }
    // The engine is plain mutable state; bumping `version` re-renders the
    // table after every action.
    var version by remember { mutableIntStateOf(0) }
    var toast by remember { mutableStateOf<String?>(null) }

    fun bump() {
        version += 1
        val report = engine.lastReport
        if (report != null && report.seat == HanafudaEngine.Seat.BOT && report.newYaku.isNotEmpty()) {
            val names = report.newYaku.joinToString(" · ") { it.label }
            toast = if (report.botDecision == "koikoi") "$names — bot calls KOI-KOI!" else names
        }
    }

    // The bot acts on a delay whenever the engine hands it the turn.
    LaunchedEffect(version) {
        if (engine.phase == HanafudaEngine.Phase.BOT_TURN) {
            delay(BOT_TURN_MS)
            engine.botTakeTurn()
            bump()
        }
    }

    // Toasts self-dismiss.
    LaunchedEffect(toast) {
        if (toast != null) {
            delay(2600)
            toast = null
        }
    }

    val choosableIds = when (engine.phase) {
        HanafudaEngine.Phase.CHOOSE_FIELD_FOR_HAND ->
            engine.pendingHandCard?.let { engine.fieldMatches(it).map { card -> card.id }.toSet() }
        HanafudaEngine.Phase.CHOOSE_FIELD_FOR_DRAW ->
            engine.pendingDrawnCard?.let { engine.fieldMatches(it).map { card -> card.id }.toSet() }
        else -> null
    } ?: emptySet()

    Box(modifier = Modifier.fillMaxSize().background(HanafudaColors.table)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(theme.spacing.md),
            verticalArrangement = Arrangement.spacedBy(theme.spacing.sm),
        ) {
            // Header
            Text(
                text = "HANAFUDABOT",
                color = HanafudaColors.gold,
                fontSize = theme.typography.sizes.xl,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                LacquerButton(label = "⟳ NEW MATCH") {
                    engine.startMatch()
                    toast = null
                    bump()
                }
                Text(
                    text = "ROUND ${engine.round}/${HanafudaEngine.TOTAL_ROUNDS} · " +
                        "YOU ${engine.playerTotal} · BOT ${engine.botTotal}",
                    color = HanafudaColors.parchmentDim,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.SemiBold,
                )
            }

            // Bot hand (face down) + capture summary.
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                SeatLabel("BOT")
                engine.botHand.forEach { _ -> HanafudaCardBack(width = 22.dp) }
            }
            CapturedTray(
                label = "BOT'S",
                pile = engine.botCaptured,
            )

            // The field, the deck, and any pending two-way choice.
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(theme.radius.md))
                    .background(HanafudaColors.felt)
                    .border(1.dp, HanafudaColors.goldDim, RoundedCornerShape(theme.radius.md))
                    .padding(theme.spacing.sm),
                verticalArrangement = Arrangement.spacedBy(theme.spacing.sm),
            ) {
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(minSize = 44.dp),
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                    verticalArrangement = Arrangement.spacedBy(5.dp),
                ) {
                    items(engine.field, key = { it.id }) { card ->
                        HanafudaCardFace(
                            card = card,
                            width = 44.dp,
                            highlighted = card.id in choosableIds,
                            onClick = {
                                if (card.id in choosableIds) {
                                    engine.resolveFieldChoice(card.id)
                                    bump()
                                }
                            },
                        )
                    }
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm),
                ) {
                    HanafudaCardBack(width = 26.dp)
                    Text(
                        text = "DECK ${engine.deck.size}",
                        color = HanafudaColors.parchmentDim,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                    )
                    val pending = engine.pendingHandCard ?: engine.pendingDrawnCard
                    if (pending != null) {
                        HanafudaCardFace(card = pending, width = 30.dp, highlighted = true, onClick = {})
                        Text(
                            text = if (engine.pendingHandCard != null) {
                                "PLAYED — PICK A MATCH"
                            } else {
                                "FLIPPED — PICK A MATCH"
                            },
                            color = HanafudaColors.gold,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }

            // Player capture summary + hand.
            CapturedTray(
                label = "YOURS",
                pile = engine.playerCaptured,
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                engine.playerHand.forEach { card ->
                    HanafudaCardFace(
                        card = card,
                        width = 52.dp,
                        highlighted = false,
                        onClick = {
                            if (engine.phase == HanafudaEngine.Phase.SELECT_HAND) {
                                engine.playHandCard(card.id)
                                bump()
                            }
                        },
                    )
                }
            }

            Text(
                text = statusMessage(engine),
                color = HanafudaColors.gold,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        toast?.let { message ->
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 110.dp)
                    .clip(RoundedCornerShape(theme.radius.sm))
                    .background(HanafudaColors.felt)
                    .border(1.dp, HanafudaColors.gold, RoundedCornerShape(theme.radius.sm))
                    .padding(horizontal = 16.dp, vertical = 10.dp),
            ) {
                Text(
                    text = message,
                    color = HanafudaColors.gold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        when (engine.phase) {
            HanafudaEngine.Phase.DECISION -> DecisionDialog(
                yaku = engine.lastReport?.newYaku.orEmpty(),
                onKoiKoi = {
                    engine.declareKoiKoi()
                    bump()
                },
                onShobu = {
                    engine.declareShobu()
                    bump()
                },
            )
            HanafudaEngine.Phase.ROUND_OVER -> RoundOverDialog(
                result = engine.results.lastOrNull(),
                nextRound = engine.round + 1,
                onNext = {
                    engine.startNextRound()
                    bump()
                },
            )
            HanafudaEngine.Phase.MATCH_OVER -> MatchOverDialog(
                winner = engine.matchWinner,
                playerTotal = engine.playerTotal,
                botTotal = engine.botTotal,
                onNewMatch = {
                    engine.startMatch()
                    bump()
                },
            )
            else -> Unit
        }
    }
}

private fun statusMessage(engine: HanafudaEngine): String = when (engine.phase) {
    HanafudaEngine.Phase.SELECT_HAND -> "YOUR TURN — TAP A HAND CARD"
    HanafudaEngine.Phase.CHOOSE_FIELD_FOR_HAND,
    HanafudaEngine.Phase.CHOOSE_FIELD_FOR_DRAW,
    -> "PICK A HIGHLIGHTED FIELD CARD"
    HanafudaEngine.Phase.DECISION -> "YAKU! KOI-KOI OR SHOBU?"
    HanafudaEngine.Phase.BOT_TURN -> "BOT IS THINKING..."
    HanafudaEngine.Phase.ROUND_OVER -> "ROUND OVER"
    HanafudaEngine.Phase.MATCH_OVER -> "MATCH OVER"
}

@Composable
private fun SeatLabel(text: String) {
    Text(
        text = text,
        color = HanafudaColors.parchmentDim,
        fontSize = 10.sp,
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.width(44.dp),
    )
}

/**
 * A capture pile grouped by card type (brights first, like the web trays)
 * with the pile's current yaku points in the label.
 */
@Composable
private fun CapturedTray(label: String, pile: List<HanafudaEngine.Card>) {
    val points = HanafudaEngine.yakuPoints(HanafudaEngine.evaluateYaku(pile))
    val order = listOf(
        HanafudaEngine.Kind.BRIGHT,
        HanafudaEngine.Kind.ANIMAL,
        HanafudaEngine.Kind.RIBBON,
        HanafudaEngine.Kind.CHAFF,
    )
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(38.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Text(
            text = "$label · $points PTS",
            color = HanafudaColors.parchmentDim,
            fontSize = 9.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(74.dp),
        )
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            order.forEach { kind ->
                pile.filter { it.kind == kind }.forEach { card ->
                    HanafudaCardFace(card = card, width = 22.dp, highlighted = false, onClick = {})
                }
            }
        }
    }
}

/**
 * Simplified native card face: type-colored top band, month kanji, motif
 * emoji. Distinct and month-recognizable without the web's full SVG art.
 */
@Composable
private fun HanafudaCardFace(
    card: HanafudaEngine.Card,
    width: androidx.compose.ui.unit.Dp,
    highlighted: Boolean,
    onClick: () -> Unit,
) {
    val height = width * 1.6f
    val kindColor = when (card.kind) {
        HanafudaEngine.Kind.BRIGHT -> HanafudaColors.gold
        HanafudaEngine.Kind.ANIMAL -> HanafudaColors.red
        HanafudaEngine.Kind.RIBBON ->
            if (card.ribbon == HanafudaEngine.RibbonColor.BLUE) HanafudaColors.blue
            else HanafudaColors.red
        HanafudaEngine.Kind.CHAFF -> HanafudaColors.goldDim
    }
    val shape = RoundedCornerShape(width * 0.12f)
    Column(
        modifier = Modifier
            .size(width = width, height = height)
            .clip(shape)
            .background(HanafudaColors.cream)
            .border(
                width = if (highlighted) 2.dp else 1.dp,
                color = if (highlighted) HanafudaColors.gold else HanafudaColors.ink,
                shape = shape,
            )
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(height * 0.14f)
                .background(kindColor),
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = monthKanji[card.month - 1],
            color = HanafudaColors.ink,
            fontSize = (width.value * 0.42f).sp,
            fontWeight = FontWeight.Bold,
        )
        cardEmoji[card.id]?.let { emoji ->
            Text(text = emoji, fontSize = (width.value * 0.32f).sp)
        }
        Spacer(modifier = Modifier.weight(1f))
    }
}

/** Face-down card: black lacquer with a gold roundel, like the web back. */
@Composable
private fun HanafudaCardBack(width: androidx.compose.ui.unit.Dp) {
    val shape = RoundedCornerShape(width * 0.12f)
    Box(
        modifier = Modifier
            .size(width = width, height = width * 1.6f)
            .clip(shape)
            .background(HanafudaColors.ink)
            .border(1.dp, HanafudaColors.goldDim, shape),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size(width * 0.45f)
                .border(1.5.dp, HanafudaColors.gold, RoundedCornerShape(percent = 50)),
        )
    }
}

/** Chunky lacquer-table control button echoing the web toolbar. */
@Composable
private fun LacquerButton(label: String, prominent: Boolean = false, onClick: () -> Unit) {
    val shape = RoundedCornerShape(6.dp)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(
                if (prominent) HanafudaColors.gold else HanafudaColors.gold.copy(alpha = 0.12f),
            )
            .border(1.dp, HanafudaColors.goldDim, shape)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 9.dp),
    ) {
        Text(
            text = label,
            color = if (prominent) HanafudaColors.ink else HanafudaColors.gold,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun DialogShell(title: String, content: @Composable () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize().background(HanafudaColors.scrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 340.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(HanafudaColors.felt)
                .border(2.dp, HanafudaColors.gold, RoundedCornerShape(10.dp))
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                text = title,
                color = HanafudaColors.gold,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                textAlign = TextAlign.Center,
            )
            content()
        }
    }
}

@Composable
private fun DecisionDialog(
    yaku: List<HanafudaEngine.Yaku>,
    onKoiKoi: () -> Unit,
    onShobu: () -> Unit,
) {
    DialogShell(title = "役 — Yaku!") {
        yaku.forEach { item ->
            Text(
                text = "${item.label} — ${item.points}",
                color = HanafudaColors.gold,
                fontSize = 13.sp,
            )
        }
        Text(
            text = "Koi-koi presses for a bigger hand; shobu banks the points now.",
            color = HanafudaColors.parchment,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            LacquerButton(label = "KOI-KOI", onClick = onKoiKoi)
            LacquerButton(label = "SHOBU", prominent = true, onClick = onShobu)
        }
    }
}

@Composable
private fun RoundOverDialog(
    result: HanafudaEngine.RoundResult?,
    nextRound: Int,
    onNext: () -> Unit,
) {
    val title = when (result?.winner) {
        HanafudaEngine.Seat.PLAYER -> "You take round ${result.round}!"
        HanafudaEngine.Seat.BOT -> "Bot takes round ${result.round}."
        null -> "Round ${result?.round ?: 0} is a draw."
    }
    DialogShell(title = title) {
        result?.takeIf { it.winner != null }?.let { won ->
            won.yaku.forEach { item ->
                Text(
                    text = "${item.label} — ${item.points}",
                    color = HanafudaColors.gold,
                    fontSize = 13.sp,
                )
            }
            Text(
                text = if (won.score == won.basePoints) {
                    "${won.basePoints} points"
                } else {
                    "${won.basePoints} points → ${won.score} after doubling"
                },
                color = HanafudaColors.parchment,
                fontSize = 12.sp,
            )
        }
        LacquerButton(label = "DEAL ROUND $nextRound", prominent = true, onClick = onNext)
    }
}

@Composable
private fun MatchOverDialog(
    winner: HanafudaEngine.Seat?,
    playerTotal: Int,
    botTotal: Int,
    onNewMatch: () -> Unit,
) {
    val title = when (winner) {
        HanafudaEngine.Seat.PLAYER -> "You win the match!"
        HanafudaEngine.Seat.BOT -> "The bot takes the match."
        null -> "The match is a draw."
    }
    DialogShell(title = title) {
        Text(
            text = "Final — You $playerTotal · Bot $botTotal",
            color = HanafudaColors.parchment,
            fontSize = 13.sp,
        )
        LacquerButton(label = "NEW MATCH", prominent = true, onClick = onNewMatch)
    }
}
