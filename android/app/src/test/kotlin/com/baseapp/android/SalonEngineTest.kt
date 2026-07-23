package com.baseapp.android

import com.baseapp.android.view.games.salon.SalonEngine
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure salon engine against the web rules it mirrors
 * (`clients.ts` scoring/generation plus the SalonPage station machines):
 * deterministic and satisfiable client generation, wash completion, cut
 * gating, dye and length scoring bands, the total-score formula for perfect
 * and botched makeovers, and the mood thresholds.
 */
class SalonEngineTest {
    /**
     * A scripted random source: returns the queued doubles in order (also
     * serving nextFloat), then repeats the last value forever.
     */
    private class ScriptedRandom(private val values: List<Double>) : Random() {
        private var index = 0

        override fun nextBits(bitCount: Int): Int =
            (nextDouble() * (1L shl bitCount)).toInt()

        override fun nextDouble(): Double {
            val value = values[minOf(index, values.size - 1)]
            index += 1
            return value
        }

        override fun nextFloat(): Float = nextDouble().toFloat()
    }

    // MARK: Client generation

    @Test
    fun clientGenerationIsDeterministicWithInjectedRng() {
        val script = listOf(0.0, 0.3, 0.1, 0.2, 0.4, 0.6, 0.4, 0.5, 0.7, 0.8, 0.2)
        val first = SalonEngine.rollClient(ScriptedRandom(script))
        val second = SalonEngine.rollClient(ScriptedRandom(script))
        assertEquals(first, second)

        // Spot-check the pick math against the web tables (same call order
        // as `randomClient`): 0.0 → first walk-in color (brown); 0.3 < 0.5 →
        // accessory wish granted; 0.1 → name floor(0.1 * 12) = 1 (Milo).
        assertEquals(SalonEngine.HairColor.BROWN, first.startLook.color)
        assertTrue(first.request.accessory != null)
        assertEquals("Milo", first.name)
    }

    @Test
    fun everyGeneratedClientIsSatisfiable() {
        // A request is satisfiable when every wish is a pickable option and
        // the color differs from the walk-in color (no "keep it" swatch).
        val random = Random(seed = 42)
        repeat(200) {
            val client = SalonEngine.rollClient(random)
            assertNotEquals(client.startLook.color, client.request.color)
            assertNotEquals(SalonEngine.Accessory.NONE, client.request.accessory)
            // Walk-in look is always the same tangled baseline as the web.
            assertEquals(SalonEngine.HairLength.LONG, client.startLook.length)
            assertEquals(SalonEngine.HairTexture.STRAIGHT, client.startLook.texture)
            assertEquals(SalonEngine.Accessory.NONE, client.startLook.accessory)
            assertTrue(client.startLook.color in SalonEngine.WALK_IN_COLORS)
        }
    }

    // MARK: Wash station

    @Test
    fun washCompletesAtFullProgressAndAdvancesToCut() {
        val engine = SalonEngine(random = Random(seed = 7))
        assertEquals(SalonEngine.Station.WASH, engine.station)
        assertEquals(SalonEngine.BUBBLE_COUNT, engine.bubbles.size)
        assertEquals(0f, engine.cleanliness, 0.0001f)

        // Each bubble needs exactly SCRUBS_TO_POP passes; the last pop flips
        // the station to cut with cleanliness at 1.
        engine.bubbles.map { it.id }.forEach { id ->
            repeat(SalonEngine.SCRUBS_TO_POP - 1) {
                assertFalse(engine.scrub(id))
            }
            assertTrue(engine.scrub(id))
        }
        assertEquals(1f, engine.cleanliness, 0.0001f)
        assertEquals(SalonEngine.Station.CUT, engine.station)

        // Popped bubbles ignore further scrubs (web handleScrub early-return).
        assertFalse(engine.scrub(0))
    }

    @Test
    fun partialWashLeavesPartialCleanliness() {
        val engine = SalonEngine(random = Random(seed = 7))
        // Fully pop 4 of 10 bubbles → cleanliness 0.4, still at the wash.
        (0 until 4).forEach { id ->
            repeat(SalonEngine.SCRUBS_TO_POP) { engine.scrub(id) }
        }
        assertEquals(0.4f, engine.cleanliness, 0.0001f)
        assertEquals(SalonEngine.Station.WASH, engine.station)
    }

    // MARK: Cut station

