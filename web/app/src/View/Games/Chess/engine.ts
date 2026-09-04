// Pure chess engine: board representation, full legal move generation
// (castling, en passant, promotion), outcome detection, evaluation, and the
// three bot difficulties. No React, no DOM — everything here is a pure
// function over GameState, so it is easy to test and extend.

export type Color = "white" | "black"
export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king"

export interface Piece {
    type: PieceType
    color: Color
}

/** Squares are indexed 0-63 as `rank * 8 + file`; a1 = 0, h1 = 7, a8 = 56, h8 = 63. */
export type Board = (Piece | null)[]

export interface CastlingRights {
    whiteKingside: boolean
    whiteQueenside: boolean
    blackKingside: boolean
    blackQueenside: boolean
}

export interface GameState {
    board: Board
    turn: Color
    castling: CastlingRights
    /** Square a pawn just skipped with a double push (the en passant target), or null. */
    enPassant: number | null
    /** Plies since the last pawn move or capture (fifty-move rule fuel for extensions). */
    halfmoveClock: number
    fullmove: number
}

export interface Move {
    from: number
    to: number
    piece: PieceType
    captured?: PieceType
    promotion?: PieceType
    castle?: "kingside" | "queenside"
    isEnPassant?: boolean
}

export type Outcome = "checkmate" | "stalemate" | "insufficient-material" | null

export type BotDifficulty = "easy" | "medium" | "hard"

/** Centipawn piece values used by the evaluation and the bots. */
export const PIECE_VALUES: Record<PieceType, number> = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 0,
}

const PROMOTION_PIECES: PieceType[] = ["queen", "rook", "bishop", "knight"]
const BACK_RANK: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]

const ROOK_DIRECTIONS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
] as const
const BISHOP_DIRECTIONS = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
] as const
const KING_DIRECTIONS = [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS]
const KNIGHT_JUMPS = [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
] as const

export function fileOf(square: number): number {
    return square % 8
}

export function rankOf(square: number): number {
    return Math.floor(square / 8)
}

export function squareAt(file: number, rank: number): number {
    return rank * 8 + file
}

/** "e4"-style name for a square index. */
export function squareName(square: number): string {
    return "abcdefgh"[fileOf(square)] + String(rankOf(square) + 1)
}

/** Square index for an "e4"-style name. */
export function parseSquare(name: string): number {
    return squareAt(name.charCodeAt(0) - 97, Number(name[1]) - 1)
}

export function opposite(color: Color): Color {
    return color === "white" ? "black" : "white"
}

/** Standard starting position, white to move. */
export function initialState(): GameState {
    const board: Board = new Array<Piece | null>(64).fill(null)
    for (let file = 0; file < 8; file++) {
        board[squareAt(file, 0)] = { type: BACK_RANK[file], color: "white" }
        board[squareAt(file, 1)] = { type: "pawn", color: "white" }
        board[squareAt(file, 6)] = { type: "pawn", color: "black" }
        board[squareAt(file, 7)] = { type: BACK_RANK[file], color: "black" }
    }
    return {
        board,
        turn: "white",
        castling: {
            whiteKingside: true,
            whiteQueenside: true,
            blackKingside: true,
            blackQueenside: true,
        },
        enPassant: null,
        halfmoveClock: 0,
        fullmove: 1,
    }
}

