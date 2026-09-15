import { describe, expect, it, vi } from "vitest"
import servicesCatalog from "../../../../../packs/services/catalog.json"

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
    homeLanding,
    projectsLanding,
    quoteLanding,
    servicesPageLanding,
} from "../../../src/View/Services/servicesLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The services pack's doc-aware pages (ServicesPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). The invariant is fidelity: the catalog's seeded
 * skeletons reproduce each page's code config exactly, so shipping the
 * seed changes nothing visually and the structural editor's first gesture
 * starts from documented truth.
 *
 * The home config is time-dependent (the live "Open now" badge), so the
 * fidelity check pins one instant and builds both sides from it.
 */

const document = servicesCatalog.landing

/** A Tuesday mid-morning: the badge reads "Open — closes 5 PM". */
const NOW = new Date(2026, 7, 25, 10, 30)

describe("services catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/projects": "projects",
            "/services": "services",
            "/about": "about",
            "/quote": "quote",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(projectsLanding(""), "projects", document)).toEqual(projectsLanding(""))
        expect(applySitePageDocument(servicesPageLanding(""), "services", document)).toEqual(
            servicesPageLanding(""),
        )
        expect(applySitePageDocument(aboutLanding(""), "about", document)).toEqual(aboutLanding(""))
        expect(applySitePageDocument(quoteLanding(""), "quote", document)).toEqual(quoteLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "transformations" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["transformations", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            ...document,
            shell: { nav: { order: { links: ["/about", "/projects", "/services"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "About",
            "Projects",
            "Services",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/services", "/projects"] } } },
        })
        // /about drops out of its own links; the other two follow the order.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual(["Services", "Projects"])
    })

    it("keeps the live badge current: the home hero recomputes per render", () => {
        const openMorning = homeLanding("", new Date(2026, 7, 25, 10, 30))
        const closedNight = homeLanding("", new Date(2026, 7, 25, 22, 0))
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        expect(badgeOf(openMorning)).toMatch(/^Open/)
        expect(badgeOf(closedNight)).toMatch(/^Closed/)
    })

    it("keeps the two asks wired: quote CTA and click-to-call on the hero", () => {
        const hero = homeLanding("", NOW).sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(hero.primaryCta?.href).toBe("/quote")
        expect(hero.secondaryCta?.href).toMatch(/^tel:/)
    })

    it("pairs every comparison item on the projects page", () => {
        const gallery = projectsLanding("").sections.find((section) => section.id === "transformations")
        const items = (
            gallery?.content as {
                items: { media: { src: string }; beforeMedia?: { src: string } }[]
            }
        ).items
        expect(items.length).toBeGreaterThan(0)
        for (const item of items) {
            expect(item.beforeMedia?.src, "every comparison needs its before frame").toBeTruthy()
            expect(item.beforeMedia?.src).not.toBe(item.media.src)
        }
    })
})
