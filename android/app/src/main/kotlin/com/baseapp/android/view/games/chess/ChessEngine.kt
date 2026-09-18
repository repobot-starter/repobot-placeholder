package com.baseapp.android.view.games.chess

import kotlin.math.abs
import kotlin.math.max
import kotlin.random.Random

/**
 * Pure Kotlin port of the web chess engine
 * (`web/app/src/View/Games/Chess/engine.ts`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and interaction live in `ChessGameView`.
 *
 * Move legality (castling rights tracking, en passant, promotion), outcome
 * detection, the evaluation weights, and the three bot difficulties must stay
 * in lockstep with the web implementation and the iOS twin
 * (`ios/App/View/Games/Chess/ChessEngine.swift`). Randomness (easy bot picks,
 * greedy tie-breaks, hard-bot root shuffle) goes through an injectable
 * [Random] so tests can be deterministic.
 *
 * Squares are indexed 0-63 as `rank * 8 + file`; a1 = 0, h1 = 7, a8 = 56,
 * h8 = 63 — identical to the web `GameState`.
 */
object ChessEngine {
    /** Piece color. WHITE moves first, exactly like the web engine. */
    enum class PieceColor {
        WHITE,
        BLACK;

        val opposite: PieceColor
            get() = if (this == WHITE) BLACK else WHITE
    }

    /**
     * The six piece kinds. [centipawns] mirrors the web `PIECE_VALUES` table
     * exactly so both platforms evaluate positions identically.
     */
    enum class PieceType(val centipawns: Int) {
        PAWN(100),
        KNIGHT(320),
        BISHOP(330),
        ROOK(500),
        QUEEN(900),
        KING(0),
    }

    data class Piece(val type: PieceType, val color: PieceColor)

    /**
     * Which castling rights each side still has. Rights are lost forever when
     * the king or the relevant rook moves (or the rook is captured on its
     * corner), matching the web `CastlingRights`.
     */
    data class CastlingRights(
        val whiteKingside: Boolean,
        val whiteQueenside: Boolean,
        val blackKingside: Boolean,
        val blackQueenside: Boolean,
    )

    enum class CastleSide { KINGSIDE, QUEENSIDE }

    /**
     * One move, fully described so it can be applied, undone (by replaying
     * the history), and rendered in SAN. Mirrors the web `Move` interface.
     */
    data class Move(
        val from: Int,
        val to: Int,
        val piece: PieceType,
        val captured: PieceType? = null,
        val promotion: PieceType? = null,
        val castle: CastleSide? = null,
        val isEnPassant: Boolean = false,
    )

    /**
     * Full position: board (64 nullable pieces, index = `rank * 8 + file`),
     * side to move, castling rights, en passant target square (or null), and
     * the move clocks — identical to the web `GameState`.
     */
    data class GameState(
        val board: List<Piece?>,
        val turn: PieceColor,
        val castling: CastlingRights,
        val enPassant: Int?,
        val halfmoveClock: Int,
        val fullmove: Int,
    )

    /** Terminal result of a position; null (from [getOutcome]) means the game continues. */
    enum class Outcome { CHECKMATE, STALEMATE, INSUFFICIENT_MATERIAL }

    enum class BotDifficulty { EASY, MEDIUM, HARD }

    private val ROOK_DIRECTIONS = listOf(1 to 0, -1 to 0, 0 to 1, 0 to -1)
    private val BISHOP_DIRECTIONS = listOf(1 to 1, 1 to -1, -1 to 1, -1 to -1)
    private val KING_DIRECTIONS = ROOK_DIRECTIONS + BISHOP_DIRECTIONS
    private val KNIGHT_JUMPS = listOf(
        1 to 2, 2 to 1, 2 to -1, 1 to -2, -1 to -2, -2 to -1, -2 to 1, -1 to 2,
    )
    private val PROMOTION_PIECES = listOf(
        PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT,
    )
    private val BACK_RANK = listOf(
        PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
        PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK,
    )
    private const val FILE_NAMES = "abcdefgh"

