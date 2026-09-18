package com.baseapp.android.view.menu

/**
 * Opening-hours logic for the menu pack, mirrored from the web pack's
 * hours.ts (and MenuHours.swift on iOS). Pure and deterministic — the
 * current time is always passed in — so the "Open now" badge agrees on
 * every platform.
 *
 * Hours are same-day intervals in minutes since midnight (0–1440);
 * a day may have several intervals (e.g. lunch and dinner service).
 */
object MenuHours {
    /** [day]: 0 = Sunday … 6 = Saturday. Intervals are (openMinute, closeMinute). */
    data class DayHours(val day: Int, val intervals: List<Pair<Int, Int>>)

    /** The next transition: when we close (if open) or next open (if closed). */
    data class OpenStatus(
        val open: Boolean,
        val nextChangeDay: Int? = null,
        val nextChangeMinute: Int? = null,
    )

    val dayNames = listOf(
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    )

    /** Whether the business is open at the given weekday and minute. */
    fun isOpen(hours: List<DayHours>, day: Int, minute: Int): Boolean {
        val today = hours.firstOrNull { it.day == day } ?: return false
        return today.intervals.any { (open, close) -> minute in open until close }
    }

    /** Full status: open/closed plus the next transition, searching up to a week ahead. */
    fun statusAt(hours: List<DayHours>, day: Int, minute: Int): OpenStatus {
        fun intervalsFor(d: Int): List<Pair<Int, Int>> =
            hours.firstOrNull { it.day == ((d % 7) + 7) % 7 }?.intervals ?: emptyList()

        if (isOpen(hours, day, minute)) {
            val close = intervalsFor(day).firstOrNull { (open, c) -> minute in open until c }
            return OpenStatus(open = true, nextChangeDay = day, nextChangeMinute = close?.second ?: minute)
        }

        // Closed: find the next opening within the coming week.
        for (offset in 0 until 8) {
            val d = (day + offset) % 7
            val candidates = intervalsFor(d).filter { (open, _) -> offset > 0 || open > minute }
            if (candidates.isNotEmpty()) {
                return OpenStatus(open = false, nextChangeDay = d, nextChangeMinute = candidates.first().first)
            }
        }
        return OpenStatus(open = false)
    }

    /** "8 AM" / "12:30 PM" for a minutes-since-midnight value (1440 = midnight). */
    fun formatMinute(minute: Int): String {
        val total = minute % 1440
        val hour24 = total / 60
        val mins = total % 60
        val suffix = if (hour24 < 12) "AM" else "PM"
        val hour12 = if (hour24 % 12 == 0) 12 else hour24 % 12
        return if (mins == 0) "$hour12 $suffix" else "$hour12:${mins.toString().padStart(2, '0')} $suffix"
    }

    /** "Open — closes 3 PM" / "Closed — opens Tuesday 8 AM". */
    fun statusLabel(hours: List<DayHours>, day: Int, minute: Int): String {
        val status = statusAt(hours, day, minute)
        val nextDay = status.nextChangeDay ?: return "Closed"
        val nextMinute = status.nextChangeMinute ?: return "Closed"
        val time = formatMinute(nextMinute)
        if (status.open) return "Open — closes $time"
        val dayLabel = if (nextDay == day) "" else "${dayNames[nextDay]} "
        return "Closed — opens $dayLabel$time"
    }
}
