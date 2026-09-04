package com.baseapp.android

import com.baseapp.android.view.sugar.SugarFreshness
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Mirrors the web pack's freshness.test.ts so a machine's status badge
 * agrees on every platform.
 */
class SugarFreshnessTest {
    /** Stocked every day, 7 AM restock, sells out around 1 PM. */
    private val daily =
        SugarFreshness.MachineSchedule(
            stockedDays = setOf(0, 1, 2, 3, 4, 5, 6),
            restockMinute = 7 * 60,
            selloutMinute = 13 * 60,
        )

    /** Weekdays only. */
    private val weekdays =
        SugarFreshness.MachineSchedule(
            stockedDays = setOf(1, 2, 3, 4, 5),
            restockMinute = 7 * 60,
            selloutMinute = 11 * 60,
        )

    @Test
    fun showsRestockingBeforeTheMorningFill() {
        val status = SugarFreshness.statusAt(daily, day = 2, minute = 6 * 60)
        assertEquals(SugarFreshness.StatusKind.UPCOMING, status.kind)
        assertEquals("Restocking at 7:00 AM", status.label)
    }

    @Test
    fun freshFromRestockUntilSellingFastWindow() {
        assertEquals(
            SugarFreshness.StatusKind.FRESH,
            SugarFreshness.statusAt(daily, day = 2, minute = 7 * 60).kind,
        )
        assertEquals(
            SugarFreshness.StatusKind.FRESH,
            SugarFreshness
                .statusAt(daily, day = 2, minute = 13 * 60 - SugarFreshness.SELLING_FAST_WINDOW - 1)
                .kind,
        )
        assertEquals(
            "Stocked fresh at 7:00 AM",
            SugarFreshness.statusAt(daily, day = 2, minute = 7 * 60).label,
        )
    }

    @Test
    fun nudgesWhenAlmostGone() {
        assertEquals(
            SugarFreshness.StatusKind.SELLING_FAST,
            SugarFreshness
                .statusAt(daily, day = 2, minute = 13 * 60 - SugarFreshness.SELLING_FAST_WINDOW)
                .kind,
        )
        assertEquals(
            SugarFreshness.StatusKind.SELLING_FAST,
            SugarFreshness.statusAt(daily, day = 2, minute = 13 * 60 - 1).kind,
        )
    }

    @Test
    fun sellsOutAndPointsAtTomorrow() {
        val status = SugarFreshness.statusAt(daily, day = 2, minute = 13 * 60)
        assertEquals(SugarFreshness.StatusKind.SOLD_OUT, status.kind)
        assertEquals("Sold out — back tomorrow at 7:00 AM", status.label)
    }

    @Test
    fun restsOnUnstockedDaysAndNamesTheNextStockedDay() {
        val saturday = SugarFreshness.statusAt(weekdays, day = 6, minute = 9 * 60)
        assertEquals(SugarFreshness.StatusKind.CLOSED, saturday.kind)
        assertEquals("Back Monday at 7:00 AM", saturday.label)
        assertEquals(
            "Sold out — back Monday at 7:00 AM",
            SugarFreshness.statusAt(weekdays, day = 5, minute = 12 * 60).label,
        )
    }

    @Test
    fun nextRestockDayLabel() {
        assertEquals("tomorrow", SugarFreshness.nextRestockDayLabel(daily, day = 3))
        assertEquals("Monday", SugarFreshness.nextRestockDayLabel(weekdays, day = 6))
        assertEquals("Monday", SugarFreshness.nextRestockDayLabel(weekdays, day = 5))
    }

    @Test
    fun formatsMinutes() {
        assertEquals("7:00 AM", SugarFreshness.formatMinute(7 * 60))
        assertEquals("7:05 AM", SugarFreshness.formatMinute(7 * 60 + 5))
        assertEquals("12:00 AM", SugarFreshness.formatMinute(0))
        assertEquals("12:00 PM", SugarFreshness.formatMinute(12 * 60))
        assertEquals("3:30 PM", SugarFreshness.formatMinute(15 * 60 + 30))
    }

    @Test
    fun rotatesLineups() {
        assertEquals(0, SugarFreshness.lineupIndexForDay(0, lineupCount = 3))
        assertEquals(1, SugarFreshness.lineupIndexForDay(1, lineupCount = 3))
        assertEquals(0, SugarFreshness.lineupIndexForDay(3, lineupCount = 3))
        assertEquals(2, SugarFreshness.lineupIndexForDay(-1, lineupCount = 3))
        assertEquals(0, SugarFreshness.lineupIndexForDay(5, lineupCount = 0))
    }

    @Test
    fun formatsPrices() {
        assertEquals("$4.50", SugarFreshness.formatPrice(450))
        assertEquals("$5", SugarFreshness.formatPrice(500))
        assertEquals("$3.75", SugarFreshness.formatPrice(375))
    }
}
