package com.baseapp.android.view.games.race

import kotlin.math.abs
import kotlin.math.min
import kotlin.random.Random

/**
 * Pure Kotlin port of the web RaceBot simulation
 * (`web/app/src/View/Games/Race/engine.ts`) so the exact same rules run on
 * every platform and can be unit-tested on the JVM. No Android or Compose
 * imports here — rendering and input live in `RaceGameView`.
 *
 * Steering is tap-based ([steerLeft]/[steerRight] move the target lane);
 * nitro arrives as a held-input flag ([isBoosting]) — the native twin of a
 * held key.
 *
 * All coordinates are in field units (420x720, y growing downward); the view
 * scales the field to the device while preserving the aspect ratio. Time is
 * the engine's own [elapsed] clock, so identical steps always produce
 * identical states.
 *
 * Randomness (spawn lane, traffic speed, paint job) goes through an injected
 * [Random] so tests can pin every spawn decision. The RNG call order in
 * `trySpawnCar` (lane, speed, kind) matches the web engine exactly.
 */
class RaceEngine(private val random: Random = Random.Default) {
    companion object {
        // Field geometry and tuning — must stay byte-for-byte in sync with
        // the web constants in engine.ts.
        const val FIELD_WIDTH = 420f
        const val FIELD_HEIGHT = 720f
        const val LANE_COUNT = 3

        /** Asphalt inset: shoulders on both sides of the three 110-unit lanes. */
        const val ROAD_LEFT = 45f
        const val ROAD_WIDTH = 330f
        const val LANE_WIDTH = ROAD_WIDTH / LANE_COUNT
        const val CAR_WIDTH = 62f
        const val CAR_LENGTH = 108f

        /** Top edge of the player car; fixed — the world scrolls, the car does not. */
        const val PLAYER_Y = 560f

        /** Cruise speed at the green light (field units/s). */
        const val BASE_SPEED = 260f

        /** Cruise ceiling; nitro can push past it. */
        const val MAX_SPEED = 640f

        /** Cruise speed gained per second of driving — the difficulty ramp. */
        const val ACCELERATION = 9f

        /** Sideways glide speed during a lane change (units/s). */
        const val LANE_CHANGE_SPEED = 520f

        const val NITRO_MULTIPLIER = 1.6f

        /** Gauge (0-1) drained per second while boosting. */
        const val NITRO_DRAIN = 0.35f

        /** Gauge regenerated per second while cruising. */
        const val NITRO_REGEN = 0.12f

        /** Traffic cruises at a fixed speed rolled at spawn (units/s). */
        const val TRAFFIC_MIN_SPEED = 110f
        const val TRAFFIC_MAX_SPEED = 215f

        /** Distinct traffic paint jobs; the roll only picks the palette index. */
        const val TRAFFIC_KIND_COUNT = 4

        /** Seconds between spawn attempts at the start of a run… */
        const val SPAWN_INTERVAL_START = 1.35f

        /** …and the floor it ramps down to. */
        const val SPAWN_INTERVAL_MIN = 0.55f

        /** How much the spawn interval shrinks per second of driving. */
        const val SPAWN_INTERVAL_RAMP = 0.008f

        /**
         * A spawn is skipped if it would leave no free lane in the top
         * [ENTRY_WINDOW] units of the field — there must always be a way
         * through.
         */
        const val ENTRY_WINDOW = 260f

        /** Minimum bumper-to-bumper gap within a lane at spawn time. */
        const val SPAWN_GAP = CAR_LENGTH * 1.6f

        /** Score per car passed. */
        const val OVERTAKE_BONUS = 50

        /** Field units per scored meter (≈ 43 m/s at base cruise). */
        const val UNITS_PER_METER = 6f

        /** Collision paddings: slightly forgiving, like the web. */
        const val HIT_WIDTH = CAR_WIDTH * 0.82f
        const val HIT_LENGTH_PAD = 6f

        fun laneCenter(lane: Int): Float = ROAD_LEFT + LANE_WIDTH * (lane + 0.5f)
    }

    /**
     * One traffic car. `x` is the center in field units, `y` the top edge;
     * `kind` picks the paint-job palette entry.
     */
    class TrafficCar(
        /** Lane index 0 (left) to 2 (right). */
        val lane: Int,
        val x: Float,
        var y: Float,
        /** Own cruise speed (units/s); closing speed is player minus this. */
        val speed: Float,
        /** Paint-job palette index (0..TRAFFIC_KIND_COUNT-1). */
        val kind: Int,
        /** Whether the overtake bonus for this car has been paid. */
        var passed: Boolean = false,
    )

    /**
     * Discrete things that happened during one [step] — the native twin of
     * the web game's HUD/crash callbacks.
     */
    data class StepResult(
        /** Total overtakes after each car passed this step (usually 0-1). */
        val overtakeTotals: List<Int> = emptyList(),
        val isGameOver: Boolean = false,
    )

    /** Held input: nitro pedal down. */
    var isBoosting = false

    val traffic = mutableListOf<TrafficCar>()

    /** Lane the player is gliding toward. */
    var targetLane = 1
        private set

    /** Player center x; glides toward the target lane's center. */
    var playerX = laneCenter(1)
        private set

    /** Current cruise speed (before the nitro multiplier). */
    var speed = BASE_SPEED
        private set

    /** Nitro gauge, 0-1. */
    var nitro = 1f
        private set

    var distanceMeters = 0f
        private set

    var overtakes = 0
        private set

    var isOver = false
        private set

    /** Engine clock in seconds; drives the difficulty ramp. */
    var elapsed = 0f
        private set

    private var spawnCooldown = SPAWN_INTERVAL_START

