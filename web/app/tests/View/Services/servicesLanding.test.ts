import { describe, expect, it, vi } from "vitest"
import servicesCatalog from "../../../../../packs/services/catalog.json"

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
    homeLanding,
    projectsLanding,
    quoteLanding,
    servicesPageLanding,
} from "../../../src/View/Services/servicesLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import {
    buildLog,
    business,
    home,
    landingCopy,
    nowBuilding,
    species,
    weeklyHours,
} from "../../../src/View/Services/content"
import { composedLandingSeed } from "../../helpers/composedSeed"

/**
 * The services pack's doc-aware pages (ServicesPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). The invariant is fidelity: the catalog's seeded
 * skeletons reproduce each page's code config exactly, so shipping the
 * seed changes nothing visually and the structural editor's first gesture
 * starts from documented truth.
 *
 * The home config is time-dependent (a storefront hero's live "Open now"
 * badge), so the fidelity check pins one instant and builds both sides
 * from it.
 *
 * This suite runs inside every composed tree. A derived template of this
 * pack may pin its own layout (catalog `landing.pages`, merged over the
 * base's by resolveCatalog), so the seed under test is the one THIS tree
 * composes with — the base catalog's in the pack's own tree.
 */

/** A fixed instant for the fidelity checks (both sides build from it). */
const NOW = new Date(2026, 7, 25, 10, 30)

const document = composedLandingSeed("services", servicesCatalog.landing)

type PageId = keyof typeof servicesCatalog.landing.pages
type SeedEntry = { id: string; type: string; variant?: string }

const PAGES: [PageId, () => ReturnType<typeof homeLanding>][] = [
    ["home", () => homeLanding("", NOW)],
    ["projects", () => projectsLanding("")],
    ["services", () => servicesPageLanding("")],
    ["about", () => aboutLanding("")],
    ["quote", () => quoteLanding("")],
]

/** A Date in a fixed reference week (Aug 23–29, 2026 runs Sunday–Saturday). */
function at(day: number, minute: number): Date {
    return new Date(2026, 7, 23 + day, Math.floor(minute / 60), minute % 60)
}

