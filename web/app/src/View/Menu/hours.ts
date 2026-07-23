/**
 * Opening-hours logic for the menu pack — the computable heart of a local
 * business site. Pure and deterministic (the current time is always passed
 * in), and mirrored in MenuHours.swift and MenuHours.kt so the "Open now"
 * badge agrees on every platform.
 *
 * Hours are same-day intervals in minutes since midnight (0–1440);
 * a day may have several intervals (e.g. lunch and dinner service).
 */

export interface DayHours {
    /** 0 = Sunday … 6 = Saturday, matching JS Date.getDay(). */
    day: number
    /** [openMinute, closeMinute] pairs, sorted, non-overlapping. */
    intervals: [number, number][]
}

export interface OpenStatus {
    open: boolean
    /**
     * The next transition: when we close (if open) or next open (if closed).
     * `day` is the weekday of the transition; `minute` is minutes since
     * midnight. Undefined only when the schedule is empty.
     */
    nextChange?: { day: number; minute: number }
}

/** Whether the business is open at the given weekday and minute. */
export function isOpen(hours: DayHours[], day: number, minute: number): boolean {
    const today = hours.find((h) => h.day === day)
    if (!today) return false
    return today.intervals.some(([open, close]) => minute >= open && minute < close)
}

/** Full status: open/closed plus the next transition, searching up to a week ahead. */
export function statusAt(hours: DayHours[], day: number, minute: number): OpenStatus {
    const intervalsFor = (d: number): [number, number][] =>
        hours.find((h) => h.day === ((d % 7) + 7) % 7)?.intervals ?? []

    if (isOpen(hours, day, minute)) {
        const close = intervalsFor(day).find(([open, c]) => minute >= open && minute < c)
        return { open: true, nextChange: { day, minute: close ? close[1] : minute } }
    }

    // Closed: find the next opening within the coming week.
    for (let offset = 0; offset < 8; offset++) {
        const d = (day + offset) % 7
        const candidates = intervalsFor(d).filter(([open]) => offset > 0 || open > minute)
        if (candidates.length > 0) {
            return { open: false, nextChange: { day: d, minute: candidates[0][0] } }
        }
    }
    return { open: false }
}

/** "8:00 AM" / "12:30 PM" for a minutes-since-midnight value (1440 = midnight). */
export function formatMinute(minute: number): string {
    const total = minute % 1440
    const hour24 = Math.floor(total / 60)
    const mins = total % 60
    const suffix = hour24 < 12 ? "AM" : "PM"
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    return mins === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(mins).padStart(2, "0")} ${suffix}`
}

export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/** A short human label for the status: "Open — closes 3 PM" / "Closed — opens Tuesday 8 AM". */
export function statusLabel(hours: DayHours[], day: number, minute: number): string {
    const status = statusAt(hours, day, minute)
    if (!status.nextChange) return "Closed"
    const { day: nextDay, minute: nextMinute } = status.nextChange
    const time = formatMinute(nextMinute)
    if (status.open) {
        return `Open — closes ${time}`
    }
    const dayLabel = nextDay === day ? "" : `${dayNames[nextDay]} `
    return `Closed — opens ${dayLabel}${time}`
}
