import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import committedDocument from "../../../../../repobot.content.json"
import { applyContentDocumentEvents, parseContentEvents } from "../../../src/View/Landing/eventsDocument"
import type { DatedEvent } from "../../../src/View/Landing/events"

/**
 * The events domain's merge semantics (eventsDocument.ts) — the community
 * family's calendar read from repobot.content.json with code fallback,
 * rule for rule the schedule resolver's graceful degradation: invalid
 * entries drop alone, an empty list is a cleared calendar, a non-empty
 * list with no valid entry is a broken document that falls back whole.
 * Validation mirrors the platform's ContentContract.ts parseEvent, so the
 * platform never writes an entry the kernel drops.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

const fallbackCalendar: DatedEvent[] = [
    {
        slug: "picnic-2026",
        title: "Church picnic at Whatcom Falls",
        start: "2026-06-27T11:00",
        end: "2026-06-27T15:00",
        location: "Whatcom Falls Park",
        description: "The whole church outdoors for an afternoon.",
    },
]

const validEvent = {
    slug: "fall-kickoff",
    title: "Fall kickoff dinner",
    start: "2026-09-12T17:30",
    end: "2026-09-12T20:00",
    location: "Fellowship hall",
    description: "The common table, kickoff edition.",
    tags: ["dinner", "all-church"],
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("events schema validation (parseContentEvents)", () => {
    it("parses a well-formed events domain, preserving the contract fields", () => {
        const parsed = parseContentEvents({ events: { entries: [validEvent] } })
        expect(parsed).toEqual([validEvent])
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps end and tags optional (an open-ended untagged event still renders)", () => {
        const { end: _e, tags: _t, ...bare } = validEvent
        expect(parseContentEvents({ events: { entries: [bare] } })).toEqual([bare])
    })

    it("returns undefined when the document carries no events domain", () => {
        expect(parseContentEvents({})).toBeUndefined()
        expect(parseContentEvents(undefined)).toBeUndefined()
        expect(parseContentEvents("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseContentEvents({ events: "junk" })).toBeUndefined()
        expect(parseContentEvents({ events: { entries: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty calendar (owner cleared it)", () => {
        expect(parseContentEvents({ events: { entries: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops invalid entries alone and keeps the rest of the calendar", () => {
        const invalid = [
            { ...validEvent, slug: "UPPER CASE" },
            { ...validEvent, slug: undefined },
            { ...validEvent, slug: "untitled", title: "" },
            { ...validEvent, slug: "bad-start", start: "2026-09-12" },
            { ...validEvent, slug: "bad-end", end: "sometime" },
            { ...validEvent, slug: "no-location", location: "" },
            { ...validEvent, slug: "bad-tags", tags: [42] },
            { ...validEvent, slug: "many-tags", tags: Array(9).fill("tag") },
            "junk",
            null,
        ]
        const parsed = parseContentEvents({ events: { entries: [validEvent, ...invalid] } })
        expect(parsed).toEqual([validEvent])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate slug after the first (identity is the image join key)", () => {
        const duplicate = { ...validEvent, title: "Impostor dinner" }
        const parsed = parseContentEvents({ events: { entries: [validEvent, duplicate] } })
        expect(parsed).toEqual([validEvent])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid entries as broken, not cleared", () => {
        expect(parseContentEvents({ events: { entries: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("ignores unknown entry fields (forward compatibility for later phases)", () => {
        const parsed = parseContentEvents({
            events: { entries: [{ ...validEvent, rsvpUrl: "https://example.com", capacity: 90 }] },
        })
        expect(parsed).toEqual([validEvent])
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentEvents)", () => {
    it("the document's calendar wins over the code events when both exist", () => {
        const resolved = applyContentDocumentEvents(fallbackCalendar, {
            events: { entries: [validEvent] },
        })
        expect(resolved).toEqual([validEvent])
    })

    it("falls back to the code events when the document has no events domain", () => {
        expect(applyContentDocumentEvents(fallbackCalendar, {})).toEqual(fallbackCalendar)
    })

    it("falls back whole on a corrupt domain instead of blanking the site", () => {
        const resolved = applyContentDocumentEvents(fallbackCalendar, {
            events: { entries: ["junk"] },
        })
        expect(resolved).toEqual(fallbackCalendar)
    })

    it("honors a cleared calendar (empty entries) instead of resurrecting the code events", () => {
        expect(applyContentDocumentEvents(fallbackCalendar, { events: { entries: [] } })).toEqual([])
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no events (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseContentEvents(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "a composed events seed parses clean — every entry contract-valid, no warnings",
        () => {
            const parsed = parseContentEvents(committedDocument)
            if (parsed === undefined) {
                // A pack without an events seed (or the kernel itself):
                // nothing to validate, and nothing may have warned.
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { events?: { entries?: unknown[] } }).events?.entries
            expect(parsed, "a seed must parse without dropping entries").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
        },
    )
})
