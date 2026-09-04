// Pure carrom simulation: physics (circular rigid bodies, exponential
// friction, elastic collisions, pocket capture) plus the simplified official
// rules (turns, queen cover, striker fouls, board scoring, match to 25).
//
// No DOM, no React, no network — the engine is a plain state machine driven
// by step(dt) with an injected RNG, so it can be unit-tested headlessly and
// ported 1:1 to the native apps. The iOS (`CarromEngine.swift`) and Android
// (`CarromEngine.kt`) ports mirror every constant and rule in this file; if
// you change physics or rules here, change them there too.
//
// Coordinates are board units (600x600, y growing downward). Rendering
// scales the board to the device.

/** Board geometry — shared verbatim with the native ports. */
export const BOARD_SIZE = 600
export const COIN_RADIUS = 12
export const STRIKER_RADIUS = 16
export const POCKET_RADIUS = 24
export const POCKET_INSET = 30
/** Exponential velocity damping coefficient (per second): v *= e^(-k*dt). */
export const FRICTION = 1.8
export const RESTITUTION_BODY = 0.92
export const RESTITUTION_WALL = 0.78
/** Below this speed (units/s) a body snaps to rest. */
export const REST_SPEED = 6
export const COIN_MASS = 1
export const STRIKER_MASS = 1.5
export const MAX_SHOT_SPEED = 1500
export const MIN_SHOT_SPEED = 90
/** Distance from the player's board edge to their striker baseline. */
export const BASELINE_OFFSET = 90
/** The striker may slide along the baseline between these x margins. */
export const BASELINE_MARGIN = 110
/** Fixed physics timestep; step(dt) accumulates real time into these. */
export const PHYSICS_STEP = 1 / 240
export const COINS_PER_PLAYER = 9
export const QUEEN_POINTS = 3
export const MATCH_TARGET = 25

export type CarromMode = "bot" | "2p"
export type BotLevel = "easy" | "medium" | "hard"
export type PieceKind = "white" | "black" | "queen" | "striker"
export type CarromPhase = "aiming" | "rolling" | "boardOver" | "matchOver"
/** Player 0 flicks white from the bottom baseline; player 1 flicks black from the top. */
export type PlayerIndex = 0 | 1

/**
 * Bot aim/power gaussian error (radians / fraction of power) per level.
 * Lower stddev = better bot. Shared with the native ports.
 */
export const BOT_LEVELS: Record<BotLevel, { aimStdDev: number; powerStdDev: number }> = {
    easy: { aimStdDev: 0.1, powerStdDev: 0.14 },
    medium: { aimStdDev: 0.05, powerStdDev: 0.08 },
    hard: { aimStdDev: 0.018, powerStdDev: 0.04 },
}

export interface CarromPiece {
    id: number
    kind: PieceKind
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    mass: number
    /** false once the piece has been pocketed. */
    onBoard: boolean
}

/** What one settled strike amounted to, for turn messages and tests. */
export interface StrikeSummary {
    shooter: PlayerIndex
    /** The striker went into a pocket. */
    foul: boolean
    /** Shooter pockets their own color (or the queen) and shoots again. */
    keptTurn: boolean
    ownPocketed: number
    opponentPocketed: number
    /** Queen fate this strike, if it was involved at all. */
    queenOutcome: "covered" | "pending" | "returned" | null
}

/** Discrete things that happened during step(dt) — drive sounds and HUD. */
export type CarromEvent =
    | { type: "collision"; speed: number }
    | { type: "wall"; speed: number }
    | { type: "pocket"; piece: PieceKind }
    | { type: "strikeResolved"; summary: StrikeSummary }
    | { type: "boardOver"; winner: PlayerIndex; points: number }
    | { type: "matchOver"; winner: PlayerIndex }

export interface Point {
    x: number
    y: number
}

/** The four corner pocket centers, in board units. */
export const POCKETS: Point[] = [
    { x: POCKET_INSET, y: POCKET_INSET },
    { x: BOARD_SIZE - POCKET_INSET, y: POCKET_INSET },
    { x: POCKET_INSET, y: BOARD_SIZE - POCKET_INSET },
    { x: BOARD_SIZE - POCKET_INSET, y: BOARD_SIZE - POCKET_INSET },
]

