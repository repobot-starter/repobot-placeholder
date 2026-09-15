import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import committedDocument from "../../../../../repobot.content.json"
import type { DayHours } from "../../../src/View/Landing/hours"
import { applyContentDocumentHours, parseContentHours } from "../../../src/View/Landing/hoursDocument"

/**
 * The hours domain's merge semantics (hoursDocument.ts) — the local-business
 * family's opening week read from repobot.content.json with code fallback,
 * rule for rule the schedule resolver's graceful degradation. Validation
 * mirrors the platform's ContentContract.ts parseDayHours, so the platform
 * never writes a day the kernel drops.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

const fallbackWeek: DayHours[] = [
    { day: 0, intervals: [[540, 840]] },
    { day: 2, intervals: [[420, 900]] },
]

const validDay = {
    day: 5,
    intervals: [
        [420, 900],
        [1020, 1260],
    ],
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("hours schema validation (parseContentHours)", () => {
    it("parses a well-formed hours domain, split intervals included", () => {
        const parsed = parseContentHours({ hours: { week: [validDay] } })
        expect(parsed).toEqual([validDay])
        expect(warn).not.toHaveBeenCalled()
    })

    it("returns undefined when the document carries no hours domain", () => {
        expect(parseContentHours({})).toBeUndefined()
        expect(parseContentHours(undefined)).toBeUndefined()
        expect(parseContentHours("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseContentHours({ hours: "junk" })).toBeUndefined()
        expect(parseContentHours({ hours: { week: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty week (everything closed)", () => {
        expect(parseContentHours({ hours: { week: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops invalid days alone and keeps the rest of the week", () => {
        const invalid = [
            { day: 7, intervals: [[420, 900]] },
            { day: -1, intervals: [[420, 900]] },
            { day: 1.5, intervals: [[420, 900]] },
            { day: 1, intervals: [] },
            { day: 1, intervals: [[900, 420]] },
            { day: 1, intervals: [[420, 420]] },
            { day: 1, intervals: [[-10, 420]] },
            { day: 1, intervals: [[420, 1441]] },
            { day: 1, intervals: [[420.5, 900]] },
            // Overlapping intervals: the second opens before the first closes.
            {
                day: 1,
                intervals: [
                    [420, 900],
                    [840, 1000],
                ],
            },
            { day: 1, intervals: [[420, 900], [1000]] },
            "junk",
            null,
        ]
        const parsed = parseContentHours({ hours: { week: [validDay, ...invalid] } })
        expect(parsed).toEqual([validDay])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate day after the first (a week has one row per day)", () => {
        const duplicate = { ...validDay, intervals: [[600, 700]] }
        const parsed = parseContentHours({ hours: { week: [validDay, duplicate] } })
        expect(parsed).toEqual([validDay])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid entries as broken, not closed", () => {
        expect(parseContentHours({ hours: { week: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentHours)", () => {
    it("the document's week wins over the code hours when both exist", () => {
        expect(applyContentDocumentHours(fallbackWeek, { hours: { week: [validDay] } })).toEqual([validDay])
    })

    it("falls back to the code hours when the document has no hours domain", () => {
        expect(applyContentDocumentHours(fallbackWeek, {})).toEqual(fallbackWeek)
    })

    it("falls back whole on a corrupt domain instead of blanking the badge", () => {
        expect(applyContentDocumentHours(fallbackWeek, { hours: { week: ["junk"] } })).toEqual(fallbackWeek)
    })

    it("honors an all-closed week (empty) instead of resurrecting the code hours", () => {
        expect(applyContentDocumentHours(fallbackWeek, { hours: { week: [] } })).toEqual([])
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no hours (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseContentHours(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "a composed hours seed parses clean — every day contract-valid, no warnings",
        () => {
            const parsed = parseContentHours(committedDocument)
            if (parsed === undefined) {
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { hours?: { week?: unknown[] } }).hours?.week
            expect(parsed, "a seed must parse without dropping entries").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
        },
    )
})
