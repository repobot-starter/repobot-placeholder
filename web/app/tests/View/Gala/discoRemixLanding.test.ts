import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import discoCatalog from "../../../../../packs/gala-disco/catalog.json"

// The builders run on the gala-disco seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock("../../../src/View/Gala/content", () => import("../../../src/View/Gala/discoRemix.content"))
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { event } from "../../../src/View/Gala/content"
import { homeLanding, rsvpLanding } from "../../../src/View/Gala/galaLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The gala-disco remix's pinned skeletons (packs/gala-disco/catalog.json
 * `landing.pages`) against the base builders running on the remix's seed:
 * the content-gated sections emit exactly the pinned ids, types, variants,
 * and order, so the remix keeps its layout while the base evening keeps
 * its own.
 */

const document = { ...discoCatalog.landing, routes: { "/": "home", "/rsvp": "rsvp" } }

function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

const [year, month, day] = event.dateIso.split("-").map(Number)
const NOW = new Date(year, month - 1, day - 50, 10, 30)

describe("gala-disco pinned layout", () => {
    it("reproduces each pinned page from the seed exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(
            inDocumentRegister(homeLanding("", NOW)),
        )
        expect(applySitePageDocument(rsvpLanding("", NOW), "rsvp", document)).toEqual(
            inDocumentRegister(rsvpLanding("", NOW)),
        )
    })

    it("opens on the invitation card and splits the nav around its anchors", () => {
        const config = homeLanding("", NOW)
        expect(config.sections[0].variant).toBe("invitation")
        expect(config.shell?.nav?.variant).toBe("split")
        expect(config.shell?.nav?.content.links?.map((link) => link.href)).toEqual([
            "#steps",
            "#highlights",
            "#showcase",
        ])
    })
})
