// Pure RaceBot engine: a three-lane neon highway racer. The player car sits
// near the bottom of the field while traffic scrolls toward it; steering
// snaps between lanes (with a continuous lateral glide), nitro trades a
// draining gauge for extra speed, and every car passed pays an overtake
// bonus. Crash into a bumper and the run is over.
//
// No React, no DOM — the engine is a plain state machine driven by
// `step(dt)`, so it is easy to test and extend. The native ports
// (`ios/App/View/Games/Race/RaceEngine.swift` and
// `android/.../view/games/race/RaceEngine.kt`) mirror this file — keep the
// constants, the RNG call order in `trySpawnCar` (lane, speed, kind), and
// the collision paddings in sync so every platform drives identically.
//
// Randomness (spawn lane, traffic speed, paint job) goes through an injected
// `random` closure so tests can pin every spawn decision.

/** Field units; the view scales the field to its canvas. */
export const FIELD_WIDTH = 420
export const FIELD_HEIGHT = 720

export const LANE_COUNT = 3
/** Asphalt inset: shoulders on both sides of the three 110-unit lanes. */
export const ROAD_LEFT = 45
export const ROAD_WIDTH = 330
export const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT

export const CAR_WIDTH = 62
export const CAR_LENGTH = 108
/** Top edge of the player car; fixed — the world scrolls, the car does not. */
export const PLAYER_Y = 560

/** Cruise speed at the green light (field units/s). */
export const BASE_SPEED = 260
/** Cruise ceiling; nitro can push past it. */
export const MAX_SPEED = 640
/** Cruise speed gained per second of driving — the difficulty ramp. */
export const ACCELERATION = 9
/** Sideways glide speed during a lane change (units/s). */
export const LANE_CHANGE_SPEED = 520

export const NITRO_MULTIPLIER = 1.6
/** Gauge (0-1) drained per second while boosting. */
export const NITRO_DRAIN = 0.35
/** Gauge regenerated per second while cruising. */
export const NITRO_REGEN = 0.12

/** Traffic cruises at a fixed speed rolled at spawn (units/s). */
export const TRAFFIC_MIN_SPEED = 110
export const TRAFFIC_MAX_SPEED = 215
/** Distinct traffic paint jobs; the roll only picks the palette index. */
export const TRAFFIC_KIND_COUNT = 4

/** Seconds between spawn attempts at the start of a run… */
export const SPAWN_INTERVAL_START = 1.35
/** …and the floor it ramps down to. */
export const SPAWN_INTERVAL_MIN = 0.55
/** How much the spawn interval shrinks per second of driving. */
export const SPAWN_INTERVAL_RAMP = 0.008

/**
 * A spawn is skipped if it would leave no free lane in the entry window
 * (top `ENTRY_WINDOW` units of the field) — there must always be a way
 * through.
 */
export const ENTRY_WINDOW = 260
/** Minimum bumper-to-bumper gap within a lane at spawn time. */
export const SPAWN_GAP = CAR_LENGTH * 1.6

/** Score per car passed. */
export const OVERTAKE_BONUS = 50
/** Field units per scored meter (≈ 43 m/s at base cruise). */
export const UNITS_PER_METER = 6

/** Collision paddings: slightly forgiving, like the other games. */
const HIT_WIDTH = CAR_WIDTH * 0.82
const HIT_LENGTH_PAD = 6

export interface TrafficCar {
    /** Lane index 0 (left) to 2 (right). */
    lane: number
    /** Center x in field units (baked from the lane at spawn). */
    x: number
    /** Top edge y; grows as the player gains on the car. */
    y: number
    /** Own cruise speed (units/s); closing speed is player minus this. */
    speed: number
    /** Paint-job palette index (0..TRAFFIC_KIND_COUNT-1). */
    kind: number
    /** Whether the overtake bonus for this car has been paid. */
    passed: boolean
}

export interface RaceEvent {
    kind: "overtake" | "crash"
    /** Total overtakes (overtake) or final score (crash). */
    value: number
}

export function laneCenter(lane: number): number {
    return ROAD_LEFT + LANE_WIDTH * (lane + 0.5)
}

/**
 * The simulation. Steering is tap-based (`steerLeft`/`steerRight` move the
 * target lane); nitro is a held flag, the native twin of a held key.
 */
export class RaceEngine {
    /** Held input: nitro pedal down. */
    isBoosting = false

    traffic: TrafficCar[] = []
    /** Lane the player is gliding toward. */
    targetLane = 1
    /** Player center x; glides toward the target lane's center. */
    playerX = laneCenter(1)
    /** Current cruise speed (before the nitro multiplier). */
    speed = BASE_SPEED
    /** Nitro gauge, 0-1. */
    nitro = 1
    distanceMeters = 0
    overtakes = 0
    isOver = false
    /** Engine clock in seconds; drives the difficulty ramp. */
    elapsed = 0

    private spawnCooldown = SPAWN_INTERVAL_START
    private readonly random: () => number

    constructor(random: () => number = Math.random) {
        this.random = random
    }

    get score(): number {
        return Math.floor(this.distanceMeters) + this.overtakes * OVERTAKE_BONUS
    }

    /** True while the nitro flame should render and the multiplier applies. */
    get isNitroActive(): boolean {
        return this.isBoosting && this.nitro > 0 && !this.isOver
    }

    /** Ground speed including nitro (what the speedometer shows). */
    get effectiveSpeed(): number {
        return this.speed * (this.isNitroActive ? NITRO_MULTIPLIER : 1)
    }

