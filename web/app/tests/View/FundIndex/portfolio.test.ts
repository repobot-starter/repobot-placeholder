import { describe, expect, it } from "vitest"
import {
    allSectors,
    companyBadge,
    countsLine,
    daysSinceInvestment,
    exitsCount,
    indexNumber,
    investmentYear,
    isNewInvestment,
    newestFirst,
    portfolioCount,
} from "../../../src/View/FundIndex/portfolio"

/**
 * The index fund's portfolio engine is pure — the clock is always passed
 * in — so every rule pins an instant and asserts the exact label a visitor
 * would read. The rules under test are the pack's pitch: counts, chips,
 * status pills, and the register's signature index numerals are arithmetic
 * over the content data, never hand-written.
 */

/** A fixed "today": August 27, 2026, mid-morning. */
const NOW = new Date(2026, 7, 27, 10, 30)

const active = (investedAt: string) => ({ status: "active" as const, investedAt })

describe("fund-index portfolio engine", () => {
    it("counts whole days since the first check from local midnight", () => {
        expect(daysSinceInvestment({ investedAt: "2026-08-27" }, NOW)).toBe(0)
        expect(daysSinceInvestment({ investedAt: "2026-08-26" }, NOW)).toBe(1)
        // A future-dated investment never goes negative.
        expect(daysSinceInvestment({ investedAt: "2026-09-01" }, NOW)).toBe(0)
    })

    it("keeps an investment New for ~6 months, to the day", () => {
        // Day 183 is the last New day; day 184 ages out.
        expect(isNewInvestment({ investedAt: "2026-02-25" }, NOW)).toBe(true)
        expect(isNewInvestment({ investedAt: "2026-02-24" }, NOW)).toBe(false)
    })

    it("grades an active company's freshness from the clock", () => {
        expect(companyBadge(active("2026-07-14"), NOW)).toEqual({ label: "New", tone: "accent" })
        // A seasoned active company wears no pill at all — the sheet stays quiet.
        expect(companyBadge(active("2024-05-01"), NOW)).toBeUndefined()
    })

    it("lets the data override the clock for settled statuses", () => {
        // An exit wears its outcome however fresh the date is.
        expect(companyBadge({ status: "acquired", investedAt: "2026-08-01" }, NOW)).toEqual({
            label: "Acquired",
            tone: "neutral",
        })
        expect(companyBadge({ status: "public", investedAt: "2026-08-01" }, NOW)).toEqual({
            label: "Public",
            tone: "neutral",
        })
    })

    it("computes portfolio and exit counts from statuses", () => {
        const list = [
            active("2026-07-01"),
            active("2025-01-01"),
            { status: "acquired" as const, investedAt: "2024-01-01" },
            { status: "public" as const, investedAt: "2021-01-01" },
        ]
        expect(portfolioCount(list)).toBe(4)
        expect(exitsCount(list)).toBe(2)
    })

    it("derives sector chips as a first-appearance union", () => {
        const list = [{ sectors: ["Compute"] }, { sectors: ["Risk", "Compute"] }, { sectors: ["Space"] }]
        expect(allSectors(list)).toEqual(["Compute", "Risk", "Space"])
    })

    it("writes the counts line with correct grammar", () => {
        expect(
            countsLine([
                { ...active("2026-07-01"), sectors: ["Compute"] },
                { status: "acquired" as const, investedAt: "2024-01-01", sectors: ["Risk"] },
            ]),
        ).toBe("2 companies · 1 exit · 2 sectors")
        expect(
            countsLine([
                { ...active("2026-07-01"), sectors: ["Compute"] },
                { status: "acquired" as const, investedAt: "2024-01-01", sectors: ["Risk"] },
                { status: "public" as const, investedAt: "2021-01-01", sectors: ["Risk"] },
            ]),
        ).toBe("3 companies · 2 exits · 2 sectors")
    })

    it("reads the investment year off the date", () => {
        expect(investmentYear({ investedAt: "2024-12-04" })).toBe("2024")
    })

    it("files positions as zero-padded index numerals", () => {
        expect(indexNumber(0)).toBe("001")
        expect(indexNumber(5)).toBe("006")
        expect(indexNumber(0, 2)).toBe("01")
        expect(indexNumber(2, 2)).toBe("03")
        // Past the padding width, the numeral keeps counting honestly.
        expect(indexNumber(99, 2)).toBe("100")
    })

    it("sorts dated entries newest-first without touching the input", () => {
        const entries = [{ date: "2025-09-03" }, { date: "2026-05-12" }, { date: "2026-01-28" }]
        expect(newestFirst(entries).map((entry) => entry.date)).toEqual([
            "2026-05-12",
            "2026-01-28",
            "2025-09-03",
        ])
        expect(entries[0].date).toBe("2025-09-03")
    })
})
