import { describe, expect, it, vi } from "vitest"
import interiorsCatalog from "../../../../../packs/interiors/catalog.json"

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
    portfolioLanding,
    servicesLanding,
} from "../../../src/View/Interiors/interiorsLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { projects } from "../../../src/View/Interiors/content"

/**
 * The interiors pack's doc-aware pages (InteriorsPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). The invariant is fidelity: the catalog's seeded
 * skeletons reproduce each page's code config exactly, so shipping the
 * seed changes nothing visually and the structural editor's first gesture
 * starts from documented truth.
 */

const document = interiorsCatalog.landing

describe("interiors catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/portfolio": "portfolio",
            "/offerings": "offerings",
            "/about": "about",
            "/contact": "contact",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding(""), "home", document)).toEqual(homeLanding(""))
        expect(applySitePageDocument(portfolioLanding(""), "portfolio", document)).toEqual(
            portfolioLanding(""),
        )
        expect(applySitePageDocument(servicesLanding(""), "offerings", document)).toEqual(servicesLanding(""))
        expect(applySitePageDocument(aboutLanding(""), "about", document)).toEqual(aboutLanding(""))
        expect(applySitePageDocument(contactLanding(""), "contact", document)).toEqual(contactLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            pages: { home: { sections: [{ id: "featured-work" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["featured-work", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            ...document,
            shell: { nav: { order: { links: ["/about", "/portfolio", "/offerings"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "About",
            "Portfolio",
            "Services",
        ])
    })

    it("derives the filter chips from the projects' categories", () => {
        const grid = portfolioLanding("").sections.find((section) => section.id === "portfolio")
        const items = (grid?.content as { items: { tags?: string[] }[] }).items
        expect(items).toHaveLength(projects.length)
        for (const item of items) {
            expect(item.tags?.length, "every project carries its category tag").toBe(1)
        }
        // The chips are data: the grid must carry more than one distinct
        // category or the filter row is pointless.
        const categories = new Set(items.flatMap((item) => item.tags ?? []))
        expect(categories.size).toBeGreaterThanOrEqual(3)
    })

    it("renders a RESOLVED portfolio when one is handed in (the Manage path)", () => {
        // The builders render whatever the resolver hands them — a document
        // edit walks the same path as the code default.
        const edited = [{ ...projects[0], title: "Renamed by the owner" }]
        const grid = portfolioLanding("", edited).sections.find((section) => section.id === "portfolio")
        const items = (grid?.content as { items: { title: string }[] }).items
        expect(items.map((item) => item.title)).toEqual(["Renamed by the owner"])
        // The home rail follows the contract's featured flags.
        const rail = homeLanding("", edited).sections.find((section) => section.id === "featured-work")
        const railItems = (rail?.content as { items: { title: string }[] }).items
        expect(railItems.map((item) => item.title)).toEqual(["Renamed by the owner"])
    })

    it("keeps the two asks wired: portfolio CTA and the project ask on the hero", () => {
        const hero = homeLanding("").sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(hero.primaryCta?.href).toBe("/portfolio")
        expect(hero.secondaryCta?.href).toBe("/contact")
    })

    it("keeps the studio's menu off /services (the services pack's preview route)", () => {
        // The nav and routes must point at /offerings: when this pack is
        // active, /services still belongs to the services pack's preview.
        expect(Object.keys(document.routes)).not.toContain("/services")
        const links = homeLanding("").shell?.nav?.content.links ?? []
        for (const link of links) {
            expect(link.href).not.toBe("/services")
        }
        expect(links.map((link) => link.href)).toContain("/offerings")
    })

    it("prefixes every internal link on the preview route", () => {
        const config = homeLanding("/interiors")
        const links = config.shell?.nav?.content.links ?? []
        for (const link of links) {
            expect(link.href).toMatch(/^\/interiors\//)
        }
        const hero = config.sections[0].content as { primaryCta?: { href: string } }
        expect(hero.primaryCta?.href).toBe("/interiors/portfolio")
    })
})
