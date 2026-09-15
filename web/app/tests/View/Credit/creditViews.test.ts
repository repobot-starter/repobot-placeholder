import { describe, expect, it } from "vitest"
import {
    daysUntil,
    describeDaysUntil,
    findingCounts,
    formatCreditDate,
    formatCreditMoney,
    type CreditFindingNode,
} from "../../../src/View/Credit/creditShared"

function finding(severity: CreditFindingNode["severity"]): CreditFindingNode {
    return {
        code: "X",
        severity,
        title: "t",
        detail: "d",
        documentId: null,
    }
}

function isoDaysFromToday(days: number): string {
    const now = new Date()
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days))
    return date.toISOString().slice(0, 10)
}

describe("credit views", () => {
    it("formats money in the LC's own currency", () => {
        expect(formatCreditMoney(18_450_000, "usd")).toBe("$184,500.00")
        expect(formatCreditMoney(0, "usd")).toBe("$0.00")
    })

    it("formats ISO dates without timezone drift", () => {
        expect(formatCreditDate("2027-05-31")).toContain("2027")
        expect(formatCreditDate("2027-05-31")).toContain("31")
        expect(formatCreditDate("not-a-date")).toBe("not-a-date")
    })

    it("counts whole days to a deadline and describes the countdown", () => {
        expect(daysUntil(isoDaysFromToday(0))).toBe(0)
        expect(daysUntil(isoDaysFromToday(12))).toBe(12)
        expect(daysUntil(isoDaysFromToday(-3))).toBe(-3)
        expect(describeDaysUntil(isoDaysFromToday(12))).toBe("12 days left")
        expect(describeDaysUntil(isoDaysFromToday(1))).toBe("1 day left")
        expect(describeDaysUntil(isoDaysFromToday(0))).toBe("due today")
        expect(describeDaysUntil(isoDaysFromToday(-1))).toBe("1 day ago")
        expect(describeDaysUntil(isoDaysFromToday(-3))).toBe("3 days ago")
    })

    it("tallies the report for the LC cards' badges", () => {
        expect(
            findingCounts([
                finding("OK"),
                finding("DISCREPANCY"),
                finding("WARNING"),
                finding("DISCREPANCY"),
            ]),
        ).toEqual({ discrepancies: 2, warnings: 1 })
        expect(findingCounts([finding("OK")])).toEqual({ discrepancies: 0, warnings: 0 })
    })
})
