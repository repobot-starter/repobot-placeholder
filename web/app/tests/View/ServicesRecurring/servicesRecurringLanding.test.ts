import { describe, expect, it, vi } from "vitest"
import recurringCatalog from "../../../../../packs/services-recurring/catalog.json"

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
    bookLanding,
    homeLanding,
    plansLanding,
} from "../../../src/View/ServicesRecurring/servicesRecurringLanding"
import type { LandingConfig } from "@ui"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import {
    addOns,
    home,
    roomReady,
    season,
    thread,
    turnover,
    weeklyHours,
} from "../../../src/View/ServicesRecurring/content"
import { composedLandingSeed } from "../../helpers/composedSeed"

/**
 * The recurring-services pack's doc-aware pages (ServicesRecurringPage
 * routes each page's config through `useSitePageConfig`, keyed by the
 * catalog's `landing.routes`). The invariant is fidelity: the catalog's
 * seeded skeletons reproduce each page's code config exactly, so shipping
 * the seed changes nothing visually and the structural editor's first
 * gesture starts from documented truth.
 *
 * The home config is time-dependent (the live "Open now" badge), so the
 * fidelity check pins one instant and builds both sides from it.
 *
 * The document is the one THIS tree composes: a restyled remix
 * (services-recurring-turnover, services-lawncare-crew,
 * services-pest-creature) pins its own register and pages, and the
 * builders — running on that remix's content seed — must reproduce those
 * instead.
 */

const document = composedLandingSeed("services-recurring", recurringCatalog.landing)

/** The code config wearing the document's register — the one field a pinned remix re-values. */
function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

/** A fixed instant for the fidelity checks (both sides build from it). */
const NOW = new Date(2026, 7, 25, 10, 30)

/** A Date in a fixed reference week (Aug 23–29, 2026 runs Sunday–Saturday). */
function at(day: number, minute: number): Date {
    return new Date(2026, 7, 23 + day, Math.floor(minute / 60), minute % 60)
}

describe("services-recurring catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/plans": "plans",
            "/about": "about",
            "/book": "book",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        const pages: [string, LandingConfig][] = [
            ["home", homeLanding("", NOW)],
            ["plans", plansLanding("")],
            ["about", aboutLanding("")],
            ["book", bookLanding("")],
        ]
        for (const [pageId, config] of pages) {
            expect(applySitePageDocument(config, pageId, document), pageId).toEqual(
                inDocumentRegister(config),
            )
        }
    })

    it("pins the code to the base catalog's register", () => {
        // The builders' preset is the base's (PACK_REGISTERS, generated
        // from this catalog); only a remix's document re-registers it.
        expect(recurringCatalog.landing.style).toEqual({ preset: "warm-boutique" })
        for (const config of [homeLanding("", NOW), plansLanding(""), aboutLanding(""), bookLanding("")]) {
            expect(config.style?.preset).toBe("warm-boutique")
        }
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "plans" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["plans", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            ...document,
            shell: { nav: { order: { links: ["/about", "/plans"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "About",
            "Plans & pricing",
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/plans"] } } },
        })
        // /about drops out of its own links; the other one follows.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual(["Plans & pricing"])
    })

    it.runIf(home.badge !== "")("shows the seed's own hero badge when it sets one", () => {
        const hero = homeLanding("", NOW).sections[0].content as { badge?: string }
        expect(hero.badge).toBe(home.badge)
    })

    it.runIf(home.badge === "")("keeps the live badge current: the home hero recomputes per render", () => {
        // The probes derive from the module's posted hours — the module is
        // the remix's after compose, and a remix's week may not cover a
        // pinned weekday.
        const [first] = weeklyHours
        const restDay = [0, 1, 2, 3, 4, 5, 6].find(
            (day) => !weeklyHours.some((hours) => hours.day === day && hours.intervals.length > 0),
        )
        expect(restDay).toBeDefined()
        if (restDay === undefined) return
        const openMoment = homeLanding("", at(first.day, first.intervals[0][0] + 1))
        const closedMoment = homeLanding("", at(restDay, 10 * 60 + 30))
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        expect(badgeOf(openMoment)).toMatch(/^Open/)
        expect(badgeOf(closedMoment)).toMatch(/^Closed/)
    })

    it("sells the rhythm up front: pricing tiers live on the home page", () => {
        // The recurring shape's signature — a subscription doesn't hide its
        // plans behind a link.
        const home = homeLanding("", NOW)
        const pricing = home.sections.find((section) => section.type === "pricing")
        expect(pricing, "home page carries the pricing section").toBeTruthy()
        const tiers = (pricing?.content as { tiers: { monthly: number; yearlyPerMonth: number }[] }).tiers
        expect(tiers.length).toBeGreaterThanOrEqual(2)
        // Per-visit prices: both toggle sides equal, so no monthly/yearly
        // toggle renders and the period suffix stays honest.
        for (const tier of tiers) {
            expect(tier.monthly).toBe(tier.yearlyPerMonth)
        }
    })

    it("squares the plans-page comparison to the tiers", () => {
        const plansPage = plansLanding("")
        const pricing = plansPage.sections.find((section) => section.type === "pricing")
        const comparison = plansPage.sections.find((section) => section.type === "comparison")
        const tiers = (pricing?.content as { tiers: { name: string }[] }).tiers
        const columns = (comparison?.content as { columns: string[] }).columns
        // The comparison's plan columns are exactly the tiers, in order.
        expect(columns.slice(1)).toEqual(tiers.map((tier) => tier.name))
    })

    it("renders each optional home section exactly when its content is filled", () => {
        const ids = homeLanding("", NOW).sections.map((section) => section.id)
        expect(ids.includes("turnover"), "turnover rail").toBe(turnover.steps.length > 0)
        expect(ids.includes("checklist"), "door-hanger checklist").toBe(roomReady.items.length > 0)
        expect(ids.includes("thread"), "house-manager thread").toBe(thread.messages.length > 0)
        expect(ids.includes("season"), "season calendar").toBe(season.windows.length > 0)
        // The order is fixed; the seed only chooses which sections exist.
        const order = [
            "hero",
            "thread",
            "season",
            "proof",
            "included",
            "specimens",
            "plans",
            "turnover",
            "checklist",
            "standard",
            "kind-words",
            "service-area",
            "book-banner",
        ]
        expect(ids).toEqual(order.filter((id) => ids.includes(id)))
        expect(plansLanding("").sections.some((section) => section.id === "add-ons")).toBe(addOns.length > 0)
    })

    it.runIf(turnover.steps.length > 0)(
        "hangs turnover day on the rail: clock times and a photo per step",
        () => {
            const rail = homeLanding("", NOW).sections.find((section) => section.id === "turnover")
            expect(rail?.type).toBe("steps")
            expect(rail?.variant).toBe("horizontal-rail")
            const steps = (rail?.content as { steps: { label?: string; media?: unknown }[] }).steps
            expect(steps.map((step) => step.label)).toEqual(turnover.steps.map((step) => step.time))
            for (const step of steps) expect(step.media).toBeDefined()
        },
    )
})
