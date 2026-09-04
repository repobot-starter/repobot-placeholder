/**
 * Listing-status logic — the computable heart of a real-estate site, the
 * hours engine's sibling (`View/Landing/hours.ts`). Pure and deterministic:
 * the current time is always passed in, so the badges recompute per render
 * and the tests pin one instant.
 *
 * The content module owns the facts (`status`, `listedAt`, `soldAt`); this
 * module owns what the visitor reads from them: the status badge on every
 * listing card, the days-on-market arithmetic, and the hero's live market
 * pulse. Change a listing's dates or status in `content.ts` and every
 * badge, count, and label follows.
 */

import type { Listing } from "./content"

/** How long a fresh listing stays "New this week" / "Just listed". */
export const NEW_THIS_WEEK_DAYS = 7
export const JUST_LISTED_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Parses an ISO date ("2026-08-24") as local midnight, matching `new Date(y, m, d)`. */
function localDate(iso: string): Date {
    const [year, month, day] = iso.split("-").map(Number)
    return new Date(year, month - 1, day)
}

/** Whole days from the listing date to `now`; fresh listings are 0 days old. */
export function daysOnMarket(listing: Pick<Listing, "listedAt">, now: Date): number {
    const listed = localDate(listing.listedAt).getTime()
    return Math.max(0, Math.floor((now.getTime() - listed) / MS_PER_DAY))
}

export interface ListingBadge {
    label: string
    /** The showcase pill's tone: accent for live states, neutral for settled ones. */
    tone: "accent" | "neutral"
}

/**
 * The status pill a listing card wears. Sold and pending come straight
 * from the data; available listings earn their freshness from the clock —
 * "New this week" within a week of listing, "Just listed" within two,
 * then the plain "For sale".
 */
export function listingBadge(listing: Pick<Listing, "status" | "listedAt">, now: Date): ListingBadge {
    if (listing.status === "sold") {
        return { label: "Sold", tone: "neutral" }
    }
    if (listing.status === "pending") {
        return { label: "Sale pending", tone: "accent" }
    }
    const days = daysOnMarket(listing, now)
    if (days <= NEW_THIS_WEEK_DAYS) {
        return { label: "New this week", tone: "accent" }
    }
    if (days <= JUST_LISTED_DAYS) {
        return { label: "Just listed", tone: "accent" }
    }
    return { label: "For sale", tone: "accent" }
}

/** "4 bd · 3 ba · 2,940 sq ft" — the spec line every listing card carries. */
export function specsLine(listing: Pick<Listing, "beds" | "baths" | "sqft">): string {
    return `${listing.beds} bd · ${listing.baths} ba · ${listing.sqft.toLocaleString("en-US")} sq ft`
}

/**
 * The card's trailing status note: days on market while a listing is
 * live ("12 days on market"), the closing while it's history ("Closed
 * over asking" stays the description's job — this stays factual).
 */
export function marketLine(listing: Pick<Listing, "status" | "listedAt">, now: Date): string {
    if (listing.status === "sold") {
        return "Closed"
    }
    const days = daysOnMarket(listing, now)
    if (days === 0) {
        return "Listed today"
    }
    return days === 1 ? "1 day on market" : `${days} days on market`
}

/** How many listings are fresh within `NEW_THIS_WEEK_DAYS` and still available. */
export function newThisWeekCount(
    listings: readonly Pick<Listing, "status" | "listedAt">[],
    now: Date,
): number {
    return listings.filter(
        (listing) => listing.status === "available" && daysOnMarket(listing, now) <= NEW_THIS_WEEK_DAYS,
    ).length
}

/**
 * The hero's live market pulse: leads with this week's fresh inventory
 * when there is any, otherwise the standing count of active listings —
 * either way the badge is arithmetic over the data, never hand-written.
 */
export function marketPulseLabel(
    listings: readonly Pick<Listing, "status" | "listedAt">[],
    now: Date,
): string {
    const fresh = newThisWeekCount(listings, now)
    if (fresh === 1) {
        return "1 new listing this week"
    }
    if (fresh > 1) {
        return `${fresh} new listings this week`
    }
    const active = listings.filter((listing) => listing.status === "available").length
    return active === 1 ? "1 home on the market" : `${active} homes on the market`
}
