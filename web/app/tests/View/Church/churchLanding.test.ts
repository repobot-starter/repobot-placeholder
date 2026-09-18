import { describe, expect, it, vi } from "vitest"
import churchCatalog from "../../../../../packs/church/catalog.json"

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
import { church, events } from "../../../src/View/Church/content"
import {
    eventsLanding,
    homeLanding,
    ministriesLanding,
    sermonsLanding,
    visitLanding,
} from "../../../src/View/Church/churchLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { splitEvents } from "../../../src/View/Landing/events"

/**
 * The church pack's doc-aware pages (ChurchPage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * Three invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Computation — the next-service badge and the events split are derived
 *    from content at the passed moment, never hand-curated.
 * 3. Restraint — Give stays an external link; no route ever points at it.
 */

const document = churchCatalog.landing

// A fixed Thursday morning between the pancake breakfast (Aug 8) and the
// fall kickoff (Sep 12), so the demo calendar splits both ways.
const NOW = new Date("2026-08-27T10:00:00")

describe("church catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/visit": "visit",
            "/ministries": "ministries",
            "/sermons": "sermons",
            "/events": "events",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(visitLanding("", NOW), "visit", document)).toEqual(visitLanding("", NOW))
        expect(applySitePageDocument(ministriesLanding(""), "ministries", document)).toEqual(
            ministriesLanding(""),
        )
        expect(applySitePageDocument(sermonsLanding(""), "sermons", document)).toEqual(sermonsLanding(""))
        expect(applySitePageDocument(eventsLanding("", NOW), "events", document)).toEqual(
            eventsLanding("", NOW),
        )
    })

    it("pins the hymnal register as the document style", () => {
        expect(document.style).toEqual({ preset: "hymnal" })
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "services" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["services", "hero"])
    })
})

describe("church computed mechanics", () => {
    it("wears the computed next-service badge on the hero", () => {
        // Thursday 10 AM: the next service is Sunday's 9 AM gathering.
        const hero = homeLanding("", NOW).sections.find((section) => section.id === "hero")
        expect((hero?.content as { badge?: string }).badge).toBe("Next service — Sunday 9 AM")
        // Saturday 8 PM reads "tomorrow"; Sunday 10 AM reads "today 11 AM".
        const saturday = homeLanding("", new Date("2026-08-29T20:00:00"))
        expect((saturday.sections[0].content as { badge?: string }).badge).toBe(
            "Next service — tomorrow 9 AM",
        )
        const sunday = homeLanding("", new Date("2026-08-30T10:00:00"))
        expect((sunday.sections[0].content as { badge?: string }).badge).toBe("Next service — today 11 AM")
    })

    it("splits events into upcoming and past at render time", () => {
        const config = eventsLanding("", NOW)
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

    it("badges exactly the soonest upcoming event as next up", () => {
        const config = eventsLanding("", NOW)
        const upcoming = (
            config.sections.find((section) => section.id === "upcoming")?.content as {
                items: { title: string; badge?: { label: string } }[]
            }
        ).items
        expect(upcoming[0].badge).toEqual({ label: "Next up" })
        expect(upcoming.slice(1).every((item) => item.badge === undefined)).toBe(true)
        // The hero names the same event.
        const hero = config.sections.find((section) => section.id === "hero")
        expect((hero?.content as { badge?: string }).badge).toBe(`Next up — ${upcoming[0].title}`)
    })

    it("keeps Give an external link in the chrome and the banners", () => {
        const config = homeLanding("", NOW)
        expect(config.shell?.nav?.content.cta).toEqual({ label: "Give", href: church.giveUrl })
        expect(church.giveUrl).toMatch(/^https:\/\//)
        const banner = config.sections.find((section) => section.id === "give-banner")
        expect((banner?.content as { cta: { href?: string } }).cta.href).toBe(church.giveUrl)
    })
})
