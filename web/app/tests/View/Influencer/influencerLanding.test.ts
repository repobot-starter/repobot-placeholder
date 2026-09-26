import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import influencerCatalog from "../../../../../packs/influencer/catalog.json"

// The shared shell appends the project manifest's marketing pages to every
// nav ("adding a page rewires every nav"). These tests assert the pack's OWN
// chrome, but the ambient manifest differs per composed tree — this suite
// runs inside EVERY composed template. Pin the manifest empty so the
// assertions are about the pack, not about which tree they shipped in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import {
    aboutLanding,
    contactLanding,
    homeLanding,
    linksLanding,
    looksLanding,
} from "../../../src/View/Influencer/influencerLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { landingCopy, links, looks } from "../../../src/View/Influencer/content"
import { composedLandingSeed } from "../../helpers/composedSeed"

/**
 * The influencer pack's doc-aware pages (InfluencerPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). The invariant is fidelity: the catalog's seeded
 * skeletons reproduce each page's code config exactly, so shipping the
 * seed changes nothing visually and the structural editor's first gesture
 * starts from documented truth. The pack-specific invariants ride along:
 * the hub renders in entry order, both derived chip taxonomies are real,
 * and every product link lands in the shop strip.
 */

const document = composedLandingSeed("influencer", influencerCatalog.landing)

/** A derived template pins its own register; the code config wears it once composed. */
function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

describe("influencer catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/looks": "looks",
            "/links": "links",
            "/about": "about",
            "/contact": "contact",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        for (const [page, build] of [
            ["home", homeLanding],
            ["looks", looksLanding],
            ["links", linksLanding],
            ["about", aboutLanding],
            ["contact", contactLanding],
        ] as const) {
            expect(applySitePageDocument(build(""), page, document), page).toEqual(
                inDocumentRegister(build("")),
            )
        }
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            pages: { home: { sections: [{ id: "featured-looks" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["featured-looks", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            ...document,
            shell: { nav: { order: { links: ["/about", "/links", "/looks"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            landingCopy.nav.about,
            landingCopy.nav.links,
            landingCopy.nav.looks,
        ])
    })

    it("renders the hub in entry order — the owner's arrangement IS the hub", () => {
        const hub = linksLanding("").sections.find((section) => section.id === "link-hub")
        const items = (hub?.content as { items: { title: string; url: string }[] }).items
        expect(items.map((item) => item.title)).toEqual(links.map((link) => link.title))
        expect(items.map((item) => item.url)).toEqual(links.map((link) => link.url))
    })

    it("derives the looks grid's filter chips from the looks' categories", () => {
        const grid = looksLanding("").sections.find((section) => section.id === "looks")
        const items = (grid?.content as { items: { tags?: string[] }[] }).items
        expect(items).toHaveLength(looks.length)
        for (const item of items) {
            expect(item.tags?.length, "every look carries its category tag").toBe(1)
        }
        // The chips are data: the grid must carry more than one distinct
        // category or the filter row is pointless.
        const categories = new Set(items.flatMap((item) => item.tags ?? []))
        expect(categories.size).toBeGreaterThanOrEqual(3)
    })

    it("flattens every product link into the shop strip, each a real https link", () => {
        const strip = looksLanding("").sections.find((section) => section.id === "shop-the-looks")
        const items = (strip?.content as { items: { title: string; url: string }[] }).items
        const expected = looks.flatMap((look) => look.productLinks ?? [])
        expect(items).toHaveLength(expected.length)
        expect(items.map((item) => item.title)).toEqual(expected.map((piece) => piece.label))
        for (const item of items) {
            expect(item.url).toMatch(/^https:\/\//)
        }
    })

    it("renders RESOLVED content when handed in (the Manage path)", () => {
        // The builders render whatever the resolvers hand them — a document
        // edit walks the same path as the code default.
        const editedLooks = [{ ...looks[0], title: "Renamed by the owner" }]
        const grid = looksLanding("", editedLooks).sections.find((section) => section.id === "looks")
        const items = (grid?.content as { items: { title: string }[] }).items
        expect(items.map((item) => item.title)).toEqual(["Renamed by the owner"])
        // The home rail follows the contract's featured flags.
        const rail = homeLanding("", editedLooks).sections.find((section) => section.id === "featured-looks")
        const railItems = (rail?.content as { items: { title: string }[] }).items
        expect(railItems.map((item) => item.title)).toEqual(["Renamed by the owner"])
        // The hub teaser follows an edited hub, order preserved.
        const editedLinks = [{ ...links[1] }, { ...links[0], title: "The owner's new drop" }]
        const teaser = homeLanding("", looks, editedLinks).sections.find(
            (section) => section.id === "right-now",
        )
        const teaserItems = (teaser?.content as { items: { title: string }[] }).items
        expect(teaserItems.map((item) => item.title)).toEqual([links[1].title, "The owner's new drop"])
    })

    it("keeps the two asks wired: looks CTA and the partnership ask on the hero", () => {
        const hero = homeLanding("").sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(hero.primaryCta?.href).toBe("/looks")
        expect(hero.secondaryCta?.href).toBe("/contact")
    })

    it("keeps the pack off other packs' preview routes (/link is the link pack's)", () => {
        // The hub lives at /links (plural) — /link belongs to the link
        // pack's preview; the routes and nav must never collide with it.
        expect(Object.keys(document.routes)).not.toContain("/link")
        const navLinks = homeLanding("").shell?.nav?.content.links ?? []
        for (const link of navLinks) {
            expect(link.href).not.toBe("/link")
        }
        expect(navLinks.map((link) => link.href)).toContain("/links")
    })

    it("prefixes every internal link on the preview route", () => {
        const config = homeLanding("/influencer")
        const navLinks = config.shell?.nav?.content.links ?? []
        for (const link of navLinks) {
            expect(link.href).toMatch(/^\/influencer\//)
        }
        const hero = config.sections[0].content as { primaryCta?: { href: string } }
        expect(hero.primaryCta?.href).toBe("/influencer/looks")
    })
})
