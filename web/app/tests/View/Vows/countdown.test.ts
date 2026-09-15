import { describe, expect, it } from "vitest"
import { countdownLabel, daysUntil, rsvpNudge } from "../../../src/View/Vows/countdown"

/**
 * The clock engine's rules, pinned at fixed instants (the estate listings
 * engine's testing idiom): the countdown the site renders is computed from
 * the wedding date per render, and the labels flip on calendar midnights,
 * not on publish hours.
 */

/** The demo wedding date the pinned instants count toward. */
const WEDDING = "2027-06-12"

describe("vows countdown engine", () => {
    it("counts whole calendar days, midnight to midnight", () => {
        // Late evening still counts the full remaining days: a guest
        // checking at 11 PM reads the calendar, not a rounded fraction.
        expect(daysUntil(WEDDING, new Date(2026, 7, 27, 23, 30))).toBe(289)
        expect(daysUntil(WEDDING, new Date(2026, 7, 27, 0, 5))).toBe(289)
        expect(daysUntil(WEDDING, new Date(2027, 5, 11, 23, 59))).toBe(1)
        expect(daysUntil(WEDDING, new Date(2027, 5, 12, 0, 0))).toBe(0)
        expect(daysUntil(WEDDING, new Date(2027, 5, 13, 8, 0))).toBe(-1)
    })

    it("speaks the countdown the way a guest would", () => {
        expect(countdownLabel(WEDDING, new Date(2026, 7, 27, 10, 30))).toBe("289 days to go")
        expect(countdownLabel(WEDDING, new Date(2027, 5, 10, 10, 30))).toBe("2 days to go")
        expect(countdownLabel(WEDDING, new Date(2027, 5, 11, 10, 30))).toBe("Tomorrow!")
        expect(countdownLabel(WEDDING, new Date(2027, 5, 12, 10, 30))).toBe("Today's the day")
        // The site outlives its date as the keepsake, not a negative count.
        expect(countdownLabel(WEDDING, new Date(2027, 5, 20, 10, 30))).toBe("Just married")
    })

    it("keeps the RSVP nudge counting toward the reply-by date", () => {
        const REPLY_BY = "2027-05-01"
        const LABEL = "May 1, 2027"
        expect(rsvpNudge(REPLY_BY, LABEL, new Date(2027, 3, 21, 9, 0))).toBe(
            "Please reply by May 1, 2027 — 10 days away.",
        )
        expect(rsvpNudge(REPLY_BY, LABEL, new Date(2027, 3, 30, 9, 0))).toBe(
            "Please reply by May 1, 2027 — that's tomorrow.",
        )
        expect(rsvpNudge(REPLY_BY, LABEL, new Date(2027, 4, 1, 9, 0))).toBe(
            "Please reply today — May 1, 2027 is the day.",
        )
        // Past the deadline the ask softens instead of scolding.
        expect(rsvpNudge(REPLY_BY, LABEL, new Date(2027, 4, 3, 9, 0))).toBe(
            "The reply-by date (May 1, 2027) has passed — send your reply and we'll do our best.",
        )
    })
})
