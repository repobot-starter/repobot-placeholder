package com.baseapp.android

import com.baseapp.android.view.games.race.RaceEngine
import kotlin.math.abs
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure RaceBot simulation. The engine takes an injectable
 * [Random], so every test below is deterministic: a constant 0.5 roll pins
 * spawn lanes (middle), traffic speeds, and paint jobs.
 */
class RaceEngineTest {
    /** Small enough that world movement within one frame is negligible. */
    private val dt = 0.001f

    /** `nextFloat() == 0.5` pins every spawn roll, like the web tests. */
    private fun makeEngine(): RaceEngine = RaceEngine(random = FixedRandom(0.5f))

    @Test
    fun `starts centered cruising with full nitro`() {
        val engine = makeEngine()
        assertEquals(1, engine.targetLane)
        assertEquals(RaceEngine.laneCenter(1), engine.playerX, 0.0001f)
        assertEquals(RaceEngine.BASE_SPEED, engine.speed, 0.0001f)
        assertEquals(1f, engine.nitro, 0.0001f)
        assertFalse(engine.isOver)
    }

    @Test
    fun `steering clamps to the road`() {
        val engine = makeEngine()
        engine.steerLeft()
        assertEquals(0, engine.targetLane)
        engine.steerLeft()
        assertEquals("steering off the left shoulder is ignored", 0, engine.targetLane)

        engine.steerRight()
        engine.steerRight()
        assertEquals(2, engine.targetLane)
        engine.steerRight()
        assertEquals("steering off the right shoulder is ignored", 2, engine.targetLane)
    }

    @Test
    fun `lane change glides at the lateral speed and snaps on arrival`() {
        val engine = makeEngine()
        engine.steerLeft()

        engine.step(0.05f)
        val expected = RaceEngine.laneCenter(1) - RaceEngine.LANE_CHANGE_SPEED * 0.05f
        assertEquals(expected, engine.playerX, 0.001f)

        // Plenty of frames later the glide has snapped exactly onto the
        // lane center (no drift accumulation).
        repeat(20) { engine.step(0.05f) }
        assertEquals(RaceEngine.laneCenter(0), engine.playerX, 0.0001f)
    }

    @Test
    fun `nitro boosts speed then drains and regenerates`() {
        val engine = makeEngine()
        engine.isBoosting = true
        assertTrue(engine.isNitroActive)
        assertEquals(engine.speed * RaceEngine.NITRO_MULTIPLIER, engine.effectiveSpeed, 0.0001f)

        engine.step(1f)
        assertEquals(1f - RaceEngine.NITRO_DRAIN, engine.nitro, 0.0001f)

        // An empty gauge turns the boost off even while the pedal is held.
        repeat(3) { engine.step(1f) }
        assertEquals(0f, engine.nitro, 0.0001f)
        assertFalse(engine.isNitroActive)
        assertEquals(engine.speed, engine.effectiveSpeed, 0.0001f)

        // Releasing the pedal refills the gauge.
        engine.isBoosting = false
        engine.step(1f)
        assertEquals(RaceEngine.NITRO_REGEN, engine.nitro, 0.0001f)
    }

    @Test
    fun `cruise speed ramps to the ceiling`() {
        val engine = makeEngine()
        // Hug the left shoulder: the 0.5 roll only ever spawns middle-lane
        // traffic, so the long cruise below can never end in a crash.
        engine.steerLeft()
        engine.step(1f)
        assertEquals(RaceEngine.BASE_SPEED + RaceEngine.ACCELERATION, engine.speed, 0.0001f)

        repeat(100) { engine.step(1f) }
        assertEquals(RaceEngine.MAX_SPEED, engine.speed, 0.0001f)
    }

    @Test
    fun `overtake pays once and the car is recycled off-screen`() {
        val engine = makeEngine()
        engine.clearTraffic()
        // Hug the left shoulder so the middle-lane spawns of the long run
        // below can never crash the player.
        engine.steerLeft()
        // A car in the other lane just above the pay line.
        engine.addCar(lane = 0, y = RaceEngine.PLAYER_Y + RaceEngine.CAR_LENGTH - 1f)

        val result = engine.step(0.05f)
        assertEquals(listOf(1), result.overtakeTotals)
        assertEquals(1, engine.overtakes)
        assertEquals(engine.distanceMeters.toInt() + RaceEngine.OVERTAKE_BONUS, engine.score)

        // Passing frames never pay the same car twice…
        repeat(5) {
            assertTrue(engine.step(0.05f).overtakeTotals.isEmpty())
        }
        assertEquals(1, engine.overtakes)

        // …and the car is dropped once it is fully off-screen. (Cadence
        // spawns are middle-lane only under the 0.5 roll, so lane 0 going
        // empty means exactly our car was recycled.)
        repeat(200) { engine.step(0.05f) }
        assertFalse(engine.traffic.any { it.lane == 0 })
    }

