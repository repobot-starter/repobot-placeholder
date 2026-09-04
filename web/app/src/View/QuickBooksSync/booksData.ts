import { gql, useQuery, type QueryResult } from "@apollo/client"
import type { QuickBooksCustomersQuery, QuickBooksInvoicesQuery } from "../../generated/graphql/types"

/**
 * The data layer behind the QuickBooks Sync command center: one extra read
 * (thirteen trailing months of P&L plus month-end balance sheets — both
 * already on the schema, see packs/quickbooks/PACK.md) and the pure
 * derivations that turn the raw books into chart-ready view models. Every
 * number on the page comes from these queries, so cards, charts, and tables
 * tell one consistent story.
 */

export type InvoiceNode = QuickBooksInvoicesQuery["quickBooksInvoices"][number]
export type CustomerNode = QuickBooksCustomersQuery["quickBooksCustomers"][number]

export interface StatementLine {
    category: string
    minorUnits: number
}

export interface ProfitAndLossPeriod {
    /** Calendar month as YYYY-MM, oldest first. */
    month: string
    totalIncomeMinorUnits: number
    totalExpensesMinorUnits: number
    netIncomeMinorUnits: number
    expenseLines: StatementLine[]
}

export interface BalanceSheetPeriod {
    month: string
    totalAssetsMinorUnits: number
    assetLines: StatementLine[]
}

export interface QuickBooksSyncStatementsData {
    quickBooksProfitAndLoss: ProfitAndLossPeriod[]
    quickBooksBalanceSheet: BalanceSheetPeriod[]
}

const QUICK_BOOKS_SYNC_STATEMENTS = gql`
    query QuickBooksSyncStatements {
        quickBooksProfitAndLoss {
            month
            totalIncomeMinorUnits
            totalExpensesMinorUnits
            netIncomeMinorUnits
            expenseLines {
                category
                minorUnits
            }
        }
        quickBooksBalanceSheet {
            month
            totalAssetsMinorUnits
            assetLines {
                category
                minorUnits
            }
        }
    }
`

export function useQuickBooksSyncStatementsQuery(options: {
    skip: boolean
}): QueryResult<QuickBooksSyncStatementsData> {
    return useQuery<QuickBooksSyncStatementsData>(QUICK_BOOKS_SYNC_STATEMENTS, options)
}

/** Operation name for refetchQueries when the connection changes. */
export const QUICK_BOOKS_SYNC_STATEMENTS_NAME = "QuickBooksSyncStatements"

//
// Formatters — crisp dashboard numerals (whole dollars; cents add noise at
// this zoom level and every simulated amount is whole-dollar anyway).
//

const wholeUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
})

export function formatMoneyWhole(minorUnits: number): string {
    return wholeUsd.format(Math.round(minorUnits / 100))
}

