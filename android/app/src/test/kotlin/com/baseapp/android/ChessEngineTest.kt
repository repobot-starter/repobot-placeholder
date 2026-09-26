package com.baseapp.android

import com.baseapp.android.view.games.chess.ChessEngine
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure chess engine against the web `engine.ts` rules it
 * mirrors: perft node counts from the start position, castling legality
 * (blocked / through check), en passant, promotion, mate and stalemate
 * detection, and bot move legality.
 */
class ChessEngineTest {
    // MARK: Perft

    /**
     * Classic perft counts from the starting position. Any divergence from
     * 20 / 400 / 8902 means the move generator disagrees with real chess
     * (and with the web engine).
     */
    @Test
    fun perftFromStartPositionMatchesKnownNodeCounts() {
        val start = ChessEngine.initialState()
        assertEquals(20, perft(start, 1))
        assertEquals(400, perft(start, 2))
        assertEquals(8902, perft(start, 3))
    }

    // MARK: Castling

    @Test
    fun castlingBlockedByOwnPiecesIsIllegal() {
        // In the start position every castle path is occupied.
        val startCastles = ChessEngine.legalMoves(ChessEngine.initialState())
            .filter { it.castle != null }
        assertTrue(startCastles.isEmpty())

        // Bishop parked on f1 blocks kingside only; queenside stays available.
        val state = makeState(
            listOf(
                Triple("e1", ChessEngine.PieceType.KING, ChessEngine.PieceColor.WHITE),
                Triple("a1", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.WHITE),
                Triple("h1", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.WHITE),
                Triple("f1", ChessEngine.PieceType.BISHOP, ChessEngine.PieceColor.WHITE),
                Triple("e8", ChessEngine.PieceType.KING, ChessEngine.PieceColor.BLACK),
            ),
        )
        val sides = ChessEngine.legalMoves(state).mapNotNull { it.castle }
        assertEquals(listOf(ChessEngine.CastleSide.QUEENSIDE), sides)
    }

    @Test
    fun castlingThroughOrOutOfCheckIsIllegal() {
        // Black rook on f4 covers f1: the king may not pass through an
        // attacked square, so kingside is out while queenside remains legal.
        val throughCheck = makeState(
            listOf(
                Triple("e1", ChessEngine.PieceType.KING, ChessEngine.PieceColor.WHITE),
                Triple("a1", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.WHITE),
                Triple("h1", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.WHITE),
                Triple("f4", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.BLACK),
                Triple("h8", ChessEngine.PieceType.KING, ChessEngine.PieceColor.BLACK),
            ),
        )
        val sides = ChessEngine.legalMoves(throughCheck).mapNotNull { it.castle }
        assertEquals(listOf(ChessEngine.CastleSide.QUEENSIDE), sides)

        // Black rook on e5 gives check: castling is never legal while in check.
        val inCheck = makeState(
            listOf(
                Triple("e1", ChessEngine.PieceType.KING, ChessEngine.PieceColor.WHITE),
                Triple("a1", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.WHITE),
                Triple("h1", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.WHITE),
                Triple("e5", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.BLACK),
                Triple("h8", ChessEngine.PieceType.KING, ChessEngine.PieceColor.BLACK),
            ),
        )
        assertTrue(ChessEngine.isInCheck(inCheck, ChessEngine.PieceColor.WHITE))
        assertTrue(ChessEngine.legalMoves(inCheck).all { it.castle == null })
    }

