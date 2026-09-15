import { describe, expect, it, vi } from "vitest"
import yogaCatalog from "../../../../../packs/fitness-yoga/catalog.json"

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
    beginLanding,
    homeLanding,
    pricingLanding,
    scheduleLanding,
    teachersLanding,
} from "../../../src/View/FitnessYoga/yogaLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The yoga & pilates pack's doc-aware pages (YogaPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). The invariant is fidelity: the catalog's seeded
 * skeletons reproduce each page's code config exactly, so shipping the
 * seed changes nothing visually and the structural editor's first gesture
 * starts from documented truth.
 *
 * Home and schedule are time-dependent (the live badge, the today column,
 * the now/next chips), so the fidelity checks pin one instant and build
 * both sides from it.
 */

const document = yogaCatalog.landing

/** A fixed "today": Thursday August 27, 2026, mid-morning — during the
 * 9:30 prenatal hour. */
const NOW = new Date(2026, 7, 27, 9, 45)

describe("fitness-yoga catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/schedule": "schedule",
            "/teachers": "teachers",
            "/pricing": "pricing",
            "/begin": "begin",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(scheduleLanding("", NOW), "schedule", document)).toEqual(
            scheduleLanding("", NOW),
        )
        expect(applySitePageDocument(teachersLanding(""), "teachers", document)).toEqual(teachersLanding(""))
        expect(applySitePageDocument(pricingLanding(""), "pricing", document)).toEqual(pricingLanding(""))
        expect(applySitePageDocument(beginLanding(""), "begin", document)).toEqual(beginLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "schedule" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["schedule", "hero"])
    })

    it("computes the live badge from the clock, in the hero and the grid", () => {
        // Thursday 9:45 AM: mid-Prenatal — the badge reads in-session.
        const home = homeLanding("", NOW)
        const hero = home.sections[0].content as { badge?: string }
        expect(hero.badge).toBe("In session — Prenatal until 10:30 AM")
        const grid = home.sections.find((section) => section.id === "schedule")
        expect((grid?.content as { badge?: string }).badge).toBe(hero.badge)
        // Thursday 11 AM: between classes — the badge points forward.
        const between = homeLanding("", new Date(2026, 7, 27, 11, 0))
        expect((between.sections[0].content as { badge?: string }).badge).toBe(
            "Next class: Vinyasa II · Today 5:30 PM",
        )
    })

    it("marks today's column and exactly one live session in the grid", () => {
        const grid = scheduleLanding("", NOW).sections.find((section) => section.id === "schedule")
        const days = (
            grid?.content as {
                days: { label: string; today?: boolean; sessions: { state?: string }[] }[]
            }
        ).days
        // Practice runs daily, so the grid renders all seven columns.
        expect(days).toHaveLength(7)
        expect(days.filter((day) => day.today === true).map((day) => day.label)).toEqual(["Thursday"])
        const marked = days.flatMap((day) => day.sessions.filter((session) => session.state !== undefined))
        expect(marked).toHaveLength(1)
        expect(marked[0]?.state).toBe("now")
    })

    it("keeps the introduction ask wired on every page that makes it", () => {
        const heroCtas = homeLanding("", NOW).sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(heroCtas.primaryCta?.href).toBe("/begin")
        expect(heroCtas.secondaryCta?.href).toBe("/schedule")
        for (const config of [homeLanding("", NOW), pricingLanding("")]) {
            const banner = config.sections.find((section) => section.type === "cta-banner")
            expect((banner?.content as { cta: { href: string } }).cta.href).toBe("/begin")
        }
        // The preview wiring prefixes every internal link.
        const previewHero = homeLanding("/yoga", NOW).sections[0].content as {
            primaryCta?: { href: string }
        }
        expect(previewHero.primaryCta?.href).toBe("/yoga/begin")
    })

    it("wears the atelier register everywhere", () => {
        for (const config of [
            homeLanding("", NOW),
            scheduleLanding("", NOW),
            teachersLanding(""),
            pricingLanding(""),
            beginLanding(""),
        ]) {
            expect(config.style.preset).toBe("atelier")
            expect(config.shell?.nav?.variant).toBe("burger-overlay")
        }
    })
})
