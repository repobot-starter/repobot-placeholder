package com.baseapp.android.view.games.chess

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

/**
 * Board palette mirroring the web `ChessPage.styles.css.ts` wood colors. The
 * board keeps its own look on both light and dark app themes (why: the web
 * board is hardcoded wood too — it is part of the game's identity).
 */
private object ChessColors {
    val woodLight = Color(0xFFF0D9B5)
    val woodDark = Color(0xFFB58863)
    val selected = Color(0x73FFEB3B) // rgba(255,235,59,0.45)
    val lastMove = Color(0x6BFFD54F) // rgba(255,213,79,0.42)
    val check = Color(0xA6FF3C32) // rgba(255,60,50,0.65)
    val marker = Color(0x591E1810) // rgba(30,24,16,0.35)
    val pieceWhite = Color(0xFFFAF4E4)
    val pieceBlack = Color(0xFF211812)
    val boardBorder = Color(0xFF26221A)
    val overlayScrim = Color(0xB826221A) // rgba(38,34,26,0.72)
    val overlayText = Color(0xFF7CF29C)
}

/** Unicode glyphs for every piece, by color — the same as the web `PIECE_GLYPHS`. */
private fun chessGlyph(piece: ChessEngine.Piece): String =
    when (piece.color) {
        ChessEngine.PieceColor.WHITE -> when (piece.type) {
            ChessEngine.PieceType.KING -> "♔"
            ChessEngine.PieceType.QUEEN -> "♕"
            ChessEngine.PieceType.ROOK -> "♖"
            ChessEngine.PieceType.BISHOP -> "♗"
            ChessEngine.PieceType.KNIGHT -> "♘"
            ChessEngine.PieceType.PAWN -> "♙"
        }
        ChessEngine.PieceColor.BLACK -> when (piece.type) {
            ChessEngine.PieceType.KING -> "♚"
            ChessEngine.PieceType.QUEEN -> "♛"
            ChessEngine.PieceType.ROOK -> "♜"
            ChessEngine.PieceType.BISHOP -> "♝"
            ChessEngine.PieceType.KNIGHT -> "♞"
            ChessEngine.PieceType.PAWN -> "♟"
        }
    }

private enum class ChessMode(val label: String) {
    ONE_PLAYER("1P VS BOT"),
    TWO_PLAYER("2P LOCAL"),
}

/**
 * One played ply: the move, its SAN, and the position after it. Undo just
 * drops entries, exactly like the web page's `PlyRecord` history.
 */
private data class ChessPly(
    val move: ChessEngine.Move,
    val san: String,
    val state: ChessEngine.GameState,
)

/**
 * Home surface for the `chess` pack — the native twin of the web ChessPage.
 * Rendering and touch input only: all rules live in [ChessEngine] so they
 * stay JVM-testable and in lockstep with the web game. No network, no stores.
 *
 * Bot moves are searched on [Dispatchers.Default] from a LaunchedEffect keyed
 * on the ply count, so the hard bot never blocks composition.
 */
