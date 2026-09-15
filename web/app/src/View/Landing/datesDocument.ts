import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import type { ShowDate } from "../Music/schedule"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"

/**
 * The dates domain of the business-content contract (repobot.content.json)
 * — the music family's tour (band, dj), the show-date sibling of the
 * schedule domain in `contentDocument.ts`. The document owns the facts a
 * tour runs on: ISO local date (a show in Austin happens on Austin's
 * calendar), city, venue, region, the external ticket link, and the small
 * status word ("SOLD OUT"). The contract entry extends the music engine's
 * `ShowDate` with a stable `slug` (the editor's row key), so `splitShows`
 * keeps computing the upcoming/past split and the "Tonight — City" badge
 * from saved entries — past shows auto-collapse into the archive at
 * render time, never by edit.
 *
 * Merge semantics mirror the schedule resolver's graceful degradation —
 * no document a hand or the platform can write may crash the page:
 *
 * - A missing or malformed `dates.entries` falls back to code content.
 * - Each entry is validated alone; a bad one (junk date, empty city,
 *   duplicate slug) is dropped with a warning while the rest render.
 * - An EMPTY entries array is honored (the owner cleared the tour), but
 *   a non-empty array whose every entry is invalid reads as a broken
 *   document and falls back whole.
 *
 * Validation rules are kept in lockstep with the platform's
 * ContentContract.ts (parseShow) — the same mirror discipline as the
 * schedule domain, so the platform never writes an entry the kernel
 * would drop. The fallback path mints slugs by the platform's own
 * date-city derivation rule, so a slug minted here and a slug the
 * platform mints for the same row agree.
 */

/** One show of the tour: the music engine's row plus its stable identity. */
export interface ContentShow extends ShowDate {
    /** Stable identity across edits — the editor's row key. */
    slug: string
}

/** Contract ids everywhere: short lower-kebab (the session-id grammar). */
const SHOW_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const HTTP_URL_PATTERN = /^https?:\/\//

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
 * One document show validated alone, or undefined when it cannot render
 * (the caller warns and drops it). Unknown fields are ignored, so later
 * phases can grow the entry without breaking older kernels.
 */
function parseShow(entry: unknown, seen: Set<string>): ContentShow | undefined {
    if (!isRecord(entry)) return undefined
    const { slug, date, city, venue, region, ticketUrl, note } = entry
    if (typeof slug !== "string" || !SHOW_SLUG_PATTERN.test(slug)) return undefined
    if (seen.has(slug)) return undefined
    if (typeof date !== "string" || !ISO_DATE_PATTERN.test(date)) return undefined
    if (!isShortString(city, 120)) return undefined
    if (!isShortString(venue, 200)) return undefined
    if (region !== undefined && !isShortString(region, 60)) return undefined
    if (ticketUrl !== undefined && (typeof ticketUrl !== "string" || !HTTP_URL_PATTERN.test(ticketUrl))) {
        return undefined
    }
    if (note !== undefined && !isShortString(note, 60)) return undefined
    seen.add(slug)
    return {
        slug,
        date,
        city,
        venue,
        ...(region !== undefined ? { region } : {}),
        ...(ticketUrl !== undefined ? { ticketUrl } : {}),
        ...(note !== undefined ? { note } : {}),
    }
}

/**
 * The document's dates domain (`dates.entries`), or undefined when the
 * document doesn't speak for it — the caller then falls back to the
 * pack's code content. Exported pure for tests; pages go through
 * `useContentShows`.
 */
export function parseContentShows(document: unknown): ContentShow[] | undefined {
    if (!isRecord(document)) return undefined
    const dates = document.dates
    if (dates === undefined) return undefined
    if (!isRecord(dates)) {
        warnInvalid("dates", dates, "keeping the code tour")
        return undefined
    }
    const entries = dates.entries
    if (!Array.isArray(entries)) {
        warnInvalid("dates.entries", entries, "keeping the code tour")
        return undefined
    }
    const seen = new Set<string>()
    const parsed: ContentShow[] = []
    for (const entry of entries) {
        const show = parseShow(entry, seen)
        if (show === undefined) {
            warnInvalid("dates.entries entry", entry, "dropping it")
            continue
        }
        parsed.push(show)
    }
    if (entries.length > 0 && parsed.length === 0) {
        // Every entry invalid: a broken document, not a cleared tour.
        warnInvalid("dates.entries", "(no valid entries)", "keeping the code tour")
        return undefined
    }
    return parsed
}

/** A deterministic show slug from a code entry: the platform's own
 * date-city rule (slugFromText + dedupe), so seed slugs, fallback slugs,
 * and platform-minted slugs all agree on one identity per row. */
function derivedShowSlug(show: ShowDate, taken: Set<string>): string {
    const base =
        `${show.date} ${show.city}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "show"
    let candidate = base
    for (let suffix = 2; taken.has(candidate); suffix++) {
        candidate = `${base}-${suffix}`
    }
    taken.add(candidate)
    return candidate
}

/**
 * Code shows lifted into the contract shape with deterministic slugs.
 * The fallback path returns these so consumers see one shape whether the
 * document or the code speaks.
 */
export function withDerivedShowSlugs(shows: readonly ShowDate[]): ContentShow[] {
    const taken = new Set<string>()
    return shows.map((show) => ({ ...show, slug: derivedShowSlug(show, taken) }))
}

/**
 * Pure resolve of a document over code shows — exported for tests;
 * pages go through `useContentShows`.
 */
export function applyContentDocumentShows(fallback: readonly ShowDate[], document: unknown): ContentShow[] {
    return parseContentShows(document) ?? withDerivedShowSlugs(fallback)
}

/**
 * The tour a pack page should render: the committed document's shows when
 * `surface` names the ACTIVE pack (the document describes the active
 * pack's business, exactly like the schedule domain), otherwise the code
 * shows untouched. Callers pass their own pack key.
 */
export function resolveContentShows(fallback: readonly ShowDate[], surface: PackKey): ContentShow[] {
    if (surface !== activePack.key) return withDerivedShowSlugs(fallback)
    return applyContentDocumentShows(fallback, getContentDocument())
}

/** `resolveContentShows` as a hook: re-renders on live document edits. */
export function useContentShows(fallback: readonly ShowDate[], surface: PackKey): ContentShow[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveContentShows(fallback, surface)
}
