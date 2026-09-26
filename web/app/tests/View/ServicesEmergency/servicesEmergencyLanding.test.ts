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
import { composedLandingSeed } from "../../helpers/composedSeed"

/**
 * The emergency-services pack's doc-aware pages (ServicesEmergencyPage
 * routes each page's config through `useSitePageConfig`, keyed by the
 * catalog's `landing.routes`). The invariant is fidelity: the catalog's
 * seeded skeletons reproduce each page's code config exactly, so shipping
 * the seed changes nothing visually and the structural editor's first
 * gesture starts from documented truth.
 *
 * This suite runs inside every composed tree. A derived template of this
 * pack may pin its own layout (catalog `landing.pages`, merged over the
 * base's by resolveCatalog), so the seed under test is the one THIS tree
 * composes with — the base catalog's in the pack's own tree.
 */

/** A fixed instant for the fidelity checks (both sides build from it). */
const NOW = new Date(2026, 8, 22, 10, 0)

const document = composedLandingSeed("services-emergency", emergencyCatalog.landing)

type PageId = keyof typeof emergencyCatalog.landing.pages
type SeedEntry = { id: string; type: string; variant?: string }

const PAGES: [PageId, () => ReturnType<typeof homeLanding>][] = [
    ["home", () => homeLanding("", NOW)],
    ["services", () => servicesPageLanding("")],
    ["about", () => aboutLanding("")],
    ["request", () => requestLanding("")],
]

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
        // In the pack's own tree (and an unpinned remix's) the seed IS the
        // code, byte for byte.
        if (document.pages === emergencyCatalog.landing.pages) {
            for (const [pageId, build] of PAGES) {
                expect(applySitePageDocument(build(), pageId, document), pageId).toEqual(build())
            }
        }
        // In every tree (a derived template's pin included): each seeded
        // section binds to a real code section — never a placeholder — and
        // the page renders the seed's order and variants over the code's
        // own content, in the seed's register.
        for (const [pageId, build] of PAGES) {
            const code = build()
            const applied = applySitePageDocument(code, pageId, document)
            const seed = (document.pages as Record<string, { sections: SeedEntry[] }>)[pageId].sections
            expect(
                applied.sections.map((section) => section.id),
                pageId,
            ).toEqual(seed.map((entry) => entry.id))
            for (const [index, entry] of seed.entries()) {
                const source = code.sections.find((section) => section.id === entry.id)
                expect(source, `${pageId}: seeded '${entry.id}' must bind to a code section`).toBeDefined()
                expect(source?.type, `${pageId}: '${entry.id}' type`).toBe(entry.type)
                expect(applied.sections[index].variant, `${pageId}: '${entry.id}' variant`).toBe(
                    entry.variant ?? source?.variant,
                )
                expect(applied.sections[index].content, `${pageId}: '${entry.id}' content`).toEqual(
                    source?.content,
                )
            }
            expect(applied.style?.preset, pageId).toBe(document.style.preset)
        }
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
