package com.baseapp.android

import com.baseapp.android.view.menu.MenuHours
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Mirrors the web pack's hours.test.ts — the opening-hours logic is the
 * menu pack's "engine", and the "Open now" badge must agree on every
 * platform.
 */
class MenuHoursTest {
    /** Tue/Wed 7–15, Fri 7–15 and 17–21; closed the rest of the week. */
    private val hours = listOf(
        MenuHours.DayHours(day = 2, intervals = listOf(420 to 900)),
        MenuHours.DayHours(day = 3, intervals = listOf(420 to 900)),
        MenuHours.DayHours(day = 5, intervals = listOf(420 to 900, 1020 to 1260)),
    )

    @Test
    fun `open inside an interval and closed at its exact end`() {
        assertTrue(MenuHours.isOpen(hours, day = 2, minute = 420))
        assertTrue(MenuHours.isOpen(hours, day = 2, minute = 899))
        assertFalse(MenuHours.isOpen(hours, day = 2, minute = 900))
        assertFalse(MenuHours.isOpen(hours, day = 1, minute = 600))
    }

    @Test
    fun `handles a split day with two services`() {
        assertFalse(MenuHours.isOpen(hours, day = 5, minute = 960))
        assertTrue(MenuHours.isOpen(hours, day = 5, minute = 1020))
    }

    @Test
    fun `reports the closing time while open`() {
        assertEquals(
            MenuHours.OpenStatus(open = true, nextChangeDay = 2, nextChangeMinute = 900),
            MenuHours.statusAt(hours, day = 2, minute = 600),
        )
    }

    @Test
    fun `reports the second service when between intervals`() {
        assertEquals(
            MenuHours.OpenStatus(open = false, nextChangeDay = 5, nextChangeMinute = 1020),
            MenuHours.statusAt(hours, day = 5, minute = 960),
        )
    }

    @Test
    fun `rolls to the next open day across the closed weekend`() {
        assertEquals(
            MenuHours.OpenStatus(open = false, nextChangeDay = 2, nextChangeMinute = 420),
            MenuHours.statusAt(hours, day = 5, minute = 1300),
        )
    }

    @Test
    fun `empty schedule has no transition`() {
        assertEquals(
            MenuHours.OpenStatus(open = false),
            MenuHours.statusAt(emptyList(), day = 2, minute = 600),
        )
    }

    @Test
    fun `formats minutes as 12-hour times`() {
        assertEquals("12 AM", MenuHours.formatMinute(0))
        assertEquals("7 AM", MenuHours.formatMinute(420))
        assertEquals("12:30 PM", MenuHours.formatMinute(750))
        assertEquals("9 PM", MenuHours.formatMinute(1260))
    }

    @Test
    fun `builds open and closed labels`() {
        assertEquals("Open — closes 3 PM", MenuHours.statusLabel(hours, day = 2, minute = 600))
        assertEquals("Closed — opens 5 PM", MenuHours.statusLabel(hours, day = 5, minute = 960))
        assertEquals(
            "Closed — opens Tuesday 7 AM",
            MenuHours.statusLabel(hours, day = 6, minute = 600),
        )
        assertEquals("Closed", MenuHours.statusLabel(emptyList(), day = 2, minute = 600))
    }
}
