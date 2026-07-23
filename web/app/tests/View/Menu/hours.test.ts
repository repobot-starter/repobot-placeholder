import { describe, expect, it } from "vitest"
import { formatMinute, isOpen, statusAt, statusLabel, type DayHours } from "../../../src/View/Menu/hours"

/** Tue/Wed 7–15, Fri 7–15 and 17–21; closed the rest of the week. */
const hours: DayHours[] = [
    { day: 2, intervals: [[420, 900]] },
    { day: 3, intervals: [[420, 900]] },
    {
        day: 5,
        intervals: [
            [420, 900],
            [1020, 1260],
        ],
    },
]

describe("isOpen", () => {
    it("is open inside an interval and closed at its exact end", () => {
        expect(isOpen(hours, 2, 420)).toBe(true) // opening minute counts
        expect(isOpen(hours, 2, 899)).toBe(true)
        expect(isOpen(hours, 2, 900)).toBe(false) // closing minute doesn't
        expect(isOpen(hours, 1, 600)).toBe(false) // Monday closed
    })

    it("handles a split day with two services", () => {
        expect(isOpen(hours, 5, 960)).toBe(false) // between lunch and supper
        expect(isOpen(hours, 5, 1020)).toBe(true) // supper opens
    })
})

describe("statusAt", () => {
    it("reports the closing time while open", () => {
        expect(statusAt(hours, 2, 600)).toEqual({
            open: true,
            nextChange: { day: 2, minute: 900 },
        })
    })

    it("reports the second service when between intervals", () => {
        expect(statusAt(hours, 5, 960)).toEqual({
            open: false,
            nextChange: { day: 5, minute: 1020 },
        })
    })

    it("rolls to the next open day across the closed weekend", () => {
        // Friday after supper -> next open is Tuesday morning.
        expect(statusAt(hours, 5, 1300)).toEqual({
            open: false,
            nextChange: { day: 2, minute: 420 },
        })
    })

    it("returns no transition for an empty schedule", () => {
        expect(statusAt([], 2, 600)).toEqual({ open: false })
    })
})

describe("labels", () => {
    it("formats minutes as 12-hour times", () => {
        expect(formatMinute(0)).toBe("12 AM")
        expect(formatMinute(420)).toBe("7 AM")
        expect(formatMinute(750)).toBe("12:30 PM")
        expect(formatMinute(1260)).toBe("9 PM")
    })

    it("builds open and closed labels", () => {
        expect(statusLabel(hours, 2, 600)).toBe("Open — closes 3 PM")
        expect(statusLabel(hours, 5, 960)).toBe("Closed — opens 5 PM")
        expect(statusLabel(hours, 6, 600)).toBe("Closed — opens Tuesday 7 AM")
        expect(statusLabel([], 2, 600)).toBe("Closed")
    })
})