    fun fileOf(square: Int): Int = square % 8

    fun rankOf(square: Int): Int = square / 8

    fun squareAt(file: Int, rank: Int): Int = rank * 8 + file

    /** "e4"-style name for a square index. */
    fun squareName(square: Int): String =
        "${FILE_NAMES[fileOf(square)]}${rankOf(square) + 1}"

    /** Square index for an "e4"-style name. */
    fun parseSquare(name: String): Int =
        squareAt(name[0].code - 'a'.code, name[1].code - '1'.code)

    /** Standard starting position, white to move. */
    fun initialState(): GameState {
        val board = arrayOfNulls<Piece>(64)
        for (file in 0 until 8) {
            board[squareAt(file, 0)] = Piece(BACK_RANK[file], PieceColor.WHITE)
            board[squareAt(file, 1)] = Piece(PieceType.PAWN, PieceColor.WHITE)
            board[squareAt(file, 6)] = Piece(PieceType.PAWN, PieceColor.BLACK)
            board[squareAt(file, 7)] = Piece(BACK_RANK[file], PieceColor.BLACK)
        }
        return GameState(
            board = board.toList(),
            turn = PieceColor.WHITE,
            castling = CastlingRights(
                whiteKingside = true,
                whiteQueenside = true,
                blackKingside = true,
                blackQueenside = true,
            ),
            enPassant = null,
            halfmoveClock = 0,
            fullmove = 1,
        )
    }

    /** True when [byColor] attacks [square] on this board (ignores pins — raw attack). */
    fun isSquareAttacked(board: List<Piece?>, square: Int, byColor: PieceColor): Boolean {
        val file = fileOf(square)
        val rank = rankOf(square)

        // Pawns attack diagonally toward the enemy, so look one rank "behind" the square.
        val pawnRank = rank - (if (byColor == PieceColor.WHITE) 1 else -1)
        if (pawnRank in 0..7) {
            for (df in intArrayOf(-1, 1)) {
                val f = file + df
                if (f < 0 || f > 7) {
                    continue
                }
                val piece = board[squareAt(f, pawnRank)]
                if (piece != null && piece.color == byColor && piece.type == PieceType.PAWN) {
                    return true
                }
            }
        }

        for ((df, dr) in KNIGHT_JUMPS) {
            val f = file + df
            val r = rank + dr
            if (f < 0 || f > 7 || r < 0 || r > 7) {
                continue
            }
            val piece = board[squareAt(f, r)]
            if (piece != null && piece.color == byColor && piece.type == PieceType.KNIGHT) {
                return true
            }
        }

        for ((df, dr) in KING_DIRECTIONS) {
            val diagonal = df != 0 && dr != 0
            var f = file + df
            var r = rank + dr
            var distance = 1
            while (f in 0..7 && r in 0..7) {
                val piece = board[squareAt(f, r)]
                if (piece != null) {
                    if (piece.color == byColor) {
                        if (piece.type == PieceType.QUEEN) {
                            return true
                        }
                        if (piece.type == (if (diagonal) PieceType.BISHOP else PieceType.ROOK)) {
                            return true
                        }
                        if (piece.type == PieceType.KING && distance == 1) {
                            return true
                        }
                    }
                    break
                }
                f += df
                r += dr
                distance += 1
            }
        }

        return false
    }

    /** True when [color]'s king is attacked in this position. */
    fun isInCheck(state: GameState, color: PieceColor): Boolean {
        val king = state.board.indexOfFirst { it?.type == PieceType.KING && it.color == color }
        return king >= 0 && isSquareAttacked(state.board, king, color.opposite)
    }

