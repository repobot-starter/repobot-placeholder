// Pure tawla (backgammon) engine: position representation, dice, legal
// move-sequence generation with the forced-move rules (play as many dice as
// possible; if only one can be played, play the higher), hitting blots to
// the bar, entering from the bar, exact-or-higher bearing off, win detection
// (single / gammon / backgammon), and the three-level heuristic bot.
//
// No React, no DOM — everything here is a pure function over Position, so it
// is easy to test and extend. The native ports (ios/App/View/Games/Tawla/
// TawlaEngine.swift and android/.../view/games/tawla/TawlaEngine.kt) mirror
// this file rule-for-rule and weight-for-weight; change them together.

export type Player = "white" | "black"

/** `Move.from` when a checker enters from the bar. */
export const BAR = -1
/** `Move.to` when a checker bears off the board. */
export const OFF = -2

export const CHECKERS_PER_PLAYER = 15
/** First to this many points wins the match (gammons count 2, backgammons 3). */
export const MATCH_TARGET = 5

/**
 * A position. `points[i]` is the signed checker count on board index `i`:
 * positive = white, negative = black. Indices run 0-23 where index 0 is
 * White's 1-point (the deepest point of White's home board) and index 23 is
 * White's 24-point. White races 23 -> 0 and bears off past index 0; Black
 * races 0 -> 23 and bears off past index 23. A player's own point number for
 * index `i` is `i + 1` for White and `24 - i` for Black.
 */
export interface Position {
    points: number[]
    bar: Record<Player, number>
    off: Record<Player, number>
}

/** One checker move with the die that paid for it. */
export interface Move {
    /** Board index, or `BAR` when entering from the bar. */
    from: number
    /** Board index, or `OFF` when bearing off. */
    to: number
    die: number
    /** True when the move lands on an enemy blot and sends it to the bar. */
    hit: boolean
}

/** A complete legal turn: a maximal move sequence and the position after it. */
export interface Turn {
    moves: Move[]
    result: Position
}

export type BotLevel = "easy" | "medium" | "hard"

export type ResultKind = "single" | "gammon" | "backgammon"

export interface GameResult {
    winner: Player
    /** Match points earned: 1 (single), 2 (gammon), or 3 (backgammon). */
    points: number
    kind: ResultKind
}

/** Uniform-[0,1) source, injectable so dice and bot noise are testable. */
export type Rng = () => number

/**
 * Heuristic weights shared by all bot levels — must stay in sync with the
 * `heuristic*` constants in TawlaEngine.swift and TawlaEngine.kt.
 */
export const HEURISTIC = {
    /** Per pip of race lead over the opponent (their pips minus ours). */
    pip: 1,
    /** Per checker already borne off (progress beyond the pip count). */
    off: 12,
    /** Per made point (two or more own checkers) anywhere on the board. */
    point: 4,
    /** Extra per made point inside the own home board (board strength). */
    homePoint: 6,
    /** Flat penalty per own blot, even when nothing can reach it yet. */
    blot: 2,
    /** Penalty per enemy checker a direct shot (1-6 pips) away from a blot. */
    blotShot: 3,
    /** Easy: amplitude of the random noise added to each candidate score. */
    easyNoise: 20,
    /** Hard: bonus per opponent checker on the bar (prioritized hitting). */
    hitBonus: 15,
    /** Hard: bonus per point of the longest prime beyond the first. */
    primeBonus: 5,
}

/** Safety valve for pathological double rolls; real positions stay far below. */
const SEQUENCE_CAP = 20000

export function opponent(player: Player): Player {
    return player === "white" ? "black" : "white"
}

/** Standard backgammon starting position. */
export function initialPosition(): Position {
    const points = new Array<number>(24).fill(0)
    // White: 2 on the 24-point, 5 on the 13-point, 3 on the 8-point, 5 on the 6-point.
    points[23] = 2
    points[12] = 5
    points[7] = 3
    points[5] = 5
    // Black mirrors White exactly.
    points[0] = -2
    points[11] = -5
    points[16] = -3
    points[18] = -5
    return { points, bar: { white: 0, black: 0 }, off: { white: 0, black: 0 } }
}

export function clonePosition(position: Position): Position {
    return {
        points: [...position.points],
        bar: { ...position.bar },
        off: { ...position.off },
    }
}

/** Number of `player`'s checkers on board index `index` (never negative). */
export function checkersAt(position: Position, player: Player, index: number): number {
    const signed = position.points[index]
    return player === "white" ? Math.max(0, signed) : Math.max(0, -signed)
}

