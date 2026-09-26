import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import photoboothCatalog from "../../../../../packs/vows-photobooth/catalog.json"

// The builders run on the vows-photobooth seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock("../../../src/View/Vows/content", () => import("../../../src/View/Vows/photoboothRemix.content"))
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
import { vowsShell } from "../../../src/View/Vows/vowsShell"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The vows-photobooth remix's pinned skeletons
 * (packs/vows-photobooth/catalog.json `landing.pages`) against the base
 * builders running on the remix's seed: the zine composition emits exactly
 * the pinned ids, types, variants, and order on all six pages, so the
 * remix keeps its layout while the base wedding keeps its own.
 */

const document = {
    ...photoboothCatalog.landing,
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

/** A fixed "today": August 27, 2026, mid-morning — 289 days out. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("vows-photobooth pinned layout", () => {
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

    it("prints the city under the names and calls the party page Registry", () => {
        const nav = vowsShell("", "").nav?.content
        expect(nav?.logo).toEqual({ name: "Priya & Marcus", tagline: "— Chicago, IL" })
        expect(nav?.links?.map((link) => link.label)).toEqual(["Our story", "Schedule", "Travel", "Registry"])
    })
})