/** True when `byColor` attacks `square` on this board (ignores pins — raw attack). */
export function isSquareAttacked(board: Board, square: number, byColor: Color): boolean {
    const file = fileOf(square)
    const rank = rankOf(square)

    // Pawns attack diagonally toward the enemy, so look one rank "behind" the square.
    const pawnRank = rank - (byColor === "white" ? 1 : -1)
    if (pawnRank >= 0 && pawnRank <= 7) {
        for (const df of [-1, 1]) {
            const f = file + df
            if (f < 0 || f > 7) {
                continue
            }
            const piece = board[squareAt(f, pawnRank)]
            if (piece && piece.color === byColor && piece.type === "pawn") {
                return true
            }
        }
    }

    for (const [df, dr] of KNIGHT_JUMPS) {
        const f = file + df
        const r = rank + dr
        if (f < 0 || f > 7 || r < 0 || r > 7) {
            continue
        }
        const piece = board[squareAt(f, r)]
        if (piece && piece.color === byColor && piece.type === "knight") {
            return true
        }
    }

    for (const [df, dr] of KING_DIRECTIONS) {
        const diagonal = df !== 0 && dr !== 0
        let f = file + df
        let r = rank + dr
        let distance = 1
        while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
            const piece = board[squareAt(f, r)]
            if (piece) {
                if (piece.color === byColor) {
                    if (piece.type === "queen") {
                        return true
                    }
                    if (piece.type === (diagonal ? "bishop" : "rook")) {
                        return true
                    }
                    if (piece.type === "king" && distance === 1) {
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

/** True when `color`'s king is attacked in this position. */
export function isInCheck(state: GameState, color: Color): boolean {
    const king = state.board.findIndex((piece) => piece?.type === "king" && piece.color === color)
    return king >= 0 && isSquareAttacked(state.board, king, opposite(color))
}

function pawnMoves(state: GameState, from: number, color: Color, out: Move[]): void {
    const { board } = state
    const direction = color === "white" ? 1 : -1
    const file = fileOf(from)
    const rank = rankOf(from)
    const promotionRank = color === "white" ? 7 : 0
    const startRank = color === "white" ? 1 : 6

    const push = (to: number, captured?: PieceType): void => {
        if (rankOf(to) === promotionRank) {
            for (const promotion of PROMOTION_PIECES) {
                out.push({ from, to, piece: "pawn", captured, promotion })
            }
        } else {
            out.push({ from, to, piece: "pawn", captured })
        }
    }

    const oneUp = squareAt(file, rank + direction)
    if (!board[oneUp]) {
        push(oneUp)
        if (rank === startRank) {
            const twoUp = squareAt(file, rank + 2 * direction)
            if (!board[twoUp]) {
                out.push({ from, to: twoUp, piece: "pawn" })
            }
        }
    }

    for (const df of [-1, 1]) {
        const f = file + df
        if (f < 0 || f > 7) {
            continue
        }
        const to = squareAt(f, rank + direction)
        const target = board[to]
        if (target && target.color !== color) {
            push(to, target.type)
        } else if (!target && to === state.enPassant) {
            out.push({ from, to, piece: "pawn", captured: "pawn", isEnPassant: true })
        }
    }
}

function leaperMoves(
    board: Board,
    from: number,
    color: Color,
    piece: PieceType,
    offsets: readonly (readonly [number, number])[],
    out: Move[],
): void {
    const file = fileOf(from)
    const rank = rankOf(from)
    for (const [df, dr] of offsets) {
        const f = file + df
        const r = rank + dr
        if (f < 0 || f > 7 || r < 0 || r > 7) {
            continue
        }
        const to = squareAt(f, r)
        const target = board[to]
        if (!target) {
            out.push({ from, to, piece })
        } else if (target.color !== color) {
            out.push({ from, to, piece, captured: target.type })
        }
    }
}

function sliderMoves(
    board: Board,
    from: number,
    color: Color,
    piece: PieceType,
    directions: readonly (readonly [number, number])[],
    out: Move[],
): void {
    const file = fileOf(from)
    const rank = rankOf(from)
    for (const [df, dr] of directions) {
        let f = file + df
        let r = rank + dr
        while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
            const to = squareAt(f, r)
            const target = board[to]
            if (!target) {
                out.push({ from, to, piece })
            } else {
                if (target.color !== color) {
                    out.push({ from, to, piece, captured: target.type })
                }
                break
            }
            f += df
            r += dr
        }
    }
}

function castlingMoves(state: GameState, color: Color, out: Move[]): void {
    const { board, castling } = state
    const rank = color === "white" ? 0 : 7
    const kingFrom = squareAt(4, rank)
    const enemy = opposite(color)
    const kingside = color === "white" ? castling.whiteKingside : castling.blackKingside
    const queenside = color === "white" ? castling.whiteQueenside : castling.blackQueenside
    if (!kingside && !queenside) {
        return
    }
    const king = board[kingFrom]
    if (!king || king.type !== "king" || king.color !== color) {
        return
    }
    // Castling is never legal while in check.
    if (isSquareAttacked(board, kingFrom, enemy)) {
        return
    }
    if (kingside) {
        const f1 = squareAt(5, rank)
        const g1 = squareAt(6, rank)
        const rook = board[squareAt(7, rank)]
        if (
            rook?.type === "rook" &&
            rook.color === color &&
            !board[f1] &&
            !board[g1] &&
            !isSquareAttacked(board, f1, enemy) &&
            !isSquareAttacked(board, g1, enemy)
        ) {
            out.push({ from: kingFrom, to: g1, piece: "king", castle: "kingside" })
        }
    }
    if (queenside) {
        const b1 = squareAt(1, rank)
        const c1 = squareAt(2, rank)
        const d1 = squareAt(3, rank)
        const rook = board[squareAt(0, rank)]
        if (
            rook?.type === "rook" &&
            rook.color === color &&
            !board[b1] &&
            !board[c1] &&
            !board[d1] &&
            !isSquareAttacked(board, c1, enemy) &&
            !isSquareAttacked(board, d1, enemy)
        ) {
            out.push({ from: kingFrom, to: c1, piece: "king", castle: "queenside" })
        }
    }
}

// Every move a color could make ignoring whether it leaves its own king in
// check. Castling is the exception: its through-check conditions are part of
// the move's definition, so they are enforced here.
function pseudoMovesFor(state: GameState, color: Color): Move[] {
    const moves: Move[] = []
    for (let square = 0; square < 64; square++) {
        const piece = state.board[square]
        if (!piece || piece.color !== color) {
            continue
        }
        switch (piece.type) {
            case "pawn":
                pawnMoves(state, square, color, moves)
                break
            case "knight":
                leaperMoves(state.board, square, color, "knight", KNIGHT_JUMPS, moves)
                break
            case "bishop":
                sliderMoves(state.board, square, color, "bishop", BISHOP_DIRECTIONS, moves)
                break
            case "rook":
                sliderMoves(state.board, square, color, "rook", ROOK_DIRECTIONS, moves)
                break
            case "queen":
                sliderMoves(state.board, square, color, "queen", KING_DIRECTIONS, moves)
                break
            case "king":
                leaperMoves(state.board, square, color, "king", KING_DIRECTIONS, moves)
                castlingMoves(state, color, moves)
                break
        }
    }
    return moves
}

/** All strictly legal moves for the side to move. */
export function legalMoves(state: GameState): Move[] {
    return pseudoMovesFor(state, state.turn).filter((move) => !isInCheck(applyMove(state, move), state.turn))
}

/** Legal moves for the piece on one square (empty array if none). */
export function legalMovesFrom(state: GameState, square: number): Move[] {
    return legalMoves(state).filter((move) => move.from === square)
}

function clearedRights(rights: CastlingRights, square: number): CastlingRights {
    if (square === 0) {
        return { ...rights, whiteQueenside: false }
    }
    if (square === 7) {
        return { ...rights, whiteKingside: false }
    }
    if (square === 56) {
        return { ...rights, blackQueenside: false }
    }
    if (square === 63) {
        return { ...rights, blackKingside: false }
    }
    return rights
}

/** Applies a move and returns the new state. Pure — the input state is untouched. */
export function applyMove(state: GameState, move: Move): GameState {
    const board = state.board.slice()
    const piece = board[move.from]
    if (!piece) {
        throw new Error(`No piece on ${squareName(move.from)}`)
    }
    const color = piece.color

    board[move.from] = null
    if (move.isEnPassant) {
        board[move.to + (color === "white" ? -8 : 8)] = null
    }
    board[move.to] = move.promotion ? { type: move.promotion, color } : piece

    if (move.castle) {
        const rank = rankOf(move.from)
        const rookFrom = squareAt(move.castle === "kingside" ? 7 : 0, rank)
        const rookTo = squareAt(move.castle === "kingside" ? 5 : 3, rank)
        board[rookTo] = board[rookFrom]
        board[rookFrom] = null
    }

    let castling = state.castling
    if (piece.type === "king") {
        castling =
            color === "white"
                ? { ...castling, whiteKingside: false, whiteQueenside: false }
                : { ...castling, blackKingside: false, blackQueenside: false }
    }
    // Moving a rook off its corner, or capturing one on it, kills that right.
    castling = clearedRights(castling, move.from)
    castling = clearedRights(castling, move.to)

    const isDoublePush = piece.type === "pawn" && Math.abs(move.to - move.from) === 16

    return {
        board,
        turn: opposite(color),
        castling,
        enPassant: isDoublePush ? (move.from + move.to) / 2 : null,
        halfmoveClock: piece.type === "pawn" || move.captured ? 0 : state.halfmoveClock + 1,
        fullmove: color === "black" ? state.fullmove + 1 : state.fullmove,
    }
}

/** K vs K, K+B vs K, and K+N vs K can never be won. */
export function hasInsufficientMaterial(board: Board): boolean {
    const minors: PieceType[] = []
    for (const piece of board) {
        if (!piece || piece.type === "king") {
            continue
        }
        if (piece.type !== "bishop" && piece.type !== "knight") {
            return false
        }
        minors.push(piece.type)
        if (minors.length > 1) {
            return false
        }
    }
    return true
}

/** Terminal result of the position, or null if the game continues. */
export function getOutcome(state: GameState): Outcome {
    if (legalMoves(state).length === 0) {
        return isInCheck(state, state.turn) ? "checkmate" : "stalemate"
    }
    if (hasInsufficientMaterial(state.board)) {
        return "insufficient-material"
    }
    return null
}

const SAN_LETTERS: Record<PieceType, string> = {
    pawn: "",
    knight: "N",
    bishop: "B",
    rook: "R",
    queen: "Q",
    king: "K",
}

/**
 * Standard algebraic notation for a move about to be played from `state`
 * (e.g. "e4", "Nxf6+", "O-O", "e8=Q#"), including disambiguation and
 * check/checkmate suffixes.
 */
export function moveToSan(state: GameState, move: Move): string {
    let san: string
    if (move.castle) {
        san = move.castle === "kingside" ? "O-O" : "O-O-O"
    } else if (move.piece === "pawn") {
        san = move.captured ? `${"abcdefgh"[fileOf(move.from)]}x${squareName(move.to)}` : squareName(move.to)
        if (move.promotion) {
            san += `=${SAN_LETTERS[move.promotion]}`
        }
    } else {
        const rivals = legalMoves(state).filter(
            (other) => other.piece === move.piece && other.to === move.to && other.from !== move.from,
        )
        let disambiguation = ""
        if (rivals.length > 0) {
            const sameFile = rivals.some((other) => fileOf(other.from) === fileOf(move.from))
            const sameRank = rivals.some((other) => rankOf(other.from) === rankOf(move.from))
            if (!sameFile) {
                disambiguation = "abcdefgh"[fileOf(move.from)]
            } else if (!sameRank) {
                disambiguation = String(rankOf(move.from) + 1)
            } else {
                disambiguation = squareName(move.from)
            }
        }
        san = SAN_LETTERS[move.piece] + disambiguation + (move.captured ? "x" : "") + squareName(move.to)
    }

    const next = applyMove(state, move)
    if (isInCheck(next, next.turn)) {
        san += legalMoves(next).length === 0 ? "#" : "+"
    }
    return san
}

// Piece-square tables (centipawns) from white's point of view, written with
// rank 8 at the top so they read like a board diagram. Classic "simplified
// evaluation function" values.
// prettier-ignore
const PAWN_TABLE = [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
]
// prettier-ignore
const KNIGHT_TABLE = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
]
// prettier-ignore
const BISHOP_TABLE = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
]
// prettier-ignore
const ROOK_TABLE = [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
]
// prettier-ignore
const QUEEN_TABLE = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
]
// prettier-ignore
const KING_TABLE = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
]

