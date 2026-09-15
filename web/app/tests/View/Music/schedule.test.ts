import { describe, expect, it } from "vitest"
import {
    formatShowDate,
    formatTimecode,
    parseLocalDate,
    releaseStatus,
    splitShows,
    type ShowDate,
} from "../../../src/View/Music/schedule"

/**
 * The music category's computed-time mechanics, tested with injected
 * clocks (the task's fidelity bar): the tour split, the today/tonight
 * badge, and the release countdown must be pure functions of
 * (content, now) — midnight moves shows and flips releases, never edits.
 */

const shows: ShowDate[] = [
    { date: "2026-11-14", city: "Los Angeles", venue: "The Troubadour" },
    { date: "2026-09-04", city: "Asbury Park", venue: "The Wonder Bar" },
    { date: "2026-06-19", city: "Asbury Park", venue: "The Stone Pony" },
    { date: "2026-09-19", city: "Brooklyn", venue: "Music Hall of Williamsburg" },
    { date: "2025-10-17", city: "Pittsburgh", venue: "Mr. Smalls Theatre" },
]

describe("splitShows", () => {
    it("splits upcoming and past at local midnight and sorts both", () => {
        const schedule = splitShows(shows, new Date(2026, 7, 27, 13, 30)) // Aug 27 2026
        expect(schedule.upcoming.map((show) => show.date)).toEqual(["2026-09-04", "2026-09-19", "2026-11-14"])
        expect(schedule.past.map((show) => show.date)).toEqual(["2026-06-19", "2025-10-17"])
        expect(schedule.next?.city).toBe("Asbury Park")
        expect(schedule.badge).toBe("On tour")
    })

    it("counts a show today as upcoming all day — and badges it Tonight", () => {
        // 23:59 on show day: the show has not moved to the archive.
        const lateShowNight = splitShows(shows, new Date(2026, 8, 4, 23, 59))
        expect(lateShowNight.next?.date).toBe("2026-09-04")
        expect(lateShowNight.badge).toBe("Tonight — Asbury Park")
        // Midnight after: it archives itself; the badge moves on.
        const dayAfter = splitShows(shows, new Date(2026, 8, 5, 0, 0))
        expect(dayAfter.next?.date).toBe("2026-09-19")
        expect(dayAfter.past.map((show) => show.date)).toContain("2026-09-04")
        expect(dayAfter.badge).toBe("On tour")
    })

    it("returns no badge and no next show once every date has passed", () => {
        const done = splitShows(shows, new Date(2027, 0, 1))
        expect(done.upcoming).toEqual([])
        expect(done.next).toBeNull()
        expect(done.badge).toBeNull()
        expect(done.past[0].date).toBe("2026-11-14") // most recent first
    })

    it("parses dates as LOCAL midnight, never UTC", () => {
        const date = parseLocalDate("2026-09-04")
        expect(date.getFullYear()).toBe(2026)
        expect(date.getMonth()).toBe(8)
        expect(date.getDate()).toBe(4)
        expect(date.getHours()).toBe(0)
    })
})

describe("formatShowDate", () => {
    it("formats the tour table's date column", () => {
        expect(formatShowDate("2026-09-04")).toEqual({
            weekday: "Fri",
            month: "Sep",
            day: 4,
            year: 2026,
        })
    })
})

describe("releaseStatus (the single pack's countdown)", () => {
    const releaseDate = "2026-10-16" // a Friday

    it("counts down days / hours / minutes before the date", () => {
        // Exactly 10 days, 3 hours, 30 minutes before local midnight Oct 16.
        const status = releaseStatus(releaseDate, new Date(2026, 9, 5, 20, 30))
        expect(status.released).toBe(false)
        expect(status.days).toBe(10)
        expect(status.hours).toBe(3)
        expect(status.minutes).toBe(30)
    })

    it("labels the final week by weekday and further out by date", () => {
        expect(releaseStatus(releaseDate, new Date(2026, 9, 12)).label).toBe("Out Friday")
        expect(releaseStatus(releaseDate, new Date(2026, 8, 1)).label).toBe("Out Oct 16")
    })

    it("flips to Out now exactly at local midnight on the date", () => {
        const before = releaseStatus(releaseDate, new Date(2026, 9, 15, 23, 59))
        expect(before.released).toBe(false)
        expect(before.days).toBe(0)
        expect(before.hours).toBe(0)
        const after = releaseStatus(releaseDate, new Date(2026, 9, 16, 0, 0))
        expect(after.released).toBe(true)
        expect(after.label).toBe("Out now")
        // And stays flipped forever after.
        expect(releaseStatus(releaseDate, new Date(2027, 3, 1)).released).toBe(true)
    })
})

describe("formatTimecode", () => {
    it("formats the players' mono timecode", () => {
        expect(formatTimecode(0)).toBe("0:00")
        expect(formatTimecode(31.6)).toBe("0:31")
        expect(formatTimecode(65)).toBe("1:05")
        expect(formatTimecode(600)).toBe("10:00")
    })
})
