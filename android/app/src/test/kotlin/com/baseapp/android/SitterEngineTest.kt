package com.baseapp.android

import com.baseapp.android.view.games.sitter.SitterEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure SitterBot simulation against the web `mishaps.ts` +
 * `SitterPage.tsx` rules it mirrors: escalation timing, tool matching,
 * multi-tap and hold fixes, the scripted bathtub overflow, end-of-shift
 * scoring, and deterministic spawns through the injected random source.
 */
class SitterEngineTest {
    /** The web tick: 100ms. */
    private val tick = 0.1

    private fun engine(
        difficulty: SitterEngine.Difficulty = SitterEngine.Difficulty.NORMAL,
        random: () -> Double = { 0.5 },
    ): SitterEngine = SitterEngine(difficulty = difficulty, random = random).apply { startShift() }

    /** Steps in web-sized ticks until `elapsedMs` reaches at least [targetMs]. */
    private fun advance(engine: SitterEngine, targetMs: Double): List<SitterEngine.Event> {
        val events = mutableListOf<SitterEngine.Event>()
        while (engine.elapsedMs < targetMs && engine.isPlaying) {
            events.addAll(engine.step(tick))
        }
        return events
    }

    // ---- Escalation ---------------------------------------------------------

    @Test
    fun mishapEscalatesIntoMessAtTwelveSecondsAndPanicsTheKids() {
        val engine = engine()
        val id = engine.forceSpawn(SitterEngine.MishapKey.JUICE, SitterEngine.RoomKey.LIVING)

        // Just inside the 12s timer: still fresh.
        advance(engine, SitterEngine.MISHAP_TIMER_MS - 200)
        assertFalse(engine.mishaps.first { it.id == id }.isMess)

        // Crossing the timer: hardens into a MESS, exactly like the web.
        val events = advance(engine, SitterEngine.MISHAP_TIMER_MS + 200)
        assertTrue(events.contains(SitterEngine.Event.MishapBecameMess(id)))
        assertTrue(engine.mishaps.first { it.id == id }.isMess)

        // Messes rile the kids up: every wander clock is pulled inside the
        // panic window (web KID_PANIC_MS).
        for (kid in engine.kids) {
            assertTrue(kid.nextMoveAtMs <= engine.elapsedMs + SitterEngine.KID_PANIC_MS)
        }

        // A mess is permanent unless fixed: 30 more seconds change nothing.
        advance(engine, engine.elapsedMs + 30_000)
        assertTrue(engine.mishaps.any { it.id == id && it.isMess })
    }

    // ---- Tool matching ------------------------------------------------------

    @Test
    fun correctToolFixesAndCreditsKidCare() {
        val engine = engine()

        // Mop fixes the juice; not a kid-care mishap.
        val juiceId = engine.forceSpawn(SitterEngine.MishapKey.JUICE, SitterEngine.RoomKey.KITCHEN)
        assertEquals(
            SitterEngine.TapOutcome.Fixed,
            engine.applyTool(SitterEngine.ToolKey.MOP, juiceId),
        )
        assertEquals(1, engine.fixes)
        assertEquals(0, engine.kidCare)
        assertTrue(engine.mishaps.isEmpty())

        // Snack fixes the hungry kid and feeds the happiness score.
        val hungryId = engine.forceSpawn(SitterEngine.MishapKey.HUNGRY, SitterEngine.RoomKey.BEDROOM)
        assertEquals(
            SitterEngine.TapOutcome.Fixed,
            engine.applyTool(SitterEngine.ToolKey.SNACK, hungryId),
        )
        assertEquals(2, engine.fixes)
        assertEquals(1, engine.kidCare)
    }

