/**
 * Portfolio arithmetic for the index fund — the computable heart of the
 * pack, sibling of the fund pack's engine. Pure and
 * deterministic: the current time is always passed in, so badges recompute
 * per render and the tests pin one instant.
 *
 * The content module owns the facts (`sectors`, `investedAt`, `status`,
 * the ordered focus areas and principles, the dated log); this module owns
 * what the visitor reads from them: counts, exits, sector chips, status
 * pills, the "New" badge, newest-first ordering — and the register's
 * signature, the index numerals (001/002/003) computed from array
 * position, never typed by hand.
 */

import type { Company } from "./content"

/** How long an active investment stays "New" — roughly six months. */
export const NEW_INVESTMENT_DAYS = 183

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Parses an ISO date ("2026-07-02") as local midnight, matching `new Date(y, m, d)`. */
function localDate(iso: string): Date {
    const [year, month, day] = iso.split("-").map(Number)
    return new Date(year, month - 1, day)
}

/** Whole days since the investment; fresh investments are 0 days old. */
export function daysSinceInvestment(company: Pick<Company, "investedAt">, now: Date): number {
    const invested = localDate(company.investedAt).getTime()
    return Math.max(0, Math.floor((now.getTime() - invested) / MS_PER_DAY))
}

/** Whether an investment is fresh enough to wear the "New" badge. */
export function isNewInvestment(company: Pick<Company, "investedAt">, now: Date): boolean {
    return daysSinceInvestment(company, now) <= NEW_INVESTMENT_DAYS
}

/** "2025" — the year the firm invested, for the row's eyebrow. */
export function investmentYear(company: Pick<Company, "investedAt">): string {
    return company.investedAt.slice(0, 4)
}

export interface CompanyBadge {
    label: string
    /** Accent for the live "New" state, neutral for settled outcomes. */
    tone: "accent" | "neutral"
}

/**
 * The status pill a company row wears. Exits come straight from the data
 * ("Acquired", "Public"); an active company earns "New" from the clock for
 * its first ~six months, and after that wears no pill at all.
 */
export function companyBadge(
    company: Pick<Company, "status" | "investedAt">,
    now: Date,
): CompanyBadge | undefined {
    if (company.status === "acquired") {
        return { label: "Acquired", tone: "neutral" }
    }
    if (company.status === "public") {
        return { label: "Public", tone: "neutral" }
    }
    if (isNewInvestment(company, now)) {
        return { label: "New", tone: "accent" }
    }
    return undefined
}

/** How many companies the fund has backed — the whole list, exits included. */
export function portfolioCount(companies: readonly Pick<Company, "status">[]): number {
    return companies.length
}

/** Exits are settled outcomes: acquisitions plus public listings. */
export function exitsCount(companies: readonly Pick<Company, "status">[]): number {
    return companies.filter((company) => company.status !== "active").length
}

/** Union of all sector tags in first-appearance order — the filter chips. */
export function allSectors(companies: readonly Pick<Company, "sectors">[]): string[] {
    const seen: string[] = []
    for (const company of companies) {
        for (const sector of company.sectors) {
            if (!seen.includes(sector)) {
                seen.push(sector)
            }
        }
    }
    return seen
}

/**
 * The portfolio hero's counts line — arithmetic over the data, never a
 * hand-written number: "12 companies · 3 exits · 6 sectors".
 */
export function countsLine(companies: readonly Pick<Company, "status" | "sectors">[]): string {
    const exits = exitsCount(companies)
    const sectors = allSectors(companies).length
    return `${portfolioCount(companies)} companies · ${exits} ${exits === 1 ? "exit" : "exits"} · ${sectors} sectors`
}

/**
 * The register's signature numeral: position → "001", "002", … Reorder the
 * content array and every numeral follows; nothing is typed by hand.
 * `width` picks the zero padding — 3 for the focus index, 2 for principles.
 */
export function indexNumber(position: number, width = 3): string {
    return `${position + 1}`.padStart(width, "0")
}

/** Dated entries (the log) sorted newest-first, input untouched. */
export function newestFirst<T extends { date: string }>(entries: readonly T[]): T[] {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date))
}
