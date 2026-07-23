package com.baseapp.android

import com.baseapp.android.view.games.style.StyleEngine
import com.baseapp.android.view.games.style.StyleItem
import com.baseapp.android.view.games.style.StyleSlotId
import com.baseapp.android.view.games.style.StyleTheme
import com.baseapp.android.view.games.style.StyleWardrobe
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Exercises the pure StyleBot engine against the web wardrobe.ts /
 * StylePage.tsx rules it mirrors: judge scoring weights, star thresholds,
 * the tick-driven round timer, deterministic theme rotation, and the
 * integrity of the ported wardrobe catalog.
 */
class StyleEngineTest {
    private fun engine(seed: Int = 7): StyleEngine = StyleEngine(random = Random(seed))

    private fun theme(name: String): StyleTheme =
        StyleWardrobe.THEMES.first { it.name == name }

    private fun item(id: String): StyleItem =
        StyleWardrobe.SLOTS.flatMap { it.items }.first { it.id == id }

    /** A head-to-toe gala look: every slot filled and every item on-theme. */
    private fun galaOutfit(): Map<StyleSlotId, StyleItem> = mapOf(
        StyleSlotId.HAT to item("crown"),
        StyleSlotId.TOP to item("ball-gown"),
        StyleSlotId.BOTTOM to item("silk-skirt"),
        StyleSlotId.SHOES to item("heels"),
        StyleSlotId.ACCESSORY to item("diamond-ring"),
    )

    /** Every slot filled with pajama/sport gear — all off-theme at the gala. */
    private fun offThemeOutfit(): Map<StyleSlotId, StyleItem> = mapOf(
        StyleSlotId.HAT to item("earmuff-phones"),
        StyleSlotId.TOP to item("martial-gi"),
        StyleSlotId.BOTTOM to item("flannel-pjs"),
        StyleSlotId.SHOES to item("fuzzy-socks"),
        StyleSlotId.ACCESSORY to item("teddy-bear"),
    )

    // ------------------------------------------------------------------
    // Scoring
    // ------------------------------------------------------------------

    @Test
    fun scoringRewardsOnThemeItemsPerWebWeights() {
        val gala = theme("Gala Night")

        // Full gala outfit: 5 matches x 20 + 20 full-match + 10 complete = 130.
        val perfect = StyleWardrobe.scoreOutfit(galaOutfit(), gala)
        assertEquals(5, perfect.matches)
        assertTrue(perfect.complete)
        assertTrue(perfect.fullMatch)
        assertEquals(StyleWardrobe.MAX_ROUND_SCORE, perfect.total)
        assertEquals(130, perfect.total)

        // Swapping one slot off-theme drops that item's 20 points AND the
        // 20-point full-match bonus, keeping only the complete-outfit 10.
        val oneMiss = galaOutfit() + (StyleSlotId.ACCESSORY to item("teddy-bear"))
        val nearMiss = StyleWardrobe.scoreOutfit(oneMiss, gala)
        assertEquals(4, nearMiss.matches)
        assertTrue(nearMiss.complete)
        assertFalse(nearMiss.fullMatch)
        assertEquals(4 * 20 + 10, nearMiss.total)

        // The same five items judged against Beach Day are all off-theme:
        // only the complete-outfit bonus survives.
        val wrongParty = StyleWardrobe.scoreOutfit(galaOutfit(), theme("Beach Day"))
        assertEquals(0, wrongParty.matches)
        assertEquals(StyleWardrobe.COMPLETE_OUTFIT_BONUS, wrongParty.total)

        // An incomplete outfit earns match points but no completion bonus.
        val partial = mapOf(
            StyleSlotId.HAT to item("crown"),
            StyleSlotId.TOP to item("ball-gown"),
        )
        val twoOnTheme = StyleWardrobe.scoreOutfit(partial, gala)
        assertEquals(2, twoOnTheme.matches)
        assertFalse(twoOnTheme.complete)
        assertEquals(2 * 20, twoOnTheme.total)

        // Multi-tag items match any theme sharing one tag: the hair bow
        // (pajama/school/gala) counts at both the gala and the school run.
        assertTrue(StyleWardrobe.itemMatchesTheme(item("hair-bow"), gala))
        assertTrue(StyleWardrobe.itemMatchesTheme(item("hair-bow"), theme("Rainy School Run")))
        assertFalse(StyleWardrobe.itemMatchesTheme(item("hair-bow"), theme("Snow Trip")))
    }

