package com.baseapp.android.view.games.tawla

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.delay

/**
 * Café-table palette mirroring the web `TawlaPage.styles.css.ts` woods. The
 * board keeps its own warm look on both light and dark app themes (why: the
 * web board is hardcoded wood too — it is part of the game's identity).
 */
private object TawlaColors {
    val frame = Color(0xFF5A3A22)
    val frameEdge = Color(0xFF3A2414)
    val felt = Color(0xFF7A4A28)
    val pointLight = Color(0xFFE9D3A8)
    val pointDark = Color(0xFFA34F2A)
    val brass = Color(0xFFD9A441)
    val glow = Color(0xFFFFD98A)
    val cream = Color(0xFFF4E8D0)
    val checkerWhite = Color(0xFFF3EAD6)
    val checkerWhiteRim = Color(0xFF9F8F6C)
    val checkerBlack = Color(0xFF33231A)
    val checkerBlackRim = Color(0xFF120A04)
    val trayBg = Color(0xFF241207)
    val overlayScrim = Color(0xD1180A02)
}

private enum class TawlaPhase { AWAIT_ROLL, MOVING, GAME_OVER, MATCH_OVER }

/** Board columns from White's perspective, matching the web constants. */
private val TOP_LEFT = listOf(12, 13, 14, 15, 16, 17)
private val TOP_RIGHT = listOf(18, 19, 20, 21, 22, 23)
private val BOTTOM_LEFT = listOf(11, 10, 9, 8, 7, 6)
private val BOTTOM_RIGHT = listOf(5, 4, 3, 2, 1, 0)

private val DIE_GLYPHS = listOf("⚀", "⚁", "⚂", "⚃", "⚄", "⚅")

/**
 * Home surface for the `tawla` pack — the native twin of the web TawlaPage.
 * Rendering and touch input only: all rules live in [TawlaEngine] so the
 * game stays JVM-testable and in lockstep with the web engine. No network,
 * no stores.
 *
 * Touch-first and vs-bot only: the human is always White, the bot is Black —
 * the web page additionally offers a two-player hotseat mode that makes no
 * sense on a phone. Interaction is tap-checker-then-point, exactly like the
 * web click flow.
 */