/** True when `index` lies inside `player`'s home board. */
export function isHomeIndex(player: Player, index: number): boolean {
    return player === "white" ? index <= 5 : index >= 18
}

/** Board index a bar checker enters on for a given die. */
export function entryIndex(player: Player, die: number): number {
    return player === "white" ? 24 - die : die - 1
}

/**
 * Pip count: total dice pips `player` still needs to bear everything off.
 * Bar checkers count the full 25-pip trip.
 */
export function pipCount(position: Position, player: Player): number {
    let pips = position.bar[player] * 25
    for (let index = 0; index < 24; index++) {
        const count = checkersAt(position, player, index)
        pips += count * (player === "white" ? index + 1 : 24 - index)
    }
    return pips
}

/** True when every checker is in the home board (bear-off precondition). */
export function allInHome(position: Position, player: Player): boolean {
    if (position.bar[player] > 0) {
        return false
    }
    for (let index = 0; index < 24; index++) {
        if (checkersAt(position, player, index) > 0 && !isHomeIndex(player, index)) {
            return false
        }
    }
    return true
}

/** A point is blocked when the opponent holds it with two or more checkers. */
function isBlocked(position: Position, player: Player, index: number): boolean {
    return checkersAt(position, opponent(player), index) >= 2
}

/** Landing here hits when the opponent has exactly one checker (a blot). */
function landsOnBlot(position: Position, player: Player, index: number): boolean {
    return checkersAt(position, opponent(player), index) === 1
}

/**
 * Every legal single move for one die. Bar checkers must enter first; bearing
 * off requires all checkers home and follows the exact-or-higher rule (a die
 * larger than the point only bears off when no checker sits further back).
 */
export function legalSingleMoves(position: Position, player: Player, die: number): Move[] {
    const moves: Move[] = []

    if (position.bar[player] > 0) {
        const to = entryIndex(player, die)
        if (!isBlocked(position, player, to)) {
            moves.push({ from: BAR, to, die, hit: landsOnBlot(position, player, to) })
        }
        return moves
    }

    const canBearOff = allInHome(position, player)
    for (let from = 0; from < 24; from++) {
        if (checkersAt(position, player, from) === 0) {
            continue
        }
        const to = player === "white" ? from - die : from + die
        if (to >= 0 && to <= 23) {
            if (!isBlocked(position, player, to)) {
                moves.push({ from, to, die, hit: landsOnBlot(position, player, to) })
            }
        } else if (canBearOff) {
            // Past the edge: exact roll always bears off; a bigger die only
            // bears off the rearmost checker (none may sit further back).
            const exact = player === "white" ? to === -1 : to === 24
            const overshoot = player === "white" ? to < -1 : to > 24
            if (exact || (overshoot && !hasCheckerBehind(position, player, from))) {
                moves.push({ from, to: OFF, die, hit: false })
            }
        }
    }
    return moves
}

/** True when `player` has a checker further from bearing off than `from`. */
function hasCheckerBehind(position: Position, player: Player, from: number): boolean {
    if (player === "white") {
        for (let index = from + 1; index <= 5; index++) {
            if (checkersAt(position, player, index) > 0) {
                return true
            }
        }
    } else {
        for (let index = 18; index < from; index++) {
            if (checkersAt(position, player, index) > 0) {
                return true
            }
        }
    }
    return false
}

/** Applies one move and returns the new position. Pure — input is untouched. */
export function applyMove(position: Position, player: Player, move: Move): Position {
    const next = clonePosition(position)
    const sign = player === "white" ? 1 : -1

    if (move.from === BAR) {
        next.bar[player] -= 1
    } else {
        next.points[move.from] -= sign
    }

    if (move.to === OFF) {
        next.off[player] += 1
    } else {
        if (move.hit) {
            next.points[move.to] = 0
            next.bar[opponent(player)] += 1
        }
        next.points[move.to] += sign
    }
    return next
}

/** Replays a move sequence from a starting position (used for undo). */
export function positionAfter(position: Position, player: Player, moves: Move[]): Position {
    let current = position
    for (const move of moves) {
        current = applyMove(current, player, move)
    }
    return current
}

export function movesEqual(a: Move, b: Move): boolean {
    return a.from === b.from && a.to === b.to && a.die === b.die && a.hit === b.hit
}

function moveKey(move: Move): string {
    return `${move.from}>${move.to}#${move.die}`
}