    @Test
    fun starThresholdsMatchWebRounding() {
        val gala = theme("Gala Night")

        // stars = round(total / 130 * 5), JS Math.round semantics.
        assertEquals(5, StyleWardrobe.scoreOutfit(galaOutfit(), gala).stars) // 130

        val fourOfFive = galaOutfit() + (StyleSlotId.ACCESSORY to item("teddy-bear"))
        assertEquals(3, StyleWardrobe.scoreOutfit(fourOfFive, gala).stars) // 90: 3.46 → 3

        val threeOnly = mapOf(
            StyleSlotId.HAT to item("crown"),
            StyleSlotId.TOP to item("ball-gown"),
            StyleSlotId.BOTTOM to item("silk-skirt"),
        )
        assertEquals(2, StyleWardrobe.scoreOutfit(threeOnly, gala).stars) // 60: 2.31 → 2

        val twoOnly = mapOf(
            StyleSlotId.HAT to item("crown"),
            StyleSlotId.TOP to item("ball-gown"),
        )
        assertEquals(2, StyleWardrobe.scoreOutfit(twoOnly, gala).stars) // 40: 1.54 → 2

        val oneOnly = mapOf(StyleSlotId.HAT to item("crown"))
        assertEquals(1, StyleWardrobe.scoreOutfit(oneOnly, gala).stars) // 20: 0.77 → 1

        assertEquals(0, StyleWardrobe.scoreOutfit(offThemeOutfit(), gala).stars) // 10: 0.38 → 0
        assertEquals(0, StyleWardrobe.scoreOutfit(emptyMap(), gala).stars) // naked: 0
    }

    // ------------------------------------------------------------------
    // Round timer
    // ------------------------------------------------------------------

    @Test
    fun timerExpiryEndsTheRound() {
        val engine = engine()
        engine.startSeason()
        assertEquals(StyleEngine.Phase.DRESSING, engine.phase)
        assertEquals(StyleWardrobe.ROUND_SECONDS, engine.secondsLeft)

        // 39 accumulated seconds tick the clock down without ending the
        // round, regardless of how the dt slices arrive.
        engine.tick(38.5f)
        engine.tick(0.5f)
        assertEquals(1, engine.secondsLeft)
        assertEquals(StyleEngine.Phase.DRESSING, engine.phase)

        // The final second locks the score and starts the walk automatically.
        val events = engine.tick(1f)
        assertTrue(StyleEngine.Event.TIME_EXPIRED in events)
        assertEquals(StyleEngine.Phase.WALKING, engine.phase)
        assertEquals(1, engine.roundScores.size)

        // The walk runs on the same tick clock and reveals the verdict at 2.6s.
        assertTrue(engine.tick(2.5f).isEmpty())
        assertEquals(StyleEngine.Phase.WALKING, engine.phase)
        val walkEvents = engine.tick(0.2f)
        assertTrue(StyleEngine.Event.VERDICT_REVEALED in walkEvents)
        assertEquals(StyleEngine.Phase.VERDICT, engine.phase)
        assertNotNull(engine.verdict)
    }

    @Test
    fun manualFinishLocksScoreAndSeasonEndsAfterFinalRound() {
        val engine = engine()
        engine.startSeason()

        repeat(StyleWardrobe.ROUNDS_PER_SEASON) { round ->
            assertEquals(round, engine.roundIndex)
            engine.shuffleOutfit()
            engine.finishRound()
            assertEquals(StyleEngine.Phase.WALKING, engine.phase)
            engine.tick(StyleEngine.WALK_DURATION_SECONDS)
            assertEquals(StyleEngine.Phase.VERDICT, engine.phase)
            engine.dismissVerdict()
        }

        assertEquals(StyleEngine.Phase.SEASON_OVER, engine.phase)
        assertEquals(StyleWardrobe.ROUNDS_PER_SEASON, engine.roundScores.size)
        assertEquals(engine.roundScores.sum(), engine.seasonTotal)

        // A finished season is inert until a new one starts.
        engine.finishRound()
        assertEquals(StyleEngine.Phase.SEASON_OVER, engine.phase)
        engine.startSeason()
        assertEquals(StyleEngine.Phase.DRESSING, engine.phase)
        assertEquals(0, engine.roundIndex)
        assertTrue(engine.roundScores.isEmpty())
    }

