import type { LandingConfig } from "@ui"
import { afterEach, describe, expect, it, vi } from "vitest"
import servicesCatalog from "../../../../../packs/services/catalog.json"
import hallockCatalog from "../../../../../packs/services-contractor-hallock/catalog.json"
import marenCatalog from "../../../../../packs/services-hair-maren/catalog.json"
import sableCatalog from "../../../../../packs/services-hair-sable/catalog.json"
import meridianCatalog from "../../../../../packs/services-contractor-meridian/catalog.json"
import noorCatalog from "../../../../../packs/services-makeup-noor/catalog.json"
import tidewaterCatalog from "../../../../../packs/services-makeup-tidewater/catalog.json"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The services remixes on the kernel's newer content slots pin their own
 * registers and page skeletons while the base pack's builders emit the
 * sections from the remix's seed. Every pinned entry must bind a real code
 * section built from that seed — an unbound entry would render the
 * builder's placeholder copy on a live template.
 */

type Builders = typeof import("../../../src/View/Services/servicesLanding")

/** A weekday morning, inside every seed's posted hours. */
const NOW = new Date(2026, 7, 25, 10, 30)

async function buildersWithSeed(seed: () => Promise<unknown>): Promise<Builders> {
    vi.resetModules()
    vi.doMock("../../../src/View/Services/content", seed)
    return import("../../../src/View/Services/servicesLanding")
}

interface PinnedCatalog {
    landing: {
        style: { preset: string }
        pages: Record<string, { sections: { id: string; type: string; variant?: string }[] }>
    }
}

const remixes: { name: string; seed: () => Promise<unknown>; catalog: PinnedCatalog; preset: string }[] = [
    {
        name: "makeup-tidewater",
        seed: () => import("../../../src/View/Services/tidewaterRemix.content"),
        catalog: tidewaterCatalog,
        preset: "daybook",
    },
    {
        name: "makeup-noor",
        seed: () => import("../../../src/View/Services/noorRemix.content"),
        catalog: noorCatalog,
        preset: "jharokha",
    },
    {
        name: "contractor-meridian",
        seed: () => import("../../../src/View/Services/meridianRemix.content"),
        catalog: meridianCatalog,
        preset: "horizon",
    },
    {
        name: "contractor-hallock",
        seed: () => import("../../../src/View/Services/hallockRemix.content"),
        catalog: hallockCatalog,
        preset: "shingle",
    },
    {
        name: "hair-maren",
        seed: () => import("../../../src/View/Services/marenRemix.content"),
        catalog: marenCatalog,
        preset: "limestone",
    },
    {
        name: "hair-sable",
        seed: () => import("../../../src/View/Services/sableRemix.content"),
        catalog: sableCatalog,
        preset: "cognac",
    },
]

afterEach(() => {
    vi.doUnmock("../../../src/View/Services/content")
})

function pagesFrom(builders: Builders): Record<string, LandingConfig> {
    return {
        home: builders.homeLanding("", NOW),
        projects: builders.projectsLanding(""),
        services: builders.servicesPageLanding(""),
        about: builders.aboutLanding(""),
        quote: builders.quoteLanding(""),
    }
}

describe.each(remixes)("services-$name landing pin", ({ seed, catalog, preset }) => {
    // resolveCatalog (scripts/lib/pack-switch.mjs): the remix's landing
    // shallow-merges over the base's, so routes stay the base pack's.
    const document = { ...servicesCatalog.landing, ...catalog.landing }

    it("pins its register over the base pack's routes", () => {
        expect(catalog.landing.style.preset).toBe(preset)
        expect(document.routes).toEqual(servicesCatalog.landing.routes)
    })

    it("binds every pinned section to real seed content on every page", async () => {
        const pages = pagesFrom(await buildersWithSeed(seed))
        for (const [pageId, code] of Object.entries(pages)) {
            const pinned = catalog.landing.pages[pageId].sections
            const applied = applySitePageDocument(code, pageId, document)
            expect(
                applied.sections.map((section) => section.id),
                pageId,
            ).toEqual(pinned.map((entry) => entry.id))
            for (const entry of pinned) {
                const fromCode = code.sections.find((section) => section.id === entry.id)
                expect(fromCode, `${pageId}/${entry.id} must come from the builders`).toBeDefined()
                expect(fromCode?.type, `${pageId}/${entry.id} type`).toBe(entry.type)
                const rendered = applied.sections.find((section) => section.id === entry.id)
                expect(rendered?.content, `${pageId}/${entry.id} renders seed content`).toEqual(
                    fromCode?.content,
                )
                if (entry.variant !== undefined) {
                    expect(rendered?.variant, `${pageId}/${entry.id} variant`).toBe(entry.variant)
                }
            }
        }
    })
})