    val score: Int
        get() = distanceMeters.toInt() + overtakes * OVERTAKE_BONUS

    /** True while the nitro flame should render and the multiplier applies. */
    val isNitroActive: Boolean
        get() = isBoosting && nitro > 0f && !isOver

    /** Ground speed including nitro (what the speedometer shows). */
    val effectiveSpeed: Float
        get() = speed * (if (isNitroActive) NITRO_MULTIPLIER else 1f)

    /** Full reset (the web "Restart Race" path). */
    fun newGame() {
        traffic.clear()
        targetLane = 1
        playerX = laneCenter(1)
        speed = BASE_SPEED
        nitro = 1f
        distanceMeters = 0f
        overtakes = 0
        isOver = false
        elapsed = 0f
        spawnCooldown = SPAWN_INTERVAL_START
        isBoosting = false
    }

    fun steerLeft() {
        if (!isOver && targetLane > 0) {
            targetLane -= 1
        }
    }

    fun steerRight() {
        if (!isOver && targetLane < LANE_COUNT - 1) {
            targetLane += 1
        }
    }

    /**
     * Advance the simulation. Mirrors the web `step` frame-for-frame: ramp
     * the cruise speed, drain/refill nitro, glide the lane change, scroll
     * traffic by the closing speed, pay overtakes, spawn on the cadence,
     * and check for a crash.
     */
    fun step(dt: Float): StepResult {
        if (isOver) {
            return StepResult()
        }
        val overtakeTotals = mutableListOf<Int>()
        elapsed += dt

        // Cruise ramp and nitro gauge.
        speed = min(MAX_SPEED, speed + ACCELERATION * dt)
        nitro = when {
            isNitroActive -> (nitro - NITRO_DRAIN * dt).coerceAtLeast(0f)
            // The gauge only refills once the pedal is released — holding
            // it on an empty tank never sputters the boost back on.
            !isBoosting -> (nitro + NITRO_REGEN * dt).coerceAtMost(1f)
            else -> nitro
        }
        val groundSpeed = effectiveSpeed
        distanceMeters += groundSpeed * dt / UNITS_PER_METER

        // Lane-change glide: constant lateral speed toward the target
        // center, snapping on arrival so drift never accumulates.
        val target = laneCenter(targetLane)
        if (playerX != target) {
            val delta = LANE_CHANGE_SPEED * dt
            playerX = if (abs(target - playerX) <= delta) {
                target
            } else {
                playerX + (if (target > playerX) delta else -delta)
            }
        }

        // Traffic scrolls by the closing speed; cars behind the field are
        // recycled once fully off-screen.
        for (car in traffic) {
            car.y += (groundSpeed - car.speed) * dt
            if (!car.passed && car.y > PLAYER_Y + CAR_LENGTH) {
                car.passed = true
                overtakes += 1
                overtakeTotals.add(overtakes)
            }
        }
        traffic.removeAll { it.y >= FIELD_HEIGHT + CAR_LENGTH * 2 }

        // Spawn cadence ramps with elapsed time.
        spawnCooldown -= dt
        if (spawnCooldown <= 0f) {
            spawnCooldown = (SPAWN_INTERVAL_START - elapsed * SPAWN_INTERVAL_RAMP)
                .coerceAtLeast(SPAWN_INTERVAL_MIN)
            trySpawnCar()
        }

        // Crash check: forgiving rectangle overlap against every live car.
        val crashed = traffic.any { car ->
            abs(car.x - playerX) < HIT_WIDTH &&
                PLAYER_Y + HIT_LENGTH_PAD < car.y + CAR_LENGTH &&
                PLAYER_Y + CAR_LENGTH - HIT_LENGTH_PAD > car.y
        }
        if (crashed) {
            isOver = true
        }

        return StepResult(overtakeTotals = overtakeTotals, isGameOver = crashed)
    }

    /**
     * Roll a spawn (RNG order: lane, speed, kind — matching the web engine).
     * The spawn is dropped when the rolled lane is too crowded or when it
     * would close the last free lane in the entry window.
     */
    private fun trySpawnCar() {
        val lane = (random.nextFloat() * LANE_COUNT).toInt()
        val speed = TRAFFIC_MIN_SPEED + random.nextFloat() * (TRAFFIC_MAX_SPEED - TRAFFIC_MIN_SPEED)
        val kind = (random.nextFloat() * TRAFFIC_KIND_COUNT).toInt()

        val tooClose = traffic.any { it.lane == lane && it.y < SPAWN_GAP - CAR_LENGTH }
        if (tooClose) {
            return
        }
        val blockedLanes = traffic.filter { it.y < ENTRY_WINDOW }.map { it.lane }.toMutableSet()
        blockedLanes.add(lane)
        if (blockedLanes.size >= LANE_COUNT) {
            return
        }

        traffic.add(
            TrafficCar(lane = lane, x = laneCenter(lane), y = -CAR_LENGTH, speed = speed, kind = kind),
        )
    }

    // Test hooks -----------------------------------------------------------

    /** Test hook: empty the road to build exact scenarios. */
    fun clearTraffic() {
        traffic.clear()
    }

    /** Test hook: place a car at an exact spot. */
    fun addCar(lane: Int, y: Float, speed: Float = TRAFFIC_MIN_SPEED, kind: Int = 0) {
        traffic.add(TrafficCar(lane = lane, x = laneCenter(lane), y = y, speed = speed, kind = kind))
    }

    /** Test hook: snap the player into a lane with no glide. */
    fun snapToLane(lane: Int) {
        targetLane = lane
        playerX = laneCenter(lane)
    }

    /** Test hook: roll one spawn attempt without advancing the world. */
    fun forceSpawnRoll() {
        trySpawnCar()
    }
}