    @Test
    fun cutRequiresLengthChoiceAndAllStraysSnipped() {
        val engine = engineAtCut(ScriptedRandom(listOf(0.5)))

        // Cannot advance before choosing a length.
        assertFalse(engine.cutDone)
        engine.advanceToColor()
        assertEquals(SalonEngine.Station.CUT, engine.station)

        engine.chooseLength(SalonEngine.HairLength.SHORT)
        assertTrue(engine.lengthChosen)
        assertEquals(SalonEngine.HairLength.SHORT, engine.look.length)
        // random 0.5 → 2 + floor(0.5 * 2) = 3 strays, alternating sides.
        assertEquals(3, engine.strays.size)
        assertEquals(listOf(1f, -1f, 1f), engine.strays.map { it.direction })
        assertFalse(engine.cutDone)

        engine.strays.map { it.id }.forEach { engine.snip(it) }
        assertTrue(engine.cutDone)
        engine.advanceToColor()
        assertEquals(SalonEngine.Station.COLOR, engine.station)
    }

    @Test
    fun rePickingLengthReRollsStrays() {
        val engine = engineAtCut(Random(seed = 3))
        engine.chooseLength(SalonEngine.HairLength.SHORT)
        engine.strays.map { it.id }.forEach { engine.snip(it) }
        assertTrue(engine.cutDone)

        // Changing your mind re-rolls fresh (unsnipped) strays, like the web.
        engine.chooseLength(SalonEngine.HairLength.LONG)
        assertEquals(SalonEngine.HairLength.LONG, engine.look.length)
        assertFalse(engine.cutDone)
        assertTrue(engine.strays.none { it.snipped })
    }

    // MARK: Scoring

    @Test
    fun cutAccuracyScoringBands() {
        // Length is scored as a single 25-point band: exact match or nothing.
        val request = request(length = SalonEngine.HairLength.SHORT, accessory = null)
        val matched = SalonEngine.scoreLook(
            request, look(length = SalonEngine.HairLength.SHORT), cleanliness = 0f,
        )
        assertTrue(matched.lengthMatch)
        val missed = SalonEngine.scoreLook(
            request, look(length = SalonEngine.HairLength.LONG), cleanliness = 0f,
        )
        assertFalse(missed.lengthMatch)
        assertEquals(SalonEngine.POINTS_PER_MATCH, matched.total - missed.total)
    }

    @Test
    fun dyeMatchAndMismatchScoring() {
        val request = request(color = SalonEngine.HairColor.MINT, accessory = null)
        val matched = SalonEngine.scoreLook(
            request, look(color = SalonEngine.HairColor.MINT), cleanliness = 1f,
        )
        assertTrue(matched.colorMatch)
        val mismatched = SalonEngine.scoreLook(
            request, look(color = SalonEngine.HairColor.BLACK), cleanliness = 1f,
        )
        assertFalse(mismatched.colorMatch)
        assertEquals(SalonEngine.POINTS_PER_MATCH, matched.total - mismatched.total)
    }

    @Test
    fun perfectMakeoverMatchesWebFormula() {
        // With an accessory wish: max = 25 * 4 + 25 = 125, and a perfect
        // look with a full scrub earns all of it.
        val wish = request(accessory = SalonEngine.Accessory.TIARA)
        val perfect = SalonEngine.scoreLook(
            wish, look(accessory = SalonEngine.Accessory.TIARA), cleanliness = 1f,
        )
        assertEquals(125, perfect.max)
        assertEquals(125, perfect.total)
        assertEquals(SalonEngine.WASH_BONUS_MAX, perfect.washBonus)

        // Without an accessory wish the ceiling drops to 25 * 3 + 25 = 100.
        val noWish = request(accessory = null)
        val capped = SalonEngine.scoreLook(noWish, look(), cleanliness = 1f)
        assertEquals(100, capped.max)
        assertEquals(100, capped.total)
        assertNull(capped.accessoryMatch)
    }

    @Test
    fun botchedMakeoverMatchesWebFormula() {
        // Nothing matches, half a scrub: total = 0 + round(0.5 * 25) = 13.
        val wish = request(
            length = SalonEngine.HairLength.SHORT,
            color = SalonEngine.HairColor.PINK,
            texture = SalonEngine.HairTexture.UPDO,
            accessory = SalonEngine.Accessory.BOW,
        )
        val botched = SalonEngine.scoreLook(
            wish,
            look(
                length = SalonEngine.HairLength.LONG,
                color = SalonEngine.HairColor.BLACK,
                texture = SalonEngine.HairTexture.STRAIGHT,
            ),
            cleanliness = 0.5f,
        )
        assertEquals(13, botched.washBonus)
        assertEquals(13, botched.total)
        assertEquals(125, botched.max)
        assertEquals(false, botched.accessoryMatch)
    }

