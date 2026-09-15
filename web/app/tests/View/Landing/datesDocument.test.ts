import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import committedDocument from "../../../../../repobot.content.json"
import {
    applyContentDocumentShows,
    parseContentShows,
    withDerivedShowSlugs,
} from "../../../src/View/Landing/datesDocument"
import type { ShowDate } from "../../../src/View/Music/schedule"

/**
 * The dates domain's merge semantics (datesDocument.ts) — the music
 * family's tour read from repobot.content.json with code fallback, rule
 * for rule the schedule resolver's graceful degradation: invalid entries
 * drop alone, an empty list is a cleared tour, a non-empty list with no
 * valid entry is a broken document that falls back whole. Validation
 * mirrors the platform's ContentContract.ts parseShow, and the fallback
 * path's minted slugs follow the platform's own date-city derivation, so
 * both sides agree on one identity per row.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

const fallbackTour: ShowDate[] = [
    {
        date: "2026-09-04",
        city: "Asbury Park",
        venue: "The Wonder Bar",
        region: "NJ",
        ticketUrl: "https://tickets.example/asbury",
        note: "Hometown",
    },
    { date: "2026-09-06", city: "Philadelphia", venue: "Johnny Brenda's" },
]

const validShow = {
    slug: "2026-10-02-austin",
    date: "2026-10-02",
    city: "Austin",
    venue: "The Parish",
    region: "TX",
    ticketUrl: "https://tickets.example/austin",
    note: "SOLD OUT",
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("dates schema validation (parseContentShows)", () => {
    it("parses a well-formed dates domain, preserving the contract fields", () => {
        const parsed = parseContentShows({ dates: { entries: [validShow] } })
        expect(parsed).toEqual([validShow])
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps region, ticketUrl, and note optional (a bare show still renders)", () => {
        const { region: _r, ticketUrl: _t, note: _n, ...bare } = validShow
        expect(parseContentShows({ dates: { entries: [bare] } })).toEqual([bare])
    })

    it("returns undefined when the document carries no dates domain", () => {
        expect(parseContentShows({})).toBeUndefined()
        expect(parseContentShows(undefined)).toBeUndefined()
        expect(parseContentShows("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseContentShows({ dates: "junk" })).toBeUndefined()
        expect(parseContentShows({ dates: { entries: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty tour (owner cleared it)", () => {
        expect(parseContentShows({ dates: { entries: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops invalid entries alone and keeps the rest of the tour", () => {
        const invalid = [
            { ...validShow, slug: "UPPER CASE" },
            { ...validShow, slug: undefined },
            { ...validShow, slug: "bad-date", date: "October 2nd" },
            { ...validShow, slug: "no-city", city: "" },
            { ...validShow, slug: "no-venue", venue: "" },
            { ...validShow, slug: "bad-url", ticketUrl: "ftp://tickets.example" },
            { ...validShow, slug: "long-note", note: "x".repeat(61) },
            "junk",
            null,
        ]
        const parsed = parseContentShows({ dates: { entries: [validShow, ...invalid] } })
        expect(parsed).toEqual([validShow])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate slug after the first (identity is the editor's row key)", () => {
        const duplicate = { ...validShow, venue: "Impostor Hall" }
        const parsed = parseContentShows({ dates: { entries: [validShow, duplicate] } })
        expect(parsed).toEqual([validShow])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid entries as broken, not cleared", () => {
        expect(parseContentShows({ dates: { entries: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("ignores unknown entry fields (forward compatibility for later phases)", () => {
        const parsed = parseContentShows({
            dates: { entries: [{ ...validShow, supportAct: "The Openers", doors: "19:00" }] },
        })
        expect(parsed).toEqual([validShow])
    })
})

describe("fallback slug derivation (withDerivedShowSlugs)", () => {
    it("mints the platform's date-city slug for each code show", () => {
        const lifted = withDerivedShowSlugs(fallbackTour)
        expect(lifted.map((show) => show.slug)).toEqual(["2026-09-04-asbury-park", "2026-09-06-philadelphia"])
        // The rest of the row rides through untouched.
        expect(lifted[0]).toEqual({ ...fallbackTour[0], slug: "2026-09-04-asbury-park" })
    })

    it("dedupes two shows on the same date in the same city, platform-style", () => {
        const doubleHeader: ShowDate[] = [
            { date: "2026-09-04", city: "Austin", venue: "Early room" },
            { date: "2026-09-04", city: "Austin", venue: "Late room" },
        ]
        expect(withDerivedShowSlugs(doubleHeader).map((show) => show.slug)).toEqual([
            "2026-09-04-austin",
            "2026-09-04-austin-2",
        ])
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentShows)", () => {
    it("the document's tour wins over the code shows when both exist", () => {
        const resolved = applyContentDocumentShows(fallbackTour, { dates: { entries: [validShow] } })
        expect(resolved).toEqual([validShow])
    })

    it("falls back to the code shows (slugs minted) when the document has no dates domain", () => {
        expect(applyContentDocumentShows(fallbackTour, {})).toEqual(withDerivedShowSlugs(fallbackTour))
    })

    it("falls back whole on a corrupt domain instead of blanking the site", () => {
        const resolved = applyContentDocumentShows(fallbackTour, { dates: { entries: ["junk"] } })
        expect(resolved).toEqual(withDerivedShowSlugs(fallbackTour))
    })

    it("honors a cleared tour (empty entries) instead of resurrecting the code shows", () => {
        expect(applyContentDocumentShows(fallbackTour, { dates: { entries: [] } })).toEqual([])
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no dates (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseContentShows(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "a composed dates seed parses clean — every entry contract-valid, no warnings",
        () => {
            const parsed = parseContentShows(committedDocument)
            if (parsed === undefined) {
                // A pack without a dates seed (or the kernel itself):
                // nothing to validate, and nothing may have warned.
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { dates?: { entries?: unknown[] } }).dates?.entries
            expect(parsed, "a seed must parse without dropping entries").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
        },
    )
})