    @Test
    fun toyExplosionNeedsThreeTidyTaps() {
        val engine = engine()
        val id = engine.forceSpawn(SitterEngine.MishapKey.TOYS, SitterEngine.RoomKey.LIVING)

        assertEquals(
            SitterEngine.TapOutcome.Progressed(2),
            engine.applyTool(SitterEngine.ToolKey.TIDY, id),
        )
        assertEquals(
            SitterEngine.TapOutcome.Progressed(1),
            engine.applyTool(SitterEngine.ToolKey.TIDY, id),
        )
        assertEquals(
            SitterEngine.TapOutcome.Fixed,
            engine.applyTool(SitterEngine.ToolKey.TIDY, id),
        )
        assertEquals(1, engine.fixes)
        assertTrue(engine.mishaps.isEmpty())
    }

    @Test
    fun wrongToolOrNoToolLeavesTheMishapAndScoresNothing() {
        val engine = engine()
        val id = engine.forceSpawn(SitterEngine.MishapKey.JUICE, SitterEngine.RoomKey.BATHROOM)

        // Wrong tool: the kids giggle, nothing is fixed (the web's only
        // penalty — the mishap keeps aging toward MESS).
        assertEquals(
            SitterEngine.TapOutcome.WrongTool,
            engine.applyTool(SitterEngine.ToolKey.HUG, id),
        )
        assertEquals(0, engine.fixes)
        assertEquals(1, engine.mishaps.size)
        assertEquals("🤗 WON'T FIX THAT! THE KIDS GIGGLE AT YOU.", engine.statusMessage)

        // No tool selected: same, with a nudge toward the tray.
        assertEquals(SitterEngine.TapOutcome.NoToolSelected, engine.applyTool(null, id))
        assertEquals(0, engine.fixes)
        assertEquals(1, engine.mishaps.size)
    }

    @Test
    fun hugIsAHoldFixThatCancelsOnRelease() {
        val engine = engine()
        val id = engine.forceSpawn(SitterEngine.MishapKey.CRYING, SitterEngine.RoomKey.BEDROOM)

        // Press: the 2000ms hold starts but nothing is fixed yet. (Unrelated
        // mishaps keep spawning naturally, so assert on this id, not counts.)
        assertEquals(
            SitterEngine.TapOutcome.HoldStarted,
            engine.applyTool(SitterEngine.ToolKey.HUG, id),
        )
        engine.step(1.0)
        assertTrue(engine.mishaps.any { it.id == id })
        assertEquals(0.5, engine.holdProgress, 0.001)

        // Letting go early cancels: 3 more seconds without holding fix nothing.
        engine.releaseHold()
        engine.step(3.0)
        assertTrue(engine.mishaps.any { it.id == id })

        // Holding through the full 2000ms completes the hug and credits care.
        assertEquals(
            SitterEngine.TapOutcome.HoldStarted,
            engine.applyTool(SitterEngine.ToolKey.HUG, id),
        )
        engine.step(1.0)
        val events = engine.step(1.1)
        assertTrue(events.contains(SitterEngine.Event.MishapFixed(SitterEngine.MishapKey.CRYING)))
        assertFalse(engine.mishaps.any { it.id == id })
        assertEquals(1, engine.fixes)
        assertEquals(1, engine.kidCare)
    }

    // ---- The scripted emergency ---------------------------------------------

    @Test
    fun overflowFiresAtTheOneMinuteMarkAndFloodsIfIgnored() {
        val engine = engine()

        // Before the 1:00-remaining mark, the tub is quiet.
        advance(engine, SitterEngine.SHIFT_LENGTH_MS - SitterEngine.OVERFLOW_AT_REMAINING_MS - 200)
        assertEquals(SitterEngine.OverflowStage.WAITING, engine.overflowStage)

        // At remaining <= 60s it activates...
        val startEvents = advance(
            engine,
            SitterEngine.SHIFT_LENGTH_MS - SitterEngine.OVERFLOW_AT_REMAINING_MS + 200,
        )
        assertTrue(startEvents.contains(SitterEngine.Event.OverflowStarted))
        assertEquals(SitterEngine.OverflowStage.ACTIVE, engine.overflowStage)

        // ...and 8 ignored seconds later the bathroom floods, for good.
        val floodEvents = advance(engine, engine.elapsedMs + SitterEngine.OVERFLOW_WINDOW_MS + 200)
        assertTrue(floodEvents.contains(SitterEngine.Event.BathroomFlooded))
        assertEquals(SitterEngine.OverflowStage.FLOODED, engine.overflowStage)
    }

