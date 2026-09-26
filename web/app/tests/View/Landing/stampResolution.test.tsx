import { cleanup } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

import { buildLandings, newStampTally, stampProblems } from "../../helpers/stampSweep"

/**
 * The preview editor's stamps are only as good as the document paths they
 * name: a text stamp the merge can't resolve is a click that edits nothing,
 * a media stamp it rejects is a Replace that silently keeps the old photo.
 * Every landing page the templates render is swept here — each stamp must
 * resolve against its own section's content, through the same merge the
 * site runs. The sections only derived templates' seeds fill (the party
 * set's photo wall among them) are swept by stampResolutionRemixSeeds.test.tsx.
 */

afterEach(() => cleanup())

const modules = import.meta.glob<Record<string, unknown>>("../../../src/View/**/*Landing.ts", { eager: true })

const NOW = new Date("2026-06-01T12:00:00")

const checked = newStampTally()

describe("preview-editor stamps resolve in the content they name", () => {
    const pages = buildLandings(modules, NOW)

    it("finds the template landings", () => {
        expect(pages.length).toBeGreaterThan(40)
    })

    it.each(pages)("%s", (_name, config) => {
        expect(stampProblems(config, checked)).toEqual([])
    })

    // The dispatch job report ships in a restyle seed only
    // (services-emergency-van); sweep that home on its seed so the report's
    // stamps stay covered.
    it("ServicesEmergency/servicesEmergencyLanding.ts#homeLanding on the services-emergency-van seed", async () => {
        vi.resetModules()
        vi.doMock(
            "../../../src/View/ServicesEmergency/content",
            () => import("../../../src/View/ServicesEmergency/vanRemix.content"),
        )
        const builders = await import("../../../src/View/ServicesEmergency/servicesEmergencyLanding")
        vi.doUnmock("../../../src/View/ServicesEmergency/content")
        expect(stampProblems(builders.homeLanding("", NOW), checked)).toEqual([])
    })

    it("swept the editor's whole stamp vocabulary", () => {
        expect(checked.text).toBeGreaterThan(1000)
        expect(checked.media).toBeGreaterThan(100)
        for (const list of ["items", "slides", "media", "report.before"]) {
            expect([...checked.lists], list).toContain(list)
        }
    })
})