/** Stable identity for a position, used to dedupe equivalent bot candidates. */
export function positionKey(position: Position): string {
    return (
        position.points.join(",") +
        `|${position.bar.white},${position.bar.black}` +
        `|${position.off.white},${position.off.black}`
    )
}

/**
 * All complete legal turns for a roll. Doubles play the die four times;
 * otherwise both die orders are explored. Only maximal sequences survive
 * (you must play as many dice as possible), and when only a single die can
 * be played the higher one is forced. Returns an empty array when the roll
 * is completely blocked (the turn is forfeited).
 */
export function legalTurns(position: Position, player: Player, dice: [number, number]): Turn[] {
    const isDoubles = dice[0] === dice[1]
    const orders: number[][] = isDoubles
        ? [[dice[0], dice[0], dice[0], dice[0]]]
        : [
              [dice[0], dice[1]],
              [dice[1], dice[0]],
          ]

    const sequences: Turn[] = []
    const seen = new Set<string>()
    let maxLength = 0

    const record = (moves: Move[], result: Position): void => {
        if (moves.length < maxLength || sequences.length >= SEQUENCE_CAP) {
            return
        }
        const key = moves.map(moveKey).join(",")
        if (seen.has(key)) {
            return
        }
        seen.add(key)
        maxLength = Math.max(maxLength, moves.length)
        sequences.push({ moves, result })
    }

    const walk = (current: Position, remaining: number[], played: Move[]): void => {
        if (remaining.length === 0) {
            record(played, current)
            return
        }
        const candidates = legalSingleMoves(current, player, remaining[0])
        if (candidates.length === 0) {
            record(played, current)
            return
        }
        const rest = remaining.slice(1)
        for (const move of candidates) {
            walk(applyMove(current, player, move), rest, [...played, move])
        }
    }

    for (const order of orders) {
        walk(position, order, [])
    }

    if (maxLength === 0) {
        return []
    }
    let best = sequences.filter((turn) => turn.moves.length === maxLength)
    if (maxLength === 1 && !isDoubles) {
        // Forced-die rule: when only one die can be played, the higher wins.
        const higher = Math.max(dice[0], dice[1])
        const higherOnly = best.filter((turn) => turn.moves[0].die === higher)
        if (higherOnly.length > 0) {
            best = higherOnly
        }
    }
    return best
}

/** Longest maximal turn length (0 when the roll is fully blocked). */
export function maxTurnLength(turns: Turn[]): number {
    return turns.length > 0 ? turns[0].moves.length : 0
}

/**
 * The distinct legal next moves after `prefix` has been played this turn.
 * Prefix-matching against the full turn list is what enforces the forced-move
 * rules move-by-move: a move is only offered if some maximal sequence starts
 * this way, so the player can never strand a playable die.
 */
export function nextMoves(turns: Turn[], prefix: Move[]): Move[] {
    const moves: Move[] = []
    for (const turn of turns) {
        if (turn.moves.length <= prefix.length) {
            continue
        }
        if (!prefix.every((move, index) => movesEqual(move, turn.moves[index]))) {
            continue
        }
        const candidate = turn.moves[prefix.length]
        if (!moves.some((move) => movesEqual(move, candidate))) {
            moves.push(candidate)
        }
    }
    return moves
}

/**
 * Terminal result of the position, or null while the game continues.
 * Gammon (2 points): the loser has borne off nothing. Backgammon (3 points):
 * additionally a losing checker sits on the bar or in the winner's home board.
 */
export function winResult(position: Position): GameResult | null {
    for (const winner of ["white", "black"] as Player[]) {
        if (position.off[winner] < CHECKERS_PER_PLAYER) {
            continue
        }
        const loser = opponent(winner)
        if (position.off[loser] > 0) {
            return { winner, points: 1, kind: "single" }
        }
        let inWinnerHome = position.bar[loser] > 0
        for (let index = 0; index < 24 && !inWinnerHome; index++) {
            if (isHomeIndex(winner, index) && checkersAt(position, loser, index) > 0) {
                inWinnerHome = true
            }
        }
        return inWinnerHome
            ? { winner, points: 3, kind: "backgammon" }
            : { winner, points: 2, kind: "gammon" }
    }
    return null
}

/**
 * Enemy checkers a direct shot (a single die, 1-6 pips) away from an own
 * blot on `index`, including enemy bar checkers that could enter onto it.
 * Indirect (two-die) shots are ignored — direct shots dominate the danger.
 */
