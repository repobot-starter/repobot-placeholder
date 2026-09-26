import { cleanup } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
// The events family's restyled remixes, composed: each seed over its base
// pack's content module, as compose copies it.
vi.mock("../../../src/View/Gala/content", () => import("../../../src/View/Gala/discoRemix.content"))
vi.mock("../../../src/View/Reunion/content", () => import("../../../src/View/Reunion/rodeoRemix.content"))
vi.mock("../../../src/View/Vows/content", () => import("../../../src/View/Vows/photoboothRemix.content"))
vi.mock(
    "../../../src/View/Interiors/content",
    () => import("../../../src/View/Interiors/midcenturyRemix.content"),
)

import * as galaLanding from "../../../src/View/Gala/galaLanding"
import * as interiorsLanding from "../../../src/View/Interiors/interiorsLanding"
import * as reunionLanding from "../../../src/View/Reunion/reunionLanding"
import * as vowsLanding from "../../../src/View/Vows/vowsLanding"
import { buildLandings, newStampTally, stampProblems } from "../../helpers/stampSweep"

/**
 * The preview-editor stamp sweep (stampResolution.test.tsx) over the pages
 * the kernel's own content never renders: the base builders running on the
 * gala-disco, reunion-rodeo, vows-photobooth, and interiors-midcentury
 * seeds, whose sections (the invitation's photo wall and booth strips, the
 * poster's stops, the catalog's case files) only those seeds fill.
 */

afterEach(() => cleanup())

const NOW = new Date("2026-06-01T12:00:00")

const checked = newStampTally()

describe("preview-editor stamps resolve on the remix seeds", () => {
    const pages = buildLandings(
        {
            "View/Gala/galaLanding.ts": galaLanding,
            "View/Interiors/interiorsLanding.ts": interiorsLanding,
            "View/Reunion/reunionLanding.ts": reunionLanding,
            "View/Vows/vowsLanding.ts": vowsLanding,
        },
        NOW,
    )

    it("finds the remix landings", () => {
        expect(pages.length).toBeGreaterThanOrEqual(10)
    })

    it.each(pages)("%s", (_name, config) => {
        expect(stampProblems(config, checked)).toEqual([])
    })

    it("swept the party set's photo wall", () => {
        for (const list of ["snapshots", "snapshots.N.frames", "items", "media"]) {
            expect([...checked.lists], list).toContain(list)
        }
    })
})