    @Test
    fun fiveTapsShutOffTheTubAndCountAsAFix() {
        val engine = engine()
        advance(engine, SitterEngine.SHIFT_LENGTH_MS - SitterEngine.OVERFLOW_AT_REMAINING_MS + 200)
        assertEquals(SitterEngine.OverflowStage.ACTIVE, engine.overflowStage)

        val fixesBefore = engine.fixes
        repeat(SitterEngine.OVERFLOW_CLICKS - 1) {
            assertFalse(engine.tapOverflow())
        }
        assertTrue(engine.tapOverflow())
        assertEquals(SitterEngine.OverflowStage.SHUT_OFF, engine.overflowStage)
        assertEquals(fixesBefore + 1, engine.fixes)

        // Once shut off it never floods.
        advance(engine, engine.elapsedMs + SitterEngine.OVERFLOW_WINDOW_MS + 1_000)
        assertEquals(SitterEngine.OverflowStage.SHUT_OFF, engine.overflowStage)
    }

    // ---- Scoring --------------------------------------------------------------

    @Test
    fun scoreShiftMirrorsTheWebMath() {
        // Leftovers cost 8, messes double that (16), a flood costs 25 —
        // straight from the web penalty constants.
        val messy = SitterEngine.scoreShift(
            SitterEngine.ShiftReport(
                fixes = 10, kidCare = 2, leftoverMishaps = 1, leftoverMesses = 1, flooded = false,
            ),
        )
        // tidiness 100-8-16=76, happiness 40+30+30=100, overall 85.6 → 4 stars.
        assertEquals(76, messy.tidiness)
        assertEquals(100, messy.happiness)
        assertEquals(4, messy.stars)
        assertEquals(4 * SitterEngine.BASE_PAY_PER_STAR + 10 * SitterEngine.TIP_PER_FIX, messy.pay)

        // An ignored mess costs exactly double an ignored fresh mishap.
        val oneMishap = SitterEngine.scoreShift(
            SitterEngine.ShiftReport(
                fixes = 0, kidCare = 0, leftoverMishaps = 1, leftoverMesses = 0, flooded = false,
            ),
        )
        val oneMess = SitterEngine.scoreShift(
            SitterEngine.ShiftReport(
                fixes = 0, kidCare = 0, leftoverMishaps = 0, leftoverMesses = 1, flooded = false,
            ),
        )
        assertEquals(SitterEngine.UNFIXED_PENALTY, 100 - oneMishap.tidiness)
        assertEquals(SitterEngine.MESS_PENALTY, 100 - oneMess.tidiness)

        // Disaster shift: tidiness clamps at 0, happiness floor is 40 → 1 star.
        val disaster = SitterEngine.scoreShift(
            SitterEngine.ShiftReport(
                fixes = 0, kidCare = 0, leftoverMishaps = 5, leftoverMesses = 3, flooded = true,
            ),
        )
        assertEquals(0, disaster.tidiness)
        assertEquals(40, disaster.happiness)
        assertEquals(1, disaster.stars)
        assertEquals(SitterEngine.BASE_PAY_PER_STAR, disaster.pay)

        // 5-star boundary: overall 89.2 rates 4 stars, 90.4 rates 5.
        val fourStars = SitterEngine.scoreShift(
            SitterEngine.ShiftReport(
                fixes = 6, kidCare = 1, leftoverMishaps = 0, leftoverMesses = 0, flooded = false,
            ),
        )
        assertEquals(4, fourStars.stars)
        val fiveStars = SitterEngine.scoreShift(
            SitterEngine.ShiftReport(
                fixes = 7, kidCare = 1, leftoverMishaps = 0, leftoverMesses = 0, flooded = false,
            ),
        )
        assertEquals(5, fiveStars.stars)
    }

