import { describe, expect, it } from "vitest"
import fitnessTrainerCatalog from "../../../../../packs/fitness-trainer/catalog.json"
import fitnessYogaCatalog from "../../../../../packs/fitness-yoga/catalog.json"
import fitnessCatalog from "../../../../../packs/fitness/catalog.json"
import {
    parseScheduleSessions,
    withDerivedSessionIds,
    type ScheduleSession,
} from "../../../src/View/Landing/contentDocument"
import type { ClassSession } from "../../../src/View/Landing/schedule"
import { trainingWeek } from "../../../src/View/FitnessTrainer/content"
import { weeklySchedule as yogaWeek } from "../../../src/View/FitnessYoga/content"
import { weeklySchedule as fitnessWeek } from "../../../src/View/Fitness/content"

/**
 * The content-seed fidelity contract for schedule-bearing packs: each
 * catalog's `content.schedule.sessions` (the seed compose stamps into
 * repobot.content.json) must be a structural twin of the pack's own
 * content.ts week — same classes, same order, same times — wearing the
 * contract's booking-facing additions (sessionId, capacity, bookable) on
 * top. Twinhood is what makes the contract cutover invisible: a freshly
 * composed template renders the identical grid whether the page reads the
 * document or falls back to code, and the platform's Manage UI opens on
 * exactly the week the site already shows.
 *
 * Session ids are pinned to the resolver's own derivation rule
 * (day-HHMM-title), so an id minted by the seed and an id derived on the
 * code-fallback path agree — the booking domain (Phase 2) joins on these.
 */

const seededPacks: { key: string; week: ClassSession[]; catalog: unknown }[] = [
    { key: "fitness", week: fitnessWeek, catalog: fitnessCatalog },
    { key: "fitness-yoga", week: yogaWeek, catalog: fitnessYogaCatalog },
    { key: "fitness-trainer", week: trainingWeek, catalog: fitnessTrainerCatalog },
]

function seedSessions(catalog: unknown): ScheduleSession[] {
    const content = (catalog as { content?: unknown }).content
    const parsed = parseScheduleSessions(content)
    expect(parsed, "the catalog's content.schedule seed must parse contract-clean").toBeDefined()
    return parsed as ScheduleSession[]
}

describe.each(seededPacks)("$key content seed", ({ week, catalog }) => {
    it("mirrors the pack's content.ts week entry for entry", () => {
        const sessions = seedSessions(catalog)
        expect(sessions.map(({ sessionId: _id, capacity: _c, bookable: _b, ...session }) => session)).toEqual(
            week,
        )
    })

    it("parses without dropping a single entry", () => {
        const raw = (catalog as { content: { schedule: { sessions: unknown[] } } }).content.schedule.sessions
        expect(seedSessions(catalog)).toHaveLength(raw.length)
    })

    it("mints sessionIds by the resolver's own derivation rule", () => {
        // Seed ids and code-fallback-derived ids must agree: a project that
        // flips between the document and the code path keeps one identity
        // per class, which is what the booking domain joins on.
        const sessions = seedSessions(catalog)
        expect(sessions.map((session) => session.sessionId)).toEqual(
            withDerivedSessionIds(week).map((session) => session.sessionId),
        )
    })

    it("declares a capacity for every bookable class", () => {
        for (const session of seedSessions(catalog)) {
            if (session.bookable === true) {
                expect(
                    session.capacity,
                    `${session.sessionId}: a bookable class needs a seat ceiling`,
                ).toBeGreaterThan(0)
            }
        }
    })
})
