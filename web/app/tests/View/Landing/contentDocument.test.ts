import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import activePack from "../../../../../packs/active.json"
import committedDocument from "../../../../../repobot.content.json"
import {
    applyContentDocumentSchedule,
    parseScheduleSessions,
    withDerivedSessionIds,
    type ScheduleSession,
} from "../../../src/View/Landing/contentDocument"
import type { ClassSession } from "../../../src/View/Landing/schedule"

/**
 * The repobot.content.json merge semantics — the business-content contract
 * (contentDocument.ts): the document owns owner-editable business facts
 * (the schedule domain today), code keeps the fallback, and no document a
 * hand or the platform can write may crash the page.
 *
 * Like the landing suite, this runs in two kinds of checkout. In the
 * kernel, the root repobot.content.json IS the kernel default (no
 * domains). In a composed template repo the root document carries the
 * active pack's content seed and the pristine default is kept at
 * packs/.defaults/repobot.content.json. The strict compose-merge assertion
 * runs only where the document is known pristine — the kernel checkout and
 * the template publish gate (REPOBOT_COMPOSE_GATE=1) — because the root
 * document is the PLATFORM'S write surface: the Manage UI's schedule edits
 * land here as commits, and asserting seed equality in a customer repo
 * would turn their main red at the first schedule edit.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

type ContentOverlay = { $comment?: string; schedule?: unknown }

/** One content overlay merged exactly as applyPackOverlays merges it. */
function composeOverlay(overlay: ContentOverlay | undefined): unknown {
    const kernelDefault: unknown = existsSync(composedDefaultPath)
        ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
        : JSON.parse(readFileSync(join(repoRoot, "repobot.content.json"), "utf8"))
    if (!overlay) {
        return kernelDefault
    }
    const { $comment: _comment, ...domains } = overlay
    return { ...(kernelDefault as Record<string, unknown>), ...domains }
}

/**
 * Every document compose could legitimately have stamped for this
 * active.json: the active pack's own content seed, or any of its remixes'
 * seeds merged over the base's (active.json carries the BASE key when a
 * derived template is composed). Packs without a content seed leave the
 * kernel default.
 */