const PIECE_SQUARE_TABLES: Record<PieceType, number[]> = {
    pawn: PAWN_TABLE,
    knight: KNIGHT_TABLE,
    bishop: BISHOP_TABLE,
    rook: ROOK_TABLE,
    queen: QUEEN_TABLE,
    king: KING_TABLE,
}

const MOBILITY_WEIGHT = 2
const MATE_SCORE = 1_000_000
const HARD_SEARCH_DEPTH = 3

function pieceSquareValue(piece: Piece, square: number): number {
    const table = PIECE_SQUARE_TABLES[piece.type]
    const file = fileOf(square)
    const rank = rankOf(square)
    // Tables are written rank 8 first, so white reads them flipped.
    return piece.color === "white" ? table[(7 - rank) * 8 + file] : table[rank * 8 + file]
}

/** Static evaluation in centipawns; positive favors white. Material + piece-square + mobility. */
export function evaluate(state: GameState): number {
    let score = 0
    for (let square = 0; square < 64; square++) {
        const piece = state.board[square]
        if (!piece) {
            continue
        }
        const sign = piece.color === "white" ? 1 : -1
        score += sign * (PIECE_VALUES[piece.type] + pieceSquareValue(piece, square))
    }
    score += MOBILITY_WEIGHT * pseudoMovesFor(state, "white").length
    score -= MOBILITY_WEIGHT * pseudoMovesFor(state, "black").length
    return score
}

