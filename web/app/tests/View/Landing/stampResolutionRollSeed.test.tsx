import { cleanup } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
// The roll home, composed: the influencer-remi seed over the influencer
// pack's content module, as compose copies it.
vi.mock(
    "../../../src/View/Influencer/content",
    () => import("../../../src/View/Influencer/remiRemix.content"),
)

import * as influencerLanding from "../../../src/View/Influencer/influencerLanding"
import { buildLandings, newStampTally, stampProblems } from "../../helpers/stampSweep"

/**
 * The preview-editor stamp sweep (stampResolution.test.tsx) over the
 * influencer pages on the influencer-remi seed, which the kernel's own
 * content never renders: the masthead name, the roll as a contact sheet
 * (its frames, marks and notes), the fits as numbered plates, the quote
 * grid and the full-bleed band.
 */

afterEach(() => cleanup())

const NOW = new Date("2026-06-01T12:00:00")

const checked = newStampTally()

describe("preview-editor stamps resolve on the roll seed", () => {
    const pages = buildLandings({ "View/Influencer/influencerLanding.ts": influencerLanding }, NOW)

    it("finds the influencer landings", () => {
        expect(pages.length).toBe(5)
    })

    it.each(pages)("%s", (_name, config) => {
        expect(stampProblems(config, checked)).toEqual([])
    })

    it("swept the contact sheet, the plates, the quote grid and the band", () => {
        const kinds = pages.flatMap(([, config]) =>
            config.sections.map((section) => `${section.type}:${section.variant ?? ""}`),
        )
        expect(kinds).toContain("gallery:contact-sheet")
        expect(kinds).toContain("showcase:specimens")
        expect(kinds).toContain("testimonials:quote-grid")
        expect(kinds).toContain("cta-banner:full-bleed")
        expect([...checked.lists]).toContain("items")
        expect(checked.text).toBeGreaterThan(0)
    })
})
