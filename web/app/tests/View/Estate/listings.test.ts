import { describe, expect, it } from "vitest"
import {
    daysOnMarket,
    listingBadge,
    marketLine,
    marketPulseLabel,
    newThisWeekCount,
    specsLine,
} from "../../../src/View/Estate/listings"

/**
 * The listings engine is pure — the clock is always passed in — so every
 * rule pins an instant and asserts the exact label a visitor would read.
 * The rules under test are the pack's pitch: status pills and market
 * counts are arithmetic over the content data, never hand-written.
 */

/** A fixed "today": August 27, 2026, mid-morning. */
const NOW = new Date(2026, 7, 27, 10, 30)

const available = (listedAt: string) => ({ status: "available" as const, listedAt })

describe("estate listings engine", () => {
    it("counts whole days on market from local midnight", () => {
        expect(daysOnMarket({ listedAt: "2026-08-27" }, NOW)).toBe(0)
        expect(daysOnMarket({ listedAt: "2026-08-26" }, NOW)).toBe(1)
        expect(daysOnMarket({ listedAt: "2026-08-13" }, NOW)).toBe(14)
        // A listing dated in the future never goes negative.
        expect(daysOnMarket({ listedAt: "2026-09-01" }, NOW)).toBe(0)
    })

    it("grades an available listing's freshness from the clock", () => {
        expect(listingBadge(available("2026-08-24"), NOW)).toEqual({
            label: "New this week",
            tone: "accent",
        })
        // Day 7 is still within the week; day 8 ages into "Just listed".
        expect(listingBadge(available("2026-08-20"), NOW).label).toBe("New this week")
        expect(listingBadge(available("2026-08-19"), NOW).label).toBe("Just listed")
        // Day 14 is the last "Just listed" day; day 15 is plain inventory.
        expect(listingBadge(available("2026-08-13"), NOW).label).toBe("Just listed")
        expect(listingBadge(available("2026-08-12"), NOW).label).toBe("For sale")
    })

    it("lets the data override the clock for settled statuses", () => {
        // A sold or pending listing wears its status however fresh the
        // dates are — the facts outrank the freshness ladder.
        expect(listingBadge({ status: "sold", listedAt: "2026-08-26" }, NOW)).toEqual({
            label: "Sold",
            tone: "neutral",
        })
        expect(listingBadge({ status: "pending", listedAt: "2026-08-26" }, NOW)).toEqual({
            label: "Sale pending",
            tone: "accent",
        })
    })

    it("writes the spec line the way a listing sheet does", () => {
        expect(specsLine({ beds: 4, baths: 3, sqft: 2940 })).toBe("4 bd · 3 ba · 2,940 sq ft")
        expect(specsLine({ beds: 3, baths: 2.5, sqft: 980 })).toBe("3 bd · 2.5 ba · 980 sq ft")
    })

    it("narrates days on market with correct grammar", () => {
        expect(marketLine(available("2026-08-27"), NOW)).toBe("Listed today")
        expect(marketLine(available("2026-08-26"), NOW)).toBe("1 day on market")
        expect(marketLine(available("2026-08-20"), NOW)).toBe("7 days on market")
        expect(marketLine({ status: "sold", listedAt: "2026-05-06" }, NOW)).toBe("Closed")
    })

    it("computes the hero's market pulse from the inventory", () => {
        const inventory = [
            available("2026-08-25"),
            available("2026-08-22"),
            available("2026-07-30"),
            { status: "pending" as const, listedAt: "2026-08-26" },
            { status: "sold" as const, listedAt: "2026-05-06" },
        ]
        expect(newThisWeekCount(inventory, NOW)).toBe(2)
        expect(marketPulseLabel(inventory, NOW)).toBe("2 new listings this week")
        // One fresh listing reads singular.
        expect(marketPulseLabel([available("2026-08-25")], NOW)).toBe("1 new listing this week")
        // With nothing fresh, the pulse falls back to the standing count —
        // the badge is always arithmetic, never a stale string.
        const quiet = [available("2026-07-01"), available("2026-06-20")]
        expect(marketPulseLabel(quiet, NOW)).toBe("2 homes on the market")
        expect(marketPulseLabel([available("2026-07-01")], NOW)).toBe("1 home on the market")
    })
})