export function directShots(position: Position, player: Player, index: number): number {
    const enemy = opponent(player)
    let shots = 0
    for (let distance = 1; distance <= 6; distance++) {
        // The enemy moves toward the blot from its own direction of travel.
        const from = player === "white" ? index - distance : index + distance
        if (from >= 0 && from <= 23) {
            shots += checkersAt(position, enemy, from)
        }
    }
    // Enemy bar checkers enter in this player's home board and can hit there.
    if (isHomeIndex(player, index)) {
        shots += position.bar[enemy]
    }
    return shots
}

/** Longest run of consecutive made points (a prime blocks enemy runners). */
export function longestPrime(position: Position, player: Player): number {
    let best = 0
    let run = 0
    for (let index = 0; index < 24; index++) {
        if (checkersAt(position, player, index) >= 2) {
            run += 1
            best = Math.max(best, run)
        } else {
            run = 0
        }
    }
    return best
}

/**
 * Static evaluation of a position for `player`; higher is better. Terms:
 * race lead in pips, bear-off progress, made points (home points extra),
 * and blots penalized by the enemy direct shots that bear on them.
 */
export function evaluate(position: Position, player: Player): number {
    const enemy = opponent(player)
    let score = (pipCount(position, enemy) - pipCount(position, player)) * HEURISTIC.pip
    score += position.off[player] * HEURISTIC.off
    for (let index = 0; index < 24; index++) {
        const count = checkersAt(position, player, index)
        if (count >= 2) {
            score += HEURISTIC.point
            if (isHomeIndex(player, index)) {
                score += HEURISTIC.homePoint
            }
        } else if (count === 1) {
            score -= HEURISTIC.blot + HEURISTIC.blotShot * directShots(position, player, index)
        }
    }
    return score
}

/**
 * Picks the bot's full turn for a roll, or null when the roll is blocked.
 * Every level enumerates all legal turns and scores the resulting positions
 * with `evaluate`; candidates are deduped by final position so permutations
 * of the same play are scored once.
 *
 * - easy: greedy on the heuristic plus per-candidate random noise.
 * - medium: pure greedy on the heuristic.
 * - hard: greedy plus prioritized hitting (opponent bar checkers) and
 *   priming (longest consecutive point run) bonuses.
 */
export function findBotTurn(
    position: Position,
    player: Player,
    dice: [number, number],
    level: BotLevel,
    rng: Rng = Math.random,
): Turn | null {
    const turns = legalTurns(position, player, dice)
    if (turns.length === 0) {
        return null
    }
    const seen = new Set<string>()
    let best: Turn | null = null
    let bestScore = -Infinity
    for (const turn of turns) {
        const key = positionKey(turn.result)
        if (seen.has(key)) {
            continue
        }
        seen.add(key)
        let score = evaluate(turn.result, player)
        if (level === "easy") {
            score += (rng() * 2 - 1) * HEURISTIC.easyNoise
        } else if (level === "hard") {
            score += turn.result.bar[opponent(player)] * HEURISTIC.hitBonus
            score += Math.max(0, longestPrime(turn.result, player) - 1) * HEURISTIC.primeBonus
        }
        if (score > bestScore) {
            bestScore = score
            best = turn
        }
    }
    return best
}

export function rollDie(rng: Rng = Math.random): number {
    return Math.floor(rng() * 6) + 1
}

/**
 * Opening roll-off: each player rolls one die, ties re-roll, and the higher
 * roller starts the game playing both dice as their first roll.
 */
export function rollOpening(rng: Rng = Math.random): {
    whiteDie: number
    blackDie: number
    starter: Player
} {
    let whiteDie = rollDie(rng)
    let blackDie = rollDie(rng)
    while (whiteDie === blackDie) {
        whiteDie = rollDie(rng)
        blackDie = rollDie(rng)
    }
    return { whiteDie, blackDie, starter: whiteDie > blackDie ? "white" : "black" }
}

/** The mover's own point number for a board index (1-24). */
export function pointNumber(player: Player, index: number): number {
    return player === "white" ? index + 1 : 24 - index
}

/** Classic notation for a move, e.g. "24/18", "bar/22", "6/off", "13/7*". */
export function formatMove(player: Player, move: Move): string {
    const from = move.from === BAR ? "bar" : String(pointNumber(player, move.from))
    const to = move.to === OFF ? "off" : String(pointNumber(player, move.to))
    return `${from}/${to}${move.hit ? "*" : ""}`
}