    newGame(): void {
        this.traffic = []
        this.targetLane = 1
        this.playerX = laneCenter(1)
        this.speed = BASE_SPEED
        this.nitro = 1
        this.distanceMeters = 0
        this.overtakes = 0
        this.isOver = false
        this.elapsed = 0
        this.spawnCooldown = SPAWN_INTERVAL_START
        this.isBoosting = false
    }

    steerLeft(): void {
        if (!this.isOver && this.targetLane > 0) {
            this.targetLane -= 1
        }
    }

    steerRight(): void {
        if (!this.isOver && this.targetLane < LANE_COUNT - 1) {
            this.targetLane += 1
        }
    }

    /**
     * Advance the simulation: ramp the cruise speed, drain/refill nitro,
     * glide the lane change, scroll traffic by the closing speed, pay
     * overtakes, spawn new cars on the cadence, and check for a crash.
     */
    step(dt: number): RaceEvent[] {
        if (this.isOver) {
            return []
        }
        const events: RaceEvent[] = []
        this.elapsed += dt

        // Cruise ramp and nitro gauge.
        this.speed = Math.min(MAX_SPEED, this.speed + ACCELERATION * dt)
        if (this.isNitroActive) {
            this.nitro = Math.max(0, this.nitro - NITRO_DRAIN * dt)
        } else if (!this.isBoosting) {
            // The gauge only refills once the pedal is released — holding it
            // on an empty tank never sputters the boost back on.
            this.nitro = Math.min(1, this.nitro + NITRO_REGEN * dt)
        }
        const groundSpeed = this.effectiveSpeed
        this.distanceMeters += (groundSpeed * dt) / UNITS_PER_METER

        // Lane-change glide: constant lateral speed toward the target
        // center, snapping on arrival so drift never accumulates.
        const target = laneCenter(this.targetLane)
        if (this.playerX !== target) {
            const delta = LANE_CHANGE_SPEED * dt
            if (Math.abs(target - this.playerX) <= delta) {
                this.playerX = target
            } else {
                this.playerX += Math.sign(target - this.playerX) * delta
            }
        }

        // Traffic scrolls by the closing speed; cars behind the field are
        // recycled once fully off-screen.
        for (const car of this.traffic) {
            car.y += (groundSpeed - car.speed) * dt
            if (!car.passed && car.y > PLAYER_Y + CAR_LENGTH) {
                car.passed = true
                this.overtakes += 1
                events.push({ kind: "overtake", value: this.overtakes })
            }
        }
        this.traffic = this.traffic.filter((car) => car.y < FIELD_HEIGHT + CAR_LENGTH * 2)

        // Spawn cadence ramps with elapsed time.
        this.spawnCooldown -= dt
        if (this.spawnCooldown <= 0) {
            this.spawnCooldown = Math.max(
                SPAWN_INTERVAL_MIN,
                SPAWN_INTERVAL_START - this.elapsed * SPAWN_INTERVAL_RAMP,
            )
            this.trySpawnCar()
        }

        // Crash check: forgiving rectangle overlap against every live car.
        const crashed = this.traffic.some(
            (car) =>
                Math.abs(car.x - this.playerX) < HIT_WIDTH &&
                PLAYER_Y + HIT_LENGTH_PAD < car.y + CAR_LENGTH &&
                PLAYER_Y + CAR_LENGTH - HIT_LENGTH_PAD > car.y,
        )
        if (crashed) {
            this.isOver = true
            events.push({ kind: "crash", value: this.score })
        }

        return events
    }

    /**
     * Roll a spawn (RNG order: lane, speed, kind — mirrored by the native
     * ports). The spawn is dropped when the rolled lane is too crowded or
     * when it would close the last free lane in the entry window.
     */
    private trySpawnCar(): void {
        const lane = Math.floor(this.random() * LANE_COUNT)
        const speed = TRAFFIC_MIN_SPEED + this.random() * (TRAFFIC_MAX_SPEED - TRAFFIC_MIN_SPEED)
        const kind = Math.floor(this.random() * TRAFFIC_KIND_COUNT)

        const tooClose = this.traffic.some((car) => car.lane === lane && car.y < SPAWN_GAP - CAR_LENGTH)
        if (tooClose) {
            return
        }
        const blockedLanes = new Set(
            this.traffic.filter((car) => car.y < ENTRY_WINDOW).map((car) => car.lane),
        )
        blockedLanes.add(lane)
        if (blockedLanes.size >= LANE_COUNT) {
            return
        }

        this.traffic.push({
            lane,
            x: laneCenter(lane),
            y: -CAR_LENGTH,
            speed,
            kind,
            passed: false,
        })
    }

    // Test hooks -------------------------------------------------------

    /** Test hook: empty the road to build exact scenarios. */
    clearTraffic(): void {
        this.traffic = []
    }

    /** Test hook: place a car at an exact spot. */
    addCar(lane: number, y: number, speed = TRAFFIC_MIN_SPEED, kind = 0): void {
        this.traffic.push({ lane, x: laneCenter(lane), y, speed, kind, passed: false })
    }

    /** Test hook: snap the player into a lane with no glide. */
    snapToLane(lane: number): void {
        this.targetLane = lane
        this.playerX = laneCenter(lane)
    }

    /** Test hook: roll one spawn attempt without advancing the world. */
    forceSpawnRoll(): void {
        this.trySpawnCar()
    }
}
