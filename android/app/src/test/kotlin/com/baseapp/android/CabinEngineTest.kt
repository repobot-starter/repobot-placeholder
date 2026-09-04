package com.baseapp.android

import com.baseapp.android.view.games.cabin.CabinEngine
import kotlin.math.min
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure CabinBot simulation against the web `flight.ts` rules
 * it mirrors: boarding handoff, the request patience loop, serve rewards and
 * wrong-item penalties, the scripted event schedule, star thresholds on
 * landing, and RNG-injected deterministic spawning.
 */
class CabinEngineTest {
    private fun engine(seed: Int = 7): CabinEngine =
        CabinEngine(difficulty = CabinEngine.Difficulty.CREW, random = Random(seed))

    /** Engine that has finished boarding and just entered the cruise. */
    private fun cruisingEngine(seed: Int = 7): CabinEngine {
        val engine = engine(seed)
        engine.beginBoarding()
        engine.step(CabinEngine.Tuning.BOARDING_MS / 1000.0)
        assertEquals(CabinEngine.Phase.CRUISE, engine.phase)
        assertEquals(0.0, engine.elapsedMs, 0.001)
        return engine
    }

    /** Steps in 100ms slices like a frame loop, collecting every cue. */
    private fun stepFor(engine: CabinEngine, seconds: Double): List<CabinEngine.Cue> {
        val cues = mutableListOf<CabinEngine.Cue>()
        var remaining = seconds
        while (remaining > 0) {
            val slice = min(0.1, remaining)
            cues.addAll(engine.step(slice))
            remaining -= slice
        }
        return cues
    }

    @Test
    fun boardingPopsPassengersThenHandsOffToCruise() {
        val engine = engine()
        engine.beginBoarding()

        // First passenger boards at 300ms; nobody is seated before that.
        engine.step(0.2)
        assertFalse(engine.passengers[0].boarded)
        val cues = engine.step(0.2)
        assertTrue(engine.passengers[0].boarded)
        assertTrue(cues.contains(CabinEngine.Cue.POP))

        // Boarding runs exactly TUNING.boardingMs, then the cruise begins
        // with an intercom announcement and a fully seated cabin.
        val handoff = engine.step(CabinEngine.Tuning.BOARDING_MS / 1000.0)
        assertEquals(CabinEngine.Phase.CRUISE, engine.phase)
        assertTrue(engine.passengers.all { it.boarded })
        assertTrue(handoff.contains(CabinEngine.Cue.INTERCOM))
        assertNotNull(engine.announcement)
    }

    @Test
    fun patienceDrainsAtWebRateAndIgnoredRequestFailsAtZero() {
        val engine = cruisingEngine()
        engine.setRequest(passengerId = 0, item = CabinEngine.Item.DRINK)
        assertEquals(
            CabinEngine.Tuning.REQUEST_PATIENCE_MS,
            engine.passengers[0].request!!.totalMs,
            0.001,
        )

        // Patience drains in real time: after 4s of the 10s allowance, 6s remain.
        stepFor(engine, 4.0)
        assertEquals(6000.0, engine.passengers[0].request!!.remainingMs, 1.0)

        // Ignore it to zero: the request fails, costs -15 happiness, counts
        // as a miss, and grumbles.
        val cues = stepFor(engine, 6.05)
        assertNull(engine.passengers[0].request)
        assertEquals(1, engine.missed)
        assertEquals(
            CabinEngine.Tuning.START_HAPPINESS + CabinEngine.Tuning.EXPIRED_HAPPINESS,
            engine.passengers[0].happiness,
            0.001,
        )
        assertEquals(CabinEngine.Mood.UPSET, engine.passengers[0].mood)
        assertTrue(cues.contains(CabinEngine.Cue.GRUMBLE))
    }

    @Test
    fun servingTheRightItemResolvesTheRequestAndScores() {
        val engine = cruisingEngine()
        engine.setRequest(passengerId = 3, item = CabinEngine.Item.PRETZELS)

        val result = engine.serveItem(passengerId = 3, item = CabinEngine.Item.PRETZELS)

        assertTrue(result.correct)
        assertTrue(result.cues.contains(CabinEngine.Cue.SERVE))
        assertNull(engine.passengers[3].request)
        assertEquals(1, engine.served)
        assertEquals(
            CabinEngine.Tuning.START_HAPPINESS + CabinEngine.Tuning.SERVED_HAPPINESS,
            engine.passengers[3].happiness,
            0.001,
        )
        assertEquals(CabinEngine.Mood.HAPPY, engine.passengers[3].mood)
    }