    // MARK: Reactions

    @Test
    fun reactionThresholds() {
        // moodFor bands: ≥ 0.9 delighted, ≥ 0.55 happy, below grimace.
        assertEquals(SalonEngine.Mood.DELIGHTED, SalonEngine.moodFor(score(125, 125)))
        assertEquals(SalonEngine.Mood.DELIGHTED, SalonEngine.moodFor(score(113, 125))) // 0.904
        assertEquals(SalonEngine.Mood.HAPPY, SalonEngine.moodFor(score(112, 125))) // 0.896
        assertEquals(SalonEngine.Mood.HAPPY, SalonEngine.moodFor(score(69, 125))) // 0.552
        assertEquals(SalonEngine.Mood.GRIMACE, SalonEngine.moodFor(score(68, 125))) // 0.544
        assertEquals(SalonEngine.Mood.GRIMACE, SalonEngine.moodFor(score(0, 100)))
        // Exact boundaries.
        assertEquals(SalonEngine.Mood.DELIGHTED, SalonEngine.moodFor(score(90, 100)))
        assertEquals(SalonEngine.Mood.HAPPY, SalonEngine.moodFor(score(55, 100)))
        assertEquals(SalonEngine.Mood.GRIMACE, SalonEngine.moodFor(score(54, 100)))
    }

    @Test
    fun revealUpdatesStreaks() {
        // Play a full round and grant the client every wish → delighted.
        val engine = SalonEngine(random = Random(seed = 11))
        completeWash(engine)
        engine.chooseLength(engine.client.request.length)
        engine.strays.map { it.id }.forEach { engine.snip(it) }
        engine.advanceToColor()
        engine.applyDye(engine.client.request.color)
        engine.advanceToStyle()
        engine.chooseTexture(engine.client.request.texture)
        engine.advanceToFinish()
        engine.client.request.accessory?.let { engine.chooseAccessory(it) }
        engine.reveal()

        assertEquals(SalonEngine.Station.REVEAL, engine.station)
        assertEquals(SalonEngine.Mood.DELIGHTED, engine.mood)
        assertEquals(engine.score?.max, engine.score?.total)
        assertEquals(1, engine.streak)
        assertEquals(1, engine.bestStreak)
        assertTrue(engine.mood.lines.contains(engine.reactionLine))

        // Next client resets the stations but keeps the streaks.
        engine.nextClient()
        assertEquals(SalonEngine.Station.WASH, engine.station)
        assertNull(engine.score)
        assertEquals(1, engine.streak)
        assertEquals(1, engine.bestStreak)
    }

    // MARK: Helpers

    private fun engineAtCut(random: Random): SalonEngine {
        val engine = SalonEngine(random = random)
        completeWash(engine)
        assertEquals(SalonEngine.Station.CUT, engine.station)
        return engine
    }

    private fun completeWash(engine: SalonEngine) {
        engine.bubbles.map { it.id }.forEach { id ->
            repeat(SalonEngine.SCRUBS_TO_POP) { engine.scrub(id) }
        }
    }

    private fun request(
        length: SalonEngine.HairLength = SalonEngine.HairLength.LONG,
        color: SalonEngine.HairColor = SalonEngine.HairColor.PURPLE,
        texture: SalonEngine.HairTexture = SalonEngine.HairTexture.BRAIDS,
        accessory: SalonEngine.Accessory? = null,
    ) = SalonEngine.ClientRequest(length, color, texture, accessory)

    private fun look(
        length: SalonEngine.HairLength = SalonEngine.HairLength.LONG,
        color: SalonEngine.HairColor = SalonEngine.HairColor.PURPLE,
        texture: SalonEngine.HairTexture = SalonEngine.HairTexture.BRAIDS,
        accessory: SalonEngine.Accessory = SalonEngine.Accessory.NONE,
    ) = SalonEngine.HairLook(length, color, texture, accessory)

    private fun score(total: Int, max: Int) = SalonEngine.Score(
        lengthMatch = false,
        colorMatch = false,
        textureMatch = false,
        accessoryMatch = null,
        washBonus = 0,
        total = total,
        max = max,
    )
}
