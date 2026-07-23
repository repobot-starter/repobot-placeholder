package com.baseapp.android

import com.baseapp.android.view.flash.FlashScheduler
import java.util.Calendar
import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Mirrors the web pack's scheduler.test.ts and iOS FlashSchedulerTests so
 * the Leitner scheduler means the same thing on every platform.
 */
class FlashSchedulerTest {
    @Test
    fun `new cards start in box 1 and are due immediately`() {
        val state = FlashScheduler.newCardState()
        assertEquals(1, state.box)
        assertEquals(-1, state.lastReviewedDay)
        assertTrue(FlashScheduler.isDue(state, today = 0))
        assertTrue(FlashScheduler.isDue(state, today = 10_000))
    }

    @Test
    fun `good promotes one box and caps at the top box`() {
        var state = FlashScheduler.newCardState()
        for (expectedBox in 2..FlashScheduler.BOX_COUNT) {
            state = FlashScheduler.review(state, FlashScheduler.Grade.GOOD, today = 100)
            assertEquals(expectedBox, state.box)
        }
        state = FlashScheduler.review(state, FlashScheduler.Grade.GOOD, today = 100)
        assertEquals(FlashScheduler.BOX_COUNT, state.box)
    }

    @Test
    fun `again resets to box 1 from any box`() {
        var state = FlashScheduler.CardState(box = 4, lastReviewedDay = 50)
        state = FlashScheduler.review(state, FlashScheduler.Grade.AGAIN, today = 60)
        assertEquals(1, state.box)
        assertEquals(60, state.lastReviewedDay)
    }

    @Test
    fun `box intervals gate when a card comes back`() {
        // Box 3 waits 4 days.
        val state = FlashScheduler.CardState(box = 3, lastReviewedDay = 100)
        assertFalse(FlashScheduler.isDue(state, today = 101))
        assertFalse(FlashScheduler.isDue(state, today = 103))
        assertTrue(FlashScheduler.isDue(state, today = 104))
        assertTrue(FlashScheduler.isDue(state, today = 200))
    }

    @Test
    fun `dueIndices keeps stable order and filters correctly`() {
        val states = listOf(
            FlashScheduler.CardState(box = 1, lastReviewedDay = 100), // due day 101
            FlashScheduler.newCardState(), // always due
            FlashScheduler.CardState(box = 5, lastReviewedDay = 100), // due day 116
            FlashScheduler.CardState(box = 2, lastReviewedDay = 99), // due day 101
        )
        assertEquals(listOf(0, 1, 3), FlashScheduler.dueIndices(states, today = 101))
        assertEquals(listOf(1), FlashScheduler.dueIndices(states, today = 100))
    }

    @Test
    fun `deckProgress summarizes mastered seen and due`() {
        val states = listOf(
            FlashScheduler.newCardState(),
            FlashScheduler.CardState(box = 5, lastReviewedDay = 100),
            FlashScheduler.CardState(box = 2, lastReviewedDay = 100),
        )
        val progress = FlashScheduler.deckProgress(states, today = 101)
        assertEquals(3, progress.total)
        assertEquals(1, progress.mastered)
        assertEquals(2, progress.seen)
        // New card is due; box 2 waits 2 days; box 5 waits 16.
        assertEquals(1, progress.due)
    }

    @Test
    fun `dayIndex counts local days since the epoch`() {
        val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        calendar.clear()
        calendar.set(1970, Calendar.JANUARY, 1, 12, 0, 0)
        val utcNoonEpochDay = FlashScheduler.dayIndex(calendar.time)
        // Local offset can shift the day by at most one in either direction.
        assertTrue(utcNoonEpochDay in -1..1)

        // Two dates 10 local days apart differ by exactly 10.
        calendar.clear()
        calendar.set(2026, Calendar.MARCH, 1, 12, 0, 0)
        val first = FlashScheduler.dayIndex(calendar.time)
        calendar.set(2026, Calendar.MARCH, 11, 12, 0, 0)
        val second = FlashScheduler.dayIndex(calendar.time)
        assertEquals(10, second - first)
    }
}
