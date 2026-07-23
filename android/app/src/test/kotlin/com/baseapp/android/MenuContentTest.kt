package com.baseapp.android

import com.baseapp.android.view.menu.MenuContent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Content-integrity tests for the menu pack: prices, sections, and the
 * weekly schedule are the product, so malformed data is a build failure.
 */
class MenuContentTest {
    @Test
    fun `business identity is present`() {
        assertFalse(MenuContent.NAME.isEmpty())
        assertFalse(MenuContent.TAGLINE.isEmpty())
        assertFalse(MenuContent.ADDRESS.isEmpty())
        assertFalse(MenuContent.PHONE.isEmpty())
    }

    @Test
    fun `every section has unique items with positive prices`() {
        assertTrue(MenuContent.menu.isNotEmpty())
        val titles = MenuContent.menu.map { it.title }
        assertEquals("section titles must be unique", titles.toSet().size, titles.size)
        MenuContent.menu.forEach { section ->
            assertTrue("${section.title}: sections can't be empty", section.items.isNotEmpty())
            val names = section.items.map { it.name }
            assertEquals("${section.title}: item names must be unique", names.toSet().size, names.size)
            section.items.forEach { item ->
                assertTrue("${item.name}: price must be positive", item.priceCents > 0)
                assertFalse(item.description.isEmpty())
            }
        }
    }

    @Test
    fun `weekly hours are well-formed`() {
        MenuContent.weeklyHours.forEach { dayHours ->
            assertTrue(dayHours.day in 0..6)
            var previousClose = 0
            dayHours.intervals.forEach { (open, close) ->
                assertTrue("intervals must be forward", open < close)
                assertTrue("intervals must be sorted and non-overlapping", open >= previousClose)
                assertTrue(close <= 1440)
                previousClose = close
            }
        }
    }

    @Test
    fun `price formatting trims whole dollars`() {
        assertEquals("$14", MenuContent.formatPrice(1400))
        assertEquals("$9.50", MenuContent.formatPrice(950))
        assertEquals("$5.25", MenuContent.formatPrice(525))
    }
}
