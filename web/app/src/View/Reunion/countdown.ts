/**
 * The reunion pack's clock engine (the estate listings engine's idiom, the
 * vows pack's sibling — packs are self-contained, so each carries its
 * own): the countdown the site renders is computed from the reunion date
 * per render, never hand-written into copy. Edit `reunion.startDateIso` in
 * content.ts and the hero badge and the RSVP nudge follow. The words are
 * the family's (`landingCopy.countdown` and `landingCopy.nudge`); only the
 * numbers are computed here.
 *
 * Day arithmetic is calendar-local: "days to go" means calendar days in
 * the visitor's own timezone, flipping at midnight, not at publish hour.
 */

import { landingCopy } from "./content"

/** A copy template with its `{days}` / `{label}` tokens filled. */
function fill(template: string, days: number, label = ""): string {
    return template.replaceAll("{days}", String(days)).replaceAll("{label}", label)
}

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
 * The hero badge in the family's own voice. Day-of and afterward the page
 * stays alive instead of counting into negatives — the site outlives the
 * weekend as the album from it.
 */
export function countdownLabel(dateIso: string, now: Date): string {
    const days = daysUntil(dateIso, now)
    const copy = landingCopy.countdown
    if (days > 1) {
        return fill(copy.daysOut, days)
    }
    if (days === 1) {
        return fill(copy.tomorrow, days)
    }
    if (days === 0) {
        return fill(copy.dayOf, days)
    }
    return fill(copy.after, days)
}

/** The RSVP nudge, computed against the reply-by date. */
export function rsvpNudge(replyByIso: string, replyByLabel: string, now: Date): string {
    const days = daysUntil(replyByIso, now)
    const copy = landingCopy.nudge
    if (days > 1) {
        return fill(copy.daysOut, days, replyByLabel)
    }
    if (days === 1) {
        return fill(copy.tomorrow, days, replyByLabel)
    }
    if (days === 0) {
        return fill(copy.dayOf, days, replyByLabel)
    }
    return fill(copy.after, days, replyByLabel)
}
