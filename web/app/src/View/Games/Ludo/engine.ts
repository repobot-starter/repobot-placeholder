// Pure Ludo rules engine: board topology, turn state machine, legal-move
// generation, capture logic, and the heuristic bot. No React, no DOM —
// everything here is a pure function over GameState, so it is easy to test
// and extend. The native ports (ios/App/View/Games/Ludo/LudoEngine.swift and
// android/.../view/games/ludo/LudoEngine.kt) mirror these rules and constants
// exactly; change them together.
//
// Token positions are stored as "progress" along the seat's own path:
//   -1        in the yard (home base), waiting for a six
//   0..50     on the 52-square shared ring, at ring index (start + p) % 52
//   51..55    in the seat's private 5-square home column
//   56        home — the token has finished
//
// Each seat enters the ring on its own start square (ring indices 0, 13, 26,
// 39 for red, green, yellow, blue) and travels 51 ring squares before turning
// into its home column, so paths overlap everywhere except the columns.

export type SeatColor = "red" | "green" | "yellow" | "blue"

/** Who controls a seat. "off" seats have no tokens and are skipped entirely. */
export type SeatKind = "human" | "bot" | "off"

export const SEAT_COLORS: SeatColor[] = ["red", "green", "yellow", "blue"]

export const SEAT_COUNT = 4
export const TOKENS_PER_SEAT = 4
export const RING_SIZE = 52
/** Last progress value that is still on the shared ring. */
export const RING_LAST_PROGRESS = 50
/** First progress value inside the private home column. */
export const HOME_COLUMN_START = 51
/** Progress value of a finished token; home-column moves need an exact roll. */
export const HOME_PROGRESS = 56
/** Rolling this exits the yard and grants an extra roll. */
export const EXIT_ROLL = 6
/** Rolling this many sixes in a row forfeits the turn. */
export const SIX_STREAK_LIMIT = 3

/** Ring index of each seat's start square (also its yard exit). */
export const START_RING_INDEX = [0, 13, 26, 39]

/**
 * The 8 safe squares where captures never happen: the 4 start squares plus
 * the 4 star squares 8 ahead of each start.
 */
export const SAFE_RING_INDEXES = new Set([0, 8, 13, 21, 26, 34, 39, 47])

/** Star squares only (safe squares that are not a seat's start). */
export const STAR_RING_INDEXES = new Set([8, 21, 34, 47])

export interface GameState {
    /** Who controls each seat, in SEAT_COLORS order. Fixed for the match. */
    seats: SeatKind[]
    /** Progress of each token: tokens[seat][token], -1..56 (see header). */
    tokens: number[][]
    /** Seat whose turn it is. */
    current: number
    /** The pending roll awaiting a move choice, or null awaiting a roll. */
    dice: number | null
    /** Consecutive sixes rolled this turn (3 forfeits the turn). */
    sixStreak: number
    /** Seats in finishing order; play continues for placings after a win. */
    placings: number[]
    /** True once every placing is decided. */
    over: boolean
}

export interface MoveOption {
    /** Token index (0..3) within the current seat. */
    token: number
    /** Progress before the move (-1 when exiting the yard). */
    from: number
    /** Progress after the move. */
    to: number
    /** True when the landing square holds capturable opponent tokens. */
    captures: boolean
}

// ---------------------------------------------------------------------------
// Board topology (shared by the SVG board and the native renderers)
// ---------------------------------------------------------------------------

/** A cell on the classic 15x15 cross-shaped grid (col/row, 0-based). */
export interface Cell {
    col: number
    row: number
}

function buildRing(): Cell[] {
    const cells: Cell[] = []
    // Ring index 0 is red's start (1,6); the loop runs clockwise.
    for (let col = 1; col <= 5; col++) {
        cells.push({ col, row: 6 })
    }
    for (let row = 5; row >= 0; row--) {
        cells.push({ col: 6, row })
    }
    cells.push({ col: 7, row: 0 })
    for (let row = 0; row <= 5; row++) {
        cells.push({ col: 8, row })
    }
    for (let col = 9; col <= 14; col++) {
        cells.push({ col, row: 6 })
    }
    cells.push({ col: 14, row: 7 })
    for (let col = 14; col >= 9; col--) {
        cells.push({ col, row: 8 })
    }
    for (let row = 9; row <= 14; row++) {
        cells.push({ col: 8, row })
    }
    cells.push({ col: 7, row: 14 })
    for (let row = 14; row >= 9; row--) {
        cells.push({ col: 6, row })
    }
    for (let col = 5; col >= 0; col--) {
        cells.push({ col, row: 8 })
    }
    cells.push({ col: 0, row: 7 })
    cells.push({ col: 0, row: 6 })
    return cells
}

/** Grid cell of every ring index (52 entries; index 0 is red's start). */
export const RING_CELLS: Cell[] = buildRing()

/** Grid origin (top-left) of each seat's 6x6 yard. */
export const YARD_ORIGINS: Cell[] = [
    { col: 0, row: 0 },
    { col: 9, row: 0 },
    { col: 9, row: 9 },
    { col: 0, row: 9 },
]

