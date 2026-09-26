import { describe, expect, it, vi } from "vitest"
import weddingCatalog from "../../../../../packs/wedding/catalog.json"

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
import { albums } from "../../../src/View/Wedding/content"
import {
    aboutLanding,
    bookLanding,
    galleriesLanding,
    homeLanding,
    inquireLanding,
    packagesLanding,
    weddingsLanding,
} from "../../../src/View/Wedding/weddingLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import type { LandingConfig } from "@ui"
import { composedLandingSeed } from "../../helpers/composedSeed"

/**
 * The wedding pack's doc-aware pages (WeddingPage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * Two invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Isolation — wedding views share /weddings but are a different
 *    composition; they merge under `wedding-<slug>` so their `wedding-` ids
 *    can never bind to the index's skeleton.
 *
 * The document is the one THIS tree composes: a wedding remix pins its own
 * register and page skeletons, and the builders — running on that remix's
 * content seed — must reproduce those.
 */

const document = composedLandingSeed("wedding", weddingCatalog.landing)

/** The code config wearing the document's register — the one field a pinned remix re-values. */
function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

describe("wedding catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/weddings": "weddings",
            "/galleries": "galleries",
            "/packages": "packages",
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
            ["weddings", weddingsLanding("", undefined)],
            ["galleries", galleriesLanding("")],
            ["packages", packagesLanding("")],
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

    it("reorders a page when the documented skeleton changes", () => {
        const home = homeLanding("")
        const [first, second] = home.sections.map((section) => section.id)
        const reordered = applySitePageDocument(home, "home", {
            pages: { home: { sections: [{ id: second }, { id: first }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual([second, first])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            ...document,
            shell: { nav: { order: { links: ["/inquire", "/weddings", "/packages", "/about"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Inquire",
            "Weddings",
            "Packages",
            "About",
            "Galleries",
            "Book",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/inquire", "/weddings"] } } },
        })
        // /about drops out of its own links; the ordered two lead and the
        // rest follow in their canonical order.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Inquire",
            "Weddings",
            "Galleries",
            "Packages",
            "Book",
        ])
    })

    it("wedding views merge under wedding-<slug> and never collide with the index", () => {
        const album = albums[0]
        const view = weddingsLanding("", album)
        expect(applySitePageDocument(view, "", document)).toEqual(inDocumentRegister(view))
        expect(
            applySitePageDocument(view, "weddings", document).sections.map((section) => section.id),
        ).not.toEqual(view.sections.map((section) => section.id))
        const painted = applySitePageDocument(view, `wedding-${album.slug}`, {
            pages: {
                [`wedding-${album.slug}`]: {
                    sections: [
                        { id: "wedding-hero", type: "hero" },
                        {
                            id: "wedding-gallery",
                            type: "gallery",
                            media: { items: ["/brand/one.jpg"] },
                        },
                    ],
                },
            },
        })
        const gallery = painted.sections.find((section) => section.id === "wedding-gallery")
        expect(
            (gallery?.content as { items: { media: { src: string } }[] }).items.map((item) => item.media.src),
        ).toEqual(["/brand/one.jpg"])
        const indexIds = new Set(document.pages.weddings.sections.map((section) => section.id))
        for (const section of view.sections) {
            expect(indexIds.has(section.id ?? "")).toBe(false)
        }
    })
})