    @Test
    fun shiftEndsAtTwoMinutesWithAConsistentReport() {
        val engine = engine()
        var endResult: SitterEngine.ShiftResult? = null

        while (engine.isPlaying) {
            for (event in engine.step(tick)) {
                if (event is SitterEngine.Event.ShiftEnded) {
                    endResult = event.result
                }
            }
        }

        assertFalse(engine.isPlaying)
        assertNotNull(endResult)
        assertEquals(endResult, engine.result)
        assertTrue(engine.elapsedMs >= SitterEngine.SHIFT_LENGTH_MS)

        // Nobody touched the tub, so the untended overflow must have flooded,
        // and the leftover mishaps/messes must reproduce the final score.
        assertEquals(SitterEngine.OverflowStage.FLOODED, engine.overflowStage)
        val leftoverMesses = engine.mishaps.count { it.isMess }
        val expected = SitterEngine.scoreShift(
            SitterEngine.ShiftReport(
                fixes = engine.fixes,
                kidCare = engine.kidCare,
                leftoverMishaps = engine.mishaps.size - leftoverMesses,
                leftoverMesses = leftoverMesses,
                flooded = true,
            ),
        )
        assertEquals(expected, engine.result)

        // A finished shift is inert until the next doorbell.
        assertTrue(engine.step(tick).isEmpty())
    }

    // ---- Spawning ---------------------------------------------------------------

    @Test
    fun spawnIntervalRampsAndSpeedsUpOnReplays() {
        // Shift start vs end mirrors the DIFFICULTIES table (normal: 5500→3000).
        assertEquals(
            5_500.0,
            SitterEngine.spawnIntervalMs(0.0, SitterEngine.Difficulty.NORMAL, 1),
            0.001,
        )
        assertEquals(
            3_000.0,
            SitterEngine.spawnIntervalMs(
                SitterEngine.SHIFT_LENGTH_MS, SitterEngine.Difficulty.NORMAL, 1,
            ),
            0.001,
        )
        // Each replay multiplies by 0.92...
        assertEquals(
            5_500.0 * 0.92,
            SitterEngine.spawnIntervalMs(0.0, SitterEngine.Difficulty.NORMAL, 2),
            0.001,
        )
        // ...but never below the 1500ms floor.
        assertEquals(
            SitterEngine.MIN_SPAWN_MS,
            SitterEngine.spawnIntervalMs(
                SitterEngine.SHIFT_LENGTH_MS, SitterEngine.Difficulty.CHAOS, 20,
            ),
            0.001,
        )
    }

    @Test
    fun injectedRngMakesSpawnsFullyDeterministic() {
        // random() == 0 always picks the first weighted kind (juice), the
        // first room (living), and the minimum spot (12%, 34%).
        val zeroEngine = engine(random = { 0.0 })
        val spawnEvents = advance(zeroEngine, SitterEngine.FIRST_SPAWN_MS + 100)
            .filterIsInstance<SitterEngine.Event.MishapSpawned>()
        assertEquals(1, spawnEvents.size)
        assertEquals(SitterEngine.MishapKey.JUICE, spawnEvents[0].key)
        assertEquals(SitterEngine.RoomKey.LIVING, spawnEvents[0].room)
        val mishap = zeroEngine.mishaps[0]
        assertEquals(12.0, mishap.x, 0.001)
        assertEquals(34.0, mishap.y, 0.001)
        assertEquals(SitterEngine.FIRST_SPAWN_MS, mishap.spawnedAtMs, 1.0)

        // random() == 0.99 rolls past every other weight to the last kind
        // (tv) and the last room (bathroom) — the web pickMishapKind walk.
        val highEngine = engine(random = { 0.99 })
        advance(highEngine, SitterEngine.FIRST_SPAWN_MS + 100)
        assertEquals(1, highEngine.mishaps.size)
        assertEquals(SitterEngine.MishapKey.TV, highEngine.mishaps[0].kind.key)
        assertEquals(SitterEngine.RoomKey.BATHROOM, highEngine.mishaps[0].room)

        // Two engines sharing the same RNG stream stay in lockstep.
        val a = engine(random = { 0.37 })
        val b = engine(random = { 0.37 })
        advance(a, 30_000.0)
        advance(b, 30_000.0)
        assertEquals(a.mishaps, b.mishaps)
        assertEquals(a.kids, b.kids)
    }