    private fun pawnMoves(state: GameState, from: Int, color: PieceColor, out: MutableList<Move>) {
        val board = state.board
        val direction = if (color == PieceColor.WHITE) 1 else -1
        val file = fileOf(from)
        val rank = rankOf(from)
        val promotionRank = if (color == PieceColor.WHITE) 7 else 0
        val startRank = if (color == PieceColor.WHITE) 1 else 6

        fun push(to: Int, captured: PieceType?) {
            if (rankOf(to) == promotionRank) {
                for (promotion in PROMOTION_PIECES) {
                    out.add(Move(from, to, PieceType.PAWN, captured = captured, promotion = promotion))
                }
            } else {
                out.add(Move(from, to, PieceType.PAWN, captured = captured))
            }
        }

        val oneUp = squareAt(file, rank + direction)
        if (board[oneUp] == null) {
            push(oneUp, captured = null)
            if (rank == startRank) {
                val twoUp = squareAt(file, rank + 2 * direction)
                if (board[twoUp] == null) {
                    out.add(Move(from, twoUp, PieceType.PAWN))
                }
            }
        }

        for (df in intArrayOf(-1, 1)) {
            val f = file + df
            if (f < 0 || f > 7) {
                continue
            }
            val to = squareAt(f, rank + direction)
            val target = board[to]
            if (target != null && target.color != color) {
                push(to, captured = target.type)
            } else if (target == null && to == state.enPassant) {
                out.add(Move(from, to, PieceType.PAWN, captured = PieceType.PAWN, isEnPassant = true))
            }
        }
    }

    private fun leaperMoves(
        board: List<Piece?>,
        from: Int,
        color: PieceColor,
        piece: PieceType,
        offsets: List<Pair<Int, Int>>,
        out: MutableList<Move>,
    ) {
        val file = fileOf(from)
        val rank = rankOf(from)
        for ((df, dr) in offsets) {
            val f = file + df
            val r = rank + dr
            if (f < 0 || f > 7 || r < 0 || r > 7) {
                continue
            }
            val to = squareAt(f, r)
            val target = board[to]
            if (target == null) {
                out.add(Move(from, to, piece))
            } else if (target.color != color) {
                out.add(Move(from, to, piece, captured = target.type))
            }
        }
    }

    private fun sliderMoves(
        board: List<Piece?>,
        from: Int,
        color: PieceColor,
        piece: PieceType,
        directions: List<Pair<Int, Int>>,
        out: MutableList<Move>,
    ) {
        val file = fileOf(from)
        val rank = rankOf(from)
        for ((df, dr) in directions) {
            var f = file + df
            var r = rank + dr
            while (f in 0..7 && r in 0..7) {
                val to = squareAt(f, r)
                val target = board[to]
                if (target == null) {
                    out.add(Move(from, to, piece))
                } else {
                    if (target.color != color) {
                        out.add(Move(from, to, piece, captured = target.type))
                    }
                    break
                }
                f += df
                r += dr
            }
        }
    }

    private fun castlingMoves(state: GameState, color: PieceColor, out: MutableList<Move>) {
        val board = state.board
        val rank = if (color == PieceColor.WHITE) 0 else 7
        val kingFrom = squareAt(4, rank)
        val enemy = color.opposite
        val kingside =
            if (color == PieceColor.WHITE) state.castling.whiteKingside else state.castling.blackKingside
        val queenside =
            if (color == PieceColor.WHITE) state.castling.whiteQueenside else state.castling.blackQueenside
        if (!kingside && !queenside) {
            return
        }
        val king = board[kingFrom]
        if (king == null || king.type != PieceType.KING || king.color != color) {
            return
        }
        // Castling is never legal while in check.
        if (isSquareAttacked(board, kingFrom, enemy)) {
            return
        }
        if (kingside) {
            val f1 = squareAt(5, rank)
            val g1 = squareAt(6, rank)
            val rook = board[squareAt(7, rank)]
            if (
                rook?.type == PieceType.ROOK &&
                rook.color == color &&
                board[f1] == null &&
                board[g1] == null &&
                !isSquareAttacked(board, f1, enemy) &&
                !isSquareAttacked(board, g1, enemy)
            ) {
                out.add(Move(kingFrom, g1, PieceType.KING, castle = CastleSide.KINGSIDE))
            }
        }
        if (queenside) {
            val b1 = squareAt(1, rank)
            val c1 = squareAt(2, rank)
            val d1 = squareAt(3, rank)
            val rook = board[squareAt(0, rank)]
            if (
                rook?.type == PieceType.ROOK &&
                rook.color == color &&
                board[b1] == null &&
                board[c1] == null &&
                board[d1] == null &&
                !isSquareAttacked(board, c1, enemy) &&
                !isSquareAttacked(board, d1, enemy)
            ) {
                out.add(Move(kingFrom, c1, PieceType.KING, castle = CastleSide.QUEENSIDE))
            }
        }
    }

