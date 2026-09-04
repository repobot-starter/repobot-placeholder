import { describe, expect, it, vi } from "vitest"
import trainerCatalog from "../../../../../packs/fitness-trainer/catalog.json"

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
    applyLanding,
    homeLanding,
    programsLanding,
    resultsLanding,
} from "../../../src/View/FitnessTrainer/trainerLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The trainer pack's doc-aware pages (TrainerPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). The invariant is fidelity: the catalog's seeded
 * skeletons reproduce each page's code config exactly, so shipping the
 * seed changes nothing visually and the structural editor's first gesture
 * starts from documented truth.
 *
 * Home is time-dependent (the live badge, the today row, the now/next
 * chips), so the fidelity checks pin one instant and build both sides
 * from it.
 */

const document = trainerCatalog.landing

/** A fixed "today": Thursday August 27, 2026, 7:30 AM — inside the
 * morning 1:1 window. */
const NOW = new Date(2026, 7, 27, 7, 30)

describe("fitness-trainer catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/programs": "programs",
            "/results": "results",
            "/apply": "apply",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(programsLanding(""), "programs", document)).toEqual(programsLanding(""))
        expect(applySitePageDocument(resultsLanding(""), "results", document)).toEqual(resultsLanding(""))
        expect(applySitePageDocument(applyLanding(""), "apply", document)).toEqual(applyLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "week" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["week", "hero"])
    })

    it("computes the live badge from the clock, in the trainer's own noun", () => {
        // Thursday 7:30 AM: inside the morning 1:1 window — in session.
        const home = homeLanding("", NOW)
        const hero = home.sections[0].content as { badge?: string }
        expect(hero.badge).toBe("In session — 1:1 blocks until 9 AM")
        const week = home.sections.find((section) => section.id === "week")
        expect((week?.content as { badge?: string }).badge).toBe(hero.badge)
        // Thursday 10 AM: between blocks — the badge points forward, and
        // says "session", never "class": this is one coach's book.
        const between = homeLanding("", new Date(2026, 7, 27, 10, 0))
        expect((between.sections[0].content as { badge?: string }).badge).toBe(
            "Next session: Small group · Today 12 PM",
        )
    })

    it("marks today's row and exactly one live block in the week", () => {
        const week = homeLanding("", NOW).sections.find((section) => section.id === "week")
        const days = (
            week?.content as {
                days: { label: string; today?: boolean; sessions: { state?: string }[] }[]
            }
        ).days
        // Recovery is programmed: Wednesdays and Sundays never render.
        expect(days.map((day) => day.label)).toEqual(["Monday", "Tuesday", "Thursday", "Friday", "Saturday"])
        expect(days.filter((day) => day.today === true).map((day) => day.label)).toEqual(["Thursday"])
        const marked = days.flatMap((day) => day.sessions.filter((session) => session.state !== undefined))
        expect(marked).toHaveLength(1)
        expect(marked[0]?.state).toBe("now")
    })

    it("keeps the consult ask wired on every page that makes it", () => {
        const heroCtas = homeLanding("", NOW).sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(heroCtas.primaryCta?.href).toBe("/apply")
        expect(heroCtas.secondaryCta?.href).toBe("/programs")
        for (const config of [homeLanding("", NOW), programsLanding(""), resultsLanding("")]) {
            const banner = config.sections.find((section) => section.type === "cta-banner")
            expect((banner?.content as { cta: { href: string } }).cta.href).toBe("/apply")
        }
        // The preview wiring prefixes every internal link.
        const previewHero = homeLanding("/trainer", NOW).sections[0].content as {
            primaryCta?: { href: string }
        }
        expect(previewHero.primaryCta?.href).toBe("/trainer/apply")
    })

    it("wears the monolith register everywhere", () => {
        for (const config of [
            homeLanding("", NOW),
            programsLanding(""),
            resultsLanding(""),
            applyLanding(""),
        ]) {
            expect(config.style.preset).toBe("monolith")
            // Monolith keeps the kernel's default translucent band — no
            // variant override.
            expect(config.shell?.nav?.variant).toBeUndefined()
        }
    })
})
