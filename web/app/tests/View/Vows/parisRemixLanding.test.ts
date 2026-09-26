import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import parisCatalog from "../../../../../packs/vows-paris/catalog.json"

// The builders run on the vows-paris seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock("../../../src/View/Vows/content", () => import("../../../src/View/Vows/parisRemix.content"))
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
 * The vows-paris remix's pinned skeletons (packs/vows-paris/catalog.json
 * `landing.pages`) against the base builders running on the remix's seed:
 * the letter composition emits exactly the pinned ids, types, variants, and
 * order on all six pages, and the home is type only — the names, the
 * weekend, the hotels, the couple's note — closing on the RSVP ask.
 */

const document = {
    ...parisCatalog.landing,
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

describe("vows-paris pinned layout", () => {
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

    it("sets the home in type alone: names, weekend, hotels, the note, and the RSVP link", () => {
        const sections = homeLanding("", NOW).sections
        expect(sections.some((section) => JSON.stringify(section.content).includes('"media"'))).toBe(false)
        const [hero, weekend, stay, note, closing] = sections
        expect(hero?.content).toMatchObject({
            headline: "Inès &\u00a0Paul",
            subheadline: "Paris · Saturday 18 September 2027",
        })
        expect(weekend?.content).toMatchObject({
            title: "The weekend",
            paragraphs: [
                "Friday — Drinks at Chez Odile, 7 pm",
                "Saturday — Ceremony at the Mairie du 6e, 3 pm; dinner to follow",
                "Sunday — Picnic in the Luxembourg Gardens",
            ],
        })
        expect(stay?.content).toMatchObject({
            title: "Where to stay",
            paragraphs: ["Hôtel des Glycines", "Hôtel Saint-Clair", "Hôtel de la Treille"],
        })
        expect(note?.content).toMatchObject({ title: "A note from us" })
        expect(closing?.content).toMatchObject({
            title: "With love, Inès & Paul.",
            cta: { label: "RSVP", href: "/rsvp" },
            align: "start",
        })
    })

    it("keeps the reply card", () => {
        const form = rsvpLanding("", NOW).sections.find((section) => section.id === "rsvp-form")
        expect(form?.type).toBe("lead-form")
    })
})
