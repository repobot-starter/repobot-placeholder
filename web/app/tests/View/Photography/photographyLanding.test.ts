import { describe, expect, it, vi } from "vitest"
import photographyCatalog from "../../../../../packs/photography/catalog.json"

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
import { albums } from "../../../src/View/Photography/content"
import {
    aboutLanding,
    homeLanding,
    inquireLanding,
    workLanding,
} from "../../../src/View/Photography/photographyLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The photography pack's doc-aware pages (PhotographyPage routes each
 * page's config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). Two invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Isolation — album views share /work but are a different composition;
 *    they merge under `album-<slug>` so their `album-` ids can never bind
 *    to the work index's skeleton.
 */

const document = photographyCatalog.landing

describe("photography catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/work": "work",
            "/about": "about",
            "/inquire": "inquire",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding(""), "home", document)).toEqual(homeLanding(""))
        expect(applySitePageDocument(workLanding("", undefined), "work", document)).toEqual(
            workLanding("", undefined),
        )
        expect(applySitePageDocument(aboutLanding(""), "about", document)).toEqual(aboutLanding(""))
        expect(applySitePageDocument(inquireLanding(""), "inquire", document)).toEqual(inquireLanding(""))
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
            shell: { nav: { order: { links: ["/inquire", "/work", "/about"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Inquire",
            "Work",
            "About",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/inquire", "/work"] } } },
        })
        // /about drops out of its own links; the other two follow the order.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual(["Inquire", "Work"])
    })

    it("album views merge under album-<slug> and never collide with the index", () => {
        const album = albums[0]
        const view = workLanding("", album)
        expect(applySitePageDocument(view, "", document)).toEqual(view)
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