    /**
     * Every move a color could make ignoring whether it leaves its own king
     * in check. Castling is the exception: its through-check conditions are
     * part of the move's definition, so they are enforced here.
     */
    private fun pseudoMovesFor(state: GameState, color: PieceColor): List<Move> {
        val moves = ArrayList<Move>(48)
        for (square in 0 until 64) {
            val piece = state.board[square] ?: continue
            if (piece.color != color) {
                continue
            }
            when (piece.type) {
                PieceType.PAWN -> pawnMoves(state, square, color, moves)
                PieceType.KNIGHT ->
                    leaperMoves(state.board, square, color, PieceType.KNIGHT, KNIGHT_JUMPS, moves)
                PieceType.BISHOP ->
                    sliderMoves(state.board, square, color, PieceType.BISHOP, BISHOP_DIRECTIONS, moves)
                PieceType.ROOK ->
                    sliderMoves(state.board, square, color, PieceType.ROOK, ROOK_DIRECTIONS, moves)
                PieceType.QUEEN ->
                    sliderMoves(state.board, square, color, PieceType.QUEEN, KING_DIRECTIONS, moves)
                PieceType.KING -> {
                    leaperMoves(state.board, square, color, PieceType.KING, KING_DIRECTIONS, moves)
                    castlingMoves(state, color, moves)
                }
            }
        }
        return moves
    }

    /** All strictly legal moves for the side to move. */
    fun legalMoves(state: GameState): List<Move> =
        pseudoMovesFor(state, state.turn).filter { move ->
            !isInCheck(applyMove(state, move), state.turn)
        }

    /** Legal moves for the piece on one square (empty list if none). */
    fun legalMovesFrom(state: GameState, square: Int): List<Move> =
        legalMoves(state).filter { it.from == square }

    private fun clearedRights(rights: CastlingRights, square: Int): CastlingRights =
        when (square) {
            0 -> rights.copy(whiteQueenside = false)
            7 -> rights.copy(whiteKingside = false)
            56 -> rights.copy(blackQueenside = false)
            63 -> rights.copy(blackKingside = false)
            else -> rights
        }

    /** Applies a move and returns the new state. Pure — the input state is untouched. */
    fun applyMove(state: GameState, move: Move): GameState {
        val board = state.board.toMutableList()
        val piece = board[move.from]
            ?: throw IllegalArgumentException("No piece on ${squareName(move.from)}")
        val color = piece.color

        board[move.from] = null
        if (move.isEnPassant) {
            board[move.to + (if (color == PieceColor.WHITE) -8 else 8)] = null
        }
        board[move.to] = move.promotion?.let { Piece(it, color) } ?: piece

        if (move.castle != null) {
            val rank = rankOf(move.from)
            val rookFrom = squareAt(if (move.castle == CastleSide.KINGSIDE) 7 else 0, rank)
            val rookTo = squareAt(if (move.castle == CastleSide.KINGSIDE) 5 else 3, rank)
            board[rookTo] = board[rookFrom]
            board[rookFrom] = null
        }

        var castling = state.castling
        if (piece.type == PieceType.KING) {
            castling = if (color == PieceColor.WHITE) {
                castling.copy(whiteKingside = false, whiteQueenside = false)
            } else {
                castling.copy(blackKingside = false, blackQueenside = false)
            }
        }
        // Moving a rook off its corner, or capturing one on it, kills that right.
        castling = clearedRights(castling, move.from)
        castling = clearedRights(castling, move.to)

        val isDoublePush = piece.type == PieceType.PAWN && abs(move.to - move.from) == 16

        return GameState(
            board = board,
            turn = color.opposite,
            castling = castling,
            enPassant = if (isDoublePush) (move.from + move.to) / 2 else null,
            halfmoveClock =
                if (piece.type == PieceType.PAWN || move.captured != null) 0 else state.halfmoveClock + 1,
            fullmove = if (color == PieceColor.BLACK) state.fullmove + 1 else state.fullmove,
        )
    }

