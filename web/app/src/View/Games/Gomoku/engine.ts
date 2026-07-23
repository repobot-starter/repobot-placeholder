// Pure Gomoku engine: 15x15 board representation, freestyle win detection
// (five or more in a row), draw detection, pattern scoring, and the three
// bot levels. No React, no DOM — everything here is a pure function over the
// board array, so it is easy to test and extend.
//
// The native ports (`ios/App/View/Games/Gomoku/GomokuEngine.swift` and
// `android/.../view/games/gomoku/GomokuEngine.kt`) mirror this file — keep
// PATTERN_SCORES, DEFENSE_WEIGHT, the candidate radius, and the bot policies
// in sync so every platform plays identically.

export const BOARD_SIZE = 15
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE

export type Stone = "black" | "white"

/** Cells are indexed 0-224 as `row * 15 + col`, row 0 at the top. */
export type Board = (Stone | null)[]

export type BotLevel = "easy" | "medium" | "hard"

/** The four line axes as [dRow, dCol]; the reverse of each is walked separately. */
const DIRECTIONS = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
] as const

/**
 * Heuristic value of a line reaching `count` stones with a given number of
 * open (empty) ends after placing on a cell. A five always wins, an open four
 * (both ends free) is unstoppable next turn, a closed four and an open three
 * each force a reply. Shared verbatim with the native engine ports.
 */
export const PATTERN_SCORES = {
    five: 1_000_000,
    openFour: 100_000,
    closedFour: 12_000,
    openThree: 8_000,
    closedThree: 600,
    openTwo: 400,
    closedTwo: 60,
    openOne: 20,
    closedOne: 4,
} as const

/**
 * Defense is worth slightly less than attack so a bot that can complete its
 * own five prefers that over blocking the opponent's.
 */
const DEFENSE_WEIGHT = 0.9

/** How far (Chebyshev distance) from existing stones the bots consider moves. */
const CANDIDATE_RADIUS = 2

/** How many top-ranked candidates the hard bot expands in its 2-ply search. */
const HARD_CANDIDATE_LIMIT = 12

export function rowOf(cell: number): number {
    return Math.floor(cell / BOARD_SIZE)
}

export function colOf(cell: number): number {
    return cell % BOARD_SIZE
}

export function cellAt(row: number, col: number): number {
    return row * BOARD_SIZE + col
}

export function opposite(stone: Stone): Stone {
    return stone === "black" ? "white" : "black"
}

export function emptyBoard(): Board {
    return new Array<Stone | null>(CELL_COUNT).fill(null)
}

export function isBoardFull(board: Board): boolean {
    return board.every((cell) => cell !== null)
}

function inBounds(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

/**
 * The completed run of five or more through the stone at `cell`, as sorted
 * cell indices, or null when that stone is not part of a five. Only lines
 * through `cell` are checked, so call it with the last move played.
 */
export function findWinLine(board: Board, cell: number): number[] | null {
    const stone = board[cell]
    if (!stone) {
        return null
    }
    for (const [dRow, dCol] of DIRECTIONS) {
        const line = [cell]
        for (const sign of [1, -1]) {
            let row = rowOf(cell) + dRow * sign
            let col = colOf(cell) + dCol * sign
            while (inBounds(row, col) && board[cellAt(row, col)] === stone) {
                line.push(cellAt(row, col))
                row += dRow * sign
                col += dCol * sign
            }
        }
        if (line.length >= 5) {
            return line.sort((a, b) => a - b)
        }
    }
    return null
}

interface Run {
    /** Contiguous same-color stones walking away from the cell. */
    count: number
    /** Whether the cell just past the run is empty (the line can still grow). */
    open: boolean
}

function runFrom(board: Board, cell: number, stone: Stone, dRow: number, dCol: number): Run {
    let row = rowOf(cell) + dRow
    let col = colOf(cell) + dCol
    let count = 0
    while (inBounds(row, col) && board[cellAt(row, col)] === stone) {
        count += 1
        row += dRow
        col += dCol
    }
    return { count, open: inBounds(row, col) && board[cellAt(row, col)] === null }
}

function lineScore(count: number, openEnds: number): number {
    if (count >= 5) {
        return PATTERN_SCORES.five
    }
    if (openEnds === 0) {
        return 0
    }
    switch (count) {
        case 4:
            return openEnds === 2 ? PATTERN_SCORES.openFour : PATTERN_SCORES.closedFour
        case 3:
            return openEnds === 2 ? PATTERN_SCORES.openThree : PATTERN_SCORES.closedThree
        case 2:
            return openEnds === 2 ? PATTERN_SCORES.openTwo : PATTERN_SCORES.closedTwo
        default:
            return openEnds === 2 ? PATTERN_SCORES.openOne : PATTERN_SCORES.closedOne
    }
}

/**
 * Pattern value of placing `stone` on the empty `cell`: the sum over the four
 * axes of the score of the line that placement would create. This is the
 * shared evaluator all three bot levels build on.
 */
export function cellScore(board: Board, cell: number, stone: Stone): number {
    let total = 0
    for (const [dRow, dCol] of DIRECTIONS) {
        const forward = runFrom(board, cell, stone, dRow, dCol)
        const backward = runFrom(board, cell, stone, -dRow, -dCol)
        total += lineScore(
            1 + forward.count + backward.count,
            (forward.open ? 1 : 0) + (backward.open ? 1 : 0),
        )
    }
    return total
}

/** True when placing `stone` on the empty `cell` makes five or more in a row. */
export function makesFive(board: Board, cell: number, stone: Stone): boolean {
    for (const [dRow, dCol] of DIRECTIONS) {
        const forward = runFrom(board, cell, stone, dRow, dCol)
        const backward = runFrom(board, cell, stone, -dRow, -dCol)
        if (1 + forward.count + backward.count >= 5) {
            return true
        }
    }
    return false
}

/**
 * Empty cells worth considering: everything within CANDIDATE_RADIUS of an
 * existing stone. Far-away cells cannot interact with any line, so pruning
 * them keeps every bot level fast. An empty board yields just the center.
 */
export function candidateCells(board: Board): number[] {
    const near = new Array<boolean>(CELL_COUNT).fill(false)
    let hasStone = false
    for (let cell = 0; cell < CELL_COUNT; cell++) {
        if (!board[cell]) {
            continue
        }
        hasStone = true
        const row = rowOf(cell)
        const col = colOf(cell)
        for (let dRow = -CANDIDATE_RADIUS; dRow <= CANDIDATE_RADIUS; dRow++) {
            for (let dCol = -CANDIDATE_RADIUS; dCol <= CANDIDATE_RADIUS; dCol++) {
                if (inBounds(row + dRow, col + dCol)) {
                    near[cellAt(row + dRow, col + dCol)] = true
                }
            }
        }
    }
    if (!hasStone) {
        return [cellAt(Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2))]
    }
    const candidates: number[] = []
    for (let cell = 0; cell < CELL_COUNT; cell++) {
        if (near[cell] && !board[cell]) {
            candidates.push(cell)
        }
    }
    return candidates
}

