import { cleanup } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
// The photographic résumé, composed: the resume-yara seed over the resume
// pack's content module, as compose copies it.
vi.mock("../../../src/View/Resume/content", () => import("../../../src/View/Resume/yaraRemix.content"))

import * as resumeLanding from "../../../src/View/Resume/resumeLanding"
import { buildLandings, newStampTally, stampProblems } from "../../helpers/stampSweep"

/**
 * The preview-editor stamp sweep (stampResolution.test.tsx) over the
 * résumé on the resume-yara seed, which the kernel's own content never
 * renders: the full-bleed hero, the photographic timeline and the stories.
 */

afterEach(() => cleanup())

const NOW = new Date("2026-06-01T12:00:00")

const checked = newStampTally()

describe("preview-editor stamps resolve on the chef seed", () => {
    const pages = buildLandings({ "View/Resume/resumeLanding.ts": resumeLanding }, NOW)

    it("finds the résumé landing", () => {
        expect(pages.length).toBe(1)
    })

    it.each(pages)("%s", (_name, config) => {
        expect(stampProblems(config, checked)).toEqual([])
    })

    it("swept the photographic hero, the timeline and the stories", () => {
        const kinds = pages.flatMap(([, config]) =>
            config.sections.map((section) => `${section.type}:${section.variant ?? ""}`),
        )
        expect(kinds).toContain("hero:full-bleed-media")
        expect(kinds).toContain("steps:timeline")
        expect(kinds).toContain("showcase:stories")
        expect(checked.text).toBeGreaterThan(0)
    })
})