    /** K vs K, K+B vs K, and K+N vs K can never be won. */
    fun hasInsufficientMaterial(board: List<Piece?>): Boolean {
        var minorCount = 0
        for (piece in board) {
            if (piece == null || piece.type == PieceType.KING) {
                continue
            }
            if (piece.type != PieceType.BISHOP && piece.type != PieceType.KNIGHT) {
                return false
            }
            minorCount += 1
            if (minorCount > 1) {
                return false
            }
        }
        return true
    }

    /** Terminal result of the position, or null if the game continues. */
    fun getOutcome(state: GameState): Outcome? {
        if (legalMoves(state).isEmpty()) {
            return if (isInCheck(state, state.turn)) Outcome.CHECKMATE else Outcome.STALEMATE
        }
        if (hasInsufficientMaterial(state.board)) {
            return Outcome.INSUFFICIENT_MATERIAL
        }
        return null
    }

    private fun sanLetter(type: PieceType): String =
        when (type) {
            PieceType.PAWN -> ""
            PieceType.KNIGHT -> "N"
            PieceType.BISHOP -> "B"
            PieceType.ROOK -> "R"
            PieceType.QUEEN -> "Q"
            PieceType.KING -> "K"
        }

    /**
     * Standard algebraic notation for a move about to be played from [state]
     * (e.g. "e4", "Nxf6+", "O-O", "e8=Q#"), including disambiguation and
     * check/checkmate suffixes.
     */
    fun moveToSan(state: GameState, move: Move): String {
        var san: String
        if (move.castle != null) {
            san = if (move.castle == CastleSide.KINGSIDE) "O-O" else "O-O-O"
        } else if (move.piece == PieceType.PAWN) {
            san = if (move.captured != null) {
                "${FILE_NAMES[fileOf(move.from)]}x${squareName(move.to)}"
            } else {
                squareName(move.to)
            }
            if (move.promotion != null) {
                san += "=${sanLetter(move.promotion)}"
            }
        } else {
            val rivals = legalMoves(state).filter { other ->
                other.piece == move.piece && other.to == move.to && other.from != move.from
            }
            var disambiguation = ""
            if (rivals.isNotEmpty()) {
                val sameFile = rivals.any { fileOf(it.from) == fileOf(move.from) }
                val sameRank = rivals.any { rankOf(it.from) == rankOf(move.from) }
                disambiguation = when {
                    !sameFile -> FILE_NAMES[fileOf(move.from)].toString()
                    !sameRank -> (rankOf(move.from) + 1).toString()
                    else -> squareName(move.from)
                }
            }
            san = sanLetter(move.piece) + disambiguation +
                (if (move.captured != null) "x" else "") + squareName(move.to)
        }

        val next = applyMove(state, move)
        if (isInCheck(next, next.turn)) {
            san += if (legalMoves(next).isEmpty()) "#" else "+"
        }
        return san
    }