export function colorOf(player: PlayerIndex): "white" | "black" {
    return player === 0 ? "white" : "black"
}

/** The y coordinate of a player's striker baseline. */
export function baselineY(player: PlayerIndex): number {
    return player === 0 ? BOARD_SIZE - BASELINE_OFFSET : BASELINE_OFFSET
}

const STRIKER_ID = 0
const QUEEN_ID = 1
const CENTER = BOARD_SIZE / 2
/** Coin spacing in the opening rack; slightly over one diameter so nothing overlaps. */
const RACK_SPACING = 24.6

/**
 * The carrom board simulation. Construct, then call `strike` and pump
 * `step(dt)` from an animation loop; consume the returned events.
 *
 * Randomness (only the bot's aim/power error) goes through the injected
 * `rng` so tests are fully deterministic.
 */
export class CarromEngine {
    pieces: CarromPiece[] = []
    phase: CarromPhase = "aiming"
    currentPlayer: PlayerIndex = 0
    matchScore: [number, number] = [0, 0]
    /** Who covered the queen this board, if anyone. */
    queenOwner: PlayerIndex | null = null
    /** Player who pocketed the queen and still owes a cover. */
    queenPendingBy: PlayerIndex | null = null
    lastSummary: StrikeSummary | null = null
    boardWinner: PlayerIndex | null = null
    matchWinner: PlayerIndex | null = null

    private rng: () => number
    private accumulator = 0
    /** Pieces pocketed since the current strike began. */
    private pocketedThisStrike: PieceKind[] = []
    private strikerPocketedThisStrike = false

    constructor(rng: () => number = Math.random) {
        this.rng = rng
        this.newMatch()
    }

    /** Full match reset: scores to zero, fresh board, player 0 breaks. */
    newMatch(): void {
        this.matchScore = [0, 0]
        this.matchWinner = null
        this.setupBoard(0)
    }

    /** Rack the next board after a board ends; the board winner breaks. */
    nextBoard(): void {
        if (this.phase !== "boardOver") {
            return
        }
        this.setupBoard(this.boardWinner ?? 0)
    }

    get striker(): CarromPiece {
        return this.pieces[STRIKER_ID]
    }

    get queen(): CarromPiece {
        return this.pieces[QUEEN_ID]
    }

    /** How many coins of a color have been pocketed so far this board. */
    pocketedCount(color: "white" | "black"): number {
        return this.pieces.filter((piece) => piece.kind === color && !piece.onBoard).length
    }

    /** Slide the striker along the current shooter's baseline (aiming only). */
    setStrikerX(x: number): void {
        if (this.phase !== "aiming") {
            return
        }
        this.striker.x = Math.max(BASELINE_MARGIN, Math.min(BOARD_SIZE - BASELINE_MARGIN, x))
        this.striker.y = baselineY(this.currentPlayer)
    }

    /**
     * Flick the striker: direction (any) plus power in [0, 1] mapped onto
     * [MIN_SHOT_SPEED, MAX_SHOT_SPEED]. Begins the rolling phase.
     */
    strike(dirX: number, dirY: number, power01: number): void {
        if (this.phase !== "aiming") {
            return
        }
        const length = Math.hypot(dirX, dirY)
        if (length < 1e-6) {
            return
        }
        const speed = MIN_SHOT_SPEED + Math.max(0, Math.min(1, power01)) * (MAX_SHOT_SPEED - MIN_SHOT_SPEED)
        this.striker.vx = (dirX / length) * speed
        this.striker.vy = (dirY / length) * speed
        this.pocketedThisStrike = []
        this.strikerPocketedThisStrike = false
        this.phase = "rolling"
    }

    /**
     * Advance the simulation by dt seconds of real time. Internally runs
     * fixed PHYSICS_STEP substeps (deterministic regardless of frame rate)
     * and returns every discrete event that occurred.
     */
    step(dt: number): CarromEvent[] {
        const events: CarromEvent[] = []
        this.accumulator += Math.min(dt, 0.1)
        while (this.accumulator >= PHYSICS_STEP) {
            this.accumulator -= PHYSICS_STEP
            this.substep(PHYSICS_STEP, events)
        }
        return events
    }

