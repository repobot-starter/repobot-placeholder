/**
 * The gala pack's clock engine (the estate listings engine's idiom, the
 * vows pack's sibling — packs are self-contained, so each carries its
 * own): the countdown the site renders is computed from the event date per
 * render, never hand-written into copy. Edit `event.dateIso` in content.ts
 * and the hero badge and the RSVP nudge follow.
 *
 * Day arithmetic is calendar-local: "days to go" means calendar days in
 * the visitor's own timezone, flipping at midnight, not at publish hour.
 */

/** Midnight of an ISO date (YYYY-MM-DD) in the visitor's local calendar. */
function localMidnight(dateIso: string): Date {
    const [year, month, day] = dateIso.split("-").map(Number)
    return new Date(year, month - 1, day)
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Whole calendar days from `now` to the date: 0 on the day, negative after. */
export function daysUntil(dateIso: string, now: Date): number {
    const target = localMidnight(dateIso)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((target.getTime() - today.getTime()) / DAY_MS)
}

/**
 * The hero badge in the evening's own voice. Day-of and afterward the page
 * stays alive instead of counting into negatives — the site outlives its
 * night as the program kept from it.
 */
export function countdownLabel(dateIso: string, now: Date): string {
    const days = daysUntil(dateIso, now)
    if (days > 1) {
        return `${days} days to go`
    }
    if (days === 1) {
        return "Tomorrow night"
    }
    if (days === 0) {
        return "Tonight's the night"
    }
    return "What an evening"
}

/** The RSVP nudge, computed against the reply-by date. */
export function rsvpNudge(replyByIso: string, replyByLabel: string, now: Date): string {
    const days = daysUntil(replyByIso, now)
    if (days > 1) {
        return `Kindly reply by ${replyByLabel} — ${days} days away.`
    }
    if (days === 1) {
        return `Kindly reply by ${replyByLabel} — that's tomorrow.`
    }
    if (days === 0) {
        return `Kindly reply today — ${replyByLabel} is the day.`
    }
    return `The reply-by date (${replyByLabel}) has passed — send word and we'll find you a seat.`
}