describe("services catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/projects": "projects",
            "/services": "services",
            "/about": "about",
            "/quote": "quote",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        // In the pack's own tree the seed IS the code, byte for byte.
        if (document === servicesCatalog.landing) {
            for (const [pageId, build] of PAGES) {
                expect(applySitePageDocument(build(), pageId, document), pageId).toEqual(build())
            }
        }
        // In every tree (a derived template's pin included): each seeded
        // section binds to a real code section — never a placeholder — and
        // the page renders the seed's order and variants over the code's
        // own content, in the seed's register.
        for (const [pageId, build] of PAGES) {
            const code = build()
            const applied = applySitePageDocument(code, pageId, document)
            const seed = (document.pages as Record<string, { sections: SeedEntry[] }>)[pageId].sections
            expect(
                applied.sections.map((section) => section.id),
                pageId,
            ).toEqual(seed.map((entry) => entry.id))
            for (const [index, entry] of seed.entries()) {
                const source = code.sections.find((section) => section.id === entry.id)
                expect(source, `${pageId}: seeded '${entry.id}' must bind to a code section`).toBeDefined()
                expect(source?.type, `${pageId}: '${entry.id}' type`).toBe(entry.type)
                expect(applied.sections[index].variant, `${pageId}: '${entry.id}' variant`).toBe(
                    entry.variant ?? source?.variant,
                )
                expect(applied.sections[index].content, `${pageId}: '${entry.id}' content`).toEqual(
                    source?.content,
                )
            }
            expect(applied.style?.preset, pageId).toBe(document.style.preset)
        }
    })

    it("reorders a page when the documented skeleton changes", () => {
        // The last section this home builds (the storefront home's and the
        // stack home's differ) moved above the hero.
        const home = homeLanding("", NOW)
        const last = home.sections[home.sections.length - 1].id ?? ""
        const reordered = applySitePageDocument(home, "home", {
            pages: { home: { sections: [{ id: last }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual([last, "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            ...document,
            shell: { nav: { order: { links: ["/about", "/projects", "/services"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            landingCopy.nav.about,
            landingCopy.nav.projects,
            landingCopy.nav.services,
        ])
        // A page with no documented sections still wears the shared order.
        const bare = applySitePageDocument(aboutLanding(""), "about", {
            shell: { nav: { order: { links: ["/services", "/projects"] } } },
        })
        // /about drops out of its own links; the other two follow the order.
        expect(bare.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            landingCopy.nav.services,
            landingCopy.nav.projects,
        ])
    })

    it.runIf(home.hero.storefront)(
        "keeps the live badge current: the home hero recomputes per render",
        () => {
            // The probes derive from the module's posted hours — the module is
            // the remix's after compose, and a remix's week may not cover a
            // pinned weekday (the makeup studio rests Mondays and Tuesdays).
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
        },
    )

    it.runIf(home.hero.storefront)(
        "keeps the two asks wired: quote CTA and click-to-call on the hero",
        () => {
            const hero = homeLanding("", NOW).sections[0].content as {
                primaryCta?: { href: string }
                secondaryCta?: { href: string }
            }
            expect(hero.primaryCta?.href).toBe("/quote")
            expect(hero.secondaryCta?.href).toMatch(/^tel:/)
        },
    )

    it.runIf(!home.hero.storefront && home.hero.caption !== "")(
        "sets the title card: headline, credit, caption, one ask",
        () => {
            const [hero] = homeLanding("", NOW).sections
            expect(hero.variant).toBe("full-bleed-media")
            const content = hero.content as {
                headline: string
                credit?: string
                mediaCaption?: string
                badge?: string
                primaryCta?: { href: string }
                secondaryCta?: unknown
                media?: { src: string }
            }
            expect(content.headline).toBe(home.headline)
            expect(content.credit).toBe(home.hero.credit)
            expect(content.mediaCaption).toBe(home.hero.caption)
            expect(content.media?.src).toBe(home.heroImage.src)
            // No live badge over the photograph, and a single ask: the quote.
            expect(content.badge).toBeUndefined()
            expect(content.secondaryCta).toBeUndefined()
            expect(content.primaryCta?.href).toBe("/quote")
        },
    )

    it("keeps click-to-call one tap away on the quote page", () => {
        const form = quoteLanding("").sections.find((section) => section.id === "quote-form")
        const channels = (form?.content as { channels: { value: string; href?: string }[] }).channels
        const phone = channels.find((channel) => channel.value === business.phone)
        expect(phone?.href).toBe(business.phoneHref)
        expect(phone?.href).toMatch(/^tel:/)
        // Every page's nav ask lands on the quote page.
        for (const [pageId, build] of PAGES) {
            expect(build().shell?.nav?.content.cta?.href, pageId).toBe("/quote")
        }
    })

    it("builds a content-gated section exactly when its list has entries", () => {
        const ids = homeLanding("", NOW).sections.map((section) => section.id)
        expect(ids.includes("now-building")).toBe(nowBuilding.length > 0)
        expect(ids.includes("build-log")).toBe(buildLog.steps.length > 0)
        expect(ids.includes("species")).toBe(species.items.length > 0)
        expect(ids.includes("transformations")).toBe(home.featuredProjects.length > 0)
        expect(ids.includes("proof")).toBe(home.proofMetrics.length > 0)
        const banner = homeLanding("", NOW).sections.find((section) => section.id === "quote-banner")
        expect((banner?.content as { backdrop?: unknown }).backdrop !== undefined).toBe(
            home.bannerImage !== null,
        )
    })

    it("pairs every comparison item on the projects page", () => {
        const gallery = projectsLanding("").sections.find((section) => section.id === "transformations")
        const items = (
            gallery?.content as {
                items: { media: { src: string }; beforeMedia?: { src: string } }[]
            }
        ).items
        expect(items.length).toBeGreaterThan(0)
        for (const item of items) {
            expect(item.beforeMedia?.src, "every comparison needs its before frame").toBeTruthy()
            expect(item.beforeMedia?.src).not.toBe(item.media.src)
        }
    })
})
