// Pure ChimneyBot engine: a night-time rooftop runner. The runner sprints
// across an endless street of row houses, jumping house by house. Clear the
// gap and the chimney and the run continues; land IN a chimney and you slide
// down onto the family's dinner stove — you get cooked. Smack into a chimney
// or miss a roof and you fall to the street.
//
// No React, no DOM — the engine is a plain state machine driven by
// `step(dt)`, so it is easy to test and extend. The native ports
// (`ios/App/View/Games/Chimney/ChimneyEngine.swift` and
// `android/.../view/games/chimney/ChimneyEngine.kt`) mirror this file — keep
// the constants, the RNG call order in `pushHouse` (width, gap, roof rise,
// chimney position), and the collision rules in sync so every platform
// plays identically.
//
// Randomness (house width, gap, roof height, chimney spot) goes through an
// injected `random` closure so tests can pin every roll.

/** Field units; the view scales the field to its canvas. */
export const FIELD_WIDTH = 720
export const FIELD_HEIGHT = 420

/** The runner's fixed screen x; the world scrolls, the runner does not. */
export const PLAYER_X = 168
export const PLAYER_WIDTH = 26
export const PLAYER_HEIGHT = 34

/** Ground speed at the first rooftop (units/s)… */
export const RUN_SPEED_START = 180
/** …the ceiling it ramps to… */
export const RUN_SPEED_MAX = 360
/** …and the ramp per second of running — the difficulty curve. */
export const RUN_ACCELERATION = 4.5

export const GRAVITY = 1500
export const JUMP_VELOCITY = -600
/**
 * Releasing jump early multiplies any remaining upward velocity by this, so
 * a tap hops and a hold soars.
 */
export const JUMP_CUT_FACTOR = 0.45
/** Grace window to jump after running off a roof edge (seconds). */
export const COYOTE_TIME = 0.09
/** A jump pressed this long before landing still fires on touchdown. */
export const JUMP_BUFFER = 0.12

/**
 * House geometry is generated in SECONDS of travel at the current run speed,
 * not fixed units: jump airtime is constant (gravity does not ramp), so a
 * gap that takes 0.5s to cross is equally hard at every speed. This keeps
 * the street fair forever while the world visually rushes ever faster.
 */
export const HOUSE_SECONDS_MIN = 0.95
export const HOUSE_SECONDS_MAX = 1.45
/** Tap-hop airtime is ~0.36s and a full-hold jump ~0.8s; gaps sit between. */
export const GAP_SECONDS_MIN = 0.28
export const GAP_SECONDS_MAX = 0.52
/** Roof y band (down is +y): roofs step up/down between these levels. */
export const ROOF_Y_MIN = 200
export const ROOF_Y_MAX = 300
/** Biggest upward step between consecutive roofs (keeps every jump makeable). */
export const ROOF_RISE_MAX = 40

export const CHIMNEY_WIDTH = 36
export const CHIMNEY_HEIGHT = 30
/** Brick lip on each side of the opening. */
export const CHIMNEY_LIP = 5
export const CHIMNEY_OPENING = CHIMNEY_WIDTH - CHIMNEY_LIP * 2
/**
 * Chimney keeps this margin (in seconds of travel) from the house edges, so
 * a landing arc always leaves room to touch down before the bricks and set
 * up the next jump — at any speed.
 */
export const CHIMNEY_MARGIN_SECONDS = 0.35
/** The first houses of a run are chimney-free so the opening is a warm-up. */
export const SAFE_HOUSES = 3

export interface House {
    /** Left edge in world units. */
    x: number
    width: number
    /** Roof line y (down is +y). */
    roofY: number
    /** Chimney left edge relative to the house's left, or null (warm-up). */
    chimneyOffset: number | null
    /** Sequential index; index 0 is the first house of the run. */
    index: number
    /** Whether this house has paid its "cleared" score. */
    cleared: boolean
}

export type ChimneyEventKind = "hop" | "cooked" | "fell" | "bonked"

export interface ChimneyEvent {
    kind: ChimneyEventKind
    /** Houses cleared so far (hop) or the final score (terminal events). */
    value: number
}

/**
 * The simulation. Jump is press/release (`pressJump`/`releaseJump`) so a tap
 * hops and a hold clears the wide gaps — the native twin of a held key.
 */
export class ChimneyEngine {
    houses: House[] = []
    /** World-space x of the runner's left edge (the camera follows it). */
    playerWorldX = 0
    /** Runner top y. */
    playerY = 0
    /** Vertical velocity (down is +). */
    velocityY = 0
    speed = RUN_SPEED_START
    housesCleared = 0
    isOver = false
    /** How the run ended; null while running. */
    ending: "cooked" | "fell" | "bonked" | null = null
    /** Engine clock in seconds. */
    elapsed = 0

    private isOnRoof = true
    private coyoteRemaining = COYOTE_TIME
    private jumpBufferRemaining = 0
    private isJumpHeld = false
    /** World x where the most recently generated house ends (next spawn x). */
    private frontier = 0
    private nextHouseIndex = 0
    private readonly random: () => number

