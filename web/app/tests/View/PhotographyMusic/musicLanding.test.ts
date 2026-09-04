import { describe, expect, it, vi } from "vitest"
import musicCatalog from "../../../../../packs/photography-music/catalog.json"

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
import { albums } from "../../../src/View/PhotographyMusic/content"
import {
    aboutLanding,
    bookLanding,
    homeLanding,
    workLanding,
} from "../../../src/View/PhotographyMusic/musicLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The music-photography pack's doc-aware pages (PhotographyMusicPage routes
 * each page's config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). Two invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Isolation — album views share /work but are a different composition;
 *    they merge under `album-<slug>` so their `album-` ids can never bind
 *    to the work index's skeleton.
 */

const document = musicCatalog.landing

describe("photography-music catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/work": "work",
            "/about": "about",
            "/book": "book",
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
        expect(applySitePageDocument(bookLanding(""), "book", document)).toEqual(bookLanding(""))
    })

    it("pins the marquee register as the document style", () => {
        // The home reel is the pack's signature: the sequence gallery under
        // the marquee register's stage-black ground. The document style must
        // ride the catalog seed or the composed site would open in the
        // kernel default register.
        expect(document.style).toEqual({ preset: "marquee" })
        expect(homeLanding("").sections.map((section) => section.id)).toContain("reel")
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
            shell: { nav: { order: { links: ["/book", "/work", "/about"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Book",
            "Work",
            "About",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/book", "/work"] } } },
        })
        // /about drops out of its own links; the other two follow the order.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual(["Book", "Work"])
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
