import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"
import type { DatedEvent } from "./events"

/**
 * The events domain of the business-content contract
 * (repobot.content.json) — the community-organization family's calendar
 * (church, community, nonprofit), the dated-events sibling of the
 * schedule domain in `contentDocument.ts`. The document owns the facts an
 * organizer runs the calendar with: title, start/end (ISO local
 * datetimes, the organization's wall clock), location, description, tags.
 * Code keeps everything else — imagery above all: photos never live in
 * the contract, a pack joins its code-owned photographs back in BY
 * REFERENCE via `slug`. The contract entry IS the events engine's
 * `DatedEvent`, so `splitEvents` and the "next up" highlight run
 * unchanged on saved entries — upcoming vs. past stays computed at render
 * time whichever side the facts came from.
 *
 * Merge semantics mirror the schedule resolver's graceful degradation —
 * no document a hand or the platform can write may crash the page:
 *
 * - A missing or malformed `events.entries` falls back to code content.
 * - Each entry is validated alone; a bad one (junk datetimes, empty
 *   title, duplicate slug) is dropped with a warning while the rest
 *   render.
 * - An EMPTY entries array is honored (the owner cleared the calendar),
 *   but a non-empty array whose every entry is invalid reads as a broken
 *   document and falls back whole.
 *
 * Validation rules are kept in lockstep with the platform's
 * ContentContract.ts (parseEvent) — the same mirror discipline as the
 * schedule domain, so the platform never writes an entry the kernel
 * would drop.
 */

/** Contract ids everywhere: short lower-kebab (the session-id grammar). */
const EVENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

/** ISO local datetime ("2026-09-12T18:30") — the events engine's grammar. */
const ISO_LOCAL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

function isShortString(value: unknown, max: number): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= max
}

function parseTags(tags: unknown): string[] | undefined {
    if (!Array.isArray(tags) || tags.length > 8) return undefined
    return tags.every((tag) => isShortString(tag, 40)) ? (tags as string[]) : undefined
}

/**
 * One document event validated alone, or undefined when it cannot render
 * (the caller warns and drops it). Unknown fields are ignored, so later
 * phases can grow the entry without breaking older kernels.
 */
function parseEvent(entry: unknown, seen: Set<string>): DatedEvent | undefined {
    if (!isRecord(entry)) return undefined
    const { slug, title, start, end, location, description, tags } = entry
    if (typeof slug !== "string" || !EVENT_SLUG_PATTERN.test(slug)) return undefined
    if (seen.has(slug)) return undefined
    if (!isShortString(title, 200)) return undefined
    if (typeof start !== "string" || !ISO_LOCAL_DATETIME_PATTERN.test(start)) return undefined
    if (end !== undefined && (typeof end !== "string" || !ISO_LOCAL_DATETIME_PATTERN.test(end))) {
        return undefined
    }
    if (!isShortString(location, 200)) return undefined
    if (typeof description !== "string" || description.length > 1000) return undefined
    if (tags !== undefined && parseTags(tags) === undefined) return undefined
    seen.add(slug)
    return {
        slug,
        title,
        start,
        ...(end !== undefined ? { end } : {}),
        location,
        description,
        ...(tags !== undefined ? { tags: tags as string[] } : {}),
    }
}

/**
 * The document's events domain (`events.entries`), or undefined when the
 * document doesn't speak for it — the caller then falls back to the
 * pack's code content. Exported pure for tests; pages go through
 * `useContentEvents`.
 */
export function parseContentEvents(document: unknown): DatedEvent[] | undefined {
    if (!isRecord(document)) return undefined
    const events = document.events
    if (events === undefined) return undefined
    if (!isRecord(events)) {
        warnInvalid("events", events, "keeping the code calendar")
        return undefined
    }
    const entries = events.entries
    if (!Array.isArray(entries)) {
        warnInvalid("events.entries", entries, "keeping the code calendar")
        return undefined
    }
    const seen = new Set<string>()
    const parsed: DatedEvent[] = []
    for (const entry of entries) {
        const event = parseEvent(entry, seen)
        if (event === undefined) {
            warnInvalid("events.entries entry", entry, "dropping it")
            continue
        }
        parsed.push(event)
    }
    if (entries.length > 0 && parsed.length === 0) {
        // Every entry invalid: a broken document, not a cleared calendar.
        warnInvalid("events.entries", "(no valid entries)", "keeping the code calendar")
        return undefined
    }
    return parsed
}

/**
 * Pure resolve of a document over code events — exported for tests;
 * pages go through `useContentEvents`.
 */
export function applyContentDocumentEvents(fallback: DatedEvent[], document: unknown): DatedEvent[] {
    return parseContentEvents(document) ?? fallback
}

/**
 * The calendar a pack page should render: the committed document's events
 * when `surface` names the ACTIVE pack (the document describes the active
 * pack's business, exactly like the schedule domain), otherwise the code
 * events untouched. Callers pass their own pack key.
 */
export function resolveContentEvents(fallback: DatedEvent[], surface: PackKey): DatedEvent[] {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentEvents(fallback, getContentDocument())
}

/** `resolveContentEvents` as a hook: re-renders on live document edits. */
export function useContentEvents(fallback: DatedEvent[], surface: PackKey): DatedEvent[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveContentEvents(fallback, surface)
}