    @Test
    fun pickTogglesAndRespectsPhase() {
        val engine = engine()

        // Backstage: the closet is closed.
        engine.pick(item("crown"), StyleSlotId.HAT)
        assertNull(engine.outfit[StyleSlotId.HAT])

        engine.startSeason()
        engine.pick(item("crown"), StyleSlotId.HAT)
        assertEquals("crown", engine.outfit[StyleSlotId.HAT]?.id)
        // Picking the worn item takes it off (the web toggle).
        engine.pick(item("crown"), StyleSlotId.HAT)
        assertNull(engine.outfit[StyleSlotId.HAT])

        engine.shuffleOutfit()
        assertEquals(StyleWardrobe.SLOTS.size, engine.outfit.size)
        engine.clearOutfit()
        assertTrue(engine.outfit.isEmpty())
    }

    // ------------------------------------------------------------------
    // Theme rotation
    // ------------------------------------------------------------------

    @Test
    fun themeRotationIsDeterministicWithSeededRng() {
        val first = engine(seed = 7)
        val second = engine(seed = 7)
        first.startSeason()
        second.startSeason()

        // Same seed → same shuffled deck, and the deck is a true permutation.
        assertEquals(first.themes.map { it.name }, second.themes.map { it.name })
        assertEquals(StyleWardrobe.THEMES.size, first.themes.map { it.name }.toSet().size)

        // A different seed produces a different rotation (with these seeds).
        val third = engine(seed = 8)
        third.startSeason()
        assertNotEquals(first.themes.map { it.name }, third.themes.map { it.name })

        // Each round advances through the deck in order.
        val deck = first.themes.map { it.name }
        assertEquals(deck[0], first.theme?.name)
        first.finishRound()
        first.tick(StyleEngine.WALK_DURATION_SECONDS)
        first.dismissVerdict()
        assertEquals(deck[1], first.theme?.name)
    }

    // ------------------------------------------------------------------
    // Wardrobe data integrity
    // ------------------------------------------------------------------

    @Test
    fun wardrobeDataIntegrity() {
        // Five slots, one per outfit zone, each with a non-empty rack.
        assertEquals(StyleSlotId.entries.toList(), StyleWardrobe.SLOTS.map { it.id })
        StyleWardrobe.SLOTS.forEach { slot ->
            assertTrue("slot ${slot.id} has no items", slot.items.isNotEmpty())
            slot.items.forEach { item ->
                assertTrue("item ${item.id} has no tags", item.tags.isNotEmpty())
                assertTrue(item.name.isNotEmpty())
                assertTrue(item.emoji.isNotEmpty())
            }
        }

        // Item ids are unique across the whole catalog.
        val allIds = StyleWardrobe.SLOTS.flatMap { slot -> slot.items.map { it.id } }
        assertEquals(allIds.size, allIds.toSet().size)

        // Every theme can be judged (has tags + verdict lines) and can be
        // dressed for (at least one item in the catalog matches).
        val allItems = StyleWardrobe.SLOTS.flatMap { it.items }
        assertEquals(8, StyleWardrobe.THEMES.size)
        StyleWardrobe.THEMES.forEach { theme ->
            assertTrue("theme ${theme.name} has no tags", theme.tags.isNotEmpty())
            assertTrue("theme ${theme.name} has no verdicts", theme.verdicts.isNotEmpty())
            assertTrue(
                "no item matches theme ${theme.name}",
                allItems.any { StyleWardrobe.itemMatchesTheme(it, theme) },
            )
        }

        // The derived cap matches the web MAX_ROUND_SCORE (20*5 + 20 + 10).
        assertEquals(130, StyleWardrobe.MAX_ROUND_SCORE)
        assertEquals("style.bestScore", StyleWardrobe.BEST_SCORE_KEY)
    }
}
