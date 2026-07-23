package com.baseapp.android.view.games.ludo

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin
import kotlin.random.Random
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Self-contained board palette mirroring the web LudoPage.styles.css.ts —
 * the board keeps its classic look on both light and dark app themes (why:
 * the web board is hardcoded too; the colors are part of the game's
 * identity). App chrome around the board uses the theme tokens.
 */
private object LudoColors {
    val boardFace = Color(0xFFF8F2E3)
    val track = Color(0xFFFFFAF0)
    val line = Color(0x592B2015) // rgba(43,32,21,0.35)
    val star = Color(0x732B2015) // rgba(43,32,21,0.45)
    val overlayScrim = Color(0xB8121E18)
    val seatMain = listOf(
        Color(0xFFE0453A),
        Color(0xFF2FA24C),
        Color(0xFFF2B705),
        Color(0xFF2F6FD0),
    )
    val seatDark = listOf(
        Color(0xFF9C2B22),
        Color(0xFF1D6C32),
        Color(0xFFA97F06),
        Color(0xFF1E4B90),
    )
}

private val ludoSeatNames = listOf("Red", "Green", "Yellow", "Blue")
private val ludoDieFaces = listOf("⚀", "⚁", "⚂", "⚃", "⚄", "⚅")

/** Where each seat's finished tokens rest, inside the center triangles. */
private val ludoFinishAnchors = listOf(
    LudoCell(6.1f, 7f),
    LudoCell(7f, 6.1f),
    LudoCell(7.9f, 7f),
    LudoCell(7f, 7.9f),
)

/** Grid offsets that fan out tokens sharing one square. */
private val ludoStackOffsets = listOf(
    0f to 0f, -0.18f to -0.18f, 0.18f to -0.18f, -0.18f to 0.18f,
    0.18f to 0.18f, 0f to -0.22f, 0f to 0.22f, -0.22f to 0f,
)

/** A token's resolved board placement in grid units, ready to draw or tap. */
private data class TokenPlacement(
    val seat: Int,
    val token: Int,
    val col: Float,
    val row: Float,
    val movable: Boolean,
    val finished: Boolean,
)

/** Board cell a token occupies (yard, ring, home column, or center). */
private fun tokenCell(seat: Int, token: Int, progress: Int): LudoCell = when {
    progress == -1 -> LudoEngine.yardCells(seat)[token]
    progress <= LudoEngine.RING_LAST_PROGRESS ->
        LudoEngine.RING_CELLS[LudoEngine.ringIndex(seat, progress)]
    progress < LudoEngine.HOME_PROGRESS ->
        LudoEngine.homeColumnCells(seat)[progress - LudoEngine.RING_LAST_PROGRESS - 1]
    else -> ludoFinishAnchors[seat]
}

/** Every token's placement, fanning out stacks so they stay visible. */
private fun tokenPlacements(state: LudoGameState, movableTokens: Set<Int>): List<TokenPlacement> {
    val occupancy = mutableMapOf<LudoCell, Int>()
    val placements = mutableListOf<TokenPlacement>()
    for (seat in 0 until LudoEngine.SEAT_COUNT) {
        if (state.seats[seat] == LudoSeatKind.OFF) {
            continue
        }
        state.tokens[seat].forEachIndexed { token, progress ->
            val cell = tokenCell(seat, token, progress)
            val stackIndex = occupancy.getOrDefault(cell, 0)
            occupancy[cell] = stackIndex + 1
            val (dx, dy) = ludoStackOffsets[minOf(stackIndex, ludoStackOffsets.size - 1)]
            placements.add(
                TokenPlacement(
                    seat = seat,
                    token = token,
                    col = cell.col + 0.5f + dx,
                    row = cell.row + 0.5f + dy,
                    movable = seat == state.current && token in movableTokens,
                    finished = progress == LudoEngine.HOME_PROGRESS,
                ),
            )
        }
    }
    return placements
}

/**
 * Home surface for the `ludo` pack — the native twin of the web LudoPage.
 * Touch-first: tap the die to roll, tap a glowing token to move. Seats are
 * configurable (human/bot/off, 2-4 racers, full local hotseat). All rules
 * live in [LudoEngine] so they stay JVM-testable and in lockstep with the
 * web game. No network, no stores.
 */
