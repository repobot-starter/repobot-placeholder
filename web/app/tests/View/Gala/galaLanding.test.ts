import { describe, expect, it, vi } from "vitest"
import galaCatalog from "../../../../../packs/gala/catalog.json"

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
import { homeLanding, rsvpLanding } from "../../../src/View/Gala/galaLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The gala pack's doc-aware pages (GalaPage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * The invariant is fidelity: the catalog's seeded skeletons reproduce each
 * page's code config exactly, so shipping the seed changes nothing
 * visually and the structural editor's first gesture starts from
 * documented truth.
 *
 * Both configs are time-dependent (the hero countdown, the reply-by
 * nudge), so the fidelity checks pin one instant and build both sides
 * from it.
 */

const document = galaCatalog.landing

/** A fixed "today": August 27, 2026, mid-morning — 126 days out. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("gala catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/rsvp": "rsvp",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(rsvpLanding("", NOW), "rsvp", document)).toEqual(rsvpLanding("", NOW))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "program" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["program", "hero"])
    })

    it("keeps the countdown computed: the hero badge recomputes per render", () => {
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        expect(badgeOf(homeLanding("", NOW))).toBe("126 days to go")
        expect(badgeOf(homeLanding("", new Date(2026, 11, 31, 10, 30)))).toBe("Tonight's the night")
        // Afterward the site reads as the keepsake, not a negative count.
        expect(badgeOf(homeLanding("", new Date(2027, 0, 5, 10, 30)))).toBe("What an evening")
    })

    it("closes the evening on the ticket-stub ask, nudge included", () => {
        const banner = homeLanding("", NOW).sections.find((section) => section.id === "rsvp-banner")
        expect(banner?.variant).toBe("ticket")
        const content = banner?.content as { body?: string; cta: { href: string } }
        expect(content.cta.href).toBe("/rsvp")
        expect(content.body).toBe("Kindly reply by December 1, 2026 — 96 days away.")
    })

    it("sends the venue's directions link off-site to a maps app", () => {
        const venueSection = homeLanding("", NOW).sections.find((section) => section.id === "venue")
        const highlights = (venueSection?.content as { highlights: { cta?: { href: string } }[] }).highlights
        expect(highlights[0].cta?.href).toMatch(/^https:\/\/maps\.google\.com/)
    })
})
