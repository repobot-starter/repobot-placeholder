/**
 * Dated-events logic — the computable heart of a community-organization
 * site (church, nonprofit, neighborhood association), the calendar sibling
 * of `hours.ts`. Pure and deterministic (the current time is always passed
 * in): a single content file lists dated entries, and the site splits them
 * into upcoming vs. past at render time with a "next up" highlight — the
 * same spirit as the menu pack's computed open/closed badge, so an event
 * page can never show a stale "upcoming" listing.
 *
 * Dates are ISO local datetimes ("2026-09-12T18:30") so the site reads in
 * the organization's own wall-clock time; an event stays upcoming until it
 * ends (or until its start when no end is given).
 */

export interface DatedEvent {
    slug: string
    title: string
    /** ISO local datetime, e.g. "2026-09-12T18:30". */
    start: string
    /** ISO local datetime; the event counts as upcoming until this moment. */
    end?: string
    location: string
    description: string
    tags?: string[]
}

export interface EventSplit<E extends DatedEvent> {
    /** Soonest first. */
    upcoming: E[]
    /** Most recent first. */
    past: E[]
    /** The soonest upcoming event — the "next up" highlight. */
    nextUp?: E
}

/** When the event stops being upcoming: its end, or its start when open-ended. */
function settlesAt(event: DatedEvent): number {
    return new Date(event.end ?? event.start).getTime()
}

/**
 * The render-time split: everything still ahead of `now` (soonest first,
 * the first one being the "next up" highlight) and everything settled
 * (most recent first — the archive reads backwards).
 */
export function splitEvents<E extends DatedEvent>(events: E[], now: Date): EventSplit<E> {
    const upcoming = events
        .filter((event) => settlesAt(event) >= now.getTime())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    const past = events
        .filter((event) => settlesAt(event) < now.getTime())
        .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
    return { upcoming, past, ...(upcoming.length > 0 ? { nextUp: upcoming[0] } : {}) }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/** "12:00 AM" / "6:30 PM" from a Date's wall-clock time. */
function clockTime(date: Date): string {
    const hour24 = date.getHours()
    const mins = date.getMinutes()
    const suffix = hour24 < 12 ? "AM" : "PM"
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    return mins === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(mins).padStart(2, "0")} ${suffix}`
}

/** "Saturday, Sep 12" — the event card's date line. */
export function formatEventDay(iso: string): string {
    const date = new Date(iso)
    return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}

/** "Saturday, Sep 12 · 6:30 PM" — the full when-line for an event card. */
export function formatEventMoment(iso: string): string {
    return `${formatEventDay(iso)} · ${clockTime(new Date(iso))}`
}

/**
 * Weekly recurring moments — service times, standing meetings. Same
 * minutes-since-midnight grammar as `hours.ts`, but points instead of
 * intervals: the site computes which one is next, not whether a door is
 * open.
 */
export interface WeeklyMoment {
    /** 0 = Sunday … 6 = Saturday, matching JS Date.getDay(). */
    day: number
    /** Minutes since midnight. */
    minute: number
    /** What happens, e.g. "Sunday gathering" or "Evening prayer". */
    label: string
}

/**
 * The next weekly moment at or after the given weekday and minute,
 * searching the coming week. Undefined only when the schedule is empty.
 * A moment starting this exact minute still counts as next — the badge
 * should read "today" for the whole minute the service begins.
 */
export function nextWeeklyMoment(
    moments: WeeklyMoment[],
    day: number,
    minute: number,
): (WeeklyMoment & { daysAhead: number }) | undefined {
    for (let offset = 0; offset < 8; offset++) {
        const d = (day + offset) % 7
        const candidates = moments
            .filter((moment) => moment.day === d && (offset > 0 || moment.minute >= minute))
            .sort((a, b) => a.minute - b.minute)
        if (candidates.length > 0) {
            return { ...candidates[0], daysAhead: offset }
        }
    }
    return undefined
}

/** "9 AM" from minutes since midnight (weekly-moment grammar). */
export function formatMomentMinute(minute: number): string {
    const date = new Date(2000, 0, 1, Math.floor(minute / 60), minute % 60)
    return clockTime(date)
}

/**
 * The computed badge: "Next service — Sunday 9 AM", with "today"/"tomorrow"
 * when the moment is that close. `noun` names the moment ("service",
 * "meeting"). Empty schedule yields undefined — the badge simply doesn't
 * render.
 */
export function nextMomentLabel(
    moments: WeeklyMoment[],
    day: number,
    minute: number,
    noun: string,
): string | undefined {
    const next = nextWeeklyMoment(moments, day, minute)
    if (next === undefined) return undefined
    const when = next.daysAhead === 0 ? "today" : next.daysAhead === 1 ? "tomorrow" : WEEKDAYS[next.day]
    return `Next ${noun} — ${when} ${formatMomentMinute(next.minute)}`
}
