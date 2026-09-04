import { describe, expect, it, vi } from "vitest"
import estateCatalog from "../../../../../packs/estate/catalog.json"

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
    listingsLanding,
    neighborhoodsLanding,
} from "../../../src/View/Estate/estateLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The estate pack's doc-aware pages (EstatePage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * The invariant is fidelity: the catalog's seeded skeletons reproduce each
 * page's code config exactly, so shipping the seed changes nothing
 * visually and the structural editor's first gesture starts from
 * documented truth.
 *
 * The home and listings configs are time-dependent (computed status
 * badges, the market pulse), so the fidelity checks pin one instant and
 * build both sides from it.
 */

const document = estateCatalog.landing

/** A fixed "today": August 27, 2026, mid-morning. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("estate catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/listings": "listings",
            "/neighborhoods": "neighborhoods",
            "/about": "about",
            "/contact": "contact",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(listingsLanding("", NOW), "listings", document)).toEqual(
            listingsLanding("", NOW),
        )
        expect(applySitePageDocument(neighborhoodsLanding(""), "neighborhoods", document)).toEqual(
            neighborhoodsLanding(""),
        )
        expect(applySitePageDocument(aboutLanding(""), "about", document)).toEqual(aboutLanding(""))
        expect(applySitePageDocument(contactLanding(""), "contact", document)).toEqual(contactLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "featured-listings" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["featured-listings", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            ...document,
            shell: { nav: { order: { links: ["/about", "/listings", "/neighborhoods"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "About",
            "Listings",
            "Neighborhoods",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/neighborhoods", "/listings"] } } },
        })
        // /about drops out of its own links; the other two follow the order.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Neighborhoods",
            "Listings",
        ])
    })

    it("keeps the badges computed: the listings grid recomputes per render", () => {
        const badgesAt = (now: Date): (string | undefined)[] => {
            const grid = listingsLanding("", now).sections.find((section) => section.id === "listings")
            const items = (grid?.content as { items: { badge?: { label: string } }[] }).items
            return items.map((item) => item.badge?.label)
        }
        const fresh = badgesAt(NOW)
        // Every card wears a pill, and the demo inventory shows the whole
        // vocabulary at the pinned instant.
        expect(fresh.every((label) => label !== undefined)).toBe(true)
        expect(fresh).toContain("New this week")
        expect(fresh).toContain("Sale pending")
        expect(fresh).toContain("Sold")
        // A year on, freshness has aged out — the clock, not the content,
        // decides — while the settled statuses still read from the data.
        const aged = badgesAt(new Date(2027, 7, 27, 10, 30))
        expect(aged).not.toContain("New this week")
        expect(aged).toContain("For sale")
        expect(aged).toContain("Sold")
    })

    it("keeps the hero's market pulse live: the home hero recomputes per render", () => {
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        // At the pinned instant the demo data has fresh listings…
        expect(badgeOf(homeLanding("", NOW))).toMatch(/new listing/)
        // …and a year later the same data reads as standing inventory.
        expect(badgeOf(homeLanding("", new Date(2027, 7, 27, 10, 30)))).toMatch(/on the market/)
    })

    it("keeps the two asks wired: listings CTA and click-to-call on the hero", () => {
        const hero = homeLanding("", NOW).sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(hero.primaryCta?.href).toBe("/listings")
        expect(hero.secondaryCta?.href).toMatch(/^tel:/)
    })

    it("derives the filter chips from the listings' neighborhoods", () => {
        const grid = listingsLanding("", NOW).sections.find((section) => section.id === "listings")
        const items = (grid?.content as { items: { tags?: string[] }[] }).items
        for (const item of items) {
            expect(item.tags?.length, "every listing carries its neighborhood tag").toBe(1)
        }
    })
})
