import { describe, expect, it, vi } from "vitest"
import careCatalog from "../../../../../packs/care/catalog.json"
import type { LandingConfig } from "@ui"
import * as current from "../../../src/View/Care/content"
import * as therapy from "../../../src/View/Care/therapyRemix.content"
import * as psychology from "../../../src/View/Care/psychologyRemix.content"
import * as dental from "../../../src/View/Care/dentalRemix.content"
import * as direct from "../../../src/View/Care/directRemix.content"
import * as therapyDuet from "../../../src/View/Care/therapyDuetRemix.content"
import * as psychologyStudio from "../../../src/View/Care/psychologyStudioRemix.content"
import * as dentalBright from "../../../src/View/Care/dentalBrightRemix.content"
import * as magnolia from "../../../src/View/Care/magnoliaRemix.content"
import * as opentrail from "../../../src/View/Care/opentrailRemix.content"
import * as kindred from "../../../src/View/Care/kindredRemix.content"
import * as cambridge from "../../../src/View/Care/cambridgeRemix.content"
import * as northlight from "../../../src/View/Care/northlightRemix.content"
import * as oakAdobe from "../../../src/View/Care/oakAdobeRemix.content"
import * as clearwater from "../../../src/View/Care/clearwaterRemix.content"
import * as atwater from "../../../src/View/Care/dentalAtwaterRemix.content"
import * as fernfinch from "../../../src/View/Care/dentalFernfinchRemix.content"
import * as solana from "../../../src/View/Care/obgynSolanaRemix.content"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The care family's content-driven sections, walked for EVERY seed the
 * family ships: the module this tree carries plus each remix seed. The
 * builders read one content module, so each seed is swapped in under it
 * and the home page rebuilt from it — the same swap compose performs.
 *
 * The invariants: an optional section renders exactly when its content is
 * filled (never an empty shell); every hero directory link lands on a
 * doc-aware route or on a section the home page actually renders; the
 * price list is complete line by line; and the booking surface keeps its
 * privacy note.
 */

type Seed = typeof current

const SEEDS: [string, Seed][] = [
    ["content.ts", current],
    ["therapy", therapy],
    ["psychology", psychology],
    ["dental", dental],
    ["direct", direct],
    ["therapy-duet", therapyDuet],
    ["psychology-studio", psychologyStudio],
    ["dental-bright", dentalBright],
    ["primary-magnolia", magnolia],
    ["therapy-opentrail", opentrail],
    ["therapy-kindred", kindred],
    ["psychology-cambridge", cambridge],
    ["psychology-northlight", northlight],
    ["oak-adobe", oakAdobe],
    ["clearwater", clearwater],
    ["dental-atwater", atwater],
    ["dental-fernfinch", fernfinch],
    ["obgyn-solana", solana],
]

const NOW = new Date(2026, 7, 27, 10, 30)

async function homeFor(seed: Seed): Promise<LandingConfig> {
    vi.resetModules()
    vi.doMock("../../../src/View/Care/content", () => seed)
    const { homeLanding } = await import("../../../src/View/Care/careLanding")
    vi.doUnmock("../../../src/View/Care/content")
    return homeLanding("", NOW, seed.codePractice)
}

/** A directory prints the practice's providers; plates and notes print the seed's items. */
function exhibitsFilled(seed: Seed): boolean {
    return seed.exhibits.layout === "directory"
        ? seed.codePractice.providers.length > 0
        : seed.exhibits.items.length > 0
}

