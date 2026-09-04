import { describe, expect, it, vi } from "vitest"
import communityCatalog from "../../../../../packs/community/catalog.json"

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
import { events, membership } from "../../../src/View/Community/content"
import {
    aboutLanding,
    eventsLanding,
    homeLanding,
    joinLanding,
} from "../../../src/View/Community/communityLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { splitEvents } from "../../../src/View/Landing/events"

/**
 * The community pack's doc-aware pages (CommunityPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). Three invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Computation — the calendar's split and every computed badge derive
 *    from content at the passed moment, never hand-curated.
 * 3. Restraint — dues are flat annual rates (no billing toggle can render)
 *    and Join stays the chrome's one internal CTA.
 */

const document = communityCatalog.landing

// A fixed Thursday between July's porch concert and September's block
// party, so the demo calendar splits both ways.
const NOW = new Date("2026-08-27T10:00:00")

describe("community catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/events": "events",
            "/join": "join",
            "/about": "about",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(eventsLanding("", NOW), "events", document)).toEqual(
            eventsLanding("", NOW),
        )
        expect(applySitePageDocument(joinLanding("", NOW), "join", document)).toEqual(joinLanding("", NOW))
        expect(applySitePageDocument(aboutLanding(""), "about", document)).toEqual(aboutLanding(""))
    })

    it("pins the atelier register as the document style", () => {
        expect(document.style).toEqual({ preset: "atelier" })
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "ledger" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["ledger", "hero"])
    })
})

describe("community computed mechanics", () => {
    it("names the next calendar date on the home hero", () => {
        const hero = homeLanding("", NOW).sections.find((section) => section.id === "hero")
        // Thursday Aug 27: the next date out is September's block party.
        expect((hero?.content as { badge?: string }).badge).toBe(
            "Next up — The Fernhill block party · Saturday, Sep 12",
        )
        // After the year's last event, the badge simply doesn't render.
        const after = homeLanding("", new Date("2027-01-15T10:00:00"))
        expect((after.sections[0].content as { badge?: string }).badge).toBeUndefined()
    })

    it("teases exactly the next three dates on the home page", () => {
        const config = homeLanding("", NOW)
        const split = splitEvents(events, NOW)
        const teaser = (
            config.sections.find((section) => section.id === "calendar")?.content as {
                items: { title: string }[]
            }
        ).items
        expect(teaser.map((item) => item.title)).toEqual(
            split.upcoming.slice(0, 3).map((event) => event.title),
        )
    })

    it("splits the calendar into upcoming and past at render time", () => {
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

    it("badges exactly the soonest upcoming date as next up", () => {
        const config = eventsLanding("", NOW)
        const upcoming = (
            config.sections.find((section) => section.id === "upcoming")?.content as {
                items: { title: string; badge?: { label: string } }[]
            }
        ).items
        expect(upcoming[0].badge).toEqual({ label: "Next up" })
        expect(upcoming.slice(1).every((item) => item.badge === undefined)).toBe(true)
        // The hero names the same day.
        const hero = config.sections.find((section) => section.id === "hero")
        expect((hero?.content as { badge?: string }).badge).toBe("Next up — Saturday, Sep 12")
    })

    it("renders dues as flat annual rates — no billing toggle can appear", () => {
        const dues = joinLanding("", NOW).sections.find((section) => section.id === "dues")
        const content = dues?.content as {
            period?: string
            tiers: { name: string; monthly: number; yearlyPerMonth: number }[]
        }
        expect(content.period).toBe("/yr")
        expect(content.tiers).toHaveLength(membership.tiers.length)
        // The pricing section only shows its monthly/yearly toggle when some
        // tier discounts yearly; flat tiers keep the register quiet.
        for (const tier of content.tiers) {
            expect(tier.yearlyPerMonth, `${tier.name} must stay flat`).toBe(tier.monthly)
        }
    })

    it("keeps Join the chrome's one CTA on every page", () => {
        for (const config of [
            homeLanding("", NOW),
            eventsLanding("", NOW),
            joinLanding("", NOW),
            aboutLanding(""),
        ]) {
            expect(config.shell?.nav?.content.cta).toEqual({ label: "Join", href: "/join" })
        }
        // On the preview route the CTA follows the prefix.
        expect(homeLanding("/community", NOW).shell?.nav?.content.cta).toEqual({
            label: "Join",
            href: "/community/join",
        })
    })
})
