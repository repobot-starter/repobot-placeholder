/**
 * The vows pack's clock engine (the estate listings engine's idiom): the
 * countdown the site renders is computed from the wedding date per render,
 * never hand-written into copy. Edit `couple.weddingDateIso` in content.ts
 * and the hero badge, the RSVP nudge, and the day-of flip all follow.
 *
 * Day arithmetic is calendar-local on purpose: "days to go" means calendar
 * days until the date, in the visitor's own timezone — a guest checking at
 * 11 PM the night before should read "Tomorrow", not a rounded "0 days".
 */

/** Midnight of an ISO date (YYYY-MM-DD) in the visitor's local calendar. */
function localMidnight(dateIso: string): Date {
    const [year, month, day] = dateIso.split("-").map(Number)
    return new Date(year, month - 1, day)
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Whole calendar days from `now` to the date: 0 on the day itself,
 * negative after. Computed midnight-to-midnight so the count flips at
 * midnight, not at the hour the couple happened to publish.
 */
export function daysUntil(dateIso: string, now: Date): number {
    const target = localMidnight(dateIso)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((target.getTime() - today.getTime()) / DAY_MS)
}

/**
 * The hero badge: the countdown as a guest would say it. Day-of and
 * afterward keep the page alive instead of counting into negatives —
 * a wedding site outlives its date as the keepsake.
 */
export function countdownLabel(dateIso: string, now: Date): string {
    const days = daysUntil(dateIso, now)
    if (days > 1) {
        return `${days} days to go`
    }
    if (days === 1) {
        return "Tomorrow!"
    }
    if (days === 0) {
        return "Today's the day"
    }
    return "Just married"
}

/**
 * The RSVP page's nudge line, computed against the reply-by date: an ask
 * with a live number converts better than a printed deadline alone.
 */
export function rsvpNudge(replyByIso: string, replyByLabel: string, now: Date): string {
    const days = daysUntil(replyByIso, now)
    if (days > 1) {
        return `Please reply by ${replyByLabel} — ${days} days away.`
    }
    if (days === 1) {
        return `Please reply by ${replyByLabel} — that's tomorrow.`
    }
    if (days === 0) {
        return `Please reply today — ${replyByLabel} is the day.`
    }
    return `The reply-by date (${replyByLabel}) has passed — send your reply and we'll do our best.`
}