describe.each(SEEDS)("care sections from the %s seed", (_label, seed) => {
    // The clinic home's sections; the `stack` home (careStackHome.test.ts) leaves them to the inner pages.
    it.runIf(seed.home.stack === undefined)(
        "renders each optional section exactly when its content is filled",
        async () => {
            const ids = (await homeFor(seed)).sections.map((section) => section.id)
            expect(ids.includes("promises")).toBe(seed.promises.items.length > 0)
            expect(ids.includes("exhibits")).toBe(exhibitsFilled(seed))
            // The module's journey band, or the rail a seed hangs under the hero (both are "journey").
            expect(ids.includes("journey")).toBe(
                seed.journey.steps.length > 0 || (seed.home.journey?.steps.length ?? 0) > 0,
            )
            expect(ids.includes("services")).toBe(
                seed.promises.items.length === 0 && !exhibitsFilled(seed) && seed.journey.steps.length === 0,
            )
            expect(ids.includes("menu")).toBe(seed.menu.groups.length > 0)
            expect(ids.includes("spotlight")).toBe(seed.spotlight !== null && seed.spotlight.headline !== "")
            expect(ids.includes("faq")).toBe(seed.faq.items.length > 0)
            expect(ids[0]).toBe("hero")
            expect(ids[ids.length - 1]).toBe("book-banner")
        },
    )

    it("points every hero directory link at a route or a rendered section", async () => {
        const home = await homeFor(seed)
        const routes = Object.keys(careCatalog.landing.routes)
        const renderedTypes = new Set(home.sections.map((section) => section.type))
        for (const item of seed.home.directory?.items ?? []) {
            if (item.path === undefined) continue
            if (item.path.startsWith("#")) {
                expect(renderedTypes.has(item.path.slice(1) as never), `${item.label} → ${item.path}`).toBe(
                    true,
                )
            } else {
                expect(routes, `${item.label} → ${item.path}`).toContain(item.path)
            }
        }
        const hero = home.sections[0].content as { headline: string; aside?: { items: unknown[] } }
        expect(hero.headline).toBe(seed.home.headline)
        expect(hero.aside?.items.length ?? 0).toBe(seed.home.directory?.items.length ?? 0)
    })

    // The clinic home only; the `stack` home builds its own hero and drops the team band.
    it.runIf(seed.home.stack === undefined)(
        "sets the hero and the journey on the variants the seed asks for",
        async () => {
            const home = await homeFor(seed)
            expect(home.sections[0].variant).toBe(
                seed.home.layout === "full-bleed" ? "full-bleed-media" : "split-media",
            )
            const journey = home.sections.find((section) => section.id === "journey")
            if (journey !== undefined && seed.journey.steps.length === 0) {
                // No module journey: the section is the rail under the hero.
                expect(journey.variant).toBe("horizontal-rail")
                expect((journey.content as { steps: unknown[] }).steps.length).toBe(
                    seed.home.journey?.steps.length,
                )
            } else if (journey !== undefined) {
                const layout = seed.journey.layout ?? "timeline"
                expect(journey.variant).toBe(
                    { timeline: "timeline", rail: "horizontal-rail", cards: "numbered-cards" }[layout],
                )
                const steps = (journey.content as { steps: { media?: unknown }[] }).steps
                expect(steps.length).toBe(seed.journey.steps.length)
                steps.forEach((step, index) => {
                    expect(step.media !== undefined).toBe(seed.journey.steps[index].image !== undefined)
                })
            }
        },
    )

    it("prints the exhibits as plates, bylined notes, or a directory, as the seed asks", async () => {
        const exhibitsSection = (await homeFor(seed)).sections.find((section) => section.id === "exhibits")
        if (exhibitsSection === undefined) return
        const notes = seed.exhibits.layout === "notes"
        const directory = seed.exhibits.layout === "directory"
        expect(exhibitsSection.variant).toBe(notes ? "stories" : directory ? "filterable-grid" : "card-grid")
        const items = (
            exhibitsSection.content as {
                items: {
                    title: string
                    description: string
                    meta?: string
                    eyebrow?: string
                    tags?: string[]
                }[]
            }
        ).items
        if (directory) {
            // One card per resolved provider: name, role line, and tags
            // from the practice content, the blurb from the seed's extras.
            expect(seed.exhibits.items).toEqual([])
            const providers = seed.codePractice.providers
            expect(items.map((item) => item.title)).toEqual(providers.map((provider) => provider.name))
            items.forEach((item, index) => {
                const provider = providers[index]
                expect(item.eyebrow).toBe(
                    [provider.credentials, provider.role]
                        .filter((part) => part !== undefined && part !== "")
                        .join(" · "),
                )
                expect(item.tags, provider.name).toEqual(
                    (provider.tags ?? "")
                        .split("·")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag !== ""),
                )
                expect(item.tags?.length, `${provider.name} tags`).toBeGreaterThan(0)
                const extra = seed.exhibits.extras.find((entry) => entry.providerId === provider.providerId)
                expect(item.description, `${provider.name} blurb`).toBe(extra?.description)
            })
            return
        }
        items.forEach((item, index) => {
            const source = seed.exhibits.items[index]
            // A plate's eyebrow is its meta; an empty meta drops it.
            expect(notes ? item.meta : item.eyebrow).toBe(
                notes || source.meta !== "" ? source.meta : undefined,
            )
            expect(item.tags).toBeUndefined()
        })
    })

    // The clinic home only; the `stack` home builds its own hero and drops the team band.
    it.runIf(seed.home.stack === undefined)(
        "drops the home portraits band only for a directory of the practice's people",
        async () => {
            const ids = (await homeFor(seed)).sections.map((section) => section.id)
            const directory = seed.exhibits.layout === "directory" && seed.codePractice.providers.length > 0
            expect(ids.includes("providers")).toBe(!directory)
        },
    )

    it("prints a filled report ahead of the journey, and the photograph spotlight otherwise", async () => {
        const home = await homeFor(seed)
        const ids = home.sections.map((section) => section.id)
        const spotlight = home.sections.find((section) => section.id === "spotlight")
        if (spotlight === undefined) return
        const report = seed.spotlight?.report
        const filled = report !== undefined && report.title !== ""
        expect(spotlight.variant).toBe(filled ? "report" : "media-right")
        const content = spotlight.content as { report?: { title: string; rows: unknown[] }; media?: unknown }
        expect(content.report?.title).toBe(filled ? report.title : undefined)
        expect(content.report?.rows.length ?? 0).toBe(filled ? report.rows.length : 0)
        expect(content.media !== undefined).toBe(!filled)
        if (filled && ids.includes("journey")) {
            expect(ids.indexOf("spotlight")).toBeLessThan(ids.indexOf("journey"))
        }
    })

    it("keeps the price list complete line by line", () => {
        for (const group of seed.menu.groups) {
            expect(group.heading, "group heading").not.toBe("")
            expect(group.items.length, `${group.heading} lines`).toBeGreaterThan(0)
            for (const item of group.items) {
                expect(item.name, `${group.heading} line name`).not.toBe("")
                expect(item.price, `${item.name} price`).not.toBe("")
            }
        }
    })

    it("keeps a privacy note on the booking surface", () => {
        expect(seed.booking.privacyNote.trim()).not.toBe("")
    })
})
