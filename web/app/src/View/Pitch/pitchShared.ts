import { formatCurrencyMinorUnits } from "@ui"
import type { PitchDeckDataQuery, PitchDeckOutlineQuery, PitchSlideKind } from "../../generated/graphql/types"

/**
 * Shared bits of the pitch pack's dashboard views (packs/pitch). The route
 * paths mirror the pack's repobot.project.json dashboard destinations, which
 * the IA scaffolder wires at compose time (docs/project-ia.md) — the views
 * themselves are these kernel files.
 */
export const pitchPaths = {
    decks: "/decks",
    builder: "/builder",
    books: "/books",
} as const

export type PitchDeckNode = PitchDeckOutlineQuery["pitchDeck"]
export type PitchSlideNode = PitchDeckNode["slides"][number]
export type PitchDeckDataNode = NonNullable<PitchDeckDataQuery["pitchDeckData"]>

export function formatPitchMoney(amountMinorUnits: number, currency: string): string {
    return formatCurrencyMinorUnits(amountMinorUnits, currency)
}

/** Formats a YYYY-MM series month for a chart axis, e.g. "Aug 2026". */
export function formatPitchMonth(isoMonth: string): string {
    const date = new Date(`${isoMonth}-01T00:00:00Z`)
    if (Number.isNaN(date.getTime())) {
        return isoMonth
    }
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", timeZone: "UTC" })
}

export const slideKindLabels: Record<PitchSlideKind, string> = {
    COVER: "Cover",
    TRACTION: "Traction",
    REVENUE: "Revenue",
    MARGINS: "Margins",
    RUNWAY: "Runway",
    ASK: "The ask",
}

/** The accent swatches the builder offers; any hex is accepted by the API. */
export const accentPresets = ["#1f6feb", "#0e9f6e", "#d97706", "#dc2626", "#7c3aed", "#0f766e"] as const

/** Human copy for the runway headline, e.g. "14 months" or "Cash-flow positive". */
export function runwayLabel(runwayMonths: number | null | undefined): string {
    if (runwayMonths === null || runwayMonths === undefined) {
        return "Cash-flow positive"
    }
    return `${runwayMonths} month${runwayMonths === 1 ? "" : "s"}`
}

/** Whether a hex color reads as a valid accent, mirroring the API's rule. */
export function isValidAccent(hex: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(hex)
}
