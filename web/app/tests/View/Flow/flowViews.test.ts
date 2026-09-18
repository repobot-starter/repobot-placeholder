import { describe, expect, it } from "vitest"
import {
    budgetInputValue,
    formatFlowMoney,
    formatFlowMonth,
    isFavorableVariance,
    parseMoneyInput,
    sectionTotals,
    type FlowGridLine,
} from "../../../src/View/Flow/flowShared"

function line(overrides: Partial<FlowGridLine>): FlowGridLine {
    return {
        id: "fll-1",
        position: 0,
        label: "Rent",
        section: "EXPENSES",
        linkedCategory: null,
        budgetsMinorUnits: [0, 0],
        actualsMinorUnits: [null, null],
        variancesMinorUnits: [null, null],
        ...overrides,
    }
}

describe("flow views", () => {
    it("formats money in the template's currency", () => {
        expect(formatFlowMoney(245_000, "usd")).toBe("$2,450.00")
        expect(formatFlowMoney(0, "usd")).toBe("$0.00")
    })

    it("formats grid months without timezone drift", () => {
        expect(formatFlowMonth("2027-01")).toContain("2027")
        expect(formatFlowMonth("not-a-month")).toBe("not-a-month")
    })

    it("parses typed dollar amounts into minor units", () => {
        expect(parseMoneyInput("1234.56")).toBe(123_456)
        expect(parseMoneyInput("$2,000")).toBe(200_000)
        expect(parseMoneyInput("")).toBe(0)
        expect(parseMoneyInput("abc")).toBeUndefined()
    })

    it("renders budget cells as plain dollars", () => {
        expect(budgetInputValue(123_456)).toBe("1234.56")
        expect(budgetInputValue(200_000)).toBe("2000")
        expect(budgetInputValue(0)).toBe("0")
    })

    it("colors variance by section: income over plan is good, spending over plan is not", () => {
        expect(isFavorableVariance("INCOME", 500)).toBe(true)
        expect(isFavorableVariance("INCOME", -500)).toBe(false)
        expect(isFavorableVariance("EXPENSES", -500)).toBe(true)
        expect(isFavorableVariance("EXPENSES", 500)).toBe(false)
    })

    it("totals a section's budgets and actuals per month, leaving no-data months null", () => {
        const lines = [
            line({
                id: "a",
                section: "INCOME",
                budgetsMinorUnits: [100, 200],
                actualsMinorUnits: [150, null],
            }),
            line({
                id: "b",
                section: "INCOME",
                budgetsMinorUnits: [300, 400],
                actualsMinorUnits: [350, null],
            }),
            line({ id: "c", section: "EXPENSES", budgetsMinorUnits: [999, 999] }),
        ]
        expect(sectionTotals(lines, "INCOME", 2)).toEqual({
            budgets: [400, 600],
            actuals: [500, null],
        })
    })
})
