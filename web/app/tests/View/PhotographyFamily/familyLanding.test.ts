import { describe, expect, it, vi } from "vitest"
import familyCatalog from "../../../../../packs/photography-family/catalog.json"

// The shared shell appends the project manifest's marketing pages to every
// nav ("adding a page rewires every nav"). These tests assert the pack's OWN
// chrome, but the ambient manifest differs per composed tree — a
// saas-composed tree carries Outlay's Features/Pricing pages, and this suite
// runs inside EVERY composed template. Pin the manifest empty so the
// assertions are about the pack, not about which tree they shipped in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { albums } from "../../../src/View/PhotographyFamily/content"
import {
    aboutLanding,
    bookLanding,
    galleriesLanding,
    homeLanding,
    inquireLanding,
    investmentLanding,
    workLanding,
} from "../../../src/View/PhotographyFamily/familyLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import type { LandingConfig } from "@ui"
import { composedLandingSeed } from "../../helpers/composedSeed"

/**
 * The family-photography pack's doc-aware pages (PhotographyFamilyPage
 * routes each page's config through `useSitePageConfig`, keyed by the
 * catalog's `landing.routes`). Two invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Isolation — album views share /work but are a different composition;
 *    they merge under `album-<slug>` so their `album-` ids can never bind
 *    to the work index's skeleton.
 *
 * The document is the one THIS tree composes: the documentary remix pins
 * its own register and page skeletons, and the builders — running on that
 * remix's content seed — must reproduce those.
 */

const document = composedLandingSeed("photography-family", familyCatalog.landing)

/** The code config wearing the document's register — the one field a pinned remix re-values. */
function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

describe("photography-family catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/work": "work",
            "/galleries": "galleries",
            "/investment": "investment",
            "/about": "about",
            "/book": "book",
            "/inquire": "inquire",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        const pages: [string, LandingConfig][] = [
            ["home", homeLanding("")],
            ["work", workLanding("", undefined)],
            ["galleries", galleriesLanding("")],
            ["investment", investmentLanding("")],
            ["about", aboutLanding("")],
            ["book", bookLanding("")],
            ["inquire", inquireLanding("")],
        ]
        for (const [pageId, config] of pages) {
            expect(applySitePageDocument(config, pageId, document), pageId).toEqual(
                inDocumentRegister(config),
            )
        }
    })

    it("pins a register as the document style", () => {
        // The register is the pack's product (heirloom's light-and-airy
        // stationery on the base, snapshot's fridge door on the documentary
        // remix): the document style must ride the catalog seed or the
        // composed site would open in the kernel default register.
        expect(typeof document.style.preset).toBe("string")
        expect(document.style.preset).not.toBe("")
        expect(homeLanding("").sections.map((section) => section.id)).toContain("selected-work")
    })

    it("seeds the base pack's own register: the light-and-airy heirloom", () => {
        // The key existing projects were created from keeps meaning the
        // original Family Photographer (packs/README.md "Derived templates").
        expect(familyCatalog.landing.style).toEqual({ preset: "heirloom" })
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            pages: { home: { sections: [{ id: "collections" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["collections", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            ...document,
            shell: { nav: { order: { links: ["/about", "/work", "/investment", "/inquire"] } } },
        })
        // Galleries is unlisted in the order document, so it appends after
        // the documented links in canonical position.
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "About",
            "Work",
            "Investment",
            "Inquire",
            "Galleries",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/inquire", "/work"] } } },
        })
        // /about drops out of its own links (current page); documented order
        // leads and any unlisted survivors are appended after it.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Inquire",
            "Work",
            "Galleries",
            "Investment",
        ])
    })

    it("album views merge under album-<slug> and never collide with the index", () => {
        const album = albums[0]
        const view = workLanding("", album)
        expect(applySitePageDocument(view, "", document)).toEqual(inDocumentRegister(view))
        expect(
            applySitePageDocument(view, "work", document).sections.map((section) => section.id),
        ).not.toEqual(view.sections.map((section) => section.id))
        const painted = applySitePageDocument(view, `album-${album.slug}`, {
            pages: {
                [`album-${album.slug}`]: {
                    sections: [
                        { id: "album-hero", type: "hero" },
                        {
                            id: "album-gallery",
                            type: "gallery",
                            media: { items: ["/brand/one.jpg"] },
                        },
                    ],
                },
            },
        })
        const gallery = painted.sections.find((section) => section.id === "album-gallery")
        expect(
            (gallery?.content as { items: { media: { src: string } }[] }).items.map((item) => item.media.src),
        ).toEqual(["/brand/one.jpg"])
        const indexIds = new Set(document.pages.work.sections.map((section) => section.id))
        for (const section of view.sections) {
            expect(indexIds.has(section.id ?? "")).toBe(false)
        }
    })
})
