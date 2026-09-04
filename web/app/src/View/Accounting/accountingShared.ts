import { formatCurrencyMinorUnits } from "@ui"
import type { QuickBooksInvoicesQuery, QuickBooksInvoiceStatus } from "../../generated/graphql/types"

/**
 * Shared bits of the accounting pack's dashboard views (packs/accounting).
 * The route paths mirror the pack's repobot.project.json dashboard
 * destinations, which the IA scaffolder wires at compose time
 * (docs/project-ia.md) — the views themselves are these kernel files.
 */
export const accountingPaths = {
    overview: "/overview",
    invoices: "/invoices",
    customers: "/customers",
    advisor: "/advisor",
} as const

/**
 * The simulated sample company reports in USD (QUICKBOOKS_MODE=local). When
 * the real intuit mode lands, surface the company's currency from the API
 * instead of this constant.
 */
export const QUICKBOOKS_CURRENCY = "usd"

/** Formats an amount in QuickBooks minor units (cents) per repo conventions. */
export function formatQuickBooksMoney(amountMinorUnits: number): string {
    return formatCurrencyMinorUnits(amountMinorUnits, QUICKBOOKS_CURRENCY)
}

/** Formats a QuickBooks YYYY-MM-DD date for display, e.g. "May 4, 2026". */
export function formatQuickBooksDate(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) {
        return isoDate
    }
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    })
}

export const invoiceStatusLabels: Record<QuickBooksInvoiceStatus, string> = {
    PAID: "Paid",
    OPEN: "Open",
    OVERDUE: "Overdue",
}

export const invoiceStatusTones: Record<QuickBooksInvoiceStatus, "success" | "accent" | "danger"> = {
    PAID: "success",
    OPEN: "accent",
    OVERDUE: "danger",
}

export type QuickBooksInvoiceNode = QuickBooksInvoicesQuery["quickBooksInvoices"][number]

/** Case-insensitive match against an invoice's document number and customer. */
export function invoiceMatchesSearch(invoice: QuickBooksInvoiceNode, search: string): boolean {
    const needle = search.trim().toLowerCase()
    if (needle === "") {
        return true
    }
    return (
        invoice.docNumber.toLowerCase().includes(needle) ||
        invoice.customerName.toLowerCase().includes(needle)
    )
}