@Composable
fun LudoGameView() {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    var seatConfig by remember {
        mutableStateOf(listOf(LudoSeatKind.HUMAN, LudoSeatKind.BOT, LudoSeatKind.BOT, LudoSeatKind.BOT))
    }
    var game by remember { mutableStateOf<LudoGameState?>(null) }
    var rolling by remember { mutableStateOf(false) }
    var dieFace by remember { mutableIntStateOf(6) }
    var note by remember { mutableStateOf("Set up the seats, then start the game.") }

    val racerCount = seatConfig.count { it != LudoSeatKind.OFF }
    val state = game
    val humanTurn = state != null && !state.over && state.seats[state.current] == LudoSeatKind.HUMAN
    val movableTokens: Set<Int> =
        if (state != null && humanTurn && !rolling) {
            LudoEngine.legalMoves(state).map { it.token }.toSet()
        } else {
            emptySet()
        }

    fun playMove(token: Int) {
        val prev = game ?: return
        if (prev.dice == null) {
            return
        }
        val move = LudoEngine.legalMoves(prev).firstOrNull { it.token == token } ?: return
        val next = LudoEngine.applyMove(prev, token)
        game = next
        note = when {
            next.over -> "${ludoSeatNames[next.placings.first()]} wins the match!"
            move.captures -> "${ludoSeatNames[prev.current]} captures — back to the yard!"
            move.to == LudoEngine.HOME_PROGRESS -> "${ludoSeatNames[prev.current]} brings a token home!"
            next.current == prev.current && next.dice == null -> "Six! ${ludoSeatNames[prev.current]} rolls again."
            else -> "${ludoSeatNames[prev.current]} moves ${move.to - maxOf(move.from, 0)} squares."
        }
    }

    /** Flicks the die face a few times, then commits a real 1..6 roll. */
    suspend fun rollDie() {
        val before = game ?: return
        if (before.over || before.dice != null || rolling) {
            return
        }
        rolling = true
        repeat(6) {
            dieFace = Random.nextInt(1, 7)
            delay(60)
        }
        val value = Random.nextInt(1, 7)
        dieFace = value
        rolling = false
        val prev = game ?: return
        val next = LudoEngine.applyRoll(prev, value)
        game = next
        val who = ludoSeatNames[prev.current]
        note = when {
            next.dice != null && value == 6 -> "$who rolled a 6 — move, then roll again."
            next.dice != null -> "$who rolled a $value."
            next.current == prev.current -> "$who rolled a 6 but has no move — roll again."
            value == 6 -> "Three sixes in a row! $who forfeits the turn."
            else -> "$who rolled a $value — no legal move, turn passes."
        }
    }

    fun startGame() {
        game = LudoEngine.createGame(seatConfig)
        val first = seatConfig.indexOfFirst { it != LudoSeatKind.OFF }.coerceAtLeast(0)
        note = "${ludoSeatNames[first]} rolls first. Roll a 6 to leave the yard!"
    }

    // Bot turns: roll after a beat, then pick a move after another beat, so
    // hotseat players can follow along — mirrors the web bot pacing. Keyed
    // on the game state only: `rolling` flips inside rollDie(), and keying
    // on it would cancel the bot's own roll mid-animation.
    LaunchedEffect(game) {
        val botState = game ?: return@LaunchedEffect
        if (botState.over || rolling || botState.seats[botState.current] != LudoSeatKind.BOT) {
            return@LaunchedEffect
        }
        if (botState.dice == null) {
            delay(750)
            rollDie()
        } else {
            delay(620)
            val current = game ?: return@LaunchedEffect
            if (current.dice != null) {
                LudoEngine.chooseBotMove(current)?.let { playMove(it) }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .statusBarsPadding()
            .padding(theme.spacing.lg)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
    ) {
        Text(
            text = "🎲 LUDOBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
        )

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(theme.radius.md)),
        ) {
            LudoBoardCanvas(
                state = state ?: LudoEngine.createGame(seatConfig),
                movableTokens = movableTokens,
                onTapToken = ::playMove,
                modifier = Modifier.fillMaxSize(),
            )
            if (state != null && state.over) {
                LudoWinOverlay(state = state, onPlayAgain = ::startGame)
            }
        }

        if (state != null && !state.over) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(theme.spacing.md),
            ) {
                LudoButton(
                    label = "${ludoDieFaces[dieFace - 1]} ROLL",
                    prominent = true,
                    enabled = humanTurn && !rolling && state.dice == null,
                    onClick = { scope.launch { rollDie() } },
                )
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(LudoColors.seatMain[state.current]),
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "${ludoSeatNames[state.current]} — " +
                                state.seats[state.current].name.lowercase(),
                            color = theme.colors.textPrimary,
                            fontSize = theme.typography.sizes.sm,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    Text(
                        text = note,
                        color = theme.colors.textSecondary,
                        fontSize = theme.typography.sizes.xs,
                    )
                }
            }
            LudoButton(
                label = "⟳ NEW GAME",
                onClick = {
                    game = null
                    note = "Set up the seats, then start the game."
                },
            )
        } else {
            // Seat setup: each color is Human, Bot, or Off (2-4 racers).
            Column(verticalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
                for (seat in 0 until LudoEngine.SEAT_COUNT) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(14.dp)
                                .clip(CircleShape)
                                .background(LudoColors.seatMain[seat]),
                        )
                        Text(
                            text = ludoSeatNames[seat],
                            color = theme.colors.textPrimary,
                            fontSize = theme.typography.sizes.sm,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.width(56.dp),
                        )
                        LudoSeatKind.entries.forEach { kind ->
                            LudoButton(
                                label = kind.name,
                                isLit = seatConfig[seat] == kind,
                                onClick = {
                                    seatConfig = seatConfig.mapIndexed { index, existing ->
                                        if (index == seat) kind else existing
                                    }
                                },
                            )
                        }
                    }
                }
                LudoButton(
                    label = "▶ START GAME",
                    prominent = true,
                    enabled = racerCount >= 2,
                    onClick = ::startGame,
                )
                if (racerCount < 2) {
                    Text(
                        text = "Turn on at least two seats to play.",
                        color = theme.colors.textSecondary,
                        fontSize = theme.typography.sizes.xs,
                    )
                }
            }
        }
    }
}