function randomOf<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)]
}

function materialGain(move: Move): number {
    let gain = move.captured ? PIECE_VALUES[move.captured] : 0
    if (move.promotion) {
        gain += PIECE_VALUES[move.promotion] - PIECE_VALUES.pawn
    }
    return gain
}

// Easy: random, with a soft spot for taking something when it can.
function easyMove(moves: Move[]): Move {
    const captures = moves.filter((move) => move.captured)
    if (captures.length > 0 && Math.random() < 0.6) {
        return randomOf(captures)
    }
    return randomOf(moves)
}

// Medium: depth-1 material greed with a one-ply safety check so it does not
// leave pieces hanging (the opponent's best immediate capture counts against
// the move).
function greedyMove(state: GameState, moves: Move[]): Move {
    let best: Move[] = []
    let bestScore = -Infinity
    for (const move of moves) {
        const next = applyMove(state, move)
        let threat = 0
        for (const reply of legalMoves(next)) {
            if (reply.captured) {
                threat = Math.max(threat, PIECE_VALUES[reply.captured])
            }
        }
        const score = materialGain(move) - threat * 0.9
        if (score > bestScore) {
            bestScore = score
            best = [move]
        } else if (score === bestScore) {
            best.push(move)
        }
    }
    return randomOf(best)
}

