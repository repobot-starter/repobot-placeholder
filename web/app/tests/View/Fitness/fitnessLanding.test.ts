import { describe, expect, it, vi } from "vitest"
import fitnessCatalog from "../../../../../packs/fitness/catalog.json"

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
    coachesLanding,
    homeLanding,
    pricingLanding,
    scheduleLanding,
    trialLanding,
} from "../../../src/View/Fitness/fitnessLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The fitness pack's doc-aware pages (FitnessPage routes each page's
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

const document = fitnessCatalog.landing

/** A fixed "today": Thursday August 27, 2026, mid-morning. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("fitness catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/schedule": "schedule",
            "/coaches": "coaches",
            "/pricing": "pricing",
            "/trial": "trial",
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
        expect(applySitePageDocument(coachesLanding(""), "coaches", document)).toEqual(coachesLanding(""))
        expect(applySitePageDocument(pricingLanding(""), "pricing", document)).toEqual(pricingLanding(""))
        expect(applySitePageDocument(trialLanding(""), "trial", document)).toEqual(trialLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "schedule" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["schedule", "hero"])
    })

    it("computes the live badge from the clock, in the hero and the grid", () => {
        // Thursday 10:30 AM: between the dawn class and the 5:30 Olympic
        // hour — the badge points forward, same string in both places.
        const home = homeLanding("", NOW)
        const hero = home.sections[0].content as { badge?: string }
        expect(hero.badge).toBe("Next class: Olympic Lifting · Today 5:30 PM")
        const grid = home.sections.find((section) => section.id === "schedule")
        expect((grid?.content as { badge?: string }).badge).toBe(hero.badge)
        // Thursday 6:15 AM: mid-Conditioning — the badge flips to running.
        const during = homeLanding("", new Date(2026, 7, 27, 6, 15))
        expect((during.sections[0].content as { badge?: string }).badge).toBe(
            "In session — Conditioning until 7 AM",
        )
    })

    it("marks today's column and exactly one live session in the grid", () => {
        const grid = scheduleLanding("", NOW).sections.find((section) => section.id === "schedule")
        const days = (
            grid?.content as { days: { label: string; today?: boolean; sessions: { state?: string }[] }[] }
        ).days
        expect(days.filter((day) => day.today === true).map((day) => day.label)).toEqual(["Thursday"])
        const marked = days.flatMap((day) => day.sessions.filter((session) => session.state !== undefined))
        expect(marked).toHaveLength(1)
        expect(marked[0]?.state).toBe("next")
    })

    it("keeps the free-week ask wired on every page that makes it", () => {
        const heroCtas = homeLanding("", NOW).sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(heroCtas.primaryCta?.href).toBe("/trial")
        expect(heroCtas.secondaryCta?.href).toBe("/schedule")
        for (const config of [homeLanding("", NOW), pricingLanding("")]) {
            const banner = config.sections.find((section) => section.type === "cta-banner")
            expect((banner?.content as { cta: { href: string } }).cta.href).toBe("/trial")
        }
        // The preview wiring prefixes every internal link.
        const previewHero = homeLanding("/fitness", NOW).sections[0].content as {
            primaryCta?: { href: string }
        }
        expect(previewHero.primaryCta?.href).toBe("/fitness/trial")
    })

    it("wears the chalk register everywhere", () => {
        for (const config of [
            homeLanding("", NOW),
            scheduleLanding("", NOW),
            coachesLanding(""),
            pricingLanding(""),
            trialLanding(""),
        ]) {
            expect(config.style.preset).toBe("chalk")
            expect(config.shell?.nav?.variant).toBe("pill-links")
        }
    })
})