/**
 * The board: draws the yards, track, home columns, center, and tokens in
 * 15x15 grid space, and maps taps back to grid cells to pick the token to
 * move (only tokens in [movableTokens] respond).
 */
@Composable
private fun LudoBoardCanvas(
    state: LudoGameState,
    movableTokens: Set<Int>,
    onTapToken: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val placements = tokenPlacements(state, movableTokens)
    Canvas(
        modifier = modifier.pointerInput(placements) {
            detectTapGestures { offset ->
                val cell = size.width / 15f
                val hit = placements
                    .filter { it.movable }
                    .minByOrNull { hypot(it.col * cell - offset.x, it.row * cell - offset.y) }
                if (hit != null &&
                    hypot(hit.col * cell - offset.x, hit.row * cell - offset.y) <= cell * 0.9f
                ) {
                    onTapToken(hit.token)
                }
            }
        },
    ) {
        val cell = size.width / 15f
        drawRect(color = LudoColors.boardFace)
        drawYards(cell)
        drawTrack(cell)
        drawHomeColumns(cell)
        drawCenter(cell)
        for (placement in placements) {
            drawToken(placement, cell)
        }
    }
}

private fun DrawScope.drawYards(cell: Float) {
    for (seat in 0 until LudoEngine.SEAT_COUNT) {
        val origin = LudoEngine.YARD_ORIGINS[seat]
        drawRoundRect(
            color = LudoColors.seatMain[seat],
            topLeft = Offset(origin.col * cell, origin.row * cell),
            size = Size(6 * cell, 6 * cell),
            cornerRadius = CornerRadius(cell * 0.25f),
        )
        drawRoundRect(
            color = LudoColors.boardFace,
            topLeft = Offset((origin.col + 1) * cell, (origin.row + 1) * cell),
            size = Size(4 * cell, 4 * cell),
            cornerRadius = CornerRadius(cell * 0.2f),
        )
        for (spot in LudoEngine.yardCells(seat)) {
            drawCircle(
                color = LudoColors.seatDark[seat],
                radius = cell * 0.38f,
                center = Offset((spot.col + 0.5f) * cell, (spot.row + 0.5f) * cell),
                style = Stroke(
                    width = 1.5f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f)),
                ),
            )
        }
    }
}

private fun DrawScope.drawTrack(cell: Float) {
    LudoEngine.RING_CELLS.forEachIndexed { index, ringCell ->
        val topLeft = Offset(ringCell.col * cell, ringCell.row * cell)
        val startSeat = LudoEngine.START_RING_INDEX.indexOf(index)
        drawRect(
            color = if (startSeat >= 0) LudoColors.seatMain[startSeat] else LudoColors.track,
            topLeft = topLeft,
            size = Size(cell, cell),
        )
        drawRect(
            color = LudoColors.line,
            topLeft = topLeft,
            size = Size(cell, cell),
            style = Stroke(width = 1.5f),
        )
        if (index in LudoEngine.STAR_RING_INDEXES) {
            drawPath(
                path = starPath(
                    center = Offset(topLeft.x + cell / 2f, topLeft.y + cell / 2f),
                    outer = cell * 0.32f,
                    inner = cell * 0.14f,
                ),
                color = LudoColors.star,
            )
        }
    }
}