// Captures first, biggest victim with the cheapest attacker (MVV-LVA), so
// alpha-beta prunes early.
function orderMoves(moves: Move[]): Move[] {
    const score = (move: Move): number =>
        move.captured ? 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece] : 0
    return [...moves].sort((a, b) => score(b) - score(a))
}

// Negamax alpha-beta. Scores are from the perspective of the side to move in
// `state`. Mates found closer to the root score higher so the bot prefers the
// fastest win and the slowest loss.
function negamax(state: GameState, depth: number, alpha: number, beta: number): number {
    if (hasInsufficientMaterial(state.board)) {
        return 0
    }
    if (depth === 0) {
        const score = evaluate(state)
        return state.turn === "white" ? score : -score
    }
    const moves = legalMoves(state)
    if (moves.length === 0) {
        return isInCheck(state, state.turn) ? -(MATE_SCORE + depth) : 0
    }
    let best = -Infinity
    for (const move of orderMoves(moves)) {
        const score = -negamax(applyMove(state, move), depth - 1, -beta, -alpha)
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

// Hard: full alpha-beta search. Root moves are shuffled before ordering so
// equal-best positions do not always play out identically.
function searchMove(state: GameState, depth: number): Move {
    const moves = orderMoves(
        legalMoves(state)
            .map((move) => ({ move, key: Math.random() }))
            .sort((a, b) => a.key - b.key)
            .map((entry) => entry.move),
    )
    let best = moves[0]
    let alpha = -Infinity
    for (const move of moves) {
        const score = -negamax(applyMove(state, move), depth - 1, -Infinity, -alpha)
        if (score > alpha) {
            alpha = score
            best = move
        }
    }
    return best
}

/** Picks the bot's move for the side to move, or null if the game is over. */
export function findBotMove(state: GameState, difficulty: BotDifficulty): Move | null {
    const moves = legalMoves(state)
    if (moves.length === 0) {
        return null
    }
    switch (difficulty) {
        case "easy":
            return easyMove(moves)
        case "medium":
            return greedyMove(state, moves)
        case "hard":
            return searchMove(state, HARD_SEARCH_DEPTH)
    }
}
