import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"

/**
 * The listings domain of the business-content contract
 * (repobot.content.json) — the estate family's inventory, the property
 * sibling of the schedule domain in `contentDocument.ts`. The document
 * owns the owner-run facts of each property card: address, neighborhood,
 * price, specs, status, and the dates the status engine (the pack's
 * listings.ts) computes every badge from. Code keeps everything else —
 * imagery above all: photos never live in the contract, the pack joins
 * its code-owned photographs back in BY REFERENCE via `slug`, so the
 * contract moves numbers and statuses, never bytes.
 *
 * Merge semantics mirror the schedule resolver's graceful degradation —
 * no document a hand or the platform can write may crash the page:
 *
 * - A missing or malformed `listings.entries` falls back to code content.
 * - Each entry is validated alone; a bad one (junk dates, empty address,
 *   duplicate slug) is dropped with a warning while the rest render.
 * - An EMPTY entries array is honored (the owner delisted everything),
 *   but a non-empty array whose every entry is invalid reads as a broken
 *   document and falls back whole.
 *
 * Validation rules are kept in lockstep with the platform's
 * ContentContract.ts (parseListing) — the same mirror discipline as the
 * schedule domain, so the platform never writes an entry the kernel
 * would drop.
 */

export const LISTING_STATUSES = ["available", "pending", "sold"] as const
export type ContentListingStatus = (typeof LISTING_STATUSES)[number]

/** One property card's owner facts. Photos join by `slug`, never by value. */
export interface ContentListing {
    /** Stable identity — the code-owned photo's join key. */
    slug: string
    /** The street address — the title a buyer actually remembers. */
    title: string
    neighborhood: string
    /** Display string ("$1,285,000") — sold listings show their closed price. */
    price: string
    beds: number
    baths: number
    sqft: number
    description: string
    status: ContentListingStatus
    /** ISO date the listing went live — drives the freshness badges. */
    listedAt: string
    /** ISO date it closed; only meaningful when status is "sold". */
    soldAt?: string
    /** Whether the home page's featured rail carries this card. */
    featured?: boolean
}

/** Contract ids everywhere: short lower-kebab (the session-id grammar). */
const LISTING_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

function isShortString(value: unknown, max: number): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= max
}

/**
 * One document listing validated alone, or undefined when it cannot render
 * (the caller warns and drops it). Unknown fields are ignored, so later
 * phases can grow the entry without breaking older kernels.
 */
function parseListing(entry: unknown, seen: Set<string>): ContentListing | undefined {
    if (!isRecord(entry)) return undefined
    const {
        slug,
        title,
        neighborhood,
        price,
        beds,
        baths,
        sqft,
        description,
        status,
        listedAt,
        soldAt,
        featured,
    } = entry
    if (typeof slug !== "string" || !LISTING_SLUG_PATTERN.test(slug)) return undefined
    if (seen.has(slug)) return undefined
    if (!isShortString(title, 200)) return undefined
    if (!isShortString(neighborhood, 120)) return undefined
    if (!isShortString(price, 40)) return undefined
    if (typeof beds !== "number" || !Number.isInteger(beds) || beds < 0 || beds > 50) return undefined
    if (typeof baths !== "number" || baths < 0 || baths > 50) return undefined
    if (typeof sqft !== "number" || !Number.isInteger(sqft) || sqft < 1 || sqft > 1_000_000) return undefined
    if (typeof description !== "string" || description.length > 1000) return undefined
    if (typeof status !== "string" || !(LISTING_STATUSES as readonly string[]).includes(status)) {
        return undefined
    }
    if (typeof listedAt !== "string" || !ISO_DATE_PATTERN.test(listedAt)) return undefined
    if (soldAt !== undefined && (typeof soldAt !== "string" || !ISO_DATE_PATTERN.test(soldAt)))
        return undefined
    if (featured !== undefined && typeof featured !== "boolean") return undefined
    seen.add(slug)
    return {
        slug,
        title,
        neighborhood,
        price,
        beds,
        baths,
        sqft,
        description,
        status: status as ContentListingStatus,
        listedAt,
        ...(soldAt !== undefined ? { soldAt } : {}),
        ...(featured !== undefined ? { featured } : {}),
    }
}

/**
 * The document's listings domain (`listings.entries`), or undefined when
 * the document doesn't speak for it — the caller then falls back to the
 * pack's code content. Exported pure for tests; pages go through
 * `useContentListings`.
 */
export function parseContentListings(document: unknown): ContentListing[] | undefined {
    if (!isRecord(document)) return undefined
    const listings = document.listings
    if (listings === undefined) return undefined
    if (!isRecord(listings)) {
        warnInvalid("listings", listings, "keeping the code inventory")
        return undefined
    }
    const entries = listings.entries
    if (!Array.isArray(entries)) {
        warnInvalid("listings.entries", entries, "keeping the code inventory")
        return undefined
    }
    const seen = new Set<string>()
    const parsed: ContentListing[] = []
    for (const entry of entries) {
        const listing = parseListing(entry, seen)
        if (listing === undefined) {
            warnInvalid("listings.entries entry", entry, "dropping it")
            continue
        }
        parsed.push(listing)
    }
    if (entries.length > 0 && parsed.length === 0) {
        // Every entry invalid: a broken document, not a delisted inventory.
        warnInvalid("listings.entries", "(no valid entries)", "keeping the code inventory")
        return undefined
    }
    return parsed
}

/**
 * Pure resolve of a document over code listings — exported for tests;
 * pages go through `useContentListings`.
 */
export function applyContentDocumentListings(
    fallback: ContentListing[],
    document: unknown,
): ContentListing[] {
    return parseContentListings(document) ?? fallback
}

/**
 * The inventory a pack page should render: the committed document's
 * listings when `surface` names the ACTIVE pack (the document describes
 * the active pack's business, exactly like the schedule domain), otherwise
 * the code listings untouched. Callers pass their own pack key.
 */
export function resolveContentListings(fallback: ContentListing[], surface: PackKey): ContentListing[] {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentListings(fallback, getContentDocument())
}

/** `resolveContentListings` as a hook: re-renders on live document edits. */
export function useContentListings(fallback: ContentListing[], surface: PackKey): ContentListing[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveContentListings(fallback, surface)
}
