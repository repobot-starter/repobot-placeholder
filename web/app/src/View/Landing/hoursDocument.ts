import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"
import type { DayHours } from "./hours"

/**
 * The hours domain of the business-content contract
 * (repobot.content.json) — the local-business family's opening week, the
 * open-now sibling of the schedule domain in `contentDocument.ts`. The
 * document owns the week an owner runs the door with: per-day
 * [open, close) minute intervals, an absent day meaning closed. The
 * contract entry IS the hours engine's `DayHours`, so the live "Open now"
 * badge (`statusAt`) computes unchanged from saved entries.
 *
 * Merge semantics mirror the schedule resolver's graceful degradation —
 * no document a hand or the platform can write may crash the page:
 *
 * - A missing or malformed `hours.week` falls back to code content.
 * - Each day is validated alone; a bad one (junk day, inverted or
 *   overlapping intervals, duplicate day) is dropped with a warning while
 *   the rest of the week renders.
 * - An EMPTY week array is honored (the owner marked everything closed),
 *   but a non-empty array whose every entry is invalid reads as a broken
 *   document and falls back whole.
 *
 * Validation rules are kept in lockstep with the platform's
 * ContentContract.ts (parseDayHours) — the same mirror discipline as the
 * schedule domain, so the platform never writes an entry the kernel
 * would drop.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

function parseDayIntervals(intervals: unknown): [number, number][] | undefined {
    if (!Array.isArray(intervals) || intervals.length === 0 || intervals.length > 4) {
        return undefined
    }
    const parsed: [number, number][] = []
    for (const pair of intervals) {
        if (!Array.isArray(pair) || pair.length !== 2) return undefined
        const [open, close] = pair
        if (typeof open !== "number" || !Number.isInteger(open) || open < 0) return undefined
        if (typeof close !== "number" || !Number.isInteger(close) || close > 1440) return undefined
        if (open >= close) return undefined
        const previous = parsed[parsed.length - 1]
        if (previous !== undefined && open < previous[1]) return undefined
        parsed.push([open, close])
    }
    return parsed
}

/**
 * One document day validated alone, or undefined when it cannot render
 * (the caller warns and drops it). Unknown fields are ignored.
 */
function parseDayHours(entry: unknown, seen: Set<number>): DayHours | undefined {
    if (!isRecord(entry)) return undefined
    const { day, intervals } = entry
    if (typeof day !== "number" || !Number.isInteger(day) || day < 0 || day > 6) return undefined
    if (seen.has(day)) return undefined
    const parsed = parseDayIntervals(intervals)
    if (parsed === undefined) return undefined
    seen.add(day)
    return { day, intervals: parsed }
}

/**
 * The document's hours domain (`hours.week`), or undefined when the
 * document doesn't speak for it — the caller then falls back to the
 * pack's code content. Exported pure for tests; pages go through
 * `useContentHours`.
 */
export function parseContentHours(document: unknown): DayHours[] | undefined {
    if (!isRecord(document)) return undefined
    const hours = document.hours
    if (hours === undefined) return undefined
    if (!isRecord(hours)) {
        warnInvalid("hours", hours, "keeping the code hours")
        return undefined
    }
    const week = hours.week
    if (!Array.isArray(week)) {
        warnInvalid("hours.week", week, "keeping the code hours")
        return undefined
    }
    const seen = new Set<number>()
    const parsed: DayHours[] = []
    for (const entry of week) {
        const dayHours = parseDayHours(entry, seen)
        if (dayHours === undefined) {
            warnInvalid("hours.week entry", entry, "dropping it")
            continue
        }
        parsed.push(dayHours)
    }
    if (week.length > 0 && parsed.length === 0) {
        // Every entry invalid: a broken document, not an all-closed week.
        warnInvalid("hours.week", "(no valid entries)", "keeping the code hours")
        return undefined
    }
    return parsed
}

/**
 * Pure resolve of a document over code hours — exported for tests;
 * pages go through `useContentHours`.
 */
export function applyContentDocumentHours(fallback: DayHours[], document: unknown): DayHours[] {
    return parseContentHours(document) ?? fallback
}

/**
 * The week a pack page should render: the committed document's hours when
 * `surface` names the ACTIVE pack (the document describes the active
 * pack's business, exactly like the schedule domain), otherwise the code
 * hours untouched. Callers pass their own pack key.
 */
export function resolveContentHours(fallback: DayHours[], surface: PackKey): DayHours[] {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentHours(fallback, getContentDocument())
}

/** `resolveContentHours` as a hook: re-renders on live document edits. */
export function useContentHours(fallback: DayHours[], surface: PackKey): DayHours[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveContentHours(fallback, surface)
}
