import { formatCurrencyMinorUnits } from "@ui"
import type { FlowSection, FlowTemplateGridQuery } from "../../generated/graphql/types"

/**
 * Shared bits of the flow pack's dashboard views (packs/flow). The route
 * paths mirror the pack's repobot.project.json dashboard destinations, which
 * the IA scaffolder wires at compose time (docs/project-ia.md) — the views
 * themselves are these kernel files.
 */
export const flowPaths = {
    templates: "/templates",
    grid: "/grid",
    books: "/books",
} as const

export type FlowGridTemplate = FlowTemplateGridQuery["flowTemplate"]
export type FlowGridLine = FlowGridTemplate["lines"][number]

export function formatFlowMoney(amountMinorUnits: number, currency: string): string {
    return formatCurrencyMinorUnits(amountMinorUnits, currency)
}

/** Formats a YYYY-MM grid month for a column header, e.g. "Aug 2026". */
export function formatFlowMonth(isoMonth: string): string {
    const date = new Date(`${isoMonth}-01T00:00:00Z`)
    if (Number.isNaN(date.getTime())) {
        return isoMonth
    }
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", timeZone: "UTC" })
}

export const flowSectionLabels: Record<FlowSection, string> = {
    INCOME: "Income",
    EXPENSES: "Expenses",
}

/** Parses a typed dollar amount into integer minor units; undefined when unreadable. */
export function parseMoneyInput(raw: string): number | undefined {
    const cleaned = raw.replace(/[$,\s]/g, "")
    if (cleaned === "") {
        return 0
    }
    const amount = Number(cleaned)
    if (!Number.isFinite(amount)) {
        return undefined
    }
    return Math.round(amount * 100)
}

/** A budget cell's editable text: plain dollars, no symbols. */
export function budgetInputValue(amountMinorUnits: number): string {
    return (amountMinorUnits / 100).toFixed(2).replace(/\.00$/, "")
}

/**
 * Whether a variance is favorable: income over plan is good, spending over
 * plan is not.
 */
export function isFavorableVariance(section: FlowSection, varianceMinorUnits: number): boolean {
    return section === "INCOME" ? varianceMinorUnits >= 0 : varianceMinorUnits <= 0
}

/** Per-month totals for one section, budgets and actuals (null when no month has actuals). */
export function sectionTotals(
    lines: readonly FlowGridLine[],
    section: FlowSection,
    monthCount: number,
): { budgets: number[]; actuals: (number | null)[] } {
    const sectionLines = lines.filter((line) => line.section === section)
    const budgets = Array.from({ length: monthCount }, (_, index) =>
        sectionLines.reduce((sum, line) => sum + (line.budgetsMinorUnits[index] ?? 0), 0),
    )
    const actuals = Array.from({ length: monthCount }, (_, index) => {
        const values = sectionLines
            .map((line) => line.actualsMinorUnits[index])
            .filter((value): value is number => value !== null && value !== undefined)
        if (values.length === 0) {
            return null
        }
        return values.reduce((sum, value) => sum + value, 0)
    })
    return { budgets, actuals }
}
