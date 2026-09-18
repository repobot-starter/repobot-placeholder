import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"

/**
 * The links domain of the business-content contract
 * (repobot.content.json) — the creator family's curated link hub, the
 * link-in-bio sibling of the portfolio family's projects domain
 * (`projectsDocument.ts`). The document owns the owner-run facts of each
 * link: title, destination URL, the one-line description, the small badge
 * pill ("New", "Code NOA10"), and the optional category the hub groups
 * by. This is the one domain whose payload IS a set of destinations, so
 * the URL rule is strict on both sides: https only, capped length — the
 * contract must never be able to mint an http or javascript: link into
 * the owner's bio page.
 *
 * ORDER IS THE CONTENT: a link hub is a ranked list (the owner puts the
 * current drop first), so entries render in document order and no
 * resolver-side sort ever reorders them — the same "the editor's
 * arrangement IS the site's order" rule as the listings inventory.
 *
 * `category` is the domain's optional taxonomy axis: a short label
 * ("Shop", "Watch & read") the hub derives its group chips from
 * (`linkCategories`). Optional on purpose — a six-link hub needs no
 * shelves, and the chips only appear once the entries carry categories.
 *
 * Merge semantics mirror the projects resolver's graceful degradation —
 * no document a hand or the platform can write may crash the page:
 *
 * - A missing or malformed `links.entries` falls back to code content.
 * - Each entry is validated alone; a bad one (junk URL, empty title,
 *   duplicate slug) is dropped with a warning while the rest render.
 * - An EMPTY entries array is honored (the owner cleared the hub), but a
 *   non-empty array whose every entry is invalid reads as a broken
 *   document and falls back whole.
 *
 * Validation rules are kept in lockstep with the platform's
 * ContentContract.ts (parseLink) — the same mirror discipline as the
 * projects domain, so the platform never writes an entry the kernel
 * would drop.
 */

/** One curated link's owner facts. No imagery — a link hub is words and URLs. */
export interface ContentLink {
    /** Stable identity across edits — the editor's row key. */
    slug: string
    /** The button label — "This week's video", "My closet on Depop". */
    title: string
    /** The destination. https only, never http — see the module header. */
    url: string
    /** One supporting line under the button. */
    description?: string
    /** Small pill on the button: "New", "Free", "Code NOA10". */
    badge?: string
    /** The hub's optional group label ("Shop") — chips derive from these. */
    category?: string
}

/** Contract ids everywhere: short lower-kebab (the session-id grammar). */
const LINK_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

/**
 * https only — the hub must never render a downgrade or scriptable
 * scheme, and 500 characters covers any real campaign URL.
 */
const HTTPS_URL_PATTERN = /^https:\/\/\S+$/
export const LINK_URL_MAX_LENGTH = 500

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

function isShortString(value: unknown, max: number): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= max
}

/** True for a well-formed https destination within the length cap. */
export function isValidLinkUrl(value: unknown): value is string {
    return typeof value === "string" && value.length <= LINK_URL_MAX_LENGTH && HTTPS_URL_PATTERN.test(value)
}

/**
 * One document link validated alone, or undefined when it cannot render
 * (the caller warns and drops it). Unknown fields are ignored, so later
 * phases can grow the entry without breaking older kernels.
 */
function parseLink(entry: unknown, seen: Set<string>): ContentLink | undefined {
    if (!isRecord(entry)) return undefined
    const { slug, title, url, description, badge, category } = entry
    if (typeof slug !== "string" || !LINK_SLUG_PATTERN.test(slug)) return undefined
    if (seen.has(slug)) return undefined
    if (!isShortString(title, 120)) return undefined
    if (!isValidLinkUrl(url)) return undefined
    if (description !== undefined && !isShortString(description, 200)) return undefined
    if (badge !== undefined && !isShortString(badge, 24)) return undefined
    if (category !== undefined && !isShortString(category, 60)) return undefined
    seen.add(slug)
    return {
        slug,
        title,
        url,
        ...(description !== undefined ? { description } : {}),
        ...(badge !== undefined ? { badge } : {}),
        ...(category !== undefined ? { category } : {}),
    }
}

/**
 * The document's links domain (`links.entries`), or undefined when the
 * document doesn't speak for it — the caller then falls back to the
 * pack's code content. Entries keep document order (order is the
 * content). Exported pure for tests; pages go through `useContentLinks`.
 */
export function parseContentLinks(document: unknown): ContentLink[] | undefined {
    if (!isRecord(document)) return undefined
    const links = document.links
    if (links === undefined) return undefined
    if (!isRecord(links)) {
        warnInvalid("links", links, "keeping the code link hub")
        return undefined
    }
    const entries = links.entries
    if (!Array.isArray(entries)) {
        warnInvalid("links.entries", entries, "keeping the code link hub")
        return undefined
    }
    const seen = new Set<string>()
    const parsed: ContentLink[] = []
    for (const entry of entries) {
        const link = parseLink(entry, seen)
        if (link === undefined) {
            warnInvalid("links.entries entry", entry, "dropping it")
            continue
        }
        parsed.push(link)
    }
    if (entries.length > 0 && parsed.length === 0) {
        // Every entry invalid: a broken document, not a cleared hub.
        warnInvalid("links.entries", "(no valid entries)", "keeping the code link hub")
        return undefined
    }
    return parsed
}

/**
 * The hub's derived taxonomy: every distinct category, in first-use
 * order — the group-chip row of a link hub. Uncategorized links carry no
 * chip and never mint one; a hub whose entries carry no categories
 * derives an empty row (the chips simply don't render).
 */
export function linkCategories(links: readonly ContentLink[]): string[] {
    const categories: string[] = []
    for (const link of links) {
        if (link.category !== undefined && !categories.includes(link.category)) {
            categories.push(link.category)
        }
    }
    return categories
}

/**
 * Pure resolve of a document over code links — exported for tests;
 * pages go through `useContentLinks`.
 */
export function applyContentDocumentLinks(fallback: ContentLink[], document: unknown): ContentLink[] {
    return parseContentLinks(document) ?? fallback
}

/**
 * The link hub a pack page should render: the committed document's links
 * when `surface` names the ACTIVE pack (the document describes the
 * active pack's business, exactly like the projects domain), otherwise
 * the code links untouched. Callers pass their own pack key.
 */
export function resolveContentLinks(fallback: ContentLink[], surface: PackKey): ContentLink[] {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentLinks(fallback, getContentDocument())
}

/** `resolveContentLinks` as a hook: re-renders on live document edits. */
export function useContentLinks(fallback: ContentLink[], surface: PackKey): ContentLink[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveContentLinks(fallback, surface)
}
