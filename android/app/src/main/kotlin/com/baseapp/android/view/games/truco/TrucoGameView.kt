package com.baseapp.android.view.games.truco

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.delay

/**
 * Boteco palette mirroring the web TrucoPage styles. The table keeps its own
 * warm felt-and-wood look on both light and dark app themes (why: the web
 * table is hardcoded too — it is part of the game's identity).
 */
private object TrucoColors {
    val felt = Color(0xFF1E6B3C)
    val feltDark = Color(0xFF14512C)
    val wood = Color(0xFF5A3520)
    val woodDark = Color(0xFF3E2312)
    val cream = Color(0xFFF6ECD4)
    val ink = Color(0xFF1C1006)
    val amber = Color(0xFFFFBF47)
    val red = Color(0xFFC8402F)
    val cardFace = Color(0xFFFDF8EC)
    val cardBack = Color(0xFF27548F)
    val manilhaGold = Color(0xFFFFD76A)
    val scrim = Color(0x8C1C1006)
}

// Pacing of the table choreography (ms), mirroring the web page.
private const val BOT_THINK_MS = 900L
private const val TRICK_LINGER_MS = 1600L
private const val SPEECH_MS = 2600L

/**
 * Home surface for the `truco` pack — the native twin of the web TrucoPage.
 * Rendering and taps only: all rules live in [TrucoEngine] so the game stays
 * JVM-testable and in lockstep with the web. No network, no stores.
 *
 * The engine is not snapshot state; [tick]-style counters drive
 * recomposition, and `LaunchedEffect`s own the timing (the bot's "thinking"
 * delay, the trick-reveal linger, speech-bubble lifetimes).
 */