private fun DrawScope.drawHomeColumns(cell: Float) {
    for (seat in 0 until LudoEngine.SEAT_COUNT) {
        for (columnCell in LudoEngine.homeColumnCells(seat)) {
            val topLeft = Offset(columnCell.col * cell, columnCell.row * cell)
            drawRect(color = LudoColors.seatMain[seat], topLeft = topLeft, size = Size(cell, cell))
            drawRect(
                color = LudoColors.seatDark[seat].copy(alpha = 0.6f),
                topLeft = topLeft,
                size = Size(cell, cell),
                style = Stroke(width = 1.5f),
            )
        }
    }
}

private fun DrawScope.drawCenter(cell: Float) {
    val c6 = 6 * cell
    val c9 = 9 * cell
    val mid = 7.5f * cell
    drawRect(color = LudoColors.track, topLeft = Offset(c6, c6), size = Size(3 * cell, 3 * cell))
    val triangles = listOf(
        listOf(Offset(c6, c6), Offset(c6, c9), Offset(mid, mid)),
        listOf(Offset(c6, c6), Offset(c9, c6), Offset(mid, mid)),
        listOf(Offset(c9, c6), Offset(c9, c9), Offset(mid, mid)),
        listOf(Offset(c6, c9), Offset(c9, c9), Offset(mid, mid)),
    )
    triangles.forEachIndexed { seat, points ->
        val path = Path().apply {
            moveTo(points[0].x, points[0].y)
            lineTo(points[1].x, points[1].y)
            lineTo(points[2].x, points[2].y)
            close()
        }
        drawPath(path = path, color = LudoColors.seatMain[seat])
    }
}

private fun DrawScope.drawToken(placement: TokenPlacement, cell: Float) {
    val center = Offset(placement.col * cell, placement.row * cell)
    val radius = (if (placement.finished) 0.24f else 0.34f) * cell
    if (placement.movable) {
        drawCircle(
            color = Color.White,
            radius = radius * 1.35f,
            center = center,
            style = Stroke(width = cell * 0.09f),
        )
    }
    drawCircle(color = LudoColors.seatMain[placement.seat], radius = radius, center = center)
    drawCircle(
        color = LudoColors.seatDark[placement.seat],
        radius = radius,
        center = center,
        style = Stroke(width = 2.5f),
    )
    drawCircle(
        color = Color.White.copy(alpha = 0.4f),
        radius = radius * 0.3f,
        center = Offset(center.x - radius * 0.25f, center.y - radius * 0.3f),
    )
}

private fun starPath(center: Offset, outer: Float, inner: Float): Path {
    val path = Path()
    for (index in 0 until 10) {
        val radius = if (index % 2 == 0) outer else inner
        val angle = index * Math.PI.toFloat() / 5f - Math.PI.toFloat() / 2f
        val x = center.x + cos(angle) * radius
        val y = center.y + sin(angle) * radius
        if (index == 0) {
            path.moveTo(x, y)
        } else {
            path.lineTo(x, y)
        }
    }
    path.close()
    return path
}

/** Win overlay: winner banner, full placings, and a rematch button. */
@Composable
private fun LudoWinOverlay(state: LudoGameState, onPlayAgain: () -> Unit) {
    val medals = listOf("🥇", "🥈", "🥉", "4️⃣")
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(LudoColors.overlayScrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = "🏆 ${ludoSeatNames[state.placings.first()].uppercase()} WINS",
                color = Color.White,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
            )
            state.placings.forEachIndexed { place, seat ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(text = medals[minOf(place, 3)], fontSize = 14.sp)
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(LudoColors.seatMain[seat]),
                    )
                    Text(
                        text = "${ludoSeatNames[seat]} — ${state.seats[seat].name.lowercase()}",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
            LudoButton(label = "⟳ PLAY AGAIN", prominent = true, onClick = onPlayAgain)
        }
    }
}

/** Chunky rounded control button consistent with the board-game look. */
@Composable
private fun LudoButton(
    label: String,
    prominent: Boolean = false,
    isLit: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    val background = when {
        prominent -> LudoColors.seatMain[1]
        isLit -> theme.colors.accent
        else -> theme.colors.surfaceAlt
    }
    val textColor = when {
        prominent -> Color.White
        isLit -> theme.colors.accentText
        else -> theme.colors.textPrimary
    }
    Box(
        modifier = Modifier
            .clip(shape)
            .background(if (enabled) background else background.copy(alpha = 0.5f))
            .border(1.dp, theme.colors.border, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}