    /**
     * Plan and immediately play the bot's shot (call while phase is
     * "aiming" and it is the bot's turn). Aim error shrinks with level.
     */
    botStrike(level: BotLevel): void {
        if (this.phase !== "aiming") {
            return
        }
        const plan = this.planBotShot(level)
        this.setStrikerX(plan.x)
        this.strike(Math.cos(plan.angle), Math.sin(plan.angle), plan.power01)
    }

    /**
     * Aim guide for the UI: from the striker along (dirX, dirY) to the first
     * obstacle; if that obstacle is a wall, one reflected segment follows.
     * Returns 2 or 3 polyline points in board units.
     */
    computeAimGuide(dirX: number, dirY: number): Point[] {
        const length = Math.hypot(dirX, dirY)
        if (length < 1e-6) {
            return []
        }
        const origin = { x: this.striker.x, y: this.striker.y }
        const dir = { x: dirX / length, y: dirY / length }
        const first = this.castRay(origin, dir, STRIKER_RADIUS, STRIKER_ID)
        if (!first) {
            return []
        }
        const points = [origin, first.point]
        if (first.wallNormal) {
            const dot = dir.x * first.wallNormal.x + dir.y * first.wallNormal.y
            const reflected = {
                x: dir.x - 2 * dot * first.wallNormal.x,
                y: dir.y - 2 * dot * first.wallNormal.y,
            }
            const second = this.castRay(first.point, reflected, STRIKER_RADIUS, STRIKER_ID)
            if (second) {
                points.push(second.point)
            }
        }
        return points
    }

    // MARK: Test hooks (used by ports' unit tests; harmless in production)

    /** Teleport a piece — sets up collision/pocket scenarios in tests. */
    placePiece(id: number, x: number, y: number, vx = 0, vy = 0): void {
        const piece = this.pieces[id]
        piece.x = x
        piece.y = y
        piece.vx = vx
        piece.vy = vy
    }

    /** Mark a piece as already pocketed, as if by earlier play this board. */
    pocketForTesting(id: number): void {
        this.pieces[id].onBoard = false
    }

    // MARK: Board setup

    private setupBoard(breaker: PlayerIndex): void {
        this.pieces = []
        this.queenOwner = null
        this.queenPendingBy = null
        this.lastSummary = null
        this.boardWinner = null
        this.currentPlayer = breaker
        this.phase = "aiming"
        this.accumulator = 0
        this.pocketedThisStrike = []
        this.strikerPocketedThisStrike = false

        this.pieces.push({
            id: STRIKER_ID,
            kind: "striker",
            x: CENTER,
            y: baselineY(breaker),
            vx: 0,
            vy: 0,
            radius: STRIKER_RADIUS,
            mass: STRIKER_MASS,
            onBoard: true,
        })
        this.pieces.push(this.makeCoin(QUEEN_ID, "queen", CENTER, CENTER))

        // Classic rack: queen center, inner ring of 6 (alternating, 3+3),
        // outer ring of 12 (alternating, 6+6) → 9 white + 9 black.
        let id = 2
        for (let i = 0; i < 6; i++) {
            const angle = -Math.PI / 2 + (i * Math.PI) / 3
            const kind = i % 2 === 0 ? "white" : "black"
            this.pieces.push(
                this.makeCoin(
                    id++,
                    kind,
                    CENTER + Math.cos(angle) * RACK_SPACING,
                    CENTER + Math.sin(angle) * RACK_SPACING,
                ),
            )
        }
        for (let i = 0; i < 12; i++) {
            const angle = -Math.PI / 2 + Math.PI / 12 + (i * Math.PI) / 6
            const kind = i % 2 === 0 ? "black" : "white"
            this.pieces.push(
                this.makeCoin(
                    id++,
                    kind,
                    CENTER + Math.cos(angle) * RACK_SPACING * 2,
                    CENTER + Math.sin(angle) * RACK_SPACING * 2,
                ),
            )
        }
    }

