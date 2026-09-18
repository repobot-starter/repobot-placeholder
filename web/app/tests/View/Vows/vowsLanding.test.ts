import { describe, expect, it, vi } from "vitest"
import vowsCatalog from "../../../../../packs/vows/catalog.json"

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
    homeLanding,
    partyLanding,
    rsvpLanding,
    scheduleLanding,
    storyLanding,
    travelLanding,
} from "../../../src/View/Vows/vowsLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The vows pack's doc-aware pages (VowsPage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * The invariant is fidelity: the catalog's seeded skeletons reproduce each
 * page's code config exactly, so shipping the seed changes nothing
 * visually and the structural editor's first gesture starts from
 * documented truth.
 *
 * The home and rsvp configs are time-dependent (the hero countdown, the
 * reply-by nudge), so the fidelity checks pin one instant and build both
 * sides from it.
 */

const document = vowsCatalog.landing

/** A fixed "today": August 27, 2026, mid-morning — 289 days out. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("vows catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/story": "story",
            "/schedule": "schedule",
            "/travel": "travel",
            "/party": "party",
            "/rsvp": "rsvp",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(storyLanding(""), "story", document)).toEqual(storyLanding(""))
        expect(applySitePageDocument(scheduleLanding(""), "schedule", document)).toEqual(scheduleLanding(""))
        expect(applySitePageDocument(travelLanding(""), "travel", document)).toEqual(travelLanding(""))
        expect(applySitePageDocument(partyLanding(""), "party", document)).toEqual(partyLanding(""))
        expect(applySitePageDocument(rsvpLanding("", NOW), "rsvp", document)).toEqual(rsvpLanding("", NOW))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "gallery" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["gallery", "hero"])
    })

    it("keeps the countdown computed: the hero badge recomputes per render", () => {
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        // At the pinned instant the wedding is months out…
        expect(badgeOf(homeLanding("", NOW))).toBe("289 days to go")
        // …on the day the badge flips…
        expect(badgeOf(homeLanding("", new Date(2027, 5, 12, 10, 30)))).toBe("Today's the day")
        // …and afterward the site reads as the keepsake, not a negative count.
        expect(badgeOf(homeLanding("", new Date(2027, 6, 1, 10, 30)))).toBe("Just married")
    })

    it("keeps the reply nudge counting toward the reply-by date", () => {
        const heroOf = (now: Date): { subheadline?: string } =>
            rsvpLanding("", now).sections[0].content as { subheadline?: string }
        expect(heroOf(NOW).subheadline).toBe("Please reply by May 1, 2027 — 247 days away.")
        expect(heroOf(new Date(2027, 4, 3, 9, 0)).subheadline).toBe(
            "The reply-by date (May 1, 2027) has passed — send your reply and we'll do our best.",
        )
    })

    it("keeps the one ask wired: RSVP leads the hero and closes every page", () => {
        const hero = homeLanding("", NOW).sections[0].content as {
            primaryCta?: { href: string }
        }
        expect(hero.primaryCta?.href).toBe("/rsvp")
        for (const [name, config] of [
            ["home", homeLanding("", NOW)],
            ["story", storyLanding("")],
            ["schedule", scheduleLanding("")],
            ["travel", travelLanding("")],
            ["party", partyLanding("")],
        ] as const) {
            const banner = config.sections.find((section) => section.id === "rsvp-banner")
            expect(banner, `${name} closes on the RSVP banner`).toBeDefined()
            expect((banner?.content as { cta: { href: string } }).cta.href).toBe("/rsvp")
        }
    })

    it("sends every venue's directions link off-site to a maps app", () => {
        const venues = scheduleLanding("").sections.find((section) => section.id === "venues")
        const highlights = (venues?.content as { highlights: { cta?: { href: string } }[] }).highlights
        for (const highlight of highlights) {
            expect(highlight.cta?.href).toMatch(/^https:\/\/maps\.google\.com/)
        }
    })
})
