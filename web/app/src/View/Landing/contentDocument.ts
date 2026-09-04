import { registerVisualDocRenderer, runtimeSiteDocument, visualDocSeq } from "@ui"
import { useSyncExternalStore } from "react"
import contentDocumentJson from "../../../../../repobot.content.json"
import { activePack, type PackKey } from "../../Config/activePack"
import type { ClassSession } from "./schedule"

/**
 * Resolves the root `repobot.content.json` business-content contract over a
 * pack's `content.ts` — the business-facts sibling of the landing layout
 * document (`landingDocument.ts`). The document owns owner-editable business
 * FACTS, schema'd per domain; today that is the schedule domain (the weekly
 * timetable the fitness family renders), with listings, events, and hours
 * following the same shape later. Code keeps everything else: copy, media,
 * prices, and the engines that compute live badges from the facts.
 *
 * The document describes the ACTIVE pack's business (the same "active"
 * semantics as `packs/active.json`): compose stamps a schedule-bearing
 * pack's seed into it (the catalog's `content` overlay), the platform's
 * Manage UI and the chat agent both edit the same file, and every edit
 * ships as a config commit + redeploy. On a non-active surface (a pack's
 * preview route under another active pack) the code content stands.
 *
 * Merge semantics mirror the theme and landing resolvers' graceful
 * degradation — a hand-edited or platform-written document can never crash
 * the page:
 *
 * - A missing or malformed `schedule.sessions` falls back to `content.ts`.
 * - Each session entry is validated alone; a bad entry (junk day/times,
 *   empty title, duplicate sessionId) is dropped with a warning while the
 *   rest of the week renders.
 * - An EMPTY sessions array is honored (the owner cleared the week — the
 *   schedule engine renders "coming soon"), but a non-empty array whose
 *   every entry is invalid reads as a broken document, not a cleared week,
 *   and falls back whole.
 *
 * The schedule domain extends the render engine's `ClassSession` with the
 * booking-facing fields the platform keys on: a stable `sessionId` (the
 * booking domain's join key — never re-minted by edits to other fields),
 * `capacity` (confirmed-seat ceiling), and `bookable` (whether the class
 * takes online bookings at all). Phase-1 rendering ignores them; the
 * booking loop consumes them.
 */

export interface ScheduleSession extends ClassSession {
    /** Stable identity across edits — the booking domain's join key. */
    sessionId: string
    /** Confirmed-seat ceiling; absent = capacity is not tracked. */
    capacity?: number
    /** Whether the class takes online bookings; absent = false. */
    bookable?: boolean
}

/** Capacity ceiling: a class is a room, not a stadium. */
export const SCHEDULE_MAX_CAPACITY = 999

/* The live document. Same HMR discipline as landingDocument.ts: this module
 * is the JSON's only importer, so accepting the hot update here stops
 * Vite's invalidation from cascading to the entry, and consumers subscribe
 * through useScheduleSessions below. In production the deploy-injected
 * overlay outranks the build-time import (runtimeSiteDocuments.ts — see
 * landingDocument.ts); without it the import stands. */
let currentDocument: unknown = runtimeSiteDocument("repobot.content.json") ?? contentDocumentJson
let documentVersion = 0
const documentListeners = new Set<() => void>()

if (import.meta.hot) {
    // Claim the content document's ack: routes that never load this module
    // get the design system's vacuous fallback ack instead (themeHotUpdate).
    registerVisualDocRenderer("repobot.content.json")
    import.meta.hot.accept("../../../../../repobot.content.json", (newModule) => {
        if (newModule !== undefined) {
            currentDocument = newModule.default
            documentVersion += 1
            for (const listener of [...documentListeners]) listener()
            // Ack the observed repaint to the platform preview parent —
            // the same held-write contract the theme and landing documents
            // honor, seq-stamped for the platform's arm/ack correlation
            // (see landingDocument.ts).
            const seq = visualDocSeq("repobot.content.json")
            try {
                window.parent.postMessage(
                    {
                        channel: "repobot-preview",
                        type: "visual-applied",
                        doc: "repobot.content.json",
                        ...(seq !== undefined ? { seq } : {}),
                    },
                    "*",
                )
            } catch {
                /* A cross-origin parent that denies postMessage. */
            }
        }
    })
}

/**
 * Subscription to live document edits, shared with the sibling domain
 * resolvers (practiceDocument.ts) so every domain re-renders on the same
 * HMR update without importing the JSON twice (this module must stay the
 * document's only importer — see the HMR note above).
 */
export function subscribeContentDocument(listener: () => void): () => void {
    documentListeners.add(listener)
    return () => {
        documentListeners.delete(listener)
    }
}

/** The live document's version counter, for useSyncExternalStore. */
export function getContentDocumentVersion(): number {
    return documentVersion
}

/** The live business-content document (build-time import + HMR updates). */
export function getContentDocument(): unknown {
    return currentDocument
}

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Session ids: short lower-kebab identifiers, like every contract name. */
const SESSION_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

/**
 * One document session entry, validated alone, or undefined when it cannot
 * render (the caller warns and drops it). Unknown fields are ignored, so
 * later phases can grow the entry without breaking older kernels.
 */