function composedDocumentsForActivePack(): unknown[] {
    const catalog = JSON.parse(
        readFileSync(join(repoRoot, "packs", activePack.key, "catalog.json"), "utf8"),
    ) as { content?: ContentOverlay }
    const candidates = [composeOverlay(catalog.content)]
    for (const entry of readdirSync(join(repoRoot, "packs"), { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const remixPath = join(repoRoot, "packs", entry.name, "catalog.json")
        if (!existsSync(remixPath)) continue
        const remix = JSON.parse(readFileSync(remixPath, "utf8")) as {
            remixOf?: string
            content?: ContentOverlay
        }
        if (remix.remixOf !== activePack.key || remix.content === undefined) continue
        candidates.push(composeOverlay({ ...catalog.content, ...remix.content }))
    }
    return candidates
}

const fallbackWeek: ClassSession[] = [
    { day: 1, start: 360, end: 420, title: "Strength 101", instructor: "Mara Reyes", note: "All levels" },
    { day: 1, start: 720, end: 765, title: "Lunch Express", instructor: "Dom Cole" },
    { day: 2, start: 360, end: 420, title: "Conditioning", instructor: "Whit Okafor" },
]

const validSession = {
    sessionId: "mon-0600-strength-101",
    day: 1,
    start: 360,
    end: 420,
    title: "Strength 101",
    instructor: "Mara Reyes",
    note: "All levels",
    capacity: 12,
    bookable: true,
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("schedule schema validation (parseScheduleSessions)", () => {
    it("parses a well-formed schedule domain, preserving the contract fields", () => {
        const parsed = parseScheduleSessions({ schedule: { sessions: [validSession] } })
        expect(parsed).toEqual([validSession])
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps capacity and bookable optional (a class without either still renders)", () => {
        const { capacity: _c, bookable: _b, note: _n, ...bare } = validSession
        expect(parseScheduleSessions({ schedule: { sessions: [bare] } })).toEqual([bare])
    })

    it("returns undefined when the document carries no schedule domain", () => {
        expect(parseScheduleSessions({})).toBeUndefined()
        expect(parseScheduleSessions(undefined)).toBeUndefined()
        expect(parseScheduleSessions("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseScheduleSessions({ schedule: "junk" })).toBeUndefined()
        expect(parseScheduleSessions({ schedule: { sessions: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty week (owner cleared the schedule)", () => {
        expect(parseScheduleSessions({ schedule: { sessions: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops invalid entries alone and keeps the rest of the week", () => {
        const invalid = [
            { ...validSession, sessionId: "UPPER CASE" },
            { ...validSession, sessionId: undefined },
            { ...validSession, sessionId: "bad-day", day: 7 },
            { ...validSession, sessionId: "bad-day-2", day: -1 },
            { ...validSession, sessionId: "inverted", start: 420, end: 360 },
            { ...validSession, sessionId: "zero-length", start: 420, end: 420 },
            { ...validSession, sessionId: "past-midnight", end: 24 * 60 + 1 },
            { ...validSession, sessionId: "fractional", start: 360.5 },
            { ...validSession, sessionId: "untitled", title: "" },
            { ...validSession, sessionId: "bad-capacity", capacity: 0 },
            { ...validSession, sessionId: "huge-capacity", capacity: 1000 },
            { ...validSession, sessionId: "float-capacity", capacity: 11.5 },
            { ...validSession, sessionId: "bad-bookable", bookable: "yes" },
            { ...validSession, sessionId: "bad-note", note: 42 },
            "junk",
            null,
        ]
        const parsed = parseScheduleSessions({ schedule: { sessions: [validSession, ...invalid] } })
        expect(parsed).toEqual([validSession])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate sessionId after the first (identity is the booking join key)", () => {
        const duplicate = { ...validSession, title: "Impostor Hour" }
        const parsed = parseScheduleSessions({ schedule: { sessions: [validSession, duplicate] } })
        expect(parsed).toEqual([validSession])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid entries as broken, not cleared", () => {
        expect(parseScheduleSessions({ schedule: { sessions: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("ignores unknown entry fields (forward compatibility for later phases)", () => {
        const parsed = parseScheduleSessions({
            schedule: { sessions: [{ ...validSession, waitlist: true, room: "A" }] },
        })
        expect(parsed).toEqual([validSession])
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentSchedule)", () => {
    it("the document's schedule wins over the code week when both exist", () => {
        const resolved = applyContentDocumentSchedule(fallbackWeek, {
            schedule: { sessions: [validSession] },
        })
        expect(resolved).toEqual([validSession])
    })

    it("falls back to the code week when the document has no schedule domain", () => {
        const resolved = applyContentDocumentSchedule(fallbackWeek, {})
        expect(resolved.map(({ sessionId: _id, ...session }) => session)).toEqual(fallbackWeek)
    })

    it("falls back whole on a corrupt domain instead of blanking the site", () => {
        const resolved = applyContentDocumentSchedule(fallbackWeek, {
            schedule: { sessions: ["junk"] },
        })
        expect(resolved).toHaveLength(fallbackWeek.length)
    })

    it("honors a cleared week (empty sessions) instead of resurrecting the code week", () => {
        expect(applyContentDocumentSchedule(fallbackWeek, { schedule: { sessions: [] } })).toEqual([])
    })

    it("derives stable, unique day-HHMM-title ids for the fallback path", () => {
        const resolved = applyContentDocumentSchedule(fallbackWeek, {})
        expect(resolved.map((session) => session.sessionId)).toEqual([
            "mon-0600-strength-101",
            "mon-1200-lunch-express",
            "tue-0600-conditioning",
        ])
        // Two identical code entries must still get distinct identities.
        const doubled = withDerivedSessionIds([fallbackWeek[0], fallbackWeek[0]])
        expect(doubled[0].sessionId).not.toBe(doubled[1].sessionId)
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no schedule (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseScheduleSessions(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "the committed root document is the kernel default under the active pack's content seed",
        () => {
            expect(composedDocumentsForActivePack()).toContainEqual(committedDocument)
        },
    )

    it.runIf(documentIsPristine)(
        "a composed schedule seed parses clean — every entry contract-valid, no warnings",
        () => {
            const parsed = parseScheduleSessions(committedDocument)
            if (parsed === undefined) {
                // A pack without a schedule seed (or the kernel itself):
                // nothing to validate, and nothing may have warned.
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { schedule?: { sessions?: unknown[] } }).schedule?.sessions
            expect(parsed, "a seed must parse without dropping entries").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
            for (const session of parsed as ScheduleSession[]) {
                expect(session.sessionId).toMatch(/^[a-z0-9][a-z0-9-]*$/)
            }
        },
    )
})