    constructor(random: () => number = Math.random) {
        this.random = random
    }

    get score(): number {
        return this.housesCleared
    }

    newGame(): void {
        this.houses = []
        this.frontier = 0
        this.nextHouseIndex = 0
        this.speed = RUN_SPEED_START
        this.housesCleared = 0
        this.isOver = false
        this.ending = null
        this.elapsed = 0
        this.velocityY = 0
        this.isOnRoof = true
        this.coyoteRemaining = COYOTE_TIME
        this.jumpBufferRemaining = 0
        this.isJumpHeld = false

        // The opening house starts under the runner's feet with no gap
        // before it, so every run begins mid-stride on a safe roof.
        this.pushHouse(true)
        this.playerWorldX = this.houses[0]!.x + 40
        this.playerY = this.houses[0]!.roofY - PLAYER_HEIGHT
        this.ensureHouses()
    }

    pressJump(): void {
        if (this.isOver) {
            return
        }
        this.isJumpHeld = true
        if (this.isOnRoof || this.coyoteRemaining > 0) {
            this.velocityY = JUMP_VELOCITY
            this.isOnRoof = false
            this.coyoteRemaining = 0
        } else {
            this.jumpBufferRemaining = JUMP_BUFFER
        }
    }

    releaseJump(): void {
        this.isJumpHeld = false
        if (this.velocityY < 0) {
            this.velocityY *= JUMP_CUT_FACTOR
        }
    }

    /**
     * Advance the simulation: ramp the run speed, move the runner, apply
     * gravity, land on roofs, detect the three endings (cooked in a chimney,
     * bonked on a chimney wall, fell in a gap), and keep the street
     * generated ahead of the camera.
     */
    step(dt: number): ChimneyEvent[] {
        if (this.isOver) {
            return []
        }
        const events: ChimneyEvent[] = []
        this.elapsed += dt
        this.speed = Math.min(RUN_SPEED_MAX, this.speed + RUN_ACCELERATION * dt)

        const previousFeet = this.playerY + PLAYER_HEIGHT
        const previousWorldX = this.playerWorldX
        this.playerWorldX += this.speed * dt
        this.velocityY += GRAVITY * dt
        this.playerY += this.velocityY * dt

        const feet = this.playerY + PLAYER_HEIGHT

        // Running into a taller facade: the wall stops the runner, who then
        // slides down the bricks into the alley (gravity finishes the run).
        const wall = this.houses.find(
            (candidate) =>
                previousWorldX + PLAYER_WIDTH <= candidate.x &&
                this.playerWorldX + PLAYER_WIDTH > candidate.x &&
                feet > candidate.roofY + 4,
        )
        if (wall) {
            this.playerWorldX = wall.x - PLAYER_WIDTH
        }

        const left = this.playerWorldX
        const right = this.playerWorldX + PLAYER_WIDTH
        const centerX = left + PLAYER_WIDTH / 2
        const house = this.houseUnder(left, right)

        // Chimney checks come first: the chimney owns its slice of the roof.
        if (house && house.chimneyOffset !== null) {
            const chimneyLeft = house.x + house.chimneyOffset
            const chimneyRight = chimneyLeft + CHIMNEY_WIDTH
            const chimneyTop = house.roofY - CHIMNEY_HEIGHT
            const openingLeft = chimneyLeft + CHIMNEY_LIP
            const openingRight = chimneyRight - CHIMNEY_LIP
            const overlapsChimney = right > chimneyLeft && left < chimneyRight

            if (this.velocityY > 0 && previousFeet <= chimneyTop && feet >= chimneyTop && overlapsChimney) {
                if (centerX >= openingLeft && centerX <= openingRight) {
                    // Cooked: dropped straight down the flue, onto the stove.
                    this.isOver = true
                    this.ending = "cooked"
                    events.push({ kind: "cooked", value: this.score })
                    return events
                }
                // Caught the brick rim: stand on the chimney like a mini
                // roof. Still counts as making the house.
                this.playerY = chimneyTop - PLAYER_HEIGHT
                this.velocityY = 0
                this.isOnRoof = true
                this.coyoteRemaining = COYOTE_TIME
                if (!house.cleared && house.index > 0) {
                    house.cleared = true
                    this.housesCleared += 1
                    events.push({ kind: "hop", value: this.housesCleared })
                }
                this.ensureHouses()
                return events
            }

            // Bonked: running face-first into the brick side while below the
            // chimney's rim. The runner drops where they stand.
            if (
                previousWorldX + PLAYER_WIDTH <= chimneyLeft &&
                right > chimneyLeft &&
                feet > chimneyTop + 4
            ) {
                this.isOver = true
                this.ending = "bonked"
                events.push({ kind: "bonked", value: this.score })
                return events
            }
        }

        // Landing: falling onto (or running along) a roof snaps the feet to
        // the roof line. Only the roof the feet actually crossed counts.
        if (house && this.velocityY >= 0 && previousFeet <= house.roofY && feet >= house.roofY) {
            this.playerY = house.roofY - PLAYER_HEIGHT
            this.velocityY = 0
            this.isOnRoof = true
            this.coyoteRemaining = COYOTE_TIME
            if (this.jumpBufferRemaining > 0) {
                this.jumpBufferRemaining = 0
                this.velocityY = JUMP_VELOCITY
                this.isOnRoof = false
                if (!this.isJumpHeld) {
                    this.velocityY *= JUMP_CUT_FACTOR
                }
            }
            if (!house.cleared && house.index > 0) {
                house.cleared = true
                this.housesCleared += 1
                events.push({ kind: "hop", value: this.housesCleared })
            }
        } else if (this.isOnRoof && (!house || feet < house.roofY - 1)) {
            // Ran off an edge: start falling with the coyote window open.
            this.isOnRoof = false
        }

        if (!this.isOnRoof) {
            this.coyoteRemaining = Math.max(0, this.coyoteRemaining - dt)
        }
        this.jumpBufferRemaining = Math.max(0, this.jumpBufferRemaining - dt)

        // Fell: past every roof line, into the street between the houses.
        if (this.playerY + PLAYER_HEIGHT > FIELD_HEIGHT) {
            this.isOver = true
            this.ending = "fell"
            events.push({ kind: "fell", value: this.score })
            return events
        }

        this.ensureHouses()
        return events
    }