    @Test
    fun castlingMovesKingAndRookTogether() {
        val state = makeState(
            listOf(
                Triple("e1", ChessEngine.PieceType.KING, ChessEngine.PieceColor.WHITE),
                Triple("h1", ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.WHITE),
                Triple("e8", ChessEngine.PieceType.KING, ChessEngine.PieceColor.BLACK),
            ),
            castling = ChessEngine.CastlingRights(
                whiteKingside = true,
                whiteQueenside = false,
                blackKingside = false,
                blackQueenside = false,
            ),
        )
        val castle = ChessEngine.legalMoves(state)
            .first { it.castle == ChessEngine.CastleSide.KINGSIDE }
        val next = ChessEngine.applyMove(state, castle)
        assertEquals(
            ChessEngine.Piece(ChessEngine.PieceType.KING, ChessEngine.PieceColor.WHITE),
            next.board[ChessEngine.parseSquare("g1")],
        )
        assertEquals(
            ChessEngine.Piece(ChessEngine.PieceType.ROOK, ChessEngine.PieceColor.WHITE),
            next.board[ChessEngine.parseSquare("f1")],
        )
        assertNull(next.board[ChessEngine.parseSquare("e1")])
        assertNull(next.board[ChessEngine.parseSquare("h1")])
        assertFalse(next.castling.whiteKingside)
    }

    // MARK: En passant

    @Test
    fun enPassantCaptureRemovesTheDoublePushedPawn() {
        // 1. e4 a6 2. e5 d5 sets the en passant target on d6.
        var state = ChessEngine.initialState()
        state = play(state, "e2", "e4")
        state = play(state, "a7", "a6")
        state = play(state, "e4", "e5")
        state = play(state, "d7", "d5")
        assertEquals(ChessEngine.parseSquare("d6"), state.enPassant)

        val capture = ChessEngine.legalMoves(state)
            .first { it.isEnPassant && it.to == ChessEngine.parseSquare("d6") }
        assertEquals(ChessEngine.PieceType.PAWN, capture.captured)

        val next = ChessEngine.applyMove(state, capture)
        assertEquals(
            ChessEngine.Piece(ChessEngine.PieceType.PAWN, ChessEngine.PieceColor.WHITE),
            next.board[ChessEngine.parseSquare("d6")],
        )
        // The captured pawn sat behind the target square and must be gone.
        assertNull(next.board[ChessEngine.parseSquare("d5")])
        assertNull(next.board[ChessEngine.parseSquare("e5")])
        assertNull(next.enPassant)
    }

    // MARK: Promotion

    @Test
    fun promotionGeneratesAllFourPiecesAndApplies() {
        val state = makeState(
            listOf(
                Triple("a7", ChessEngine.PieceType.PAWN, ChessEngine.PieceColor.WHITE),
                Triple("e1", ChessEngine.PieceType.KING, ChessEngine.PieceColor.WHITE),
                Triple("h7", ChessEngine.PieceType.KING, ChessEngine.PieceColor.BLACK),
            ),
        )
        val promotions = ChessEngine.legalMovesFrom(state, ChessEngine.parseSquare("a7"))
        assertEquals(
            setOf(
                ChessEngine.PieceType.QUEEN,
                ChessEngine.PieceType.ROOK,
                ChessEngine.PieceType.BISHOP,
                ChessEngine.PieceType.KNIGHT,
            ),
            promotions.mapNotNull { it.promotion }.toSet(),
        )
        assertTrue(promotions.all { it.to == ChessEngine.parseSquare("a8") })

        val toQueen = promotions.first { it.promotion == ChessEngine.PieceType.QUEEN }
        assertEquals("a8=Q", ChessEngine.moveToSan(state, toQueen))
        val next = ChessEngine.applyMove(state, toQueen)
        assertEquals(
            ChessEngine.Piece(ChessEngine.PieceType.QUEEN, ChessEngine.PieceColor.WHITE),
            next.board[ChessEngine.parseSquare("a8")],
        )
        assertNull(next.board[ChessEngine.parseSquare("a7")])
    }

    // MARK: Outcomes