@Composable
fun TrucoGameView() {
    val theme = LocalUiTheme.current
    val engine = remember { TrucoEngine() }
    var tick by remember { mutableIntStateOf(0) }
    var speech by remember { mutableStateOf<String?>(null) }
    var speechId by remember { mutableIntStateOf(0) }
    var showLastTrick by remember { mutableStateOf(false) }
    var caraDePau by remember { mutableFloatStateOf(0.35f) }

    /** Applies engine events to the UI; effects below keep the bot moving. */
    fun apply(events: List<TrucoEngine.Event>) {
        for (event in events) {
            when (event) {
                is TrucoEngine.Event.BotSpoke -> {
                    speech = event.line
                    speechId += 1
                }
                is TrucoEngine.Event.TrickResolved -> showLastTrick = true
                else -> {}
            }
        }
        tick += 1
    }

    // Deal the first hand once.
    LaunchedEffect(Unit) { apply(engine.newGame()) }

    // Speech bubbles fade after a beat.
    LaunchedEffect(speechId) {
        if (speech != null) {
            delay(SPEECH_MS)
            speech = null
        }
    }

    // A resolved trick lingers on the felt before the next one starts.
    LaunchedEffect(showLastTrick) {
        if (showLastTrick) {
            delay(TRICK_LINGER_MS)
            showLastTrick = false
        }
    }

    // Bot turn driver: after every state change, if it is the bot's move and
    // no trick reveal is lingering, let it "think" and act.
    LaunchedEffect(tick, showLastTrick) {
        if (engine.phase == TrucoEngine.Phase.BOT_TURN && !showLastTrick) {
            delay(BOT_THINK_MS)
            if (engine.phase == TrucoEngine.Phase.BOT_TURN) {
                apply(engine.botAct())
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .statusBarsPadding()
            .padding(theme.spacing.lg),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
    ) {
        // Reading the tick subscribes this composition to engine mutations.
        @Suppress("UNUSED_EXPRESSION")
        tick

        Text(
            text = "TRUCOBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        ScoreRow(engine = engine)

        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            TrucoTable(
                engine = engine,
                speech = speech,
                showLastTrick = showLastTrick,
                onPlayCard = { index -> apply(engine.playCard(index)) },
                onRespond = { response -> apply(engine.respondToRaise(response)) },
                onMaoDeOnze = { play -> apply(engine.decideMaoDeOnze(play)) },
                onNextHand = { apply(engine.startHand()) },
                onRematch = {
                    engine.bluff = caraDePau.toDouble()
                    apply(engine.newGame())
                },
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            BotecoButton(label = "⟳ NOVA PARTIDA", onClick = {
                engine.bluff = caraDePau.toDouble()
                speech = null
                showLastTrick = false
                apply(engine.newGame())
            })
            val nextRung = TrucoEngine.nextStake(engine.stake)
            BotecoButton(
                label = nextRung?.let { TrucoEngine.RAISE_CALL.getValue(it) } ?: "DOZE É O TETO",
                danger = true,
                enabled = engine.canRaise(TrucoEngine.Seat.PLAYER),
                onClick = { apply(engine.playerCallRaise()) },
            )
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            StatusText(text = "honesto")
            Slider(
                value = caraDePau,
                onValueChange = {
                    caraDePau = it
                    engine.bluff = it.toDouble()
                },
                valueRange = 0f..1f,
                modifier = Modifier.weight(1f).padding(horizontal = 8.dp),
            )
            StatusText(text = "sem vergonha")
        }
        StatusText(
            text = "Cara de pau do bot: ${(caraDePau * 100).toInt()}% · " +
                "Primeiro a ${TrucoEngine.WINNING_SCORE} vence",
        )
    }
}

/** Score line: player and bot points plus the current stake. */
@Composable
private fun ScoreRow(engine: TrucoEngine) {
    val theme = LocalUiTheme.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ScoreBadge(label = "VOCÊ", score = engine.playerScore, color = TrucoColors.amber)
        val stakeText = engine.proposedStake?.let { "vale ${engine.stake} → $it?" }
            ?: "vale ${engine.stake}"
        Text(
            text = stakeText,
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        ScoreBadge(label = "BOT", score = engine.botScore, color = TrucoColors.red)
    }
}

@Composable
private fun ScoreBadge(label: String, score: Int, color: Color) {
    val theme = LocalUiTheme.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = score.toString(),
            color = color,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** The felt: bot cards, trick area with the vira, the player's hand, dialogs. */
@Composable
private fun TrucoTable(
    engine: TrucoEngine,
    speech: String?,
    showLastTrick: Boolean,
    onPlayCard: (Int) -> Unit,
    onRespond: (TrucoEngine.RaiseResponse) -> Unit,
    onMaoDeOnze: (Boolean) -> Unit,
    onNextHand: () -> Unit,
    onRematch: () -> Unit,
) {
    val tableShape = RoundedCornerShape(16.dp)
    Box(
        modifier = Modifier
            .fillMaxSize()
            .clip(tableShape)
            .background(
                Brush.radialGradient(listOf(TrucoColors.felt, TrucoColors.feltDark)),
            )
            .border(4.dp, TrucoColors.woodDark, tableShape),
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Bot seat: card backs plus the speech bubble.
            Box(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    repeat(engine.botHand.size) { CardBack() }
                    if (engine.botHand.isEmpty()) {
                        Spacer(modifier = Modifier.size(34.dp, 50.dp))
                    }
                }
                speech?.let { line ->
                    Text(
                        text = line,
                        color = TrucoColors.ink,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .clip(RoundedCornerShape(10.dp))
                            .background(TrucoColors.cream)
                            .border(2.dp, TrucoColors.ink, RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                    )
                }
            }

            TrickArea(engine = engine, showLastTrick = showLastTrick)

            // Player hand: tap a card to play it.
            val handLocked = showLastTrick || engine.phase != TrucoEngine.Phase.PLAYER_TURN
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                engine.playerHand.forEachIndexed { index, card ->
                    CardFace(
                        card = card,
                        isManilha = card.rank == engine.manilhaRank,
                        modifier = Modifier.clickable(enabled = !handLocked) { onPlayCard(index) },
                    )
                }
                if (engine.playerHand.isEmpty()) {
                    EmptySlot()
                }
            }
        }

        TableDialogs(
            engine = engine,
            onRespond = onRespond,
            onMaoDeOnze = onMaoDeOnze,
            onNextHand = onNextHand,
            onRematch = onRematch,
        )
    }
}

/** Vira, both trick plays, and the trick-result dots. */
@Composable
private fun TrickArea(engine: TrucoEngine, showLastTrick: Boolean) {
    // While a resolved trick lingers, show its pair; otherwise the live plays.
    val lingering = showLastTrick && engine.lastTrick != null &&
        engine.playerTrickCard == null && engine.botTrickCard == null
    val botCard = if (lingering) engine.lastTrick?.botCard else engine.botTrickCard
    val playerCard = if (lingering) engine.lastTrick?.playerCard else engine.playerTrickCard

    Row(
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            TrickCaption("VIRA")
            CardFace(card = engine.vira, isManilha = false)
            TrickCaption("manilha ${engine.manilhaRank.label}")
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            TrickCaption("BOT")
            if (botCard != null) {
                CardFace(card = botCard, isManilha = botCard.rank == engine.manilhaRank)
            } else {
                EmptySlot()
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            TrickCaption("VOCÊ")
            if (playerCard != null) {
                CardFace(card = playerCard, isManilha = playerCard.rank == engine.manilhaRank)
            } else {
                EmptySlot()
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            repeat(3) { index ->
                val result = engine.trickResults.getOrNull(index)
                val fill = when (result) {
                    TrucoEngine.TrickResult.PLAYER -> TrucoColors.amber
                    TrucoEngine.TrickResult.BOT -> TrucoColors.red
                    TrucoEngine.TrickResult.TIE -> TrucoColors.cream
                    null -> Color.Transparent
                }
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(CircleShape)
                        .background(fill)
                        .border(1.dp, TrucoColors.cream.copy(alpha = 0.6f), CircleShape),
                )
            }
        }
    }
}

/** Phase-driven overlays: truco response, mão de onze, hand over, game over. */
@Composable
private fun TableDialogs(
    engine: TrucoEngine,
    onRespond: (TrucoEngine.RaiseResponse) -> Unit,
    onMaoDeOnze: (Boolean) -> Unit,
    onNextHand: () -> Unit,
    onRematch: () -> Unit,
) {
    when (engine.phase) {
        TrucoEngine.Phase.RESPOND -> {
            val proposed = engine.proposedStake ?: return
            TableDialog(
                title = TrucoEngine.RAISE_CALL.getValue(proposed),
                message = "O bot aumentou para $proposed. Correr entrega ${engine.stake}.",
            ) {
                BotecoButton(label = "Aceito") { onRespond(TrucoEngine.RaiseResponse.ACCEPT) }
                TrucoEngine.nextStake(proposed)?.let { higher ->
                    BotecoButton(label = TrucoEngine.RAISE_CALL.getValue(higher), danger = true) {
                        onRespond(TrucoEngine.RaiseResponse.RAISE)
                    }
                }
                BotecoButton(label = "Corro") { onRespond(TrucoEngine.RaiseResponse.FOLD) }
            }
        }
        TrucoEngine.Phase.MAO_DE_ONZE -> TableDialog(
            title = "Mão de onze!",
            message = "Você tem 11. Jogue valendo 3 (sem truco) ou corra e o bot leva 1.",
        ) {
            BotecoButton(label = "Jogar (vale 3)", danger = true) { onMaoDeOnze(true) }
            BotecoButton(label = "Correr (bot +1)") { onMaoDeOnze(false) }
        }
        TrucoEngine.Phase.HAND_OVER -> TableDialog(
            title = if (engine.handWinner == TrucoEngine.Seat.PLAYER) "Mão sua!" else "Mão do bot!",
            message = (if (engine.handWinner == TrucoEngine.Seat.PLAYER) "Você leva" else "O bot leva") +
                " ${engine.handPoints} ponto(s).",
        ) {
            BotecoButton(label = "Próxima mão →", onClick = onNextHand)
        }
        TrucoEngine.Phase.GAME_OVER -> TableDialog(
            title = if (engine.gameWinner == TrucoEngine.Seat.PLAYER) {
                "Você fechou 12!"
            } else {
                "O bot fechou 12..."
            },
            message = "Final: você ${engine.playerScore} × ${engine.botScore} bot.",
        ) {
            BotecoButton(label = "Revanche!", danger = true, onClick = onRematch)
        }
        else -> {}
    }
}

@Composable
private fun TableDialog(
    title: String,
    message: String,
    buttons: @Composable () -> Unit,
) {
    Box(
        modifier = Modifier.fillMaxSize().background(TrucoColors.scrim),
        contentAlignment = Alignment.Center,
    ) {
        val shape = RoundedCornerShape(12.dp)
        Column(
            modifier = Modifier
                .padding(16.dp)
                .clip(shape)
                .background(Brush.verticalGradient(listOf(TrucoColors.wood, TrucoColors.woodDark)))
                .border(2.dp, TrucoColors.ink, shape)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = title,
                color = TrucoColors.amber,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            Text(
                text = message,
                color = TrucoColors.cream,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.Center,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                buttons()
            }
        }
    }
}

/** A drawn card face: corner indices, big suit pip, gold glow for manilhas. */
@Composable
private fun CardFace(
    card: TrucoEngine.Card,
    isManilha: Boolean,
    modifier: Modifier = Modifier,
) {
    val suitColor = if (card.suit.isRed) TrucoColors.red else TrucoColors.ink
    val shape = RoundedCornerShape(7.dp)
    Column(
        modifier = modifier
            .size(52.dp, 74.dp)
            .clip(shape)
            .background(TrucoColors.cardFace)
            .border(2.dp, if (isManilha) TrucoColors.manilhaGold else TrucoColors.ink, shape)
            .padding(4.dp),
    ) {
        Text(
            text = "${card.rank.label}${card.suit.symbol}",
            color = suitColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = card.suit.symbol,
            color = suitColor,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().weight(1f),
        )
        Text(
            text = "${card.rank.label}${card.suit.symbol}",
            color = suitColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.align(Alignment.End).rotate(180f),
        )
    }
}

@Composable
private fun CardBack() {
    Box(
        modifier = Modifier
            .size(34.dp, 50.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(TrucoColors.cardBack)
            .border(2.dp, TrucoColors.ink, RoundedCornerShape(6.dp)),
    )
}

@Composable
private fun EmptySlot() {
    Box(
        modifier = Modifier
            .size(52.dp, 74.dp)
            .border(2.dp, TrucoColors.cream.copy(alpha = 0.4f), RoundedCornerShape(7.dp)),
    )
}

/** Chunky boteco control button echoing the web page's toolbar. */
@Composable
private fun BotecoButton(
    label: String,
    danger: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    val background = if (danger) TrucoColors.red else theme.colors.surfaceAlt
    Box(
        modifier = Modifier
            .clip(shape)
            .background(if (enabled) background else background.copy(alpha = 0.45f))
            .border(1.dp, theme.colors.border, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            color = if (danger) TrucoColors.cream else theme.colors.textPrimary,
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

/** Small caption above/below a trick-area card slot (VIRA / BOT / VOCÊ). */
@Composable
private fun TrickCaption(text: String) {
    Text(
        text = text.uppercase(),
        color = TrucoColors.cream.copy(alpha = 0.75f),
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Monospace,
        letterSpacing = 1.sp,
    )
}