    // Piece-square tables (centipawns) from white's point of view, written
    // with rank 8 at the top so they read like a board diagram. Classic
    // "simplified evaluation function" values — identical to the web tables.
    private val PAWN_TABLE = intArrayOf(
        0, 0, 0, 0, 0, 0, 0, 0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5, 5, 10, 25, 25, 10, 5, 5,
        0, 0, 0, 20, 20, 0, 0, 0,
        5, -5, -10, 0, 0, -10, -5, 5,
        5, 10, 10, -20, -20, 10, 10, 5,
        0, 0, 0, 0, 0, 0, 0, 0,
    )
    private val KNIGHT_TABLE = intArrayOf(
        -50, -40, -30, -30, -30, -30, -40, -50,
        -40, -20, 0, 0, 0, 0, -20, -40,
        -30, 0, 10, 15, 15, 10, 0, -30,
        -30, 5, 15, 20, 20, 15, 5, -30,
        -30, 0, 15, 20, 20, 15, 0, -30,
        -30, 5, 10, 15, 15, 10, 5, -30,
        -40, -20, 0, 5, 5, 0, -20, -40,
        -50, -40, -30, -30, -30, -30, -40, -50,
    )
    private val BISHOP_TABLE = intArrayOf(
        -20, -10, -10, -10, -10, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 10, 10, 5, 0, -10,
        -10, 5, 5, 10, 10, 5, 5, -10,
        -10, 0, 10, 10, 10, 10, 0, -10,
        -10, 10, 10, 10, 10, 10, 10, -10,
        -10, 5, 0, 0, 0, 0, 5, -10,
        -20, -10, -10, -10, -10, -10, -10, -20,
    )
    private val ROOK_TABLE = intArrayOf(
        0, 0, 0, 0, 0, 0, 0, 0,
        5, 10, 10, 10, 10, 10, 10, 5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        0, 0, 0, 5, 5, 0, 0, 0,
    )
    private val QUEEN_TABLE = intArrayOf(
        -20, -10, -10, -5, -5, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 5, 5, 5, 0, -10,
        -5, 0, 5, 5, 5, 5, 0, -5,
        0, 0, 5, 5, 5, 5, 0, -5,
        -10, 5, 5, 5, 5, 5, 0, -10,
        -10, 0, 5, 0, 0, 0, 0, -10,
        -20, -10, -10, -5, -5, -10, -10, -20,
    )
    private val KING_TABLE = intArrayOf(
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -10, -20, -20, -20, -20, -20, -20, -10,
        20, 20, 0, 0, 0, 0, 20, 20,
        20, 30, 10, 0, 0, 10, 30, 20,
    )

    private fun pieceSquareTable(type: PieceType): IntArray =
        when (type) {
            PieceType.PAWN -> PAWN_TABLE
            PieceType.KNIGHT -> KNIGHT_TABLE
            PieceType.BISHOP -> BISHOP_TABLE
            PieceType.ROOK -> ROOK_TABLE
            PieceType.QUEEN -> QUEEN_TABLE
            PieceType.KING -> KING_TABLE
        }

    private const val MOBILITY_WEIGHT = 2
    private const val MATE_SCORE = 1_000_000
    private const val HARD_SEARCH_DEPTH = 3

    private fun pieceSquareValue(piece: Piece, square: Int): Int {
        val table = pieceSquareTable(piece.type)
        val file = fileOf(square)
        val rank = rankOf(square)
        // Tables are written rank 8 first, so white reads them flipped.
        return if (piece.color == PieceColor.WHITE) {
            table[(7 - rank) * 8 + file]
        } else {
            table[rank * 8 + file]
        }
    }

    /**
     * Static evaluation in centipawns; positive favors white. Material +
     * piece-square + mobility — the same weights as the web `evaluate`.
     */
    fun evaluate(state: GameState): Int {
        var score = 0
        for (square in 0 until 64) {
            val piece = state.board[square] ?: continue
            val sign = if (piece.color == PieceColor.WHITE) 1 else -1
            score += sign * (piece.type.centipawns + pieceSquareValue(piece, square))
        }
        score += MOBILITY_WEIGHT * pseudoMovesFor(state, PieceColor.WHITE).size
        score -= MOBILITY_WEIGHT * pseudoMovesFor(state, PieceColor.BLACK).size
        return score
    }

    private fun <T> randomOf(items: List<T>, random: Random): T =
        items[random.nextInt(items.size)]

