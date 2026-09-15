import { describe, expect, it, vi } from "vitest"
import nonprofitCatalog from "../../../../../packs/nonprofit/catalog.json"

// The shared shell appends the project manifest's marketing pages to every
// nav ("adding a page rewires every nav"). These tests assert the pack's OWN
// chrome, but the ambient manifest differs per composed tree — so pin the
// manifest empty and make the assertions about the pack, not about which
// tree they shipped in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { events, org } from "../../../src/View/Nonprofit/content"
import {
    homeLanding,
    impactLanding,
    programsLanding,
    volunteerLanding,
} from "../../../src/View/Nonprofit/nonprofitLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { splitEvents } from "../../../src/View/Landing/events"

/**
 * The nonprofit pack's doc-aware pages (NonprofitPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). Three invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Computation — the volunteer calendar's split and both computed badges
 *    derive from content at the passed moment, never hand-curated.
 * 3. Restraint — Donate stays an external link; no route ever points at it.
 */

const document = nonprofitCatalog.landing

// A fixed Thursday between the August garden blitz and September's coastal
// cleanup, so the demo calendar splits both ways.
const NOW = new Date("2026-08-27T10:00:00")

describe("nonprofit catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/programs": "programs",
            "/impact": "impact",
            "/volunteer": "volunteer",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(programsLanding(""), "programs", document)).toEqual(programsLanding(""))
        expect(applySitePageDocument(impactLanding(""), "impact", document)).toEqual(impactLanding(""))
        expect(applySitePageDocument(volunteerLanding("", NOW), "volunteer", document)).toEqual(
            volunteerLanding("", NOW),
        )
    })

    it("pins the monolith register as the document style", () => {
        expect(document.style).toEqual({ preset: "monolith" })
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "numbers" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["numbers", "hero"])
    })
})

describe("nonprofit computed mechanics", () => {
    it("names the next volunteer day on the home hero", () => {
        const hero = homeLanding("", NOW).sections.find((section) => section.id === "hero")
        // Thursday Aug 27: the next day out is September's coastal cleanup.
        expect((hero?.content as { badge?: string }).badge).toBe("Next volunteer day — Saturday, Sep 19")
        // After the year's last event, the badge simply doesn't render.
        const after = homeLanding("", new Date("2027-01-15T10:00:00"))
        expect((after.sections[0].content as { badge?: string }).badge).toBeUndefined()
    })

    it("splits volunteer days into upcoming and past at render time", () => {
        const config = volunteerLanding("", NOW)
        const split = splitEvents(events, NOW)
        const items = (id: string) =>
            (
                config.sections.find((section) => section.id === id)?.content as {
                    items: { title: string }[]
                }
            ).items
        expect(items("upcoming").map((item) => item.title)).toEqual(
            split.upcoming.map((event) => event.title),
        )
        expect(items("past").map((item) => item.title)).toEqual(split.past.map((event) => event.title))
        // The demo calendar exercises both buckets at the pinned moment.
        expect(split.upcoming.length).toBeGreaterThan(0)
        expect(split.past.length).toBeGreaterThan(0)
    })

    it("badges exactly the soonest upcoming day as next up", () => {
        const config = volunteerLanding("", NOW)
        const upcoming = (
            config.sections.find((section) => section.id === "upcoming")?.content as {
                items: { title: string; badge?: { label: string } }[]
            }
        ).items
        expect(upcoming[0].badge).toEqual({ label: "Next up" })
        expect(upcoming.slice(1).every((item) => item.badge === undefined)).toBe(true)
        // The hero names the same day.
        const hero = config.sections.find((section) => section.id === "hero")
        expect((hero?.content as { badge?: string }).badge).toBe(`Next up — ${upcoming[0].title}`)
    })

    it("keeps Donate an external link in the chrome and the plates", () => {
        const config = homeLanding("", NOW)
        expect(config.shell?.nav?.content.cta).toEqual({ label: "Donate", href: org.donateUrl })
        expect(org.donateUrl).toMatch(/^https:\/\//)
        const plate = config.sections.find((section) => section.id === "donate-banner")
        expect((plate?.content as { cta: { href?: string } }).cta.href).toBe(org.donateUrl)
    })
})
