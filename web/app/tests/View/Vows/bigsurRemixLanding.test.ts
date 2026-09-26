import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import bigsurCatalog from "../../../../../packs/vows-bigsur/catalog.json"

// The builders run on the vows-bigsur seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock("../../../src/View/Vows/content", () => import("../../../src/View/Vows/bigsurRemix.content"))
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import {
    homeLanding,
    partyLanding,
    rsvpLanding,
    scheduleLanding,
    storyLanding,
    travelLanding,
} from "../../../src/View/Vows/vowsLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The vows-bigsur remix's pinned skeletons (packs/vows-bigsur/catalog.json
 * `landing.pages`) against the base builders running on the remix's seed:
 * the story composition emits exactly the pinned ids, types, variants, and
 * order on all six pages, and the home reads the seed's weekend lines and
 * closing line with the RSVP ask intact.
 */

const document = {
    ...bigsurCatalog.landing,
    routes: {
        "/": "home",
        "/story": "story",
        "/schedule": "schedule",
        "/travel": "travel",
        "/party": "party",
        "/rsvp": "rsvp",
    },
}

function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

/** A fixed "today": August 27, 2026, mid-morning. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("vows-bigsur pinned layout", () => {
    it("reproduces each pinned page from the seed exactly", () => {
        const pages: [string, LandingConfig][] = [
            ["home", homeLanding("", NOW)],
            ["story", storyLanding("")],
            ["schedule", scheduleLanding("")],
            ["travel", travelLanding("")],
            ["party", partyLanding("")],
            ["rsvp", rsvpLanding("", NOW)],
        ]
        for (const [pageId, config] of pages) {
            expect(applySitePageDocument(config, pageId, document), pageId).toEqual(
                inDocumentRegister(config),
            )
        }
    })

    it("sets the names over the coast, the weekend in three lines, and one line with the RSVP link", () => {
        const [hero, story, weekend, closing] = homeLanding("", NOW).sections
        expect(hero?.content).toMatchObject({
            headline: "Maya & Eli",
            subheadline: "Big Sur · June 12, 2027",
        })
        expect(hero?.content).toHaveProperty("badge")
        expect(story?.content).toMatchObject({
            highlights: expect.arrayContaining([expect.objectContaining({ media: expect.anything() })]),
        })
        expect(weekend?.content).toMatchObject({
            paragraphs: [
                "Friday — Welcome dinner at the lodge",
                "Saturday — Ceremony on the bluff at five",
                "Sunday — Coffee and goodbyes",
            ],
        })
        expect(closing?.content).toMatchObject({
            title: "Stay: the lodge has held twenty rooms for us.",
            cta: { label: "RSVP", href: "/rsvp" },
        })
    })

    it("keeps the reply card", () => {
        const form = rsvpLanding("", NOW).sections.find((section) => section.id === "rsvp-form")
        expect(form?.type).toBe("lead-form")
    })
})
