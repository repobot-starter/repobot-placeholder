import { formatCurrencyMinorUnits } from "@ui"
import type { CfoClientsQuery, CfoClientStatementsQuery, CfoRole } from "../../generated/graphql/types"

/**
 * Shared bits of the CFO practice pack's dashboard views (packs/cfo). The
 * route paths mirror the pack's repobot.project.json dashboard destinations,
 * which the IA scaffolder wires at compose time (docs/project-ia.md) — the
 * views themselves are these kernel files.
 */
export const cfoPaths = {
    portfolio: "/portfolio",
    clients: "/clients",
    statements: "/statements",
    books: "/books",
} as const

/** The simulated sample companies report in USD (QUICKBOOKS_MODE=local). */
export const CFO_CURRENCY = "usd"

export function formatCfoMoney(amountMinorUnits: number): string {
    return formatCurrencyMinorUnits(amountMinorUnits, CFO_CURRENCY)
}

/** Formats a YYYY-MM statement month for display, e.g. "Aug 2026". */
export function formatStatementMonth(isoMonth: string): string {
    const date = new Date(`${isoMonth}-01T00:00:00Z`)
    if (Number.isNaN(date.getTime())) {
        return isoMonth
    }
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", timeZone: "UTC" })
}

export const cfoRoleLabels: Record<CfoRole, string> = {
    ADVISOR: "Advisor",
    CLIENT: "Client",
}

export const providerLabels: Record<string, string> = {
    QUICKBOOKS: "QuickBooks",
    XERO: "Xero",
}

export type CfoClientNode = CfoClientsQuery["cfoClients"][number]
export type CfoClientStatementsNode = CfoClientStatementsQuery["cfoClient"]
export type CfoPnlPeriod = CfoClientStatementsNode["profitAndLoss"][number]
export type CfoBalancePeriod = CfoClientStatementsNode["balanceSheet"][number]

/** The latest month's net income, for portfolio tiles; undefined before connecting. */
export function latestNetIncome(client: CfoClientNode): number | undefined {
    const periods = client.profitAndLoss
    if (periods.length === 0) {
        return undefined
    }
    return periods[periods.length - 1].netIncomeMinorUnits
}
