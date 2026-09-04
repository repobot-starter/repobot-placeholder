import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"

/**
 * The menu domain of the business-content contract (repobot.content.json)
 * — the restaurant family's card, the dishes sibling of the hours domain
 * in `hoursDocument.ts`. The document owns what the kitchen serves:
 * sections ("Breakfast", "Drinks") of dishes with descriptions, prices in
 * cents (so arithmetic and formatting stay exact — display formatting
 * stays the pack's job), dietary marks, and the "popular" flag. There are
 * no slugs and no code-owned joins: nothing references a dish by identity.
 *
 * Merge semantics mirror the schedule resolver's graceful degradation —
 * no document a hand or the platform can write may crash the page:
 *
 * - A missing or malformed `menu.sections` falls back to code content.
 * - Each section is validated alone; one bad dish spoils its section
 *   (the platform's own read rule — a half-parsed card would misprice
 *   the kitchen), which drops with a warning while the rest render.
 * - An EMPTY sections array is honored (the owner cleared the card), but
 *   a non-empty array whose every section is invalid reads as a broken
 *   document and falls back whole.
 *
 * Validation rules are kept in lockstep with the platform's
 * ContentContract.ts (parseMenuSection) — the same mirror discipline as
 * the schedule domain, so the platform never writes an entry the kernel
 * would drop.
 */

export const MENU_DIETARY_MARKS = ["V", "VG", "GF"] as const
export type ContentDietaryMark = (typeof MENU_DIETARY_MARKS)[number]

/** One dish — prices in cents so arithmetic and formatting stay exact. */
export interface ContentMenuItem {
    name: string
    description: string
    priceCents: number
    dietary: ContentDietaryMark[]
    popular?: boolean
}

/** One card of the menu ("Breakfast", "Drinks") with its dishes in order. */
export interface ContentMenuSection {
    title: string
    note?: string
    items: ContentMenuItem[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

function isShortString(value: unknown, max: number): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= max
}

function parseMenuItem(entry: unknown): ContentMenuItem | undefined {
    if (!isRecord(entry)) return undefined
    const { name, description, priceCents, dietary, popular } = entry
    if (!isShortString(name, 120)) return undefined
    if (typeof description !== "string" || description.length > 300) return undefined
    if (
        typeof priceCents !== "number" ||
        !Number.isInteger(priceCents) ||
        priceCents < 0 ||
        priceCents > 1_000_000
    ) {
        return undefined
    }
    if (
        !Array.isArray(dietary) ||
        !dietary.every((mark) => (MENU_DIETARY_MARKS as readonly string[]).includes(mark as string))
    ) {
        return undefined
    }
    if (popular !== undefined && typeof popular !== "boolean") return undefined
    return {
        name,
        description,
        priceCents,
        dietary: dietary as ContentDietaryMark[],
        ...(popular !== undefined ? { popular } : {}),
    }
}

/**
 * One document section validated alone, or undefined when it cannot render
 * (the caller warns and drops it). One bad dish spoils the section — the
 * platform's own read rule, mirrored.
 */
function parseMenuSection(entry: unknown, seen: Set<string>): ContentMenuSection | undefined {
    if (!isRecord(entry)) return undefined
    const { title, note, items } = entry
    if (!isShortString(title, 80)) return undefined
    if (seen.has(title)) return undefined
    if (note !== undefined && !isShortString(note, 200)) return undefined
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) return undefined
    const parsedItems: ContentMenuItem[] = []
    for (const item of items) {
        const parsed = parseMenuItem(item)
        if (parsed === undefined) return undefined
        parsedItems.push(parsed)
    }
    seen.add(title)
    return { title, ...(note !== undefined ? { note } : {}), items: parsedItems }
}

/**
 * The document's menu domain (`menu.sections`), or undefined when the
 * document doesn't speak for it — the caller then falls back to the
 * pack's code content. Exported pure for tests; pages go through
 * `useContentMenu`.
 */
export function parseContentMenu(document: unknown): ContentMenuSection[] | undefined {
    if (!isRecord(document)) return undefined
    const menu = document.menu
    if (menu === undefined) return undefined
    if (!isRecord(menu)) {
        warnInvalid("menu", menu, "keeping the code menu")
        return undefined
    }
    const sections = menu.sections
    if (!Array.isArray(sections)) {
        warnInvalid("menu.sections", sections, "keeping the code menu")
        return undefined
    }
    const seen = new Set<string>()
    const parsed: ContentMenuSection[] = []
    for (const entry of sections) {
        const section = parseMenuSection(entry, seen)
        if (section === undefined) {
            warnInvalid("menu.sections entry", entry, "dropping it")
            continue
        }
        parsed.push(section)
    }
    if (sections.length > 0 && parsed.length === 0) {
        // Every section invalid: a broken document, not a cleared card.
        warnInvalid("menu.sections", "(no valid entries)", "keeping the code menu")
        return undefined
    }
    return parsed
}

/**
 * Pure resolve of a document over code sections — exported for tests;
 * pages go through `useContentMenu`.
 */
export function applyContentDocumentMenu(
    fallback: ContentMenuSection[],
    document: unknown,
): ContentMenuSection[] {
    return parseContentMenu(document) ?? fallback
}

/**
 * The menu a pack page should render: the committed document's sections
 * when `surface` names the ACTIVE pack (the document describes the active
 * pack's business, exactly like the schedule domain), otherwise the code
 * sections untouched. Callers pass their own pack key.
 */
export function resolveContentMenu(fallback: ContentMenuSection[], surface: PackKey): ContentMenuSection[] {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentMenu(fallback, getContentDocument())
}

/** `resolveContentMenu` as a hook: re-renders on live document edits. */
export function useContentMenu(fallback: ContentMenuSection[], surface: PackKey): ContentMenuSection[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveContentMenu(fallback, surface)
}