/** Every empty cell where `stone` would immediately complete five in a row. */
export function winningCells(board: Board, stone: Stone): number[] {
    return candidateCells(board).filter((cell) => makesFive(board, cell, stone))
}

function randomOf<T>(items: T[], random: () => number): T {
    return items[Math.floor(random() * items.length)]
}

/** Highest-scoring cells (all ties), so the caller can pick one at random. */
function bestCells(cells: number[], score: (cell: number) => number): number[] {
    let best: number[] = []
    let bestScore = -Infinity
    for (const cell of cells) {
        const value = score(cell)
        if (value > bestScore) {
            bestScore = value
            best = [cell]
        } else if (value === bestScore) {
            best.push(cell)
        }
    }
    return best
}

/** Attack + discounted defense: how much this cell is worth to `stone` right now. */
function combinedScore(board: Board, cell: number, stone: Stone): number {
    return cellScore(board, cell, stone) + DEFENSE_WEIGHT * cellScore(board, cell, opposite(stone))
}

// Easy: greedy on its own attack only — it builds its lines single-mindedly
// and never blocks yours (until its own five happens to be available).
function easyMove(board: Board, stone: Stone, random: () => number): number {
    const candidates = candidateCells(board)
    return randomOf(
        bestCells(candidates, (cell) => cellScore(board, cell, stone)),
        random,
    )
}

// Medium: full pattern scoring for attack and defense — it blocks open threes
// and fours because the opponent's would-be score at a cell counts too.
function mediumMove(board: Board, stone: Stone, random: () => number): number {
    const candidates = candidateCells(board)
    return randomOf(
        bestCells(candidates, (cell) => combinedScore(board, cell, stone)),
        random,
    )
}

// Hard: immediate win/block detection, then a 2-ply minimax over the top
// candidates — each of the bot's moves is charged with the opponent's best
// evaluator reply, so it avoids handing over double threats.
function hardMove(board: Board, stone: Stone, random: () => number): number {
    const wins = winningCells(board, stone)
    if (wins.length > 0) {
        return randomOf(wins, random)
    }
    const blocks = winningCells(board, opposite(stone))
    if (blocks.length > 0) {
        return randomOf(blocks, random)
    }

    const enemy = opposite(stone)
    const ranked = candidateCells(board)
        .map((cell) => ({ cell, score: combinedScore(board, cell, stone) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, HARD_CANDIDATE_LIMIT)

    const valueOf = new Map<number, number>()
    for (const { cell, score } of ranked) {
        const next = board.slice()
        next[cell] = stone
        let enemyBest = 0
        for (const reply of candidateCells(next)) {
            enemyBest = Math.max(enemyBest, combinedScore(next, reply, enemy))
        }
        valueOf.set(cell, score - DEFENSE_WEIGHT * enemyBest)
    }
    return randomOf(
        bestCells(
            ranked.map((entry) => entry.cell),
            (cell) => valueOf.get(cell) ?? -Infinity,
        ),
        random,
    )
}

/**
 * Picks the bot's cell for `stone` on the current board, or null when the
 * board is full. `random` is injectable so tests can be deterministic.
 */
export function findBotMove(
    board: Board,
    stone: Stone,
    level: BotLevel,
    random: () => number = Math.random,
): number | null {
    if (candidateCells(board).length === 0) {
        return null
    }
    switch (level) {
        case "easy":
            return easyMove(board, stone, random)
        case "medium":
            return mediumMove(board, stone, random)
        case "hard":
            return hardMove(board, stone, random)
    }
}
