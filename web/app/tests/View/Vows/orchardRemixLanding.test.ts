import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import orchardCatalog from "../../../../../packs/vows-orchard/catalog.json"

// The builders run on the vows-orchard seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock("../../../src/View/Vows/content", () => import("../../../src/View/Vows/orchardRemix.content"))
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
 * The vows-orchard remix's pinned skeletons (packs/vows-orchard/catalog.json
 * `landing.pages`) against the base builders running on the remix's seed:
 * the stack composition emits exactly the pinned ids, types, variants, and
 * order on all six pages, and the home reads the seed's stack frames and
 * closing line with the RSVP ask intact.
 */

const document = {
    ...orchardCatalog.landing,
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

describe("vows-orchard pinned layout", () => {
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

    it("sets the names over the orchard, a stack of captioned frames, and one line with the RSVP link", () => {
        const [hero, stack, closing] = homeLanding("", NOW).sections
        expect(hero?.content).toMatchObject({
            headline: "Nora & Ben",
            subheadline: "Hudson Valley · October 9, 2027",
            media: expect.anything(),
        })
        expect(hero?.content).toHaveProperty("badge")
        expect(stack?.content).toMatchObject({
            fullBleed: true,
            captionStack: "band-center",
            items: [
                expect.objectContaining({ caption: expect.stringMatching(/^How we met — /) }),
                expect.objectContaining({ caption: expect.stringMatching(/^The weekend — /) }),
            ],
        })
        expect(closing?.content).toMatchObject({
            title: "Rooms are held at the inn in Rhinebeck until August 1.",
            cta: { label: "RSVP", href: "/rsvp" },
        })
    })

    it("keeps the reply card", () => {
        const form = rsvpLanding("", NOW).sections.find((section) => section.id === "rsvp-form")
        expect(form?.type).toBe("lead-form")
    })
})