/** Compact money for axis ticks and dense chips: $8.4k, $12.5k, $1.2M. */
export function formatMoneyCompact(minorUnits: number): string {
    const dollars = minorUnits / 100
    const abs = Math.abs(dollars)
    const sign = dollars < 0 ? "-" : ""
    if (abs >= 1_000_000) {
        return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    }
    if (abs >= 1_000) {
        return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}k`
    }
    return wholeUsd.format(dollars)
}

/** "2026-08" → "Aug". */
export function monthShortLabel(isoMonth: string): string {
    const date = new Date(`${isoMonth}-01T00:00:00Z`)
    if (Number.isNaN(date.getTime())) {
        return isoMonth
    }
    return date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
}

//
// Trends
//

export interface Trend {
    /** Percent change vs the prior period, or null when undefined (prior 0). */
    deltaPercent: number | null
    direction: "up" | "down" | "flat"
}

export function trendBetween(previous: number, latest: number): Trend {
    if (previous === 0) {
        return { deltaPercent: null, direction: latest > 0 ? "up" : latest < 0 ? "down" : "flat" }
    }
    const deltaPercent = ((latest - previous) / Math.abs(previous)) * 100
    const direction = Math.abs(deltaPercent) < 0.05 ? "flat" : deltaPercent > 0 ? "up" : "down"
    return { deltaPercent, direction }
}

//
// Monthly series (hero chart + KPI sparklines)
//

export interface MonthPoint {
    month: string
    label: string
    incomeMinorUnits: number
    expensesMinorUnits: number
    netMinorUnits: number
}

export function buildMonthlySeries(periods: readonly ProfitAndLossPeriod[]): MonthPoint[] {
    return periods.map((period) => ({
        month: period.month,
        label: monthShortLabel(period.month),
        incomeMinorUnits: period.totalIncomeMinorUnits,
        expensesMinorUnits: period.totalExpensesMinorUnits,
        netMinorUnits: period.netIncomeMinorUnits,
    }))
}

/** The month-end cash series: the "Cash" asset line, else total assets. */
export function buildCashSeries(periods: readonly BalanceSheetPeriod[]): number[] {
    return periods.map((period) => {
        const cashLine = period.assetLines.find((line) => /cash/i.test(line.category))
        return cashLine?.minorUnits ?? period.totalAssetsMinorUnits
    })
}

//
// Accounts-receivable aging (from open invoice balances, honest to dates)
//

export type AgingBucketKey = "current" | "d1to30" | "d31to60" | "d61plus"

export interface AgingBucket {
    key: AgingBucketKey
    label: string
    amountMinorUnits: number
    invoiceCount: number
}

const MS_PER_DAY = 86_400_000

export function buildAgingBuckets(
    invoices: readonly InvoiceNode[],
    todayIso: string = new Date().toISOString().slice(0, 10),
): AgingBucket[] {
    const buckets: AgingBucket[] = [
        { key: "current", label: "Current", amountMinorUnits: 0, invoiceCount: 0 },
        { key: "d1to30", label: "1–30 days", amountMinorUnits: 0, invoiceCount: 0 },
        { key: "d31to60", label: "31–60 days", amountMinorUnits: 0, invoiceCount: 0 },
        { key: "d61plus", label: "61+ days", amountMinorUnits: 0, invoiceCount: 0 },
    ]
    const today = new Date(`${todayIso}T00:00:00Z`).getTime()
    for (const invoice of invoices) {
        if (invoice.balanceMinorUnits <= 0) {
            continue
        }
        const due = new Date(`${invoice.dueDate}T00:00:00Z`).getTime()
        const daysPastDue = Number.isNaN(due) ? 0 : Math.floor((today - due) / MS_PER_DAY)
        const bucket =
            daysPastDue <= 0
                ? buckets[0]
                : daysPastDue <= 30
                  ? buckets[1]
                  : daysPastDue <= 60
                    ? buckets[2]
                    : buckets[3]
        bucket.amountMinorUnits += invoice.balanceMinorUnits
        bucket.invoiceCount += 1
    }
    return buckets
}

//
// Top customers (billed across the synced window, with open balances)
//

export interface TopCustomerRow {
    id: string
    name: string
    detail: string
    billedMinorUnits: number
    openMinorUnits: number
    invoiceCount: number
    /** Billed relative to the top biller, 0..1, for the share bar. */
    share: number
}

export function buildTopCustomers(
    invoices: readonly InvoiceNode[],
    customers: readonly CustomerNode[],
    limit = 5,
): TopCustomerRow[] {
    const byId = new Map<string, TopCustomerRow>()
    for (const invoice of invoices) {
        const row = byId.get(invoice.customerId) ?? {
            id: invoice.customerId,
            name: invoice.customerName,
            detail: "",
            billedMinorUnits: 0,
            openMinorUnits: 0,
            invoiceCount: 0,
            share: 0,
        }
        row.billedMinorUnits += invoice.totalMinorUnits
        row.openMinorUnits += invoice.balanceMinorUnits
        row.invoiceCount += 1
        byId.set(invoice.customerId, row)
    }
    for (const customer of customers) {
        const row = byId.get(customer.id)
        if (row !== undefined) {
            const place = [customer.city, customer.state].filter((part) => part !== "").join(", ")
            row.detail = place
        }
    }
    const rows = [...byId.values()].sort((a, b) => b.billedMinorUnits - a.billedMinorUnits).slice(0, limit)
    const top = rows[0]?.billedMinorUnits ?? 0
    for (const row of rows) {
        row.share = top > 0 ? row.billedMinorUnits / top : 0
    }
    return rows
}

//
// Expense mix (latest month, matching the hero chart's newest bar exactly)
//

export interface ExpenseSlice {
    category: string
    amountMinorUnits: number
    /** Fraction of the month's total spend, 0..1. */
    share: number
}

export function buildExpenseMix(period: ProfitAndLossPeriod | undefined): ExpenseSlice[] {
    if (period === undefined || period.totalExpensesMinorUnits <= 0) {
        return []
    }
    return [...period.expenseLines]
        .sort((a, b) => b.minorUnits - a.minorUnits)
        .map((line) => ({
            category: line.category,
            amountMinorUnits: line.minorUnits,
            share: line.minorUnits / period.totalExpensesMinorUnits,
        }))
}