    private makeCoin(id: number, kind: PieceKind, x: number, y: number): CarromPiece {
        return { id, kind, x, y, vx: 0, vy: 0, radius: COIN_RADIUS, mass: COIN_MASS, onBoard: true }
    }

    // MARK: Physics

    private substep(h: number, events: CarromEvent[]): void {
        const onBoard = this.pieces.filter((piece) => piece.onBoard)

        // Integrate + exponential friction; snap to rest below REST_SPEED.
        const damping = Math.exp(-FRICTION * h)
        for (const piece of onBoard) {
            piece.x += piece.vx * h
            piece.y += piece.vy * h
            piece.vx *= damping
            piece.vy *= damping
            if (Math.hypot(piece.vx, piece.vy) < REST_SPEED) {
                piece.vx = 0
                piece.vy = 0
            }
        }

        // Elastic circle-circle collisions with positional correction.
        for (let i = 0; i < onBoard.length; i++) {
            for (let j = i + 1; j < onBoard.length; j++) {
                this.collide(onBoard[i], onBoard[j], events)
            }
        }

        // Walls (perfectly axis-aligned, energy scaled by RESTITUTION_WALL).
        for (const piece of onBoard) {
            const r = piece.radius
            if (piece.x < r) {
                piece.x = r
                if (piece.vx < 0) {
                    events.push({ type: "wall", speed: Math.abs(piece.vx) })
                    piece.vx = -piece.vx * RESTITUTION_WALL
                }
            } else if (piece.x > BOARD_SIZE - r) {
                piece.x = BOARD_SIZE - r
                if (piece.vx > 0) {
                    events.push({ type: "wall", speed: piece.vx })
                    piece.vx = -piece.vx * RESTITUTION_WALL
                }
            }
            if (piece.y < r) {
                piece.y = r
                if (piece.vy < 0) {
                    events.push({ type: "wall", speed: Math.abs(piece.vy) })
                    piece.vy = -piece.vy * RESTITUTION_WALL
                }
            } else if (piece.y > BOARD_SIZE - r) {
                piece.y = BOARD_SIZE - r
                if (piece.vy > 0) {
                    events.push({ type: "wall", speed: piece.vy })
                    piece.vy = -piece.vy * RESTITUTION_WALL
                }
            }
        }

        // Pocket capture: a piece whose center enters a pocket circle drops.
        for (const piece of onBoard) {
            if (!piece.onBoard) {
                continue
            }
            for (const pocket of POCKETS) {
                if (Math.hypot(piece.x - pocket.x, piece.y - pocket.y) < POCKET_RADIUS) {
                    piece.onBoard = false
                    piece.vx = 0
                    piece.vy = 0
                    if (piece.kind === "striker") {
                        this.strikerPocketedThisStrike = true
                    } else {
                        this.pocketedThisStrike.push(piece.kind)
                    }
                    events.push({ type: "pocket", piece: piece.kind })
                    break
                }
            }
        }

        // A strike is over once every remaining body is at rest.
        if (this.phase === "rolling") {
            const settled = this.pieces.every((piece) => !piece.onBoard || (piece.vx === 0 && piece.vy === 0))
            if (settled) {
                this.resolveStrike(events)
            }
        }
    }

    private collide(a: CarromPiece, b: CarromPiece, events: CarromEvent[]): void {
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy)
        const minDist = a.radius + b.radius
        if (dist >= minDist || dist < 1e-9) {
            return
        }
        const nx = dx / dist
        const ny = dy / dist
        const invA = 1 / a.mass
        const invB = 1 / b.mass
        const invTotal = invA + invB

        // Separate the overlap in proportion to inverse mass.
        const overlap = minDist - dist
        a.x -= nx * overlap * (invA / invTotal)
        a.y -= ny * overlap * (invA / invTotal)
        b.x += nx * overlap * (invB / invTotal)
        b.y += ny * overlap * (invB / invTotal)

