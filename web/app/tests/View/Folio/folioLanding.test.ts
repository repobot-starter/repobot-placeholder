import { describe, expect, it, vi } from "vitest"
import folioCatalog from "../../../../../packs/folio/catalog.json"

// The shared shell appends the project manifest's marketing pages to the
// nav ("adding a page rewires every nav"), but the ambient manifest differs
// per composed tree and this suite runs inside every one of them. Pin it
// empty so the assertions are about the pack, not the tree it shipped in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { folioLanding } from "../../../src/View/Folio/folioLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The folio pack's doc-aware home surface (FolioPage routes the config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * The invariant is fidelity: the catalog's seeded skeleton reproduces the
 * code config exactly, so shipping the seed changes nothing visually and
 * the structural editor's first gesture starts from documented truth.
 */

const document = folioCatalog.landing

describe("folio catalog landing seed", () => {
    it("maps the home route to a seeded page", () => {
        expect(document.routes).toEqual({ "/": "home" })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces the page's code skeleton exactly", () => {
        expect(applySitePageDocument(folioLanding(""), "home", document)).toEqual(folioLanding(""))
    })

    it("mirrors the code sections' skeleton entries verbatim", () => {
        // The merge above is graceful — a drifted type/variant in the seed
        // falls back to code and still renders — so pin the seed entries
        // byte-for-byte too: the document is supposed to be TRUTH about the
        // page, and the structural editor starts from what it says.
        expect(document.pages.home.sections).toEqual(
            folioLanding("").sections.map((section) => ({
                id: section.id,
                type: section.type,
                ...(section.variant !== undefined ? { variant: section.variant } : {}),
            })),
        )
    })

    it("pins the editorial register as the document style", () => {
        // The catalog is the only authority for the pack's register: the
        // document style must ride the seed or a composed site would open
        // in whatever register the previous pack left in the document.
        expect(document.style).toEqual({ preset: "editorial" })
        expect(folioLanding("").style?.preset).toBe("editorial")
    })

    it("reorders the page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(folioLanding(""), "home", {
            pages: { home: { sections: [{ id: "work" }, { id: "hero" }] } },
        })
        // Page-based skeletons are the whole page: unclaimed code sections
        // do not ride along (docs/landing.md, "Other pages").
        expect(reordered.sections.map((section) => section.id)).toEqual(["work", "hero"])
    })
})