function parseSession(entry: unknown, seenIds: Set<string>): ScheduleSession | undefined {
    if (!isRecord(entry)) return undefined
    const { sessionId, day, start, end, title, instructor, note, capacity, bookable } = entry
    if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId)) return undefined
    if (seenIds.has(sessionId)) return undefined
    if (typeof day !== "number" || !Number.isInteger(day) || day < 0 || day > 6) return undefined
    if (typeof start !== "number" || !Number.isInteger(start)) return undefined
    if (typeof end !== "number" || !Number.isInteger(end)) return undefined
    // Same-day intervals, the schedule engine's contract (schedule.ts).
    if (start < 0 || end > 24 * 60 || end <= start) return undefined
    if (typeof title !== "string" || title.length === 0 || title.length > 200) return undefined
    if (typeof instructor !== "string" || instructor.length > 200) return undefined
    if (note !== undefined && (typeof note !== "string" || note.length > 500)) return undefined
    if (
        capacity !== undefined &&
        (typeof capacity !== "number" ||
            !Number.isInteger(capacity) ||
            capacity < 1 ||
            capacity > SCHEDULE_MAX_CAPACITY)
    ) {
        return undefined
    }
    if (bookable !== undefined && typeof bookable !== "boolean") return undefined
    seenIds.add(sessionId)
    return {
        sessionId,
        day,
        start,
        end,
        title,
        instructor,
        ...(note !== undefined ? { note } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(bookable !== undefined ? { bookable } : {}),
    }
}

/**
 * The document's schedule domain, or undefined when the document doesn't
 * speak for the schedule (missing/malformed `schedule.sessions`, or a
 * non-empty list with no valid entry) — the caller then falls back to the
 * pack's code content. Exported pure for tests; pages go through
 * `useScheduleSessions`.
 */
export function parseScheduleSessions(document: unknown): ScheduleSession[] | undefined {
    if (!isRecord(document)) return undefined
    const schedule = document.schedule
    if (schedule === undefined) return undefined
    if (!isRecord(schedule)) {
        warnInvalid("schedule", schedule, "keeping the code schedule")
        return undefined
    }
    const sessions = schedule.sessions
    if (!Array.isArray(sessions)) {
        warnInvalid("schedule.sessions", sessions, "keeping the code schedule")
        return undefined
    }
    const seenIds = new Set<string>()
    const parsed: ScheduleSession[] = []
    for (const entry of sessions) {
        const session = parseSession(entry, seenIds)
        if (session === undefined) {
            warnInvalid("schedule.sessions entry", entry, "dropping it")
            continue
        }
        parsed.push(session)
    }
    if (sessions.length > 0 && parsed.length === 0) {
        // Every entry invalid: a broken document, not a cleared week.
        warnInvalid("schedule.sessions", "(no valid entries)", "keeping the code schedule")
        return undefined
    }
    return parsed
}

/** A deterministic session id from a code entry: day-HHMM-title-slug. */
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

function derivedSessionId(session: ClassSession, taken: Set<string>): string {
    const hours = String(Math.floor(session.start / 60)).padStart(2, "0")
    const minutes = String(session.start % 60).padStart(2, "0")
    const slug =
        session.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40) || "class"
    const base = `${DAY_KEYS[((session.day % 7) + 7) % 7]}-${hours}${minutes}-${slug}`
    let candidate = base
    for (let suffix = 2; taken.has(candidate); suffix++) {
        candidate = `${base}-${suffix}`
    }
    taken.add(candidate)
    return candidate
}

/**
 * Code sessions lifted into the contract shape: deterministic sessionIds
 * (the same day-time-title rule a seed generator would mint), no capacity,
 * not bookable. The fallback path returns these so consumers see one shape
 * whether the document or the code speaks.
 */
export function withDerivedSessionIds(sessions: ClassSession[]): ScheduleSession[] {
    const taken = new Set<string>()
    return sessions.map((session) => ({ ...session, sessionId: derivedSessionId(session, taken) }))
}

/**
 * Pure resolve of a document over code sessions — exported for tests;
 * pages go through `useScheduleSessions`.
 */
export function applyContentDocumentSchedule(fallback: ClassSession[], document: unknown): ScheduleSession[] {
    return parseScheduleSessions(document) ?? withDerivedSessionIds(fallback)
}

/**
 * The schedule a pack page should render: the committed document's schedule
 * when `surface` names the ACTIVE pack (the document describes the active
 * pack's business, exactly like the landing document), otherwise the code
 * sessions untouched. Callers pass their own pack key as the surface.
 */
export function resolveScheduleSessions(fallback: ClassSession[], surface: PackKey): ScheduleSession[] {
    if (surface !== activePack.key) return withDerivedSessionIds(fallback)
    return applyContentDocumentSchedule(fallback, currentDocument)
}

/**
 * `resolveScheduleSessions` as a hook: identical result, plus a re-render
 * when a live repobot.content.json edit lands (dev HMR) — the same
 * subscription discipline as `useLandingConfig`.
 */
export function useScheduleSessions(fallback: ClassSession[], surface: PackKey): ScheduleSession[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveScheduleSessions(fallback, surface)
}
