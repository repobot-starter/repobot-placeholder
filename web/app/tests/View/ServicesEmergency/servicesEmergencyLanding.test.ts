import { describe, expect, it, vi } from "vitest"
import emergencyCatalog from "../../../../../packs/services-emergency/catalog.json"

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
    requestLanding,
    servicesPageLanding,
} from "../../../src/View/ServicesEmergency/servicesEmergencyLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The emergency-services pack's doc-aware pages (ServicesEmergencyPage
 * routes each page's config through `useSitePageConfig`, keyed by the
 * catalog's `landing.routes`). The invariant is fidelity: the catalog's
 * seeded skeletons reproduce each page's code config exactly, so shipping
 * the seed changes nothing visually and the structural editor's first
 * gesture starts from documented truth.
 */

const document = emergencyCatalog.landing

describe("services-emergency catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/services": "services",
            "/about": "about",
            "/request": "request",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding(""), "home", document)).toEqual(homeLanding(""))
        expect(applySitePageDocument(servicesPageLanding(""), "services", document)).toEqual(
            servicesPageLanding(""),
        )
        expect(applySitePageDocument(aboutLanding(""), "about", document)).toEqual(aboutLanding(""))
        expect(applySitePageDocument(requestLanding(""), "request", document)).toEqual(requestLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            pages: { home: { sections: [{ id: "dispatch-proof" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["dispatch-proof", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            ...document,
            shell: { nav: { order: { links: ["/request", "/services", "/about"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Request service",
            "Services",
            "About",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/request", "/services"] } } },
        })
        // /about drops out of its own links; the other two follow the order.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Request service",
            "Services",
        ])
    })

    it("leads with the call everywhere the shape promises it", () => {
        // The dispatch shape's conviction: the phone is the primary CTA on
        // the hero AND the nav CTA — the number never leaves the viewport.
        const home = homeLanding("")
        const hero = home.sections[0].content as {
            badge?: string
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(hero.primaryCta?.href).toMatch(/^tel:/)
        expect(hero.secondaryCta?.href).toBe("/request")
        expect(hero.badge).toMatch(/24\/7/)
        expect(home.shell?.nav?.content.cta?.href).toMatch(/^tel:/)
    })

    it("prices every service on the services page", () => {
        const showcase = servicesPageLanding("").sections.find((section) => section.id === "services")
        const items = (showcase?.content as { items: { meta?: string }[] }).items
        expect(items.length).toBeGreaterThan(0)
        for (const item of items) {
            expect(item.meta, "every service card carries its printed price").toBeTruthy()
        }
    })
})