/** The 5 home-column cells for a seat, ordered from ring exit toward center. */
export function homeColumnCells(seat: number): Cell[] {
    const columns: Cell[][] = [
        [1, 2, 3, 4, 5].map((col) => ({ col, row: 7 })),
        [1, 2, 3, 4, 5].map((row) => ({ col: 7, row })),
        [13, 12, 11, 10, 9].map((col) => ({ col, row: 7 })),
        [13, 12, 11, 10, 9].map((row) => ({ col: 7, row })),
    ]
    return columns[seat]
}

/** Resting spots (grid coords) for the 4 tokens inside a seat's yard. */
export function yardCells(seat: number): Cell[] {
    const origin = YARD_ORIGINS[seat]
    return [
        { col: origin.col + 1.5, row: origin.row + 1.5 },
        { col: origin.col + 3.5, row: origin.row + 1.5 },
        { col: origin.col + 1.5, row: origin.row + 3.5 },
        { col: origin.col + 3.5, row: origin.row + 3.5 },
    ]
}

/** Ring index a seat's token occupies at ring progress `progress` (0..50). */
export function ringIndexFor(seat: number, progress: number): number {
    return (START_RING_INDEX[seat] + progress) % RING_SIZE
}

// ---------------------------------------------------------------------------
// Turn state machine
// ---------------------------------------------------------------------------

/** Fresh match: all tokens in their yards, first active seat to roll. */
export function createGame(seats: SeatKind[]): GameState {
    return {
        seats: [...seats],
        tokens: seats.map(() => new Array<number>(TOKENS_PER_SEAT).fill(-1)),
        current: seats.findIndex((kind) => kind !== "off"),
        dice: null,
        sixStreak: 0,
        placings: [],
        over: false,
    }
}

/** True once every token of the seat has reached home. */
export function isSeatFinished(state: GameState, seat: number): boolean {
    return state.tokens[seat].every((progress) => progress === HOME_PROGRESS)
}

/** Seats that are in the game (not "off"), in play order. */
export function activeSeats(state: GameState): number[] {
    return state.seats.flatMap((kind, seat) => (kind === "off" ? [] : [seat]))
}

/**
 * True when an opponent token on the ring could reach `ringIndex` with a
 * single roll (1..6) without overshooting into its own home column. Used by
 * the bot to spot threats; tokens still in yards are ignored.
 */
export function isRingIndexThreatened(state: GameState, seat: number, ringIndex: number): boolean {
    for (let other = 0; other < SEAT_COUNT; other++) {
        if (other === seat || state.seats[other] === "off") {
            continue
        }
        for (const progress of state.tokens[other]) {
            if (progress < 0 || progress > RING_LAST_PROGRESS) {
                continue
            }
            const distance = (ringIndex - ringIndexFor(other, progress) + RING_SIZE) % RING_SIZE
            if (distance >= 1 && distance <= 6 && progress + distance <= RING_LAST_PROGRESS) {
                return true
            }
        }
    }
    return false
}

function capturableAt(state: GameState, seat: number, ringIndex: number): boolean {
    if (SAFE_RING_INDEXES.has(ringIndex)) {
        return false
    }
    for (let other = 0; other < SEAT_COUNT; other++) {
        if (other === seat) {
            continue
        }
        for (const progress of state.tokens[other]) {
            if (
                progress >= 0 &&
                progress <= RING_LAST_PROGRESS &&
                ringIndexFor(other, progress) === ringIndex
            ) {
                return true
            }
        }
    }
    return false
}

/** Every move the current seat may play with the pending roll (state.dice). */
export function legalMoves(state: GameState): MoveOption[] {
    if (state.dice === null || state.over) {
        return []
    }
    const dice = state.dice
    const seat = state.current
    const moves: MoveOption[] = []
    state.tokens[seat].forEach((from, token) => {
        if (from === HOME_PROGRESS) {
            return
        }
        if (from === -1) {
            // Exiting the yard requires a six; the start square is safe, so
            // an exit never captures.
            if (dice === EXIT_ROLL) {
                moves.push({ token, from, to: 0, captures: false })
            }
            return
        }
        const to = from + dice
        // Home needs an exact roll; overshooting keeps the token in place.
        if (to > HOME_PROGRESS) {
            return
        }
        const captures = to <= RING_LAST_PROGRESS && capturableAt(state, seat, ringIndexFor(seat, to))
        moves.push({ token, from, to, captures })
    })
    return moves
}

/** Advances to the next active, unfinished seat and awaits its roll. */
function advanceTurn(state: GameState): GameState {
    let next = state.current
    for (let step = 1; step <= SEAT_COUNT; step++) {
        const candidate = (state.current + step) % SEAT_COUNT
        if (state.seats[candidate] !== "off" && !isSeatFinished(state, candidate)) {
            next = candidate
            break
        }
    }
    return { ...state, current: next, dice: null, sixStreak: 0 }
}

