import { describe, expect, it, vi } from "vitest"
import reunionCatalog from "../../../../../packs/reunion/catalog.json"

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
import { homeLanding, memoriesLanding, rsvpLanding } from "../../../src/View/Reunion/reunionLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The reunion pack's doc-aware pages (ReunionPage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * The invariant is fidelity: the catalog's seeded skeletons reproduce each
 * page's code config exactly, so shipping the seed changes nothing
 * visually and the structural editor's first gesture starts from
 * documented truth.
 *
 * The home and rsvp configs are time-dependent (the hero countdown, the
 * head-count nudge), so the fidelity checks pin one instant and build both
 * sides from it.
 */

const document = reunionCatalog.landing

/** A fixed "today": August 27, 2026, mid-morning — 351 days out. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("reunion catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/memories": "memories",
            "/rsvp": "rsvp",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(memoriesLanding(""), "memories", document)).toEqual(memoriesLanding(""))
        expect(applySitePageDocument(rsvpLanding("", NOW), "rsvp", document)).toEqual(rsvpLanding("", NOW))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "weekend" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["weekend", "hero"])
    })

    it("keeps the countdown computed: the hero badge recomputes per render", () => {
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        expect(badgeOf(homeLanding("", NOW))).toBe("351 days till the lake")
        expect(badgeOf(homeLanding("", new Date(2027, 7, 13, 10, 30)))).toBe("It's reunion weekend")
        // Afterward the site reads as the album, not a negative count.
        expect(badgeOf(homeLanding("", new Date(2027, 7, 20, 10, 30)))).toBe("Until next summer")
    })

    it("closes every page on the head-count ask, nudge included on home", () => {
        const banner = homeLanding("", NOW).sections.find((section) => section.id === "rsvp-banner")
        const content = banner?.content as { body?: string; cta: { href: string } }
        expect(content.cta.href).toBe("/rsvp")
        expect(content.body).toBe("Tell us by July 1, 2027 — 308 days off — so we rent enough tables.")
        // The memory wall closes on the same ask, without the nudge.
        const wallBanner = memoriesLanding("").sections.find((section) => section.id === "rsvp-banner")
        expect((wallBanner?.content as { cta: { href: string } }).cta.href).toBe("/rsvp")
    })

    it("prefixes every internal link on the preview route", () => {
        // On /reunion (another pack active) the same configs must keep all
        // navigation inside the preview subtree.
        const config = homeLanding("/reunion", NOW)
        const hero = config.sections[0].content as {
            primaryCta: { href: string }
            secondaryCta: { href: string }
        }
        expect(hero.primaryCta.href).toBe("/reunion/rsvp")
        expect(hero.secondaryCta.href).toBe("/reunion/memories")
    })
})
