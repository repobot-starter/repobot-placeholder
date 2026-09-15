import { describe, expect, it, vi } from "vitest"
import recurringCatalog from "../../../../../packs/services-recurring/catalog.json"

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
    bookLanding,
    homeLanding,
    plansLanding,
} from "../../../src/View/ServicesRecurring/servicesRecurringLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The recurring-services pack's doc-aware pages (ServicesRecurringPage
 * routes each page's config through `useSitePageConfig`, keyed by the
 * catalog's `landing.routes`). The invariant is fidelity: the catalog's
 * seeded skeletons reproduce each page's code config exactly, so shipping
 * the seed changes nothing visually and the structural editor's first
 * gesture starts from documented truth.
 *
 * The home config is time-dependent (the live "Open now" badge), so the
 * fidelity check pins one instant and builds both sides from it.
 */

const document = recurringCatalog.landing

/** A Tuesday mid-morning: the badge reads "Open — closes 6 PM". */
const NOW = new Date(2026, 7, 25, 10, 30)

describe("services-recurring catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/plans": "plans",
            "/about": "about",
            "/book": "book",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(plansLanding(""), "plans", document)).toEqual(plansLanding(""))
        expect(applySitePageDocument(aboutLanding(""), "about", document)).toEqual(aboutLanding(""))
        expect(applySitePageDocument(bookLanding(""), "book", document)).toEqual(bookLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "plans" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["plans", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            ...document,
            shell: { nav: { order: { links: ["/about", "/plans"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "About",
            "Plans & pricing",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/plans"] } } },
        })
        // /about drops out of its own links; the other one follows.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual(["Plans & pricing"])
    })

    it("keeps the live badge current: the home hero recomputes per render", () => {
        const openMorning = homeLanding("", new Date(2026, 7, 25, 10, 30))
        const closedNight = homeLanding("", new Date(2026, 7, 25, 22, 0))
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        expect(badgeOf(openMorning)).toMatch(/^Open/)
        expect(badgeOf(closedNight)).toMatch(/^Closed/)
    })

    it("sells the rhythm up front: pricing tiers live on the home page", () => {
        // The recurring shape's signature — a subscription doesn't hide its
        // plans behind a link.
        const home = homeLanding("", NOW)
        const pricing = home.sections.find((section) => section.type === "pricing")
        expect(pricing, "home page carries the pricing section").toBeTruthy()
        const tiers = (pricing?.content as { tiers: { monthly: number; yearlyPerMonth: number }[] }).tiers
        expect(tiers.length).toBeGreaterThanOrEqual(2)
        // Per-visit prices: both toggle sides equal, so no monthly/yearly
        // toggle renders and the period suffix stays honest.
        for (const tier of tiers) {
            expect(tier.monthly).toBe(tier.yearlyPerMonth)
        }
    })

    it("squares the plans-page comparison to the tiers", () => {
        const plansPage = plansLanding("")
        const pricing = plansPage.sections.find((section) => section.type === "pricing")
        const comparison = plansPage.sections.find((section) => section.type === "comparison")
        const tiers = (pricing?.content as { tiers: { name: string }[] }).tiers
        const columns = (comparison?.content as { columns: string[] }).columns
        // The comparison's plan columns are exactly the tiers, in order.
        expect(columns.slice(1)).toEqual(tiers.map((tier) => tier.name))
    })
})