    @Test
    fun `rear-ending a car ends the run`() {
        val engine = makeEngine()
        engine.clearTraffic()
        // A car dead ahead in the player's lane, overlapping the hitbox.
        engine.addCar(
            lane = 1,
            y = RaceEngine.PLAYER_Y - RaceEngine.CAR_LENGTH + RaceEngine.HIT_LENGTH_PAD + 1f,
        )

        val result = engine.step(dt)
        assertTrue(engine.isOver)
        assertTrue(result.isGameOver)

        // A finished run must not keep simulating until a new game starts.
        val afterCrash = engine.step(dt)
        assertFalse(afterCrash.isGameOver)
        assertTrue(afterCrash.overtakeTotals.isEmpty())
    }

    @Test
    fun `adjacent lane traffic is harmless`() {
        val engine = makeEngine()
        engine.clearTraffic()
        // Side-by-side with the player, one lane over: lane centers are 110
        // units apart, comfortably past the 50.84-unit hit width.
        engine.addCar(lane = 0, y = RaceEngine.PLAYER_Y)

        engine.step(dt)
        assertFalse(engine.isOver)
    }

    @Test
    fun `spawn keeps an escape lane open`() {
        // The 0.5 roll always picks the middle lane.
        val engine = makeEngine()
        engine.clearTraffic()
        // The two outer lanes are already occupied in the entry window; a
        // middle-lane spawn would close the last gap, so it must be dropped.
        engine.addCar(lane = 0, y = 40f)
        engine.addCar(lane = 2, y = 40f)

        engine.forceSpawnRoll()
        assertEquals("spawn that blocks every lane is skipped", 2, engine.traffic.size)
    }

    @Test
    fun `spawn keeps a gap within the lane`() {
        val engine = makeEngine()
        engine.clearTraffic()
        // A car sitting right at the top of the middle lane: the next
        // middle-lane roll has no room and must be dropped.
        engine.addCar(lane = 1, y = -RaceEngine.CAR_LENGTH + 1f)

        engine.forceSpawnRoll()
        assertEquals(1, engine.traffic.size)
    }

    @Test
    fun `spawned cars use the injected rng for lane speed and kind`() {
        val engine = makeEngine()
        engine.clearTraffic()
        engine.forceSpawnRoll()

        assertEquals(1, engine.traffic.size)
        val car = engine.traffic.first()
        assertEquals(1, car.lane)
        assertEquals(RaceEngine.laneCenter(1), car.x, 0.0001f)
        assertEquals(-RaceEngine.CAR_LENGTH, car.y, 0.0001f)
        val expectedSpeed =
            RaceEngine.TRAFFIC_MIN_SPEED + 0.5f * (RaceEngine.TRAFFIC_MAX_SPEED - RaceEngine.TRAFFIC_MIN_SPEED)
        assertEquals(expectedSpeed, car.speed, 0.0001f)
        assertEquals(2, car.kind)
    }

    @Test
    fun `new game resets everything`() {
        val engine = makeEngine()
        engine.isBoosting = true
        engine.steerRight()
        engine.step(2f)
        engine.clearTraffic()
        engine.addCar(lane = 2, y = RaceEngine.PLAYER_Y)
        engine.snapToLane(2)
        engine.step(dt)
        assertTrue(engine.isOver)

        engine.newGame()
        assertFalse(engine.isOver)
        assertEquals(1, engine.targetLane)
        assertEquals(RaceEngine.laneCenter(1), engine.playerX, 0.0001f)
        assertEquals(RaceEngine.BASE_SPEED, engine.speed, 0.0001f)
        assertEquals(1f, engine.nitro, 0.0001f)
        assertEquals(0f, engine.distanceMeters, 0.0001f)
        assertEquals(0, engine.overtakes)
        assertTrue(engine.traffic.isEmpty())
        assertFalse(engine.isBoosting)
    }

    @Test
    fun `score combines distance and overtakes`() {
        val engine = makeEngine()
        engine.clearTraffic()
        engine.step(1f)
        assertEquals(engine.distanceMeters.toInt(), engine.score)

        // Right on the pay line: any forward step passes it.
        engine.addCar(lane = 0, y = RaceEngine.PLAYER_Y + RaceEngine.CAR_LENGTH)
        engine.step(dt)
        assertEquals(engine.distanceMeters.toInt() + RaceEngine.OVERTAKE_BONUS, engine.score)
    }

    /**
     * A [Random] whose `nextFloat` always returns the same value, pinning
     * every spawn decision.
     */
    private class FixedRandom(private val value: Float) : Random() {
        // nextFloat() = nextBits(24) / 2^24, so returning value * 2^bitCount
        // makes every nextFloat() call yield exactly `value`.
        override fun nextBits(bitCount: Int): Int =
            (value.toDouble() * (1L shl bitCount)).toLong().toInt()
    }
}
