import { describe, expect, it } from "vitest"
import {
    formatEventDay,
    formatEventMoment,
    formatMomentMinute,
    nextMomentLabel,
    nextWeeklyMoment,
    splitEvents,
    type DatedEvent,
    type WeeklyMoment,
} from "../../../src/View/Landing/events"

/**
 * The community category's computable heart (docs in events.ts): dated
 * entries split into upcoming vs. past at render time with a "next up"
 * highlight, and weekly moments compute the church's next-service badge.
 * Everything is pure — `now` is always passed in — so these tests pin the
 * arithmetic exactly.
 */

const event = (slug: string, start: string, end?: string): DatedEvent => ({
    slug,
    title: slug,
    start,
    ...(end !== undefined ? { end } : {}),
    location: "Hall",
    description: "…",
})

// A Saturday evening: 2026-09-12 is a Saturday.
const NOW = new Date("2026-09-12T18:00:00")

describe("splitEvents", () => {
    const events = [
        event("far-future", "2026-12-05T10:00"),
        event("yesterday", "2026-09-11T19:00"),
        event("tonight", "2026-09-12T19:30"),
        event("last-spring", "2026-04-18T09:00"),
        event("next-week", "2026-09-19T09:00"),
    ]

    it("splits around now: upcoming soonest-first, past most-recent-first", () => {
        const split = splitEvents(events, NOW)
        expect(split.upcoming.map((entry) => entry.slug)).toEqual(["tonight", "next-week", "far-future"])
        expect(split.past.map((entry) => entry.slug)).toEqual(["yesterday", "last-spring"])
    })

    it("highlights the soonest upcoming event as next up", () => {
        expect(splitEvents(events, NOW).nextUp?.slug).toBe("tonight")
    })

    it("keeps an in-progress event upcoming until its end", () => {
        const running = event("running", "2026-09-12T17:00", "2026-09-12T20:00")
        const split = splitEvents([running], NOW)
        expect(split.upcoming.map((entry) => entry.slug)).toEqual(["running"])
        expect(split.nextUp?.slug).toBe("running")
        // Once it ends it settles into the archive.
        expect(splitEvents([running], new Date("2026-09-12T20:00:01")).past).toHaveLength(1)
    })

    it("yields no next-up when everything is settled", () => {
        const split = splitEvents([event("done", "2026-01-01T10:00")], NOW)
        expect(split.upcoming).toEqual([])
        expect(split.nextUp).toBeUndefined()
    })
})

describe("event formatting", () => {
    it("formats the date line and the full when-line", () => {
        expect(formatEventDay("2026-09-12T19:30")).toBe("Saturday, Sep 12")
        expect(formatEventMoment("2026-09-12T19:30")).toBe("Saturday, Sep 12 · 7:30 PM")
        expect(formatEventMoment("2026-12-05T10:00")).toBe("Saturday, Dec 5 · 10 AM")
    })
})

describe("weekly moments", () => {
    // A church week: two Sunday services and a Wednesday evening.
    const services: WeeklyMoment[] = [
        { day: 0, minute: 9 * 60, label: "Sunday gathering" },
        { day: 0, minute: 11 * 60, label: "Sunday gathering" },
        { day: 3, minute: 19 * 60, label: "Midweek prayer" },
    ]

    it("finds the next moment later the same day", () => {
        // Sunday 9:30 AM: the 11 AM service is next, today.
        const next = nextWeeklyMoment(services, 0, 9 * 60 + 30)
        expect(next).toMatchObject({ day: 0, minute: 11 * 60, daysAhead: 0 })
    })

    it("counts a moment starting this exact minute as next", () => {
        expect(nextWeeklyMoment(services, 0, 9 * 60)).toMatchObject({ minute: 9 * 60, daysAhead: 0 })
    })

    it("rolls over the week when today's moments have passed", () => {
        // Saturday evening: next is tomorrow's 9 AM service.
        const next = nextWeeklyMoment(services, 6, 18 * 60)
        expect(next).toMatchObject({ day: 0, minute: 9 * 60, daysAhead: 1 })
    })

    it("labels the badge with today/tomorrow/weekday", () => {
        expect(nextMomentLabel(services, 0, 8 * 60, "service")).toBe("Next service — today 9 AM")
        expect(nextMomentLabel(services, 6, 18 * 60, "service")).toBe("Next service — tomorrow 9 AM")
        expect(nextMomentLabel(services, 0, 12 * 60, "service")).toBe("Next service — Wednesday 7 PM")
        expect(nextMomentLabel([], 0, 0, "service")).toBeUndefined()
    })

    it("formats moment minutes on the clock", () => {
        expect(formatMomentMinute(9 * 60)).toBe("9 AM")
        expect(formatMomentMinute(19 * 60 + 15)).toBe("7:15 PM")
    })
})
