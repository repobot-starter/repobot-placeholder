import { formatCurrencyMinorUnits } from "@ui"
import type {
    CreditDocumentKind,
    CreditFindingSeverity,
    CreditLcsQuery,
    ShipmentTerm,
} from "../../generated/graphql/types"

/**
 * Shared bits of the credit pack's dashboard views (packs/credit). The route
 * paths mirror the pack's repobot.project.json dashboard destinations, which
 * the IA scaffolder wires at compose time (docs/project-ia.md) — the views
 * themselves are these kernel files.
 */
export const creditPaths = {
    desk: "/desk",
    review: "/review",
} as const

export type CreditLcNode = CreditLcsQuery["creditLcs"][number]
export type CreditDocumentNode = CreditLcNode["documents"][number]
export type CreditFindingNode = CreditLcNode["findings"][number]

export function formatCreditMoney(amountMinorUnits: number, currency: string): string {
    return formatCurrencyMinorUnits(amountMinorUnits, currency)
}

/** Formats an ISO yyyy-mm-dd date for display, e.g. "May 31, 2027". */
export function formatCreditDate(isoDate: string): string {
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

/** Whole days from today (UTC) until the ISO date; negative when past. */
export function daysUntil(isoDate: string): number {
    const target = new Date(`${isoDate}T00:00:00Z`).getTime()
    if (Number.isNaN(target)) {
        return 0
    }
    const now = new Date()
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    return Math.round((target - todayUtc) / (24 * 60 * 60 * 1000))
}

/** "12 days left" / "due today" / "3 days ago", for the countdown chips. */
export function describeDaysUntil(isoDate: string): string {
    const days = daysUntil(isoDate)
    if (days > 1) {
        return `${days} days left`
    }
    if (days === 1) {
        return "1 day left"
    }
    if (days === 0) {
        return "due today"
    }
    if (days === -1) {
        return "1 day ago"
    }
    return `${-days} days ago`
}

export const shipmentTermLabels: Record<ShipmentTerm, string> = {
    ALLOWED: "Allowed",
    NOT_ALLOWED: "Not allowed",
    NOT_STATED: "Not stated",
}

export const documentKindLabels: Record<CreditDocumentKind, string> = {
    COMMERCIAL_INVOICE: "Commercial invoice",
    BILL_OF_LADING: "Bill of lading",
    PACKING_LIST: "Packing list",
    OTHER: "Document",
}

export const severityLabels: Record<CreditFindingSeverity, string> = {
    OK: "OK",
    WARNING: "Warning",
    DISCREPANCY: "Discrepancy",
}

export const severityBadgeTones: Record<CreditFindingSeverity, "success" | "warning" | "danger"> = {
    OK: "success",
    WARNING: "warning",
    DISCREPANCY: "danger",
}

/** Counts by severity, for the LC cards' at-a-glance report chips. */
export function findingCounts(findings: readonly CreditFindingNode[]): {
    discrepancies: number
    warnings: number
} {
    return {
        discrepancies: findings.filter((finding) => finding.severity === "DISCREPANCY").length,
        warnings: findings.filter((finding) => finding.severity === "WARNING").length,
    }
}
