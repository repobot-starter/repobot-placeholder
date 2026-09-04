import { describe, expect, it } from "vitest"
import {
    formatCfoMoney,
    formatStatementMonth,
    latestNetIncome,
    type CfoClientNode,
} from "../../../src/View/Cfo/cfoShared"

function client(profitAndLoss: CfoClientNode["profitAndLoss"]): CfoClientNode {
    return {
        membership: {
            id: "cfom-1",
            role: "CLIENT",
            joinedTime: "2026-01-01T00:00:00Z",
            user: { id: "user-1", email: "client@example.com", displayName: "Client" },
        },
        connection: null,
        snapshot: null,
        profitAndLoss,
        balanceSheet: [],
    } as CfoClientNode
}

describe("cfo views", () => {
    it("formats minor units as USD per repo conventions", () => {
        expect(formatCfoMoney(245_000)).toBe("$2,450.00")
        expect(formatCfoMoney(0)).toBe("$0.00")
    })

    it("formats statement months without timezone drift", () => {
        expect(formatStatementMonth("2026-08")).toContain("2026")
        expect(formatStatementMonth("not-a-month")).toBe("not-a-month")
    })

    it("reads the latest month's net income for portfolio tiles", () => {
        expect(latestNetIncome(client([]))).toBeUndefined()
        expect(
            latestNetIncome(
                client([
                    {
                        month: "2026-07",
                        totalIncomeMinorUnits: 100,
                        totalExpensesMinorUnits: 40,
                        netIncomeMinorUnits: 60,
                    },
                    {
                        month: "2026-08",
                        totalIncomeMinorUnits: 200,
                        totalExpensesMinorUnits: 80,
                        netIncomeMinorUnits: 120,
                    },
                ]),
            ),
        ).toBe(120)
    })
})