    /** The house whose roof span overlaps the runner's footprint, if any. */
    private houseUnder(left: number, right: number): House | undefined {
        // Prefer the house under the runner's center of mass so an edge
        // straddle resolves to the roof most of the runner stands on.
        const center = (left + right) / 2
        return (
            this.houses.find((house) => center >= house.x && center < house.x + house.width) ??
            this.houses.find((house) => right > house.x && left < house.x + house.width)
        )
    }

    /** Keep the street generated one screen past the camera's right edge. */
    private ensureHouses(): void {
        while (this.frontier < this.playerWorldX + FIELD_WIDTH * 1.5) {
            this.pushHouse(false)
        }
        // Drop houses fully behind the camera.
        this.houses = this.houses.filter((house) => house.x + house.width > this.playerWorldX - FIELD_WIDTH)
    }

    /**
     * Generate the next house (RNG order: width, gap, roof rise, chimney
     * position — mirrored by the native ports). All horizontal sizes are
     * rolled in seconds of travel at the current speed, so the street stays
     * fair as the run accelerates. The first house of a run starts at the
     * frontier with no gap; warm-up houses skip the chimney.
     */
    private pushHouse(isFirst: boolean): void {
        const width =
            this.speed * (HOUSE_SECONDS_MIN + this.random() * (HOUSE_SECONDS_MAX - HOUSE_SECONDS_MIN))
        const gap = isFirst
            ? 0
            : this.speed * (GAP_SECONDS_MIN + this.random() * (GAP_SECONDS_MAX - GAP_SECONDS_MIN))

        const previousRoof = this.houses[this.houses.length - 1]?.roofY ?? (ROOF_Y_MIN + ROOF_Y_MAX) / 2
        // Roofs step anywhere down, but at most ROOF_RISE_MAX up.
        const lowestAllowed = Math.max(ROOF_Y_MIN, previousRoof - ROOF_RISE_MAX)
        const roofY = isFirst ? previousRoof : lowestAllowed + this.random() * (ROOF_Y_MAX - lowestAllowed)

        const index = this.nextHouseIndex
        this.nextHouseIndex += 1

        let chimneyOffset: number | null = null
        const margin = this.speed * CHIMNEY_MARGIN_SECONDS
        const chimneySpan = width - margin * 2 - CHIMNEY_WIDTH
        if (index >= SAFE_HOUSES && chimneySpan > 0) {
            chimneyOffset = margin + this.random() * chimneySpan
        } else if (index >= SAFE_HOUSES) {
            // Roll anyway so narrow houses keep the RNG stream aligned
            // across platforms, then center the chimney.
            this.random()
            chimneyOffset = Math.max(0, (width - CHIMNEY_WIDTH) / 2)
        }

        this.houses.push({
            x: this.frontier + gap,
            width,
            roofY,
            chimneyOffset,
            index,
            cleared: index === 0,
        })
        this.frontier += gap + width
    }

    // Test hooks -------------------------------------------------------

    /** Test hook: replace the generated street with an exact layout. */
    setHouses(houses: House[]): void {
        this.houses = houses
        this.frontier = Number.MAX_SAFE_INTEGER
    }

    /** Test hook: place the runner at an exact spot with a velocity. */
    placeRunner(worldX: number, y: number, velocityY: number, onRoof: boolean): void {
        this.playerWorldX = worldX
        this.playerY = y
        this.velocityY = velocityY
        this.isOnRoof = onRoof
    }
}