    @Test
    fun kidsWanderToADifferentRoomOnTheirClock() {
        val engine = engine()
        // With random() == 0.5 both kids start in the bedroom (room index 2)
        // and first move at 1500 + 0.5*2500 = 2750ms.
        assertEquals(
            listOf(SitterEngine.RoomKey.BEDROOM, SitterEngine.RoomKey.BEDROOM),
            engine.kids.map { it.room },
        )

        advance(engine, 2_800.0)
        for (kid in engine.kids) {
            assertTrue(kid.room != SitterEngine.RoomKey.BEDROOM)
            assertEquals(1, kid.hopToken)
            // Next wander lands in the 3-6s window (web KID_MOVE_MIN/MAX).
            assertTrue(kid.nextMoveAtMs - engine.elapsedMs >= 2_000)
            assertTrue(kid.nextMoveAtMs <= engine.elapsedMs + SitterEngine.KID_MOVE_MAX_MS)
        }
    }

    @Test
    fun houseCapsAtEightActiveMishaps() {
        val engine = engine()
        repeat(SitterEngine.MAX_ACTIVE_MISHAPS) {
            engine.forceSpawn(SitterEngine.MishapKey.JUICE, SitterEngine.RoomKey.LIVING)
        }

        // Run long enough for several natural spawn attempts; the cap holds.
        advance(engine, 30_000.0)
        assertEquals(SitterEngine.MAX_ACTIVE_MISHAPS, engine.mishaps.size)
    }

    @Test
    fun mishapTableMirrorsTheWebData() {
        // Tool matching, click counts, hold durations, weights, kid-care
        // flags — the web MISHAP_KINDS table row for row.
        val kinds = SitterEngine.MISHAP_KINDS
        assertEquals(6, kinds.size)
        assertEquals(SitterEngine.ToolKey.MOP, SitterEngine.kindFor(SitterEngine.MishapKey.JUICE).tool)
        assertEquals(3.0, SitterEngine.kindFor(SitterEngine.MishapKey.JUICE).weight, 0.0)
        assertEquals(SitterEngine.ToolKey.HUG, SitterEngine.kindFor(SitterEngine.MishapKey.CRYING).tool)
        assertEquals(2_000.0, SitterEngine.kindFor(SitterEngine.MishapKey.CRYING).holdMs, 0.0)
        assertTrue(SitterEngine.kindFor(SitterEngine.MishapKey.CRYING).kidCare)
        assertTrue(SitterEngine.kindFor(SitterEngine.MishapKey.HUNGRY).kidCare)
        assertEquals(3, SitterEngine.kindFor(SitterEngine.MishapKey.TOYS).clicksToFix)
        assertEquals(SitterEngine.ToolKey.SPONGE, SitterEngine.kindFor(SitterEngine.MishapKey.CRAYON).tool)
        assertEquals(SitterEngine.ToolKey.REMOTE, SitterEngine.kindFor(SitterEngine.MishapKey.TV).tool)
        assertFalse(SitterEngine.kindFor(SitterEngine.MishapKey.TV).kidCare)
        assertEquals(4, SitterEngine.ROOMS.size)
        assertEquals(6, SitterEngine.TOOLS.size)
        assertEquals("sitter.bestPay", SitterEngine.BEST_PAY_KEY)
    }
}
