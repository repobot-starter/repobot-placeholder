package com.baseapp.android

import com.baseapp.android.view.flash.FlashContent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Guards the deck data the flash pack ships with: saved progress is keyed
 * by deck id + card front, so both must stay unique and non-empty.
 */
class FlashContentTest {
    @Test
    fun `every deck has an id title emoji description and cards`() {
        assertTrue(FlashContent.decks.isNotEmpty())
        for (deck in FlashContent.decks) {
            assertTrue(deck.id.isNotBlank())
            assertTrue(deck.title.isNotBlank())
            assertTrue(deck.emoji.isNotBlank())
            assertTrue(deck.description.isNotBlank())
            assertTrue("deck ${deck.id} needs cards", deck.cards.isNotEmpty())
        }
    }

    @Test
    fun `deck ids are unique`() {
        val ids = FlashContent.decks.map { it.id }
        assertEquals(ids.size, ids.toSet().size)
    }

    @Test
    fun `card fronts are unique within each deck and never blank`() {
        for (deck in FlashContent.decks) {
            val fronts = deck.cards.map { it.front }
            assertEquals("duplicate fronts in ${deck.id}", fronts.size, fronts.toSet().size)
            for (card in deck.cards) {
                assertTrue(card.front.isNotBlank())
                assertTrue(card.back.isNotBlank())
                assertFalse(card.hint?.isBlank() ?: false)
            }
        }
    }

    @Test
    fun `progress keys never collide with the storage separator`() {
        // SharedPreferences keys are "deckId::front", so neither part may
        // contain the separator.
        for (deck in FlashContent.decks) {
            assertFalse(deck.id.contains("::"))
            for (card in deck.cards) {
                assertFalse(card.front.contains("::"))
            }
        }
    }
}
