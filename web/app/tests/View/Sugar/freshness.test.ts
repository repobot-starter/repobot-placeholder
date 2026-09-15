import { describe, expect, it } from "vitest"
import {
    epochDay,
    formatMinute,
    formatPrice,
    lineupIndexForDay,
    nextRestockDayLabel,
    SELLING_FAST_WINDOW,
    statusAt,
    type MachineSchedule,
} from "../../../src/View/Sugar/freshness"

/** Stocked every day, 7 AM restock, sells out around 1 PM. */
const daily: MachineSchedule = {
    stockedDays: [0, 1, 2, 3, 4, 5, 6],
    restockMinute: 7 * 60,
    selloutMinute: 13 * 60,
}

/** Weekdays only. */
const weekdays: MachineSchedule = {
    stockedDays: [1, 2, 3, 4, 5],
    restockMinute: 7 * 60,
    selloutMinute: 11 * 60,
}

describe("statusAt", () => {
    it("shows restocking before the morning fill", () => {
        const status = statusAt(daily, 2, 6 * 60)
        expect(status.kind).toBe("upcoming")
        expect(status.label).toBe("Restocking at 7:00 AM")
    })

    it("is fresh from restock until the selling-fast window", () => {
        expect(statusAt(daily, 2, 7 * 60).kind).toBe("fresh")
        expect(statusAt(daily, 2, 13 * 60 - SELLING_FAST_WINDOW - 1).kind).toBe("fresh")
        expect(statusAt(daily, 2, 7 * 60).label).toBe("Stocked fresh at 7:00 AM")
    })

    it("nudges when the case is almost gone", () => {
        expect(statusAt(daily, 2, 13 * 60 - SELLING_FAST_WINDOW).kind).toBe("sellingFast")
        expect(statusAt(daily, 2, 13 * 60 - 1).kind).toBe("sellingFast")
    })

    it("sells out at the sellout minute and points at tomorrow", () => {
        const status = statusAt(daily, 2, 13 * 60)
        expect(status.kind).toBe("soldOut")
        expect(status.label).toBe("Sold out — back tomorrow at 7:00 AM")
    })

    it("rests on unstocked days and names the next stocked day", () => {
        // Saturday for a weekday machine: back Monday.
        const status = statusAt(weekdays, 6, 9 * 60)
        expect(status.kind).toBe("closed")
        expect(status.label).toBe("Back Monday at 7:00 AM")
        // Friday after sellout: Saturday isn't stocked, so back Monday.
        expect(statusAt(weekdays, 5, 12 * 60).label).toBe("Sold out — back Monday at 7:00 AM")
    })
})

describe("nextRestockDayLabel", () => {
    it("says tomorrow when the next day is stocked", () => {
        expect(nextRestockDayLabel(daily, 3)).toBe("tomorrow")
    })

    it("wraps the week to find the next stocked day", () => {
        // From Saturday, a weekday machine restocks Monday.
        expect(nextRestockDayLabel(weekdays, 6)).toBe("Monday")
        // From Friday, tomorrow (Saturday) is off, so Monday.
        expect(nextRestockDayLabel(weekdays, 5)).toBe("Monday")
    })
})

describe("formatMinute", () => {
    it("formats morning, noon, and afternoon times", () => {
        expect(formatMinute(7 * 60)).toBe("7:00 AM")
        expect(formatMinute(7 * 60 + 5)).toBe("7:05 AM")
        expect(formatMinute(0)).toBe("12:00 AM")
        expect(formatMinute(12 * 60)).toBe("12:00 PM")
        expect(formatMinute(15 * 60 + 30)).toBe("3:30 PM")
    })
})

describe("lineupIndexForDay", () => {
    it("rotates through lineups one day at a time", () => {
        expect(lineupIndexForDay(0, 3)).toBe(0)
        expect(lineupIndexForDay(1, 3)).toBe(1)
        expect(lineupIndexForDay(2, 3)).toBe(2)
        expect(lineupIndexForDay(3, 3)).toBe(0)
    })

    it("stays in range for negative days and empty lists", () => {
        expect(lineupIndexForDay(-1, 3)).toBe(2)
        expect(lineupIndexForDay(5, 0)).toBe(0)
    })
})

describe("epochDay", () => {
    it("counts local days since the epoch", () => {
        const first = epochDay(new Date(2026, 2, 1, 12, 0, 0))
        const second = epochDay(new Date(2026, 2, 11, 12, 0, 0))
        expect(second - first).toBe(10)
    })
})

describe("formatPrice", () => {
    it("trims trailing zero cents", () => {
        expect(formatPrice(450)).toBe("$4.50")
        expect(formatPrice(500)).toBe("$5")
        expect(formatPrice(375)).toBe("$3.75")
    })
})