/**
 * Applies a die roll for the current seat. The result either awaits a move
 * choice (dice set, same seat), grants a re-roll (six with no legal move:
 * dice null, same seat), or passes the turn (no legal move, or the
 * three-sixes forfeit: dice null, next seat).
 */
export function applyRoll(state: GameState, value: number): GameState {
    if (state.over || state.dice !== null) {
        return state
    }
    const sixStreak = value === EXIT_ROLL ? state.sixStreak + 1 : 0
    if (sixStreak >= SIX_STREAK_LIMIT) {
        // Third six in a row: the roll is void and the turn is forfeited.
        return advanceTurn(state)
    }
    const pending: GameState = { ...state, dice: value, sixStreak }
    if (legalMoves(pending).length === 0) {
        // A six still earns a re-roll even when nothing can move.
        if (value === EXIT_ROLL) {
            return { ...pending, dice: null }
        }
        return advanceTurn(pending)
    }
    return pending
}

/**
 * Plays one of the current legal moves (by token index), resolving captures,
 * finish detection, and the next turn. A six keeps the turn (extra roll);
 * anything else passes it. Pure — the input state is untouched.
 */
export function applyMove(state: GameState, token: number): GameState {
    const move = legalMoves(state).find((option) => option.token === token)
    if (!move) {
        return state
    }
    const seat = state.current
    const tokens = state.tokens.map((row) => [...row])
    tokens[seat][move.token] = move.to

    // Capture: landing on opponents outside the 8 safe squares sends every
    // opponent token on that square back to its yard.
    if (move.to <= RING_LAST_PROGRESS) {
        const ringIndex = ringIndexFor(seat, move.to)
        if (!SAFE_RING_INDEXES.has(ringIndex)) {
            for (let other = 0; other < SEAT_COUNT; other++) {
                if (other === seat) {
                    continue
                }
                tokens[other] = tokens[other].map((progress) =>
                    progress >= 0 &&
                    progress <= RING_LAST_PROGRESS &&
                    ringIndexFor(other, progress) === ringIndex
                        ? -1
                        : progress,
                )
            }
        }
    }

    let next: GameState = { ...state, tokens, dice: null }

    // Placings: a seat that just brought its last token home is recorded, and
    // when only one racer remains it takes the final placing and play ends.
    if (isSeatFinished(next, seat) && !next.placings.includes(seat)) {
        next = { ...next, placings: [...next.placings, seat] }
    }
    const remaining = activeSeats(next).filter((other) => !isSeatFinished(next, other))
    if (remaining.length <= 1) {
        return { ...next, placings: [...next.placings, ...remaining], over: true, sixStreak: 0 }
    }

    // A six grants an extra roll — unless the roller just finished.
    if (state.dice === EXIT_ROLL && !isSeatFinished(next, seat)) {
        return next
    }
    return advanceTurn(next)
}

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

const BOT_CAPTURE_SCORE = 1000
const BOT_ESCAPE_SCORE = 600
const BOT_EXIT_SCORE = 400
const BOT_FINISH_BONUS = 160
const BOT_SAFE_LANDING_BONUS = 90
const BOT_THREATENED_LANDING_PENALTY = 140
const BOT_RANDOM_JITTER = 45

/**
 * Heuristic bot: capture when possible, escape a threatened token, bring a
 * token out on a six, otherwise advance the leader while avoiding threatened
 * landing squares. `random` (0..1) adds a jitter so bots are not identical;
 * inject a fixed value for deterministic tests. Returns the token to move,
 * or null when there is no legal move.
 */
export function chooseBotMove(state: GameState, random: () => number): number | null {
    const moves = legalMoves(state)
    if (moves.length === 0) {
        return null
    }
    const seat = state.current
    let bestToken = moves[0].token
    let bestScore = -Infinity
    for (const move of moves) {
        // Advancing the most developed token is the baseline preference.
        let score = move.to
        if (move.captures) {
            score += BOT_CAPTURE_SCORE
        }
        if (
            move.from >= 0 &&
            move.from <= RING_LAST_PROGRESS &&
            !SAFE_RING_INDEXES.has(ringIndexFor(seat, move.from)) &&
            isRingIndexThreatened(state, seat, ringIndexFor(seat, move.from))
        ) {
            score += BOT_ESCAPE_SCORE
        }
        if (move.from === -1) {
            score += BOT_EXIT_SCORE
        }
        if (move.to === HOME_PROGRESS) {
            score += BOT_FINISH_BONUS
        }
        if (move.to <= RING_LAST_PROGRESS) {
            const landing = ringIndexFor(seat, move.to)
            if (SAFE_RING_INDEXES.has(landing)) {
                score += BOT_SAFE_LANDING_BONUS
            } else if (isRingIndexThreatened(state, seat, landing)) {
                score -= BOT_THREATENED_LANDING_PENALTY
            }
        }
        score += random() * BOT_RANDOM_JITTER
        if (score > bestScore) {
            bestScore = score
            bestToken = move.token
        }
    }
    return bestToken
}