type Section = LandingConfig["sections"][number]

function section(page: LandingConfig, id: string): Section {
    const found = page.sections.find((entry) => entry.id === id)
    expect(found, id).toBeDefined()
    return found as Section
}

/** The home page as the remix's catalog pins it over the base routes. */
function pinnedHome(builders: Builders, catalog: { landing: object }): LandingConfig {
    const document = { ...servicesCatalog.landing, ...catalog.landing }
    return applySitePageDocument(builders.homeLanding("", NOW), "home", document)
}

describe("services-makeup-tidewater wedding morning", () => {
    const seed = () => import("../../../src/View/Services/tidewaterRemix.content")

    it("opens on the candid suite under the headline and its written credit", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), tidewaterCatalog)
        const hero = section(home, "hero")
        expect(hero.variant).toBe("full-bleed-media")
        const content = hero.content as { headline: string; credit?: string; media?: { kind: string } }
        expect(content.headline.replace(/\s+/g, " ")).toBe("Eight faces by nine.")
        expect(content.credit).toBe("a wedding morning, beautifully documented")
        expect(content.media?.kind).toBe("image")
    })

    it("sets the morning as a photographic timeline, then the rate, the islands and the ask", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), tidewaterCatalog)
        expect(home.sections.map((entry) => entry.id)).toEqual([
            "hero",
            "build-log",
            "now-building",
            "service-area",
            "quote-banner",
        ])
        const morning = section(home, "build-log")
        expect(morning.variant).toBe("timeline")
        const steps = (
            morning.content as { steps: { label?: string; media?: unknown; frames?: unknown[] }[] }
        ).steps
        expect(steps.map((step) => step.label)).toEqual(["6:30", "7:15", "8:00", "8:45", "9:00"])
        for (const step of steps) expect(step.media, step.label).toBeDefined()
        expect(steps.some((step) => (step.frames ?? []).length > 1)).toBe(true)
        expect(section(home, "now-building").variant).toBe("ticker")
    })
})

describe("services-makeup-noor jewel box", () => {
    const seed = () => import("../../../src/View/Services/noorRemix.content")

    it("sets the name and its line over the four event panels", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), noorCatalog)
        const hero = section(home, "hero")
        expect(hero.variant).toBe("panel-collage")
        const content = hero.content as {
            headline: string
            subheadline?: string
            panels?: { label?: string; media: { kind: string } }[]
        }
        expect(content.headline).toBe("Studio Noor")
        expect(content.subheadline).toBe("Every event, every look.")
        expect(content.panels?.map((panel) => panel.label)).toEqual([
            "Mehndi",
            "Sangeet",
            "Wedding",
            "Reception",
        ])
        for (const panel of content.panels ?? []) expect(panel.media.kind, panel.label).toBe("image")
    })

    it("follows with the package board, the looks, the weekend, a bride's words and the ask", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), noorCatalog)
        expect(home.sections.map((entry) => entry.id)).toEqual([
            "hero",
            "price-menu",
            "lookbook",
            "build-log",
            "kind-words",
            "quote-banner",
        ])
        const board = section(home, "price-menu")
        expect(board.variant).toBe("builder")
        const groups = (board.content as { groups: { items: { price: string }[] }[] }).groups
        expect(groups.flatMap((group) => group.items)).toHaveLength(4)
        expect(section(home, "lookbook").variant).toBe("collections")
    })
})

describe("services-contractor-meridian coastal masthead", () => {
    const seed = () => import("../../../src/View/Services/meridianRemix.content")

    it("sets the name as the masthead over the ruled coast line", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), meridianCatalog)
        const hero = section(home, "hero")
        expect(hero.variant).toBe("masthead-overlay")
        const content = hero.content as { headline: string; credit?: string; media?: { kind: string } }
        expect(content.headline).toBe("Meridian")
        expect(content.credit).toBe("Coastal residences · Malibu · Santa Monica · Pacific Palisades")
        expect(content.media?.kind).toBe("image")
    })

    it("follows with the residences rail, the numbers, the design story and the ask", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), meridianCatalog)
        expect(home.sections.map((entry) => entry.id)).toEqual([
            "hero",
            "lookbook",
            "proof",
            "feature",
            "quote-banner",
        ])
        expect(section(home, "lookbook").variant).toBe("media-rail")
        const story = section(home, "feature")
        expect(story.variant).toBe("media-left")
        const content = story.content as {
            kicker?: string
            headline: string
            body: string
            media?: { kind: string }
            cta?: { label: string; href: string }
        }
        expect(content.kicker).toBe("Design")
        expect(content.headline).toBe("Pools engineered to disappear")
        expect(content.body).toMatch(/\S/)
        expect(content.media?.kind).toBe("image")
        expect(content.cta).toEqual({ label: "Explore the details", href: "/projects" })
    })

    it("emits no feature section from a seed that leaves the story empty", async () => {
        // Not content.ts: a composed template's content.ts is its own seed.
        const builders = await buildersWithSeed(
            () => import("../../../src/View/Services/tidewaterRemix.content"),
        )
        expect(builders.homeLanding("", NOW).sections.map((entry) => entry.id)).not.toContain("feature")
    })
})