@Composable
fun ChessGameView() {
    val theme = LocalUiTheme.current
    val start = remember { ChessEngine.initialState() }
    var plies by remember { mutableStateOf(listOf<ChessPly>()) }
    var selected by remember { mutableStateOf<Int?>(null) }
    var mode by remember { mutableStateOf(ChessMode.ONE_PLAYER) }
    var difficulty by remember { mutableStateOf(ChessEngine.BotDifficulty.MEDIUM) }
    var flipEachTurn by remember { mutableStateOf(false) }
    // All promotion candidates for the tapped square; non-null while the
    // promotion picker dialog is up.
    var promotionChoices by remember { mutableStateOf<List<ChessEngine.Move>?>(null) }
    var botThinking by remember { mutableStateOf(false) }

    val current = plies.lastOrNull()?.state ?: start
    val outcome = remember(current) { ChessEngine.getOutcome(current) }
    val inCheck = remember(current) { ChessEngine.isInCheck(current, current.turn) }
    val botTurn =
        mode == ChessMode.ONE_PLAYER && current.turn == ChessEngine.PieceColor.BLACK && outcome == null
    val targets = remember(current, selected) {
        selected?.let { ChessEngine.legalMovesFrom(current, it) } ?: emptyList()
    }
    val lastMove = plies.lastOrNull()?.move
    val checkSquare = if (inCheck) {
        current.board.indexOfFirst { it?.type == ChessEngine.PieceType.KING && it.color == current.turn }
    } else {
        -1
    }

    fun play(move: ChessEngine.Move) {
        val san = ChessEngine.moveToSan(current, move)
        val next = ChessEngine.applyMove(current, move)
        plies = plies + ChessPly(move, san, next)
        selected = null
        promotionChoices = null
    }

    fun handleSquareTap(square: Int) {
        if (outcome != null || botTurn || promotionChoices != null) {
            return
        }
        if (selected != null) {
            val candidates = targets.filter { it.to == square }
            if (candidates.isNotEmpty()) {
                if (candidates.size > 1) {
                    // Promotions generate all four pieces; let the player pick
                    // one (the web template auto-queens — the picker is the
                    // native upgrade).
                    promotionChoices = candidates
                } else {
                    play(candidates[0])
                }
                return
            }
        }
        val piece = current.board[square]
        selected = if (piece != null && piece.color == current.turn && square != selected) {
            square
        } else {
            null
        }
    }

    fun newGame() {
        plies = emptyList()
        selected = null
        promotionChoices = null
    }

    // Undo reverts a full player+bot pair in 1P so it is the player's turn again.
    fun undo() {
        selected = null
        promotionChoices = null
        val afterLast = plies.lastOrNull()?.state ?: return
        val drop = if (
            mode == ChessMode.ONE_PLAYER &&
            afterLast.turn == ChessEngine.PieceColor.WHITE &&
            plies.size >= 2
        ) 2 else 1
        plies = plies.dropLast(drop)
    }

    // Bot reply: keyed on the ply count so every player move schedules exactly
    // one search; the short delay mirrors the web BOT_THINK_DELAY_MS so the
    // player's move paints first.
    LaunchedEffect(plies.size, mode, difficulty) {
        if (!botTurn) {
            return@LaunchedEffect
        }
        botThinking = true
        try {
            delay(350)
            val move = withContext(Dispatchers.Default) {
                ChessEngine.findBotMove(current, difficulty)
            }
            if (move != null) {
                play(move)
            }
        } finally {
            botThinking = false
        }
    }

    val statusText = when (outcome) {
        ChessEngine.Outcome.CHECKMATE ->
            "CHECKMATE — ${if (current.turn == ChessEngine.PieceColor.WHITE) "BLACK" else "WHITE"} WINS"
        ChessEngine.Outcome.STALEMATE -> "STALEMATE — DRAW"
        ChessEngine.Outcome.INSUFFICIENT_MATERIAL -> "DRAW — INSUFFICIENT MATERIAL"
        null -> {
            val prefix = if (inCheck) "CHECK — " else ""
            val turn = if (current.turn == ChessEngine.PieceColor.WHITE) "WHITE" else "BLACK"
            val suffix = if (botThinking) " · BOT THINKING…" else ""
            "$prefix$turn TO MOVE$suffix"
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
            text = "CHESSBOT",
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.xl,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
            RetroButton(label = "⟳ NEW GAME", onClick = ::newGame)
            RetroButton(
                label = "↩ UNDO",
                enabled = plies.isNotEmpty() && !botThinking,
                onClick = ::undo,
            )
        }

        Box(modifier = Modifier.fillMaxWidth()) {
            ChessBoard(
                state = current,
                selected = selected,
                targets = targets,
                lastMove = lastMove,
                checkSquare = checkSquare,
                flipped = mode == ChessMode.TWO_PLAYER && flipEachTurn &&
                    current.turn == ChessEngine.PieceColor.BLACK,
                onTap = ::handleSquareTap,
            )
            promotionChoices?.let { choices ->
                PromotionPicker(
                    choices = choices,
                    color = current.turn,
                    onPick = ::play,
                    onCancel = { promotionChoices = null },
                )
            }
            if (outcome != null) {
                BoardOverlay(
                    title = when (outcome) {
                        ChessEngine.Outcome.CHECKMATE ->
                            "CHECKMATE — ${
                                if (current.turn == ChessEngine.PieceColor.WHITE) "BLACK" else "WHITE"
                            } WINS"
                        ChessEngine.Outcome.STALEMATE -> "STALEMATE — DRAW"
                        ChessEngine.Outcome.INSUFFICIENT_MATERIAL -> "DRAW — INSUFFICIENT MATERIAL"
                    },
                    subtitle = "PRESS NEW GAME",
                )
            }
        }

        Text(
            text = statusText,
            color = if (inCheck && outcome == null) theme.colors.statusError else theme.colors.textSecondary,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Column(
            modifier = Modifier.verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
                ChessMode.entries.forEach { value ->
                    RetroButton(
                        label = value.label,
                        isLit = value == mode,
                        onClick = { mode = value },
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
                ChessEngine.BotDifficulty.entries.forEach { level ->
                    RetroButton(
                        label = level.name,
                        isLit = level == difficulty,
                        enabled = mode == ChessMode.ONE_PLAYER,
                        onClick = { difficulty = level },
                    )
                }
            }
            if (mode == ChessMode.TWO_PLAYER) {
                RetroButton(
                    label = "🔄 FLIP EACH TURN",
                    isLit = flipEachTurn,
                    onClick = { flipEachTurn = !flipEachTurn },
                )
            }

            MovesPanel(plies = plies)
            CapturedPanel(plies = plies)

            Text(
                text = "Tap a piece, then a highlighted square",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                fontFamily = FontFamily.Monospace,
            )
        }
    }
}

/**
 * The 8x8 board: wood squares, Unicode pieces, move-target markers, and
 * last-move / check highlights. Purely presentational — all rules live in
 * [ChessEngine] and all interaction state in the caller, mirroring the web
 * `ChessBoard` component.
 */
@Composable
private fun ChessBoard(
    state: ChessEngine.GameState,
    selected: Int?,
    targets: List<ChessEngine.Move>,
    lastMove: ChessEngine.Move?,
    checkSquare: Int,
    flipped: Boolean,
    onTap: (Int) -> Unit,
) {
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .clip(RoundedCornerShape(8.dp))
            .border(2.dp, ChessColors.boardBorder, RoundedCornerShape(8.dp)),
    ) {
        val squareSize = maxWidth / 8
        val pieceFontSize = with(LocalDensity.current) { (squareSize * 0.66f).toSp() }
        Column {
            for (row in 0 until 8) {
                Row {
                    for (col in 0 until 8) {
                        val rank = if (flipped) row else 7 - row
                        val file = if (flipped) 7 - col else col
                        val square = rank * 8 + file
                        val piece = state.board[square]
                        val isLight = (file + rank) % 2 == 1
                        val target = targets.firstOrNull { it.to == square }
                        val isLastMoveSquare =
                            lastMove != null && (lastMove.from == square || lastMove.to == square)

                        Box(
                            modifier = Modifier
                                .size(squareSize)
                                .background(if (isLight) ChessColors.woodLight else ChessColors.woodDark)
                                .background(
                                    when {
                                        selected == square -> ChessColors.selected
                                        isLastMoveSquare -> ChessColors.lastMove
                                        else -> Color.Transparent
                                    },
                                )
                                .clickable { onTap(square) },
                            contentAlignment = Alignment.Center,
                        ) {
                            if (checkSquare == square) {
                                Box(
                                    modifier = Modifier
                                        .size(squareSize * 0.9f)
                                        .clip(CircleShape)
                                        .background(ChessColors.check),
                                )
                            }
                            piece?.let {
                                Text(
                                    text = chessGlyph(it),
                                    color = if (it.color == ChessEngine.PieceColor.WHITE) {
                                        ChessColors.pieceWhite
                                    } else {
                                        ChessColors.pieceBlack
                                    },
                                    fontSize = pieceFontSize,
                                )
                            }
                            if (target != null) {
                                if (target.captured != null) {
                                    Box(
                                        modifier = Modifier
                                            .size(squareSize * 0.86f)
                                            .border(squareSize * 0.06f, ChessColors.marker, CircleShape),
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .size(squareSize * 0.3f)
                                            .clip(CircleShape)
                                            .background(ChessColors.marker),
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** Full-board scrim with four tappable glyphs for the promotion choice. */
@Composable
private fun BoxScope.PromotionPicker(
    choices: List<ChessEngine.Move>,
    color: ChessEngine.PieceColor,
    onPick: (ChessEngine.Move) -> Unit,
    onCancel: () -> Unit,
) {
    Box(
        modifier = Modifier
            .matchParentSize()
            .clip(RoundedCornerShape(8.dp))
            .background(ChessColors.overlayScrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "PROMOTE TO",
                color = ChessColors.overlayText,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                choices.forEach { choice ->
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(ChessColors.woodLight)
                            .clickable { onPick(choice) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = chessGlyph(
                                ChessEngine.Piece(choice.promotion ?: ChessEngine.PieceType.QUEEN, color),
                            ),
                            color = ChessColors.pieceBlack,
                            fontSize = 34.sp,
                        )
                    }
                }
            }
            Text(
                text = "CANCEL",
                color = ChessColors.overlayText,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.clickable(onClick = onCancel).padding(8.dp),
            )
        }
    }
}

/** Mate/stalemate scrim over the board, echoing the Pong game-over overlay. */
@Composable
private fun BoxScope.BoardOverlay(title: String, subtitle: String) {
    Box(
        modifier = Modifier
            .matchParentSize()
            .clip(RoundedCornerShape(8.dp))
            .background(ChessColors.overlayScrim),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = title,
                color = ChessColors.overlayText,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.Center,
            )
            Text(
                text = subtitle,
                color = ChessColors.overlayText,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Monospace,
            )
        }
    }
}

/** Scrolling "1. e4 e5" list, the native twin of the web Moves panel. */
@Composable
private fun MovesPanel(plies: List<ChessPly>) {
    val theme = LocalUiTheme.current
    Panel(header = "MOVES") {
        if (plies.isEmpty()) {
            Text(
                text = "No moves yet. White starts!",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.xs,
                fontFamily = FontFamily.Monospace,
            )
        } else {
            val scrollState = rememberScrollState()
            LaunchedEffect(plies.size) {
                scrollState.scrollTo(scrollState.maxValue)
            }
            Column(
                modifier = Modifier
                    .heightIn(max = 140.dp)
                    .verticalScroll(scrollState),
            ) {
                for (index in plies.indices step 2) {
                    Row(horizontalArrangement = Arrangement.spacedBy(theme.spacing.sm)) {
                        MoveText(text = "${index / 2 + 1}.", dim = true, width = 30.dp)
                        MoveText(text = plies[index].san, width = 72.dp)
                        MoveText(text = plies.getOrNull(index + 1)?.san ?: "")
                    }
                }
            }
        }
    }
}

@Composable
private fun MoveText(text: String, dim: Boolean = false, width: Dp? = null) {
    val theme = LocalUiTheme.current
    Text(
        text = text,
        color = if (dim) theme.colors.textSecondary else theme.colors.textPrimary,
        fontSize = theme.typography.sizes.sm,
        fontWeight = FontWeight.SemiBold,
        fontFamily = FontFamily.Monospace,
        modifier = if (width != null) Modifier.width(width) else Modifier,
    )
}

/** Captured-piece trays plus the running material difference. */
@Composable
private fun CapturedPanel(plies: List<ChessPly>) {
    val theme = LocalUiTheme.current
    val byWhite = mutableListOf<ChessEngine.PieceType>()
    val byBlack = mutableListOf<ChessEngine.PieceType>()
    plies.forEachIndexed { index, ply ->
        ply.move.captured?.let { captured ->
            (if (index % 2 == 0) byWhite else byBlack).add(captured)
        }
    }
    val diff = (byWhite.sumOf { it.centipawns } - byBlack.sumOf { it.centipawns }) / 100

    Panel(header = "CAPTURED") {
        TrayLabel("WHITE TOOK")
        Tray(pieces = byWhite, color = ChessEngine.PieceColor.BLACK)
        TrayLabel("BLACK TOOK")
        Tray(pieces = byBlack, color = ChessEngine.PieceColor.WHITE)
        Text(
            text = when {
                diff == 0 -> "Material even"
                diff > 0 -> "White +$diff"
                else -> "Black +${-diff}"
            },
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun TrayLabel(text: String) {
    val theme = LocalUiTheme.current
    Text(
        text = text,
        color = theme.colors.textSecondary,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Monospace,
    )
}

@Composable
private fun Tray(pieces: List<ChessEngine.PieceType>, color: ChessEngine.PieceColor) {
    val theme = LocalUiTheme.current
    Text(
        text = if (pieces.isEmpty()) {
            "—"
        } else {
            pieces.joinToString("") { chessGlyph(ChessEngine.Piece(it, color)) }
        },
        color = theme.colors.textPrimary,
        fontSize = 18.sp,
    )
}

/** Bordered panel with a small accent header, echoing the web side panels. */
@Composable
private fun Panel(header: String, content: @Composable () -> Unit) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.md)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(theme.colors.surfaceAlt)
            .border(1.dp, theme.colors.border, shape)
            .padding(theme.spacing.md),
        verticalArrangement = Arrangement.spacedBy(theme.spacing.xs),
    ) {
        Text(
            text = header,
            color = theme.colors.accent,
            fontSize = theme.typography.sizes.xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        content()
    }
}

/** Chunky monospace control button echoing the web console's toolbar. */
@Composable
private fun RetroButton(
    label: String,
    isLit: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val shape = RoundedCornerShape(theme.radius.sm)
    Box(
        modifier = Modifier
            .alpha(if (enabled) 1f else 0.45f)
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