    private fun materialGain(move: Move): Int {
        var gain = move.captured?.centipawns ?: 0
        if (move.promotion != null) {
            gain += move.promotion.centipawns - PieceType.PAWN.centipawns
        }
        return gain
    }

    /** Easy: random, with a soft spot for taking something when it can. */
    private fun easyMove(moves: List<Move>, random: Random): Move {
        val captures = moves.filter { it.captured != null }
        if (captures.isNotEmpty() && random.nextDouble() < 0.6) {
            return randomOf(captures, random)
        }
        return randomOf(moves, random)
    }

    /**
     * Medium: depth-1 material greed with a one-ply safety check so it does
     * not leave pieces hanging (the opponent's best immediate capture counts
     * against the move).
     */
    private fun greedyMove(state: GameState, moves: List<Move>, random: Random): Move {
        var best = mutableListOf<Move>()
        var bestScore = Double.NEGATIVE_INFINITY
        for (move in moves) {
            val next = applyMove(state, move)
            var threat = 0
            for (reply in legalMoves(next)) {
                if (reply.captured != null) {
                    threat = max(threat, reply.captured.centipawns)
                }
            }
            val score = materialGain(move) - threat * 0.9
            if (score > bestScore) {
                bestScore = score
                best = mutableListOf(move)
            } else if (score == bestScore) {
                best.add(move)
            }
        }
        return randomOf(best, random)
    }

    /**
     * Captures first, biggest victim with the cheapest attacker (MVV-LVA),
     * so alpha-beta prunes early.
     */
    private fun orderMoves(moves: List<Move>): List<Move> =
        moves.sortedByDescending { move ->
            if (move.captured != null) 10 * move.captured.centipawns - move.piece.centipawns else 0
        }

    /**
     * Negamax alpha-beta. Scores are from the perspective of the side to move
     * in [state]. Mates found closer to the root score higher so the bot
     * prefers the fastest win and the slowest loss.
     */
    private fun negamax(state: GameState, depth: Int, alphaIn: Int, beta: Int): Int {
        if (hasInsufficientMaterial(state.board)) {
            return 0
        }
        if (depth == 0) {
            val score = evaluate(state)
            return if (state.turn == PieceColor.WHITE) score else -score
        }
        val moves = legalMoves(state)
        if (moves.isEmpty()) {
            return if (isInCheck(state, state.turn)) -(MATE_SCORE + depth) else 0
        }
        var alpha = alphaIn
        var best = Int.MIN_VALUE
        for (move in orderMoves(moves)) {
            val score = -negamax(applyMove(state, move), depth - 1, -beta, -alpha)
            if (score > best) {
                best = score
            }
            if (best > alpha) {
                alpha = best
            }
            if (alpha >= beta) {
                break
            }
        }
        return best
    }

    /**
     * Hard: full alpha-beta search. Root moves are shuffled before ordering
     * so equal-best positions do not always play out identically.
     */
    private fun searchMove(state: GameState, depth: Int, random: Random): Move {
        val moves = orderMoves(legalMoves(state).shuffled(random))
        var best = moves[0]
        var alpha = Int.MIN_VALUE + 1
        for (move in moves) {
            val score = -negamax(applyMove(state, move), depth - 1, Int.MIN_VALUE + 1, -alpha)
            if (score > alpha) {
                alpha = score
                best = move
            }
        }
        return best
    }

    /**
     * Picks the bot's move for the side to move, or null if the game is over.
     * [random] is injectable so tests can be deterministic; the default
     * matches the web's `Math.random()`.
     */
    fun findBotMove(
        state: GameState,
        difficulty: BotDifficulty,
        random: Random = Random.Default,
    ): Move? {
        val moves = legalMoves(state)
        if (moves.isEmpty()) {
            return null
        }
        return when (difficulty) {
            BotDifficulty.EASY -> easyMove(moves, random)
            BotDifficulty.MEDIUM -> greedyMove(state, moves, random)
            BotDifficulty.HARD -> searchMove(state, HARD_SEARCH_DEPTH, random)
        }
    }
}
