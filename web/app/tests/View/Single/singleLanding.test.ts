import { describe, expect, it, vi } from "vitest"
import singleCatalog from "../../../../../packs/single/catalog.json"

// Pin the ambient manifest empty (see the wedding suite).
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { tailLanding } from "../../../src/View/Single/singleLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The release page's doc-aware tail: the masthead / excerpt / tracklist /
 * visual are bespoke surfaces, but the closing kernel sections (about +
 * mailing list) merge through the landing document under page id "home",
 * so the catalog's seed must reproduce the code config exactly and stay
 * reorderable by the structural editor.
 */

const document = singleCatalog.landing

describe("single catalog landing seed", () => {
    it("maps the one-pager's tail to the seeded home page", () => {
        expect(document.routes).toEqual({ "/": "home" })
        expect(Object.keys(document.pages)).toEqual(["home"])
        expect(document.pages.home.sections.map((section) => section.id)).toEqual(
            tailLanding().sections.map((section) => section.id),
        )
    })

    it("reproduces the tail's code skeleton exactly", () => {
        const config = tailLanding()
        expect(applySitePageDocument(config, "home", document)).toEqual(config)
    })

    it("pins the monolith register as the document style", () => {
        expect(document.style).toEqual({ preset: "monolith" })
        expect(tailLanding().style.preset).toBe("monolith")
    })

    it("reorders the tail when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(tailLanding(), "home", {
            pages: { home: { sections: [{ id: "mailing-list" }, { id: "about" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["mailing-list", "about"])
    })
})
