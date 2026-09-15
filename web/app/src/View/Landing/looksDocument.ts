import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"
import { isValidLinkUrl } from "./linksDocument"

/**
 * The looks domain of the business-content contract
 * (repobot.content.json) — the creator family's style gallery: outfit
 * posts with shoppable product links, the wearable sibling of the
 * portfolio family's projects domain (`projectsDocument.ts`). The
 * document owns the owner-run facts of each look: title, category,
 * caption, the product links ("Shop the look" — label + https URL each),
 * and the featured flag the home rail curates by. Code keeps everything
 * else — imagery above all: photographs never live in the contract, the
 * pack joins its code-owned photos back in BY REFERENCE via `slug`, so
 * the contract moves words and links, never bytes.
 *
 * `category` is the domain's one taxonomy axis: a short label
 * ("Everyday", "Vintage flip") the looks grid derives its filter chips
 * from (`lookCategories`). It is deliberately a free string, not an enum
 * — every creator names their own shelves, and the derived-chip
 * discipline means an owner minting a new category in Manage grows the
 * filter row without a kernel change (the projects rule, verbatim).
 *
 * `productLinks` reuse the links domain's URL rule (https only, capped
 * length — `isValidLinkUrl`): a shoppable look must never be able to
 * mint an http or scriptable link, and one bad product link spoils only
 * its look, never the gallery.
 *
 * Merge semantics mirror the projects resolver's graceful degradation —
 * no document a hand or the platform can write may crash the page:
 *
 * - A missing or malformed `looks.entries` falls back to code content.
 * - Each entry is validated alone; a bad one (junk URL in a product
 *   link, empty title, duplicate slug) is dropped with a warning while
 *   the rest render.
 * - An EMPTY entries array is honored (the owner archived the gallery),
 *   but a non-empty array whose every entry is invalid reads as a broken
 *   document and falls back whole.
 *
 * Validation rules are kept in lockstep with the platform's
 * ContentContract.ts (parseLook) — the same mirror discipline as the
 * projects domain, so the platform never writes an entry the kernel
 * would drop.
 */

/** One "Shop the look" destination: a label and its https URL. */
export interface LookProductLink {
    /** The piece — "The trench", "Loafers". */
    label: string
    /** Where to buy it. https only (the links domain's URL rule). */
    url: string
}

/** One look's owner facts. Photos join by `slug`, never by value. */
export interface ContentLook {
    /** Stable identity — the code-owned photo set's join key. */
    slug: string
    /** The look's name — "Canal Street Trench". */
    title: string
    /** The taxonomy chip the looks grid filters by — "Everyday". */
    category: string
    /** The caption — where it was worn, why it works. */
    description?: string
    /** "Shop the look": up to 8 pieces, each a label + https URL. */
    productLinks?: LookProductLink[]
    /** Whether the home page's featured rail carries this look. */
    featured?: boolean
}

/** Contract ids everywhere: short lower-kebab (the session-id grammar). */
const LOOK_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

/** A look is an outfit, not a catalog — eight pieces covers a full fit. */
export const LOOK_MAX_PRODUCT_LINKS = 8

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

function isShortString(value: unknown, max: number): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= max
}

/** The whole product-link list validated, or undefined when any entry is bad. */
function parseProductLinks(value: unknown): LookProductLink[] | undefined {
    if (!Array.isArray(value) || value.length > LOOK_MAX_PRODUCT_LINKS) return undefined
    const parsed: LookProductLink[] = []
    for (const entry of value) {
        if (!isRecord(entry)) return undefined
        const { label, url } = entry
        if (!isShortString(label, 80)) return undefined
        if (!isValidLinkUrl(url)) return undefined
        parsed.push({ label, url })
    }
    return parsed
}

/**
 * One document look validated alone, or undefined when it cannot render
 * (the caller warns and drops it). Unknown fields are ignored, so later
 * phases can grow the entry without breaking older kernels.
 */
function parseLook(entry: unknown, seen: Set<string>): ContentLook | undefined {
    if (!isRecord(entry)) return undefined
    const { slug, title, category, description, productLinks, featured } = entry
    if (typeof slug !== "string" || !LOOK_SLUG_PATTERN.test(slug)) return undefined
    if (seen.has(slug)) return undefined
    if (!isShortString(title, 200)) return undefined
    if (!isShortString(category, 60)) return undefined
    if (description !== undefined && (typeof description !== "string" || description.length > 1000)) {
        return undefined
    }
    let parsedProductLinks: LookProductLink[] | undefined
    if (productLinks !== undefined) {
        parsedProductLinks = parseProductLinks(productLinks)
        if (parsedProductLinks === undefined) return undefined
    }
    if (featured !== undefined && typeof featured !== "boolean") return undefined
    seen.add(slug)
    return {
        slug,
        title,
        category,
        ...(description !== undefined ? { description } : {}),
        ...(parsedProductLinks !== undefined ? { productLinks: parsedProductLinks } : {}),
        ...(featured !== undefined ? { featured } : {}),
    }
}

/**
 * The document's looks domain (`looks.entries`), or undefined when the
 * document doesn't speak for it — the caller then falls back to the
 * pack's code content. Exported pure for tests; pages go through
 * `useContentLooks`.
 */
export function parseContentLooks(document: unknown): ContentLook[] | undefined {
    if (!isRecord(document)) return undefined
    const looks = document.looks
    if (looks === undefined) return undefined
    if (!isRecord(looks)) {
        warnInvalid("looks", looks, "keeping the code gallery")
        return undefined
    }
    const entries = looks.entries
    if (!Array.isArray(entries)) {
        warnInvalid("looks.entries", entries, "keeping the code gallery")
        return undefined
    }
    const seen = new Set<string>()
    const parsed: ContentLook[] = []
    for (const entry of entries) {
        const look = parseLook(entry, seen)
        if (look === undefined) {
            warnInvalid("looks.entries entry", entry, "dropping it")
            continue
        }
        parsed.push(look)
    }
    if (entries.length > 0 && parsed.length === 0) {
        // Every entry invalid: a broken document, not an archived gallery.
        warnInvalid("looks.entries", "(no valid entries)", "keeping the code gallery")
        return undefined
    }
    return parsed
}

/**
 * The gallery's derived taxonomy: every distinct category, in first-use
 * order — the filter-chip row of a looks grid. Derived per render so an
 * owner minting a new category in Manage grows the chips without any
 * kernel change; the empty string never appears (the parser requires a
 * non-empty category).
 */
export function lookCategories(looks: readonly ContentLook[]): string[] {
    const categories: string[] = []
    for (const look of looks) {
        if (!categories.includes(look.category)) categories.push(look.category)
    }
    return categories
}

/**
 * Pure resolve of a document over code looks — exported for tests;
 * pages go through `useContentLooks`.
 */
export function applyContentDocumentLooks(fallback: ContentLook[], document: unknown): ContentLook[] {
    return parseContentLooks(document) ?? fallback
}

/**
 * The gallery a pack page should render: the committed document's looks
 * when `surface` names the ACTIVE pack (the document describes the
 * active pack's business, exactly like the projects domain), otherwise
 * the code looks untouched. Callers pass their own pack key.
 */
export function resolveContentLooks(fallback: ContentLook[], surface: PackKey): ContentLook[] {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentLooks(fallback, getContentDocument())
}

/** `resolveContentLooks` as a hook: re-renders on live document edits. */
export function useContentLooks(fallback: ContentLook[], surface: PackKey): ContentLook[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveContentLooks(fallback, surface)
}