        // Impulse along the normal (bodies are frictionless disks).
        const relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
        if (relVel >= 0) {
            return
        }
        const impulse = (-(1 + RESTITUTION_BODY) * relVel) / invTotal
        a.vx -= impulse * invA * nx
        a.vy -= impulse * invA * ny
        b.vx += impulse * invB * nx
        b.vy += impulse * invB * ny
        events.push({ type: "collision", speed: Math.abs(relVel) })
    }

    // MARK: Rules

    private resolveStrike(events: CarromEvent[]): void {
        const shooter = this.currentPlayer
        const own = colorOf(shooter)
        const opponent = colorOf((1 - shooter) as PlayerIndex)
        const ownPocketed = this.pocketedThisStrike.filter((kind) => kind === own).length
        const opponentPocketed = this.pocketedThisStrike.filter((kind) => kind === opponent).length
        const queenPocketed = this.pocketedThisStrike.includes("queen")
        const foul = this.strikerPocketedThisStrike

        let queenOutcome: StrikeSummary["queenOutcome"] = null
        let keptTurn = false

        if (foul) {
            // Foul: one of the shooter's pocketed coins returns to center,
            // any queen involvement is undone, and the turn passes.
            this.returnCoinToBoard(own)
            if (queenPocketed || this.queenPendingBy === shooter) {
                this.respotQueen()
                this.queenPendingBy = null
                queenOutcome = "returned"
            }
        } else if (queenPocketed) {
            if (ownPocketed > 0) {
                this.queenOwner = shooter
                queenOutcome = "covered"
            } else {
                // Cover owed on the shooter's next strike.
                this.queenPendingBy = shooter
                queenOutcome = "pending"
            }
            // Taking the queen always earns another strike (needed to cover).
            keptTurn = true
        } else if (this.queenPendingBy === shooter) {
            if (ownPocketed > 0) {
                this.queenOwner = shooter
                queenOutcome = "covered"
            } else {
                this.respotQueen()
                queenOutcome = "returned"
            }
            this.queenPendingBy = null
            keptTurn = ownPocketed > 0
        } else {
            keptTurn = ownPocketed > 0
        }

        const summary: StrikeSummary = {
            shooter,
            foul,
            keptTurn: keptTurn && !foul,
            ownPocketed,
            opponentPocketed,
            queenOutcome,
        }
        this.lastSummary = summary
        events.push({ type: "strikeResolved", summary })

        // Win check for both players (a strike can clear either color).
        for (const player of [shooter, (1 - shooter) as PlayerIndex]) {
            if (this.pocketedCount(colorOf(player)) === COINS_PER_PLAYER) {
                // A pending queen at the moment of clearing counts as uncovered.
                if (this.queenPendingBy === player) {
                    this.respotQueen()
                    this.queenPendingBy = null
                }
                this.endBoard(player, events)
                return
            }
        }

        if (!summary.keptTurn) {
            this.currentPlayer = (1 - shooter) as PlayerIndex
        }
        this.respotStriker()
        this.phase = "aiming"
        this.pocketedThisStrike = []
        this.strikerPocketedThisStrike = false
    }

    private endBoard(winner: PlayerIndex, events: CarromEvent[]): void {
        const loserColor = colorOf((1 - winner) as PlayerIndex)
        const remaining = COINS_PER_PLAYER - this.pocketedCount(loserColor)
        const points = remaining + (this.queenOwner === winner ? QUEEN_POINTS : 0)
        this.matchScore[winner] += points
        this.boardWinner = winner
        events.push({ type: "boardOver", winner, points })
        if (this.matchScore[winner] >= MATCH_TARGET) {
            this.matchWinner = winner
            this.phase = "matchOver"
            events.push({ type: "matchOver", winner })
        } else {
            this.phase = "boardOver"
        }
    }

    /** Foul penalty: put one of the shooter's pocketed coins back near center. */
    private returnCoinToBoard(color: "white" | "black"): void {
        const coin = this.pieces.find((piece) => piece.kind === color && !piece.onBoard)
        if (!coin) {
            return
        }
        const spot = this.findFreeSpot()
        coin.x = spot.x
        coin.y = spot.y
        coin.vx = 0
        coin.vy = 0
        coin.onBoard = true
    }

    private respotQueen(): void {
        const spot = this.findFreeSpot()
        this.queen.x = spot.x
        this.queen.y = spot.y
        this.queen.vx = 0
        this.queen.vy = 0
        this.queen.onBoard = true
    }

    private respotStriker(): void {
        this.striker.x = CENTER
        this.striker.y = baselineY(this.currentPlayer)
        this.striker.vx = 0
        this.striker.vy = 0
        this.striker.onBoard = true
    }

    /** Center if free, else deterministic concentric-ring search outward. */
    private findFreeSpot(): Point {
        const isFree = (x: number, y: number): boolean =>
            this.pieces.every(
                (piece) =>
                    !piece.onBoard || Math.hypot(piece.x - x, piece.y - y) > piece.radius + COIN_RADIUS + 1,
            )
        if (isFree(CENTER, CENTER)) {
            return { x: CENTER, y: CENTER }
        }
        for (let ring = 1; ring <= 8; ring++) {
            const radius = RACK_SPACING * ring
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI) / 6
                const x = CENTER + Math.cos(angle) * radius
                const y = CENTER + Math.sin(angle) * radius
                if (isFree(x, y)) {
                    return { x, y }
                }
            }
        }
        return { x: CENTER, y: CENTER }
    }

    // MARK: Bot

    /**
     * Pick the best (target coin, pocket, baseline position) by simple
     * line-of-sight scoring, then perturb angle and power by the level's
     * gaussian error. Falls back to a firm nudge at the nearest own coin
     * when nothing is cleanly makeable.
     */
    private planBotShot(level: BotLevel): { x: number; angle: number; power01: number } {
        const shooter = this.currentPlayer
        const own = colorOf(shooter)
        const baseY = baselineY(shooter)
        const candidates = this.pieces.filter(
            (piece) => piece.onBoard && (piece.kind === own || piece.kind === "queen"),
        )
        const { aimStdDev, powerStdDev } = BOT_LEVELS[level]

        let best: { score: number; x: number; angle: number; travel: number } | null = null
        for (const coin of candidates) {
            for (const pocket of POCKETS) {
                const toPocketX = pocket.x - coin.x
                const toPocketY = pocket.y - coin.y
                const pocketDist = Math.hypot(toPocketX, toPocketY)
                if (pocketDist < 1e-6) {
                    continue
                }
                const px = toPocketX / pocketDist
                const py = toPocketY / pocketDist
                // Ghost position: where the striker's center must be at
                // impact to knock the coin straight at the pocket.
                const ghostX = coin.x - px * (STRIKER_RADIUS + coin.radius)
                const ghostY = coin.y - py * (STRIKER_RADIUS + coin.radius)
                if (
                    this.pathBlocked(coin.x, coin.y, pocket.x, pocket.y, coin.radius - 2, [
                        coin.id,
                        STRIKER_ID,
                    ])
                ) {
                    continue
                }
                for (let sample = 0; sample <= 14; sample++) {
                    const x = BASELINE_MARGIN + ((BOARD_SIZE - 2 * BASELINE_MARGIN) * sample) / 14
                    const shotX = ghostX - x
                    const shotY = ghostY - baseY
                    const shotDist = Math.hypot(shotX, shotY)
                    if (shotDist < STRIKER_RADIUS) {
                        continue
                    }
                    // Alignment: the striker must push the coin pocketward.
                    const align = (shotX / shotDist) * px + (shotY / shotDist) * py
                    if (align < 0.3) {
                        continue
                    }
                    if (
                        this.pathBlocked(x, baseY, ghostX, ghostY, STRIKER_RADIUS - 1, [coin.id, STRIKER_ID])
                    ) {
                        continue
                    }
                    const travel = shotDist + pocketDist
                    const score =
                        align * 2 -
                        travel / (BOARD_SIZE * 2) +
                        (coin.kind === "queen" && this.pocketedCount(own) > 0 ? 0.3 : 0)
                    if (!best || score > best.score) {
                        best = { score, x, angle: Math.atan2(shotY, shotX), travel }
                    }
                }
            }
        }

        if (best) {
            const angle = best.angle + this.gaussian() * aimStdDev
            const power01 = Math.max(
                0.25,
                Math.min(1, (260 + best.travel * 1.9) / MAX_SHOT_SPEED + this.gaussian() * powerStdDev),
            )
            return { x: best.x, angle, power01 }
        }

        // Fallback: smash toward the nearest candidate (or board center).
        const target = candidates.reduce<CarromPiece | null>((nearest, coin) => {
            if (!nearest) {
                return coin
            }
            const dNearest = Math.hypot(nearest.x - CENTER, nearest.y - baseY)
            const dCoin = Math.hypot(coin.x - CENTER, coin.y - baseY)
            return dCoin < dNearest ? coin : nearest
        }, null)
        const tx = target ? target.x : CENTER
        const ty = target ? target.y : CENTER
        const angle = Math.atan2(ty - baseY, tx - CENTER) + this.gaussian() * aimStdDev
        return { x: CENTER, angle, power01: 0.7 }
    }

    /** Segment sweep test: does a disk of `radius` moving a→b hit any piece? */
    private pathBlocked(
        ax: number,
        ay: number,
        bx: number,
        by: number,
        radius: number,
        excludeIds: number[],
    ): boolean {
        const abx = bx - ax
        const aby = by - ay
        const lengthSq = abx * abx + aby * aby
        for (const piece of this.pieces) {
            if (!piece.onBoard || excludeIds.includes(piece.id)) {
                continue
            }
            const t =
                lengthSq === 0
                    ? 0
                    : Math.max(0, Math.min(1, ((piece.x - ax) * abx + (piece.y - ay) * aby) / lengthSq))
            const cx = ax + abx * t
            const cy = ay + aby * t
            if (Math.hypot(piece.x - cx, piece.y - cy) < radius + piece.radius) {
                return true
            }
        }
        return false
    }

    /** Standard normal via Box-Muller on the injected RNG (two draws). */
    private gaussian(): number {
        const u1 = 1 - this.rng()
        const u2 = this.rng()
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    }

    // MARK: Ray casting (aim guide)

    private castRay(
        origin: Point,
        dir: Point,
        radius: number,
        excludeId: number,
    ): { point: Point; wallNormal: Point | null } | null {
        let bestT = Infinity
        let wallNormal: Point | null = null

        // Walls, inset by the moving disk's radius.
        const walls: Array<{ t: number; normal: Point }> = []
        if (dir.x < 0) {
            walls.push({ t: (radius - origin.x) / dir.x, normal: { x: 1, y: 0 } })
        }
        if (dir.x > 0) {
            walls.push({ t: (BOARD_SIZE - radius - origin.x) / dir.x, normal: { x: -1, y: 0 } })
        }
        if (dir.y < 0) {
            walls.push({ t: (radius - origin.y) / dir.y, normal: { x: 0, y: 1 } })
        }
        if (dir.y > 0) {
            walls.push({ t: (BOARD_SIZE - radius - origin.y) / dir.y, normal: { x: 0, y: -1 } })
        }
        for (const wall of walls) {
            if (wall.t > 1e-6 && wall.t < bestT) {
                bestT = wall.t
                wallNormal = wall.normal
            }
        }

        // Pieces: ray vs circle grown by the disk radius (Minkowski sum).
        for (const piece of this.pieces) {
            if (!piece.onBoard || piece.id === excludeId) {
                continue
            }
            const r = radius + piece.radius
            const ox = origin.x - piece.x
            const oy = origin.y - piece.y
            const b = ox * dir.x + oy * dir.y
            const c = ox * ox + oy * oy - r * r
            const disc = b * b - c
            if (disc < 0) {
                continue
            }
            const t = -b - Math.sqrt(disc)
            if (t > 1e-6 && t < bestT) {
                bestT = t
                wallNormal = null
            }
        }

        if (!Number.isFinite(bestT)) {
            return null
        }
        return {
            point: { x: origin.x + dir.x * bestT, y: origin.y + dir.y * bestT },
            wallNormal,
        }
    }
}