    @Test
    fun foolsMateIsDetectedAsCheckmate() {
        // 1. f3 e5 2. g4 Qh4# — the fastest possible checkmate.
        var state = ChessEngine.initialState()
        state = play(state, "f2", "f3")
        state = play(state, "e7", "e5")
        state = play(state, "g2", "g4")

        val mate = move(state, "d8", "h4")
        assertEquals("Qh4#", ChessEngine.moveToSan(state, mate))

        state = ChessEngine.applyMove(state, mate)
        assertTrue(ChessEngine.isInCheck(state, ChessEngine.PieceColor.WHITE))
        assertTrue(ChessEngine.legalMoves(state).isEmpty())
        assertEquals(ChessEngine.Outcome.CHECKMATE, ChessEngine.getOutcome(state))
    }

    @Test
    fun stalematePositionIsDetectedAsDraw() {
        // Black to move with king a8 boxed in by Kb6 + Qc7 — no check, no moves.
        val state = makeState(
            listOf(
                Triple("a8", ChessEngine.PieceType.KING, ChessEngine.PieceColor.BLACK),
                Triple("b6", ChessEngine.PieceType.KING, ChessEngine.PieceColor.WHITE),
                Triple("c7", ChessEngine.PieceType.QUEEN, ChessEngine.PieceColor.WHITE),
            ),
            turn = ChessEngine.PieceColor.BLACK,
        )
        assertFalse(ChessEngine.isInCheck(state, ChessEngine.PieceColor.BLACK))
        assertTrue(ChessEngine.legalMoves(state).isEmpty())
        assertEquals(ChessEngine.Outcome.STALEMATE, ChessEngine.getOutcome(state))
    }

    // MARK: Bots

    @Test
    fun easyBotPlaysALegalMove() {
        val state = ChessEngine.initialState()
        val legal = ChessEngine.legalMoves(state)

        // Seeded random keeps the picks reproducible; several seeds cover
        // both the capture-bias and fallback branches.
        for (seed in 0L until 5L) {
            val move = ChessEngine.findBotMove(state, ChessEngine.BotDifficulty.EASY, Random(seed))
            assertTrue(move != null && legal.contains(move))
        }
    }

    // MARK: Helpers

    /** Counts leaf nodes of the legal move tree — the standard perft metric. */
    private fun perft(state: ChessEngine.GameState, depth: Int): Int {
        if (depth == 0) {
            return 1
        }
        var nodes = 0
        for (move in ChessEngine.legalMoves(state)) {
            nodes += perft(ChessEngine.applyMove(state, move), depth - 1)
        }
        return nodes
    }

    /**
     * Builds a position from a piece list. Castling rights default to "all
     * available" so castle tests exercise the path checks, not the rights.
     */
    private fun makeState(
        pieces: List<Triple<String, ChessEngine.PieceType, ChessEngine.PieceColor>>,
        turn: ChessEngine.PieceColor = ChessEngine.PieceColor.WHITE,
        castling: ChessEngine.CastlingRights = ChessEngine.CastlingRights(
            whiteKingside = true,
            whiteQueenside = true,
            blackKingside = true,
            blackQueenside = true,
        ),
        enPassant: Int? = null,
    ): ChessEngine.GameState {
        val board = arrayOfNulls<ChessEngine.Piece>(64)
        for ((square, type, color) in pieces) {
            board[ChessEngine.parseSquare(square)] = ChessEngine.Piece(type, color)
        }
        return ChessEngine.GameState(
            board = board.toList(),
            turn = turn,
            castling = castling,
            enPassant = enPassant,
            halfmoveClock = 0,
            fullmove = 1,
        )
    }

    /** The unique legal move between two named squares (fails the test if absent). */
    private fun move(state: ChessEngine.GameState, from: String, to: String): ChessEngine.Move =
        ChessEngine.legalMoves(state).first {
            it.from == ChessEngine.parseSquare(from) && it.to == ChessEngine.parseSquare(to)
        }

    private fun play(
        state: ChessEngine.GameState,
        from: String,
        to: String,
    ): ChessEngine.GameState = ChessEngine.applyMove(state, move(state, from, to))
}