@Composable
fun TawlaGameView() {
    val theme = LocalUiTheme.current

    // Position at the start of the current turn; `prefix` holds the moves
    // played so far, exactly like the web page's `position` + `prefix` pair.
    var position by remember { mutableStateOf(TawlaEngine.initialPosition()) }
    var mover by remember { mutableStateOf<TawlaEngine.Player?>(null) }
    var dice by remember { mutableStateOf<Pair<Int, Int>?>(null) }
    var turns by remember { mutableStateOf(emptyList<TawlaEngine.Turn>()) }
    var prefix by remember { mutableStateOf(emptyList<TawlaEngine.Move>()) }
    var selected by remember { mutableStateOf<Int?>(null) }
    var phase by remember { mutableStateOf(TawlaPhase.AWAIT_ROLL) }
    var result by remember { mutableStateOf<TawlaEngine.GameResult?>(null) }
    var whiteScore by remember { mutableIntStateOf(0) }
    var blackScore by remember { mutableIntStateOf(0) }
    var level by remember { mutableStateOf(TawlaEngine.BotLevel.MEDIUM) }

    val shown = mover?.let { TawlaEngine.positionAfter(position, it, prefix) } ?: position
    val humanTurn = phase == TawlaPhase.MOVING && mover == TawlaEngine.Player.WHITE
    val legalNext =
        if (humanTurn) TawlaEngine.nextMoves(turns, prefix) else emptyList()
    val destinations = selected?.let { source -> legalNext.filter { it.from == source } }
        ?: emptyList()

    /** Ends the turn: settles a win or hands the dice to the opponent. */
    fun finishTurn(final: TawlaEngine.Position, moverNow: TawlaEngine.Player) {
        position = final
        dice = null
        turns = emptyList()
        prefix = emptyList()
        selected = null
        val gameResult = TawlaEngine.winResult(final)
        if (gameResult == null) {
            mover = moverNow.opponent
            phase = TawlaPhase.AWAIT_ROLL
            return
        }
        if (gameResult.winner == TawlaEngine.Player.WHITE) {
            whiteScore += gameResult.points
        } else {
            blackScore += gameResult.points
        }
        result = gameResult
        val winnerScore =
            if (gameResult.winner == TawlaEngine.Player.WHITE) whiteScore else blackScore
        phase = if (winnerScore >= TawlaEngine.MATCH_TARGET) {
            TawlaPhase.MATCH_OVER
        } else {
            TawlaPhase.GAME_OVER
        }
    }

    /** Rolls for [roller] (null = the opening roll-off decides who starts). */
    fun roll(roller: TawlaEngine.Player?) {
        val rolled: Pair<Int, Int>
        val starter: TawlaEngine.Player
        if (roller != null) {
            starter = roller
            rolled = TawlaEngine.rollDie() to TawlaEngine.rollDie()
        } else {
            val (whiteDie, blackDie, opener) = TawlaEngine.rollOpening()
            starter = opener
            rolled = whiteDie to blackDie
        }
        mover = starter
        dice = rolled
        turns = TawlaEngine.legalTurns(position, starter, rolled)
        phase = TawlaPhase.MOVING
    }

    fun newGame(fullMatch: Boolean) {
        position = TawlaEngine.initialPosition()
        mover = null
        dice = null
        turns = emptyList()
        prefix = emptyList()
        selected = null
        result = null
        phase = TawlaPhase.AWAIT_ROLL
        if (fullMatch) {
            whiteScore = 0
            blackScore = 0
        }
    }

    fun playHumanMove(move: TawlaEngine.Move) {
        prefix = prefix + move
        selected = null
    }

    fun onTapPoint(index: Int) {
        if (!humanTurn) {
            return
        }
        val candidate = destinations.firstOrNull { it.to == index }
        if (candidate != null) {
            playHumanMove(candidate)
            return
        }
        selected = if (legalNext.any { it.from == index } && selected != index) index else null
    }

    fun onTapBar() {
        if (humanTurn && legalNext.any { it.from == TawlaEngine.BAR }) {
            selected = if (selected == TawlaEngine.BAR) null else TawlaEngine.BAR
        }
    }

    fun onTapOff() {
        if (!humanTurn) {
            return
        }
        // Prefer the exact die so the higher one stays free for a longer move.
        val move = destinations.filter { it.to == TawlaEngine.OFF }.minByOrNull { it.die }
        if (move != null) {
            playHumanMove(move)
        }
    }

    // A fully blocked roll passes the turn after a short beat (both seats).
    LaunchedEffect(phase, dice, turns) {
        val roller = mover
        if (phase == TawlaPhase.MOVING && dice != null && turns.isEmpty() && roller != null) {
            delay(1200)
            finishTurn(position, roller)
        }
    }

    // Human turn commits automatically once every playable die is used; an
    // undo during the pause changes `prefix` and cancels the commit.
    LaunchedEffect(prefix, turns) {
        val roller = mover
        if (
            humanTurn && roller != null && turns.isNotEmpty() &&
            prefix.size == TawlaEngine.maxTurnLength(turns)
        ) {
            delay(550)
            finishTurn(TawlaEngine.positionAfter(position, roller, prefix), roller)
        }
    }

    // Bot seat: roll automatically, then play the turn checker by checker.
    LaunchedEffect(phase, mover, dice, turns, level) {
        if (mover != TawlaEngine.Player.BLACK || result != null) {
            return@LaunchedEffect
        }
        if (phase == TawlaPhase.AWAIT_ROLL) {
            delay(700)
            roll(TawlaEngine.Player.BLACK)
            return@LaunchedEffect
        }
        val rolled = dice
        if (phase != TawlaPhase.MOVING || rolled == null || turns.isEmpty()) {
            return@LaunchedEffect
        }
        val turn = TawlaEngine.findBotTurn(position, TawlaEngine.Player.BLACK, rolled, level)
            ?: return@LaunchedEffect
        for (step in 1..turn.moves.size) {
            delay(550)
            prefix = turn.moves.take(step)
        }
        delay(500)
        finishTurn(turn.result, TawlaEngine.Player.BLACK)
    }

    val statusText = when (phase) {
        TawlaPhase.MATCH_OVER ->
            if (result?.winner == TawlaEngine.Player.WHITE) "You win the match!"
            else "Bot wins the match"
        TawlaPhase.GAME_OVER -> {
            val kind = result?.kind?.name?.lowercase() ?: ""
            if (result?.winner == TawlaEngine.Player.WHITE) "You win — $kind" else "Bot wins — $kind"
        }
        TawlaPhase.MOVING ->
            if (mover == TawlaEngine.Player.BLACK) "Bot plays…"
            else if (shown.whiteBar > 0) "Enter from the bar" else "Play your dice"
        TawlaPhase.AWAIT_ROLL -> when (mover) {
            null -> "Roll for the start"
            TawlaEngine.Player.WHITE -> "Your roll"
            TawlaEngine.Player.BLACK -> "Bot rolls…"
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
        Text(
            text = "☕ TAWLABOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ScorePill(
                label = "YOU $whiteScore",
                pips = TawlaEngine.pipCount(shown, TawlaEngine.Player.WHITE),
            )
            Text(
                text = statusText,
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Serif,
                textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f),
            )
            ScorePill(
                label = "BOT $blackScore",
                pips = TawlaEngine.pipCount(shown, TawlaEngine.Player.BLACK),
            )
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1.45f),
        ) {
            TawlaBoard(
                shown = shown,
                selected = selected,
                sources = legalNext.map { it.from }.toSet(),
                destinations = destinations.map { it.to }.toSet(),
                onTapPoint = ::onTapPoint,
                onTapBar = ::onTapBar,
                onTapOff = ::onTapOff,
            )
            val settled = result
            if (settled != null && (phase == TawlaPhase.GAME_OVER || phase == TawlaPhase.MATCH_OVER)) {
                GameOverOverlay(
                    matchOver = phase == TawlaPhase.MATCH_OVER,
                    result = settled,
                    whiteScore = whiteScore,
                    blackScore = blackScore,
                    onContinue = { newGame(fullMatch = phase == TawlaPhase.MATCH_OVER) },
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth().height(52.dp),
            horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val rolled = dice
            if (phase == TawlaPhase.AWAIT_ROLL && mover != TawlaEngine.Player.BLACK) {
                CafeButton(
                    label = if (mover == null) "🎲 ROLL FOR START" else "🎲 ROLL",
                    onClick = { roll(mover) },
                )
            } else if (rolled != null) {
                DiceFaces(dice = rolled, usedDice = prefix.map { it.die })
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            CafeButton(label = "⟳ NEW MATCH", onClick = { newGame(fullMatch = true) })
            CafeButton(
                label = "↩ UNDO",
                enabled = humanTurn && prefix.isNotEmpty() &&
                    prefix.size < TawlaEngine.maxTurnLength(turns),
                onClick = {
                    prefix = prefix.dropLast(1)
                    selected = null
                },
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            TawlaEngine.BotLevel.entries.forEach { option ->
                CafeButton(
                    label = option.name,
                    isLit = option == level,
                    onClick = { level = option },
                )
            }
        }

        Text(
            text = "Tap a checker, then a glowing point · First to ${TawlaEngine.MATCH_TARGET} points",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.xs,
            fontFamily = FontFamily.Serif,
        )
    }
}

/**
 * The wooden board: two point halves, the raised bar, and the bear-off
 * trays. Layout mirrors the web board — White's home is the lower right,
 * point 1 at the far right, and White races toward it.
 */
@Composable
private fun TawlaBoard(
    shown: TawlaEngine.Position,
    selected: Int?,
    sources: Set<Int>,
    destinations: Set<Int>,
    onTapPoint: (Int) -> Unit,
    onTapBar: () -> Unit,
    onTapOff: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxSize()
            .clip(RoundedCornerShape(10.dp))
            .background(TawlaColors.felt)
            .border(3.dp, TawlaColors.frameEdge, RoundedCornerShape(10.dp))
            .padding(6.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        BoardHalf(
            top = TOP_LEFT, bottom = BOTTOM_LEFT, shown = shown, selected = selected,
            sources = sources, destinations = destinations, onTapPoint = onTapPoint,
            modifier = Modifier.weight(1f),
        )
        BarColumn(shown = shown, selected = selected, sources = sources, onTapBar = onTapBar)
        BoardHalf(
            top = TOP_RIGHT, bottom = BOTTOM_RIGHT, shown = shown, selected = selected,
            sources = sources, destinations = destinations, onTapPoint = onTapPoint,
            modifier = Modifier.weight(1f),
        )
        OffColumn(shown = shown, destinations = destinations, onTapOff = onTapOff)
    }
}

@Composable
private fun BoardHalf(
    top: List<Int>,
    bottom: List<Int>,
    shown: TawlaEngine.Position,
    selected: Int?,
    sources: Set<Int>,
    destinations: Set<Int>,
    onTapPoint: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxHeight(), verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(1.dp)) {
            top.forEach { index ->
                PointCell(
                    index = index, isTop = true, signedCount = shown.points[index],
                    isSelected = selected == index, isDestination = index in destinations,
                    isSource = index in sources, onTap = { onTapPoint(index) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
        Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(1.dp)) {
            bottom.forEach { index ->
                PointCell(
                    index = index, isTop = false, signedCount = shown.points[index],
                    isSelected = selected == index, isDestination = index in destinations,
                    isSource = index in sources, onTap = { onTapPoint(index) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

/**
 * One point: the inlaid triangle plus its checker stack (max five drawn;
 * the last one carries the overflow count, like the web stack).
 */
@Composable
private fun PointCell(
    index: Int,
    isTop: Boolean,
    signedCount: Int,
    isSelected: Boolean,
    isDestination: Boolean,
    isSource: Boolean,
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val owner = when {
        signedCount > 0 -> TawlaEngine.Player.WHITE
        signedCount < 0 -> TawlaEngine.Player.BLACK
        else -> null
    }
    val count = kotlin.math.abs(signedCount)
    val visible = minOf(count, 5)
    val triangleColor =
        if (index % 2 == (if (isTop) 0 else 1)) TawlaColors.pointDark else TawlaColors.pointLight

    BoxWithConstraints(
        modifier = modifier
            .fillMaxHeight()
            .clickable(onClick = onTap),
        contentAlignment = if (isTop) Alignment.TopCenter else Alignment.BottomCenter,
    ) {
        val checkerSize = minOf(maxWidth * 0.9f, maxHeight / 5.2f)

        Canvas(modifier = Modifier.fillMaxSize()) {
            val inset = size.width * 0.06f
            val path = Path().apply {
                if (isTop) {
                    moveTo(inset, 0f)
                    lineTo(size.width - inset, 0f)
                    lineTo(size.width / 2f, size.height * 0.92f)
                } else {
                    moveTo(inset, size.height)
                    lineTo(size.width - inset, size.height)
                    lineTo(size.width / 2f, size.height * 0.08f)
                }
                close()
            }
            drawPath(path, triangleColor)
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            val order = if (isTop) 0 until visible else (visible - 1) downTo 0
            order.forEach { checkerIndex ->
                if (owner != null) {
                    CheckerDisc(
                        player = owner,
                        label = if (checkerIndex == visible - 1 && count > 5) "$count" else null,
                        modifier = Modifier.size(checkerSize),
                    )
                }
            }
        }

        if (isDestination || isSelected || isSource) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .border(
                        width = 2.dp,
                        color = when {
                            isSelected -> TawlaColors.brass
                            isDestination -> TawlaColors.glow
                            else -> TawlaColors.glow.copy(alpha = 0.35f)
                        },
                        shape = RoundedCornerShape(4.dp),
                    ),
            )
        }
    }
}

@Composable
private fun BarColumn(
    shown: TawlaEngine.Position,
    selected: Int?,
    sources: Set<Int>,
    onTapBar: () -> Unit,
) {
    Column(
        modifier = Modifier
            .width(26.dp)
            .fillMaxHeight()
            .clip(RoundedCornerShape(5.dp))
            .background(TawlaColors.frame)
            .clickable(onClick = onTapBar),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        BarWell(
            player = TawlaEngine.Player.BLACK,
            count = shown.blackBar,
            highlighted = false,
            modifier = Modifier.weight(1f),
        )
        BarWell(
            player = TawlaEngine.Player.WHITE,
            count = shown.whiteBar,
            highlighted = TawlaEngine.BAR in sources || selected == TawlaEngine.BAR,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun BarWell(
    player: TawlaEngine.Player,
    count: Int,
    highlighted: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .then(
                if (highlighted) {
                    Modifier.border(2.dp, TawlaColors.glow, RoundedCornerShape(4.dp))
                } else {
                    Modifier
                },
            ),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
    ) {
        val visible = minOf(count, 4)
        repeat(visible) { index ->
            CheckerDisc(
                player = player,
                label = if (index == visible - 1 && count > 4) "$count" else null,
                modifier = Modifier.size(18.dp),
            )
        }
    }
}

@Composable
private fun OffColumn(
    shown: TawlaEngine.Position,
    destinations: Set<Int>,
    onTapOff: () -> Unit,
) {
    Column(
        modifier = Modifier.width(34.dp).fillMaxHeight(),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        OffTray(
            label = "BOT",
            count = shown.blackOff,
            active = false,
            onTap = {},
            modifier = Modifier.weight(1f),
        )
        OffTray(
            label = "YOU",
            count = shown.whiteOff,
            active = TawlaEngine.OFF in destinations,
            onTap = onTapOff,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun OffTray(
    label: String,
    count: Int,
    active: Boolean,
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(5.dp))
            .background(TawlaColors.trayBg)
            .then(
                if (active) {
                    Modifier.border(2.dp, TawlaColors.glow, RoundedCornerShape(5.dp))
                } else {
                    Modifier
                },
            )
            .clickable(onClick = onTap),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = "$count",
            color = TawlaColors.glow,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = label,
            color = TawlaColors.cream.copy(alpha = 0.75f),
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
    }
}

@Composable
private fun CheckerDisc(
    player: TawlaEngine.Player,
    label: String?,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(
                if (player == TawlaEngine.Player.WHITE) {
                    TawlaColors.checkerWhite
                } else {
                    TawlaColors.checkerBlack
                },
            )
            .border(
                1.dp,
                if (player == TawlaEngine.Player.WHITE) {
                    TawlaColors.checkerWhiteRim
                } else {
                    TawlaColors.checkerBlackRim
                },
                CircleShape,
            ),
        contentAlignment = Alignment.Center,
    ) {
        if (label != null) {
            Text(
                text = label,
                color = if (player == TawlaEngine.Player.WHITE) {
                    TawlaColors.frameEdge
                } else {
                    TawlaColors.cream
                },
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
            )
        }
    }
}

/**
 * Dice faces (four for doubles) with used-up markers derived from the moves
 * played so far, mirroring the web page's `diceFaces` memo.
 */
@Composable
private fun RowScope.DiceFaces(dice: Pair<Int, Int>, usedDice: List<Int>) {
    val theme = LocalUiTheme.current
    val faces = if (dice.first == dice.second) List(4) { dice.first } else listOf(dice.first, dice.second)
    val remaining = usedDice.toMutableList()
    faces.forEach { value ->
        val used = remaining.remove(value)
        Text(
            text = DIE_GLYPHS[value - 1],
            color = theme.colors.textPrimary.copy(alpha = if (used) 0.3f else 1f),
            fontSize = 40.sp,
        )
    }
}

@Composable
private fun GameOverOverlay(
    matchOver: Boolean,
    result: TawlaEngine.GameResult,
    whiteScore: Int,
    blackScore: Int,
    onContinue: () -> Unit,
) {
    val youWin = result.winner == TawlaEngine.Player.WHITE
    Box(
        modifier = Modifier
            .fillMaxSize()
            .clip(RoundedCornerShape(10.dp))
            .background(TawlaColors.overlayScrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = when {
                    matchOver && youWin -> "YOU WIN THE MATCH"
                    matchOver -> "BOT WINS THE MATCH"
                    youWin -> "YOU WIN +${result.points}"
                    else -> "BOT WINS +${result.points}"
                },
                color = TawlaColors.glow,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
            )
            Text(
                text = "Score $whiteScore–$blackScore · first to ${TawlaEngine.MATCH_TARGET}",
                color = TawlaColors.cream,
                fontSize = 13.sp,
                fontFamily = FontFamily.Serif,
            )
            CafeButton(
                label = if (matchOver) "☕ NEW MATCH" else "NEXT GAME ▸",
                onClick = onContinue,
            )
        }
    }
}

/** Seat score pill: match points plus the live pip count, café-brass style. */
@Composable
private fun ScorePill(label: String, pips: Int) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(TawlaColors.trayBg)
            .border(1.dp, TawlaColors.brass, RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(
            text = label,
            color = TawlaColors.cream,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = "pip $pips",
            color = TawlaColors.brass,
            fontSize = 10.sp,
            fontFamily = FontFamily.Serif,
        )
    }
}

/** Chunky café control button echoing the web console's toolbar. */
@Composable
private fun CafeButton(
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
            color = when {
                !enabled -> theme.colors.textSecondary.copy(alpha = 0.5f)
                isLit -> theme.colors.accentText
                else -> theme.colors.textPrimary
            },
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
    }
}
