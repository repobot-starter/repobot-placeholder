import { expect } from "chai"
import {
    QboReport,
    parseBalanceSheetReport,
    parseProfitAndLossReport,
} from "../../src/DependencyWrappers/IntuitWrapper/IntuitApiWrapper.js"

/**
 * The QBO report parsers against fixtures shaped like Intuit's actual
 * responses (month columns stamped with StartDate metadata plus a Total
 * column, recursive Section rows with Data leaves and Summary totals).
 */
describe("Intuit report parsing", function () {
    const columns = {
        Column: [
            { ColTitle: "", ColType: "Account" },
            {
                ColTitle: "Jul 2026",
                ColType: "Money",
                MetaData: [
                    { Name: "StartDate", Value: "2026-07-01" },
                    { Name: "EndDate", Value: "2026-07-31" },
                ],
            },
            {
                ColTitle: "Aug 2026",
                ColType: "Money",
                MetaData: [
                    { Name: "StartDate", Value: "2026-08-01" },
                    { Name: "EndDate", Value: "2026-08-11" },
                ],
            },
            { ColTitle: "Total", ColType: "Money" },
        ],
    }

    it("maps a P&L report with nested accounts into monthly periods", function () {
        const report: QboReport = {
            Columns: columns,
            Rows: {
                Row: [
                    {
                        group: "Income",
                        type: "Section",
                        Header: { ColData: [{ value: "Income" }, { value: "" }, { value: "" }] },
                        Rows: {
                            Row: [
                                {
                                    type: "Data",
                                    ColData: [
                                        { value: "Design income" },
                                        { value: "12000.00" },
                                        { value: "9000.50" },
                                        { value: "21000.50" },
                                    ],
                                },
                                {
                                    // A parent account with sub-accounts nests one level down.
                                    type: "Section",
                                    Header: { ColData: [{ value: "Services" }] },
                                    Rows: {
                                        Row: [
                                            {
                                                type: "Data",
                                                ColData: [
                                                    { value: "Consulting" },
                                                    { value: "3000.00" },
                                                    { value: "" },
                                                    { value: "3000.00" },
                                                ],
                                            },
                                        ],
                                    },
                                    Summary: { ColData: [{ value: "Total Services" }] },
                                },
                            ],
                        },
                        Summary: { ColData: [{ value: "Total Income" }] },
                    },
                    {
                        group: "Expenses",
                        type: "Section",
                        Rows: {
                            Row: [
                                {
                                    type: "Data",
                                    ColData: [
                                        { value: "Payroll" },
                                        { value: "7000.00" },
                                        { value: "7100.00" },
                                        { value: "14100.00" },
                                    ],
                                },
                            ],
                        },
                        Summary: { ColData: [{ value: "Total Expenses" }] },
                    },
                    {
                        // Derived summary sections are skipped; totals come from lines.
                        group: "NetIncome",
                        type: "Section",
                        Summary: { ColData: [{ value: "Net Income" }, { value: "8000.00" }] },
                    },
                ],
            },
        }

        const periods = parseProfitAndLossReport(report)
        expect(periods.map((period) => period.month)).to.deep.equal(["2026-07", "2026-08"])

        const july = periods[0]
        expect(july.incomeLines).to.deep.equal([
            { category: "Design income", minorUnits: 1_200_000 },
            { category: "Consulting", minorUnits: 300_000 },
        ])
        expect(july.totalIncomeMinorUnits).to.equal(1_500_000)
        expect(july.expenseLines).to.deep.equal([{ category: "Payroll", minorUnits: 700_000 }])
        expect(july.totalExpensesMinorUnits).to.equal(700_000)
        expect(july.netIncomeMinorUnits).to.equal(800_000)

        const august = periods[1]
        // Empty cells parse as zero (Consulting had no August activity).
        expect(august.incomeLines[1]).to.deep.equal({ category: "Consulting", minorUnits: 0 })
        expect(august.totalIncomeMinorUnits).to.equal(900_050)
        expect(august.netIncomeMinorUnits).to.equal(900_050 - 710_000)
    })

    it("maps a balance sheet's combined liabilities-and-equity section", function () {
        const report: QboReport = {
            Columns: columns,
            Rows: {
                Row: [
                    {
                        group: "TotalAssets",
                        type: "Section",
                        Header: { ColData: [{ value: "ASSETS" }] },
                        Rows: {
                            Row: [
                                {
                                    type: "Data",
                                    ColData: [
                                        { value: "Checking" },
                                        { value: "45000.00" },
                                        { value: "46000.00" },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        type: "Section",
                        Header: { ColData: [{ value: "LIABILITIES AND EQUITY" }] },
                        Rows: {
                            Row: [
                                {
                                    group: "Liabilities",
                                    type: "Section",
                                    Rows: {
                                        Row: [
                                            {
                                                type: "Data",
                                                ColData: [
                                                    { value: "Credit card" },
                                                    { value: "5000.00" },
                                                    { value: "4000.00" },
                                                ],
                                            },
                                        ],
                                    },
                                },
                                {
                                    group: "Equity",
                                    type: "Section",
                                    Rows: {
                                        Row: [
                                            {
                                                type: "Data",
                                                ColData: [
                                                    { value: "Retained earnings" },
                                                    { value: "40000.00" },
                                                    { value: "42000.00" },
                                                ],
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        }

        const periods = parseBalanceSheetReport(report)
        expect(periods.map((period) => period.month)).to.deep.equal(["2026-07", "2026-08"])

        const july = periods[0]
        expect(july.assetLines).to.deep.equal([{ category: "Checking", minorUnits: 4_500_000 }])
        expect(july.liabilityLines).to.deep.equal([{ category: "Credit card", minorUnits: 500_000 }])
        expect(july.equityLines).to.deep.equal([{ category: "Retained earnings", minorUnits: 4_000_000 }])
        expect(july.totalAssetsMinorUnits).to.equal(4_500_000)
        expect(july.totalLiabilitiesMinorUnits + july.totalEquityMinorUnits).to.equal(4_500_000)

        const august = periods[1]
        expect(august.totalAssetsMinorUnits).to.equal(4_600_000)
        expect(august.totalLiabilitiesMinorUnits).to.equal(400_000)
        expect(august.totalEquityMinorUnits).to.equal(4_200_000)
    })
})
