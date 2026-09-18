package com.baseapp.android.view.sugar

import java.util.Calendar
import java.util.Date

/**
 * The pastry-machine pack's engine: pure freshness logic, mirrored from
 * the web pack's freshness.ts (and SugarFreshness.swift on iOS) so a
 * machine's status badge agrees on every platform.
 */
object SugarFreshness {
    data class MachineSchedule(
        /** Days the machine is stocked; 0 = Sunday … 6 = Saturday. */
        val stockedDays: Set<Int>,
        /** Minutes since midnight when the case is restocked. */
        val restockMinute: Int,
        /** Minutes since midnight when the case typically sells out. */
        val selloutMinute: Int,
    )

    /** How long before typical sellout the "selling fast" nudge appears. */
    const val SELLING_FAST_WINDOW = 90

    enum class StatusKind { CLOSED, UPCOMING, FRESH, SELLING_FAST, SOLD_OUT }

    data class CaseStatus(val kind: StatusKind, val label: String)

    private val dayNames =
        listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")

    /** "7:00 AM" from minutes since midnight. */
    fun formatMinute(minute: Int): String {
        val hour24 = (minute / 60) % 24
        val minutes = minute % 60
        val suffix = if (hour24 < 12) "AM" else "PM"
        val hour12 = if (hour24 % 12 == 0) 12 else hour24 % 12
        return "%d:%02d %s".format(hour12, minutes, suffix)
    }

    /** "tomorrow" or the day name of the next stocked day after [day]. */
    fun nextRestockDayLabel(schedule: MachineSchedule, day: Int): String {
        for (ahead in 1..7) {
            if ((day + ahead) % 7 in schedule.stockedDays) {
                return if (ahead == 1) "tomorrow" else dayNames[(day + ahead) % 7]
            }
        }
        return "soon"
    }

    /** The status badge for a machine at the given local day and minute. */
    fun statusAt(schedule: MachineSchedule, day: Int, minute: Int): CaseStatus {
        val restock = formatMinute(schedule.restockMinute)
        if (day !in schedule.stockedDays) {
            return CaseStatus(
                StatusKind.CLOSED,
                "Back ${nextRestockDayLabel(schedule, day)} at $restock",
            )
        }
        if (minute < schedule.restockMinute) {
            return CaseStatus(StatusKind.UPCOMING, "Restocking at $restock")
        }
        if (minute >= schedule.selloutMinute) {
            return CaseStatus(
                StatusKind.SOLD_OUT,
                "Sold out — back ${nextRestockDayLabel(schedule, day)} at $restock",
            )
        }
        if (minute >= schedule.selloutMinute - SELLING_FAST_WINDOW) {
            return CaseStatus(StatusKind.SELLING_FAST, "Selling fast — almost gone")
        }
        return CaseStatus(StatusKind.FRESH, "Stocked fresh at $restock")
    }

    /**
     * Which daily case a machine shows: the lineup rotates through the list
     * one day at a time.
     */
    fun lineupIndexForDay(epochDay: Int, lineupCount: Int): Int {
        if (lineupCount == 0) return 0
        return ((epochDay % lineupCount) + lineupCount) % lineupCount
    }

    /** Days since the Unix epoch in local time — drives the lineup rotation. */
    fun epochDay(date: Date): Int {
        val calendar = Calendar.getInstance().apply { time = date }
        val offsetMs = calendar.get(Calendar.ZONE_OFFSET) + calendar.get(Calendar.DST_OFFSET)
        return Math.floorDiv(date.time + offsetMs, 86_400_000L).toInt()
    }

    /** "$4.50" / "$4" — trims trailing zero cents. */
    fun formatPrice(priceCents: Int): String {
        val dollars = priceCents / 100
        val cents = priceCents % 100
        return if (cents == 0) "$$dollars" else "$%d.%02d".format(dollars, cents)
    }
}