    @Test
    fun servingTheWrongItemCostsTheWebPenaltyAndKeepsTheRequest() {
        val engine = cruisingEngine()
        engine.setRequest(passengerId = 3, item = CabinEngine.Item.DRINK)

        val result = engine.serveItem(passengerId = 3, item = CabinEngine.Item.HEADPHONES)

        assertFalse(result.correct)
        assertEquals(listOf(CabinEngine.Cue.GRUMBLE), result.cues)
        assertEquals(CabinEngine.Item.DRINK, engine.passengers[3].request?.item)
        assertEquals(0, engine.served)
        assertEquals(
            CabinEngine.Tuning.START_HAPPINESS + CabinEngine.Tuning.WRONG_ITEM_HAPPINESS,
            engine.passengers[3].happiness,
            0.001,
        )

        // A seat with no open request shrugs the tray off entirely (no penalty).
        val idle = engine.serveItem(passengerId = 5, item = CabinEngine.Item.DRINK)
        assertFalse(idle.correct)
        assertTrue(idle.cues.isEmpty())
        assertEquals(CabinEngine.Tuning.START_HAPPINESS, engine.passengers[5].happiness, 0.001)
    }

    @Test
    fun scriptedCelebrityFiresAtItsTriggerTime() {
        val engine = cruisingEngine()
        // The event schedule is drawn from the injected RNG inside the web
        // window (celebrity 15-35s of cruise); the engine must fire it the
        // moment the cruise clock crosses that time.
        val event = engine.events[0]
        assertEquals(CabinEngine.EventKind.CELEBRITY, event.kind)
        assertTrue(event.atMs >= 15000.0 && event.atMs <= 35000.0)

        // Just before the trigger: no celebrity anywhere.
        stepFor(engine, (event.atMs - 100.0) / 1000.0)
        assertFalse(engine.passengers.any { it.role == CabinEngine.Role.CELEBRITY })
        assertFalse(event.fired)

        // Crossing the trigger fires the event: an intercom cue, a front-row
        // passenger in shades with a short-patience demand, an announcement.
        val cues = stepFor(engine, 0.2)
        assertTrue(cues.contains(CabinEngine.Cue.INTERCOM))
        assertTrue(event.fired)
        val celebrity = engine.passengers.first { it.role == CabinEngine.Role.CELEBRITY }
        assertEquals(0, celebrity.row)
        assertEquals("🕶️", celebrity.face)
        assertEquals(
            CabinEngine.Tuning.CELEBRITY_PATIENCE_MS,
            celebrity.request!!.totalMs,
            0.001,
        )
        assertTrue(engine.announcement!!.contains("celebrity"))
    }

    @Test
    fun starThresholdsAtFlightEnd() {
        // Web land(): >=90 → 5, >=75 → 4, >=55 → 3, >=35 → 2, else 1.
        val cases = listOf(
            90.0 to 5, 89.0 to 4, 75.0 to 4, 74.0 to 3, 55.0 to 3,
            54.0 to 2, 35.0 to 2, 34.0 to 1, 0.0 to 1,
        )
        for ((happiness, stars) in cases) {
            val engine = cruisingEngine()
            engine.setUniformHappiness(happiness)
            engine.landNow()
            assertEquals(CabinEngine.Phase.LANDED, engine.phase)
            assertEquals("happiness $happiness should land $stars stars", stars, engine.stars)
            // Landing clears every open request and stops further simulation.
            assertTrue(engine.passengers.all { it.request == null })
            assertTrue(engine.step(1.0).isEmpty())
        }
    }

    @Test
    fun requestSpawningIsDeterministicWithInjectedRNG() {
        // Two engines fed the same seed replay the exact same flight: the
        // first request lands on the same passenger with the same item once
        // the 1.5s initial cooldown elapses. 14 x 110ms = 1540ms crosses the
        // cooldown strictly (a 15 x 100ms split can float-round just short).
        val first = cruisingEngine(seed = 42)
        val second = cruisingEngine(seed = 42)

        val firstCues = mutableListOf<CabinEngine.Cue>()
        val secondCues = mutableListOf<CabinEngine.Cue>()
        repeat(14) {
            firstCues.addAll(first.step(0.11))
            secondCues.addAll(second.step(0.11))
        }
        assertTrue(firstCues.contains(CabinEngine.Cue.REQUEST))
        assertEquals(firstCues, secondCues)

        val firstTarget = first.passengers.first { it.request != null }
        val secondTarget = second.passengers.first { it.request != null }
        assertEquals(firstTarget.id, secondTarget.id)
        assertEquals(firstTarget.request!!.item, secondTarget.request!!.item)
        assertEquals(
            CabinEngine.Tuning.REQUEST_PATIENCE_MS,
            firstTarget.request!!.totalMs,
            0.001,
        )

        // The next spawn interval follows the web ramp: interval * (1 -
        // progress * (1 - endOfFlightSpawnFactor)) for the crew difficulty.
        val progress = first.elapsedMs / CabinEngine.Tuning.CRUISE_MS
        val expected = CabinEngine.Difficulty.CREW.spawnIntervalMs *
            (1 - progress * (1 - CabinEngine.Tuning.END_OF_FLIGHT_SPAWN_FACTOR))
        assertEquals(expected, first.spawnCooldownMs, 1.0)
    }
}