describe("services-contractor-hallock long-form feature", () => {
    const seed = () => import("../../../src/View/Services/hallockRemix.content")

    it("opens on the engraved title over the estate", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), hallockCatalog)
        const hero = section(home, "hero")
        expect(hero.variant).toBe("full-bleed-media")
        const content = hero.content as { headline: string; badge?: string; media?: { kind: string } }
        expect(content.headline).toBe("Built to become heirlooms.")
        expect(content.badge).toBe("Hallock & Sons · Est. 1962")
        expect(content.media?.kind).toBe("image")
    })

    it("tells one estate as a feature, then the lanes and the commission ask", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), hallockCatalog)
        expect(home.sections.map((entry) => entry.id)).toEqual([
            "hero",
            "feature",
            "service-area",
            "quote-banner",
        ])
        const story = section(home, "feature")
        expect(story.variant).toBe("feature")
        const content = story.content as {
            body: string
            pullQuote?: string
            figures?: { title?: string; media: { kind: string } }[]
            plate?: { caption?: string; media: { kind: string } }
        }
        expect(content.body.split("\n\n")).toHaveLength(3)
        expect(content.pullQuote).toBe("We build the house their grandchildren will argue over.")
        expect(content.figures?.map((figure) => figure.title)).toEqual([
            "Cedar shingle detail",
            "Hand-carved newel post",
        ])
        expect(content.plate?.caption).toBe("Elevation · Hedges Lane, Amagansett")
        expect(section(home, "service-area").variant).toBe("text-logos")
    })
})

describe("services-hair-maren stylist directory", () => {
    const seed = () => import("../../../src/View/Services/marenRemix.content")

    it("sets the suite, the stylists by level and the ask", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), marenCatalog)
        expect(home.sections.map((entry) => entry.id)).toEqual(["hero", "lookbook", "quote-banner"])
        expect(section(home, "hero").variant).toBe("full-bleed-media")
        const directory = section(home, "lookbook")
        expect(directory.variant).toBe("directory")
        const items = (directory.content as { items: { title: string; eyebrow?: string; tags?: string[] }[] })
            .items
        expect(items).toHaveLength(6)
        expect([...new Set(items.map((item) => item.eyebrow))]).toEqual(["Master", "Senior", "Artisan"])
        for (const item of items) expect(item.tags?.length, item.title).toBeGreaterThan(0)
    })

    it("sets no eyebrow on lookbook items from a seed without levels", async () => {
        const home = pinnedHome(
            await buildersWithSeed(() => import("../../../src/View/Services/noorRemix.content")),
            noorCatalog,
        )
        const items = (section(home, "lookbook").content as { items: { eyebrow?: string }[] }).items
        for (const item of items) expect(item.eyebrow).toBeUndefined()
    })
})

describe("services-hair-sable ritual", () => {
    const seed = () => import("../../../src/View/Services/sableRemix.content")

    it("sets the portrait, the timed ritual, one voice, the rates and the ask", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), sableCatalog)
        expect(home.sections.map((entry) => entry.id)).toEqual([
            "hero",
            "build-log",
            "kind-words",
            "now-building",
            "quote-banner",
        ])
        expect(section(home, "build-log").variant).toBe("horizontal-rail")
        const steps = (
            section(home, "build-log").content as { steps: { label?: string; duration?: string }[] }
        ).steps
        expect(steps).toHaveLength(5)
        for (const step of steps) {
            expect(step.label).toBeUndefined()
            expect(step.duration).toMatch(/^\d+ min$/)
        }
        expect(section(home, "kind-words").variant).toBe("single-featured")
        expect(section(home, "now-building").variant).toBe("ticker")
    })

    it("keeps labels and sets no duration on build-log steps from a seed without minutes", async () => {
        const home = pinnedHome(
            await buildersWithSeed(() => import("../../../src/View/Services/tidewaterRemix.content")),
            tidewaterCatalog,
        )
        const steps = (
            section(home, "build-log").content as { steps: { label?: string; duration?: string }[] }
        ).steps
        expect(steps.length).toBeGreaterThan(0)
        for (const step of steps) {
            expect(step.label).toBeTruthy()
            expect(step.duration).toBeUndefined()
        }
    })
})
