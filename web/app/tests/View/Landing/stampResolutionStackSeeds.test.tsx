import { cleanup } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
// The full-bleed stack remixes, composed: each seed over its base pack's
// content module, as compose copies it.
vi.mock("../../../src/View/Gala/content", () => import("../../../src/View/Gala/waltRemix.content"))
vi.mock("../../../src/View/Care/content", () => import("../../../src/View/Care/clearwaterRemix.content"))
vi.mock("../../../src/View/Services/content", () => import("../../../src/View/Services/casacalRemix.content"))
vi.mock("../../../src/View/Influencer/content", () => import("../../../src/View/Influencer/luaRemix.content"))
vi.mock("../../../src/View/Estate/content", () => import("../../../src/View/Estate/aldercottRemix.content"))
vi.mock(
    "../../../src/View/Interiors/content",
    () => import("../../../src/View/Interiors/aokifarrowRemix.content"),
)
vi.mock("../../../src/View/FundIndex/content", () => import("../../../src/View/FundIndex/stetRemix.content"))

import * as careLanding from "../../../src/View/Care/careLanding"
import * as estateLanding from "../../../src/View/Estate/estateLanding"
import * as fundIndexLanding from "../../../src/View/FundIndex/fundIndexLanding"
import * as galaLanding from "../../../src/View/Gala/galaLanding"
import * as influencerLanding from "../../../src/View/Influencer/influencerLanding"
import * as interiorsLanding from "../../../src/View/Interiors/interiorsLanding"
import * as servicesLanding from "../../../src/View/Services/servicesLanding"
import { buildLandings, newStampTally, stampProblems } from "../../helpers/stampSweep"

/**
 * The preview-editor stamp sweep (stampResolution.test.tsx) over the stack
 * homes the kernel's own content never renders: gala on the gala-walt seed
 * (the memory book) and care on the care-obgyn-clearwater seed (the
 * outcomes report as stats bars, its footnote and sample-data note), and
 * services on the services-painting-casacal seed (the room stack, its
 * captions written into the photographs), influencer on the
 * influencer-lua seed (the diary stack and the edition's own copy),
 * estate on the estate-aldercott seed (the listing plates, each caption's
 * detail line), interiors on the interiors-architecture-aokifarrow seed (the
 * monograph: numbered plates, the feature, the index of works), and
 * fund-index on the fund-index-stet seed (the one-line home: the badged
 * line, the run of names, the colophon).
 */

afterEach(() => cleanup())

const NOW = new Date("2026-06-01T12:00:00")

const checked = newStampTally()

describe("preview-editor stamps resolve on the stack seeds", () => {
    const pages = buildLandings(
        {
            "View/Care/careLanding.ts": careLanding,
            "View/Estate/estateLanding.ts": estateLanding,
            "View/FundIndex/fundIndexLanding.ts": fundIndexLanding,
            "View/Gala/galaLanding.ts": galaLanding,
            "View/Influencer/influencerLanding.ts": influencerLanding,
            "View/Interiors/interiorsLanding.ts": interiorsLanding,
            "View/Services/servicesLanding.ts": servicesLanding,
        },
        NOW,
    )

    it("finds the stack landings", () => {
        expect(pages.length).toBeGreaterThanOrEqual(27)
    })

    it.each(pages)("%s", (_name, config) => {
        expect(stampProblems(config, checked)).toEqual([])
    })

    it("swept the report's rows, the memory book, and the room stack", () => {
        const kinds = pages.flatMap(([, config]) =>
            config.sections.map((section) => `${section.type}:${section.variant ?? ""}`),
        )
        expect(kinds).toContain("stats:bars")
        expect(kinds).toContain("testimonials:quote-grid")
        expect(kinds).toContain("gallery:sequence")
        expect(kinds).toContain("social-proof:metrics-row")
        expect(kinds).toContain("content-split:feature")
        expect(kinds).toContain("social-proof:text-logos")
        expect([...checked.lists]).toContain("items")
        expect(checked.text).toBeGreaterThan(0)
    })
})
