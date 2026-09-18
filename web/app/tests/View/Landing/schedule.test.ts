import { describe, expect, it } from "vitest"
import {
    scheduleBadge,
    scheduleStatusAt,
    sessionsOn,
    weekColumns,
    type ClassSession,
} from "../../../src/View/Landing/schedule"

/**
 * The schedule engine is pure — the clock is always passed in — so these
 * tests pin exact instants, the same discipline as the hours engine's
 * suite. The fixture week: Mon/Wed/Fri dawn + evening classes, Saturday
 * morning, nothing Sunday/Tuesday/Thursday.
 */

const week: ClassSession[] = [
    { day: 1, start: 6 * 60, end: 7 * 60, title: "Strength 101", instructor: "Reyes" },
    { day: 1, start: 17 * 60 + 30, end: 18 * 60 + 30, title: "Barbell Club", instructor: "Cole" },
    { day: 3, start: 6 * 60, end: 7 * 60, title: "Conditioning", instructor: "Whit" },
    { day: 5, start: 6 * 60, end: 7 * 60, title: "Strength 101", instructor: "Reyes" },
    { day: 6, start: 9 * 60, end: 10 * 60 + 30, title: "Team Session", instructor: "All coaches" },
]

describe("schedule engine", () => {
    it("lists a day's sessions in start order regardless of entry order", () => {
        const shuffled = [...week].reverse()
        expect(sessionsOn(shuffled, 1).map((session) => session.title)).toEqual([
            "Strength 101",
            "Barbell Club",
        ])
        expect(sessionsOn(shuffled, 0)).toEqual([])
    })

    it("reports the running class during its interval", () => {
        // Monday 6:30 AM: Strength 101 runs 6–7.
        const status = scheduleStatusAt(week, 1, 6 * 60 + 30)
        expect(status.kind).toBe("in-session")
        if (status.kind === "in-session") {
            expect(status.session.title).toBe("Strength 101")
        }
        expect(scheduleBadge(week, 1, 6 * 60 + 30)).toBe("In session — Strength 101 until 7 AM")
    })

    it("treats the closing minute as over, not running", () => {
        const status = scheduleStatusAt(week, 1, 7 * 60)
        expect(status.kind).toBe("next")
    })

    it("points at the next class later the same day", () => {
        // Monday 9 AM: the dawn class is done; Barbell Club is at 5:30 PM.
        expect(scheduleBadge(week, 1, 9 * 60)).toBe("Next class: Barbell Club · Today 5:30 PM")
    })

    it("rolls to the next day with classes, skipping empty ones", () => {
        // Monday 8 PM → Tuesday is empty → Wednesday's Conditioning.
        expect(scheduleBadge(week, 1, 20 * 60)).toBe("Next class: Conditioning · Wednesday 6 AM")
    })

    it("wraps the week from its last class back to the first", () => {
        // Saturday noon: nothing Sunday, next is Monday dawn.
        expect(scheduleBadge(week, 6, 12 * 60)).toBe("Next class: Strength 101 · Monday 6 AM")
    })

    it("answers empty-schedule instead of looping", () => {
        expect(scheduleStatusAt([], 1, 9 * 60)).toEqual({ kind: "empty" })
        expect(scheduleBadge([], 1, 9 * 60)).toBe("Schedule coming soon")
    })

    it("speaks the caller's noun — a trainer's book says session, not class", () => {
        expect(scheduleBadge(week, 1, 9 * 60, "session")).toBe("Next session: Barbell Club · Today 5:30 PM")
    })

    it("builds Monday-first columns, dropping empty days", () => {
        const columns = weekColumns(week, 3, 6 * 60 + 15)
        expect(columns.map((column) => column.label)).toEqual(["Monday", "Wednesday", "Friday", "Saturday"])
    })

    it("flags today's column and the running session", () => {
        // Wednesday 6:15 AM: Conditioning is live.
        const columns = weekColumns(week, 3, 6 * 60 + 15)
        const wednesday = columns.find((column) => column.label === "Wednesday")
        expect(wednesday?.today).toBe(true)
        expect(columns.filter((column) => column.today === true)).toHaveLength(1)
        expect(wednesday?.sessions[0]?.state).toBe("now")
        // Exactly one live mark across the whole grid.
        const marked = columns.flatMap((column) =>
            column.sessions.filter((session) => session.state !== undefined),
        )
        expect(marked).toHaveLength(1)
    })

    it("marks the single next-upcoming session across day boundaries", () => {
        // Monday 8 PM → next is Wednesday's Conditioning; Monday's own
        // sessions carry no mark.
        const columns = weekColumns(week, 1, 20 * 60)
        const monday = columns.find((column) => column.label === "Monday")
        const wednesday = columns.find((column) => column.label === "Wednesday")
        expect(monday?.sessions.every((session) => session.state === undefined)).toBe(true)
        expect(wednesday?.sessions[0]?.state).toBe("next")
    })

    it("renders times and instructors into the column sessions", () => {
        const columns = weekColumns(week, 1, 6 * 60 + 30)
        const monday = columns.find((column) => column.label === "Monday")
        expect(monday?.sessions[1]).toMatchObject({
            time: "5:30 PM",
            endTime: "6:30 PM",
            title: "Barbell Club",
            detail: "Cole",
        })
    })
})
