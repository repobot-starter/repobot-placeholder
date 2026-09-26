import type { LandingConfig } from "@ui"
import { afterEach, describe, expect, it, vi } from "vitest"
import hairCatalog from "../../../../../packs/services-hair-braids/catalog.json"
import koenCatalog from "../../../../../packs/services-landscape-koen/catalog.json"
import landscapeCatalog from "../../../../../packs/services-landscape-native/catalog.json"
import olivettaCatalog from "../../../../../packs/services-landscape-olivetta/catalog.json"
import makeupCatalog from "../../../../../packs/services-makeup-counter/catalog.json"
import paintingCatalog from "../../../../../packs/services-painting-swiss/catalog.json"
import servicesCatalog from "../../../../../packs/services/catalog.json"
import builderCatalog from "../../../../../packs/services-builder/catalog.json"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * Each restyled services remix (services-builder and the four skins) pins
 * its own register and page skeletons while the base pack's builders emit
 * the sections from the remix's seed. Every
 * pinned entry must bind a real code section built from that seed — an
 * unbound entry would render the builder's placeholder copy on a live
 * skin, and a pinned id the seed doesn't feed silently binds by type.
 */

type Builders = typeof import("../../../src/View/Services/servicesLanding")

/** A weekday morning, inside every skin's posted hours. */
const NOW = new Date(2026, 7, 25, 10, 30)

async function buildersWithSeed(seed: () => Promise<unknown>): Promise<Builders> {
    vi.resetModules()
    vi.doMock("../../../src/View/Services/content", seed)
    return import("../../../src/View/Services/servicesLanding")
}

const skins = [
    {
        name: "builder",
        seed: () => import("../../../src/View/Services/builderRemix.content"),
        catalog: builderCatalog,
        preset: "tideline",
    },
    {
        name: "hair",
        seed: () => import("../../../src/View/Services/hairBraidsRemix.content"),
        catalog: hairCatalog,
        preset: "crown",
    },
    {
        name: "makeup",
        seed: () => import("../../../src/View/Services/makeupCounterRemix.content"),
        catalog: makeupCatalog,
        preset: "vanity",
    },
    {
        name: "landscape",
        seed: () => import("../../../src/View/Services/landscapeNativeRemix.content"),
        catalog: landscapeCatalog,
        preset: "riso",
    },
    {
        name: "painting",
        seed: () => import("../../../src/View/Services/paintingSwissRemix.content"),
        catalog: paintingCatalog,
        preset: "paintchip",
    },
    {
        name: "olivetta",
        seed: () => import("../../../src/View/Services/olivettaRemix.content"),
        catalog: olivettaCatalog,
        preset: "plaster",
    },
    {
        name: "koen",
        seed: () => import("../../../src/View/Services/koenRemix.content"),
        catalog: koenCatalog,
        preset: "basalt",
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

describe.each(skins)("services-$name landing pin", ({ seed, catalog, preset }) => {
    // resolveCatalog (scripts/lib/pack-switch.mjs): the skin's landing
    // shallow-merges over the base's, so routes stay the base pack's.
    const document = { ...servicesCatalog.landing, ...catalog.landing }

    it("pins its register over the base pack's routes", () => {
        expect(catalog.landing.style.preset).toBe(preset)
        expect(document.routes).toEqual(servicesCatalog.landing.routes)
    })

    it("binds every pinned section to real seed content on every page", async () => {
        const pages = pagesFrom(await buildersWithSeed(seed))
        for (const [pageId, code] of Object.entries(pages)) {
            const pinned = catalog.landing.pages[pageId as keyof typeof catalog.landing.pages].sections
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
                if ("variant" in entry) {
                    expect(rendered?.variant, `${pageId}/${entry.id} variant`).toBe(entry.variant)
                }
            }
        }
    })
})

describe("services-painting-swiss color deck", () => {
    it("deals the palette as swatches under the hero, every chip linking to the quote", async () => {
        const builders = await buildersWithSeed(
            () => import("../../../src/View/Services/paintingSwissRemix.content"),
        )
        const home = builders.homeLanding("/services", NOW)
        const ids = home.sections.map((section) => section.id)
        expect(ids.indexOf("palette")).toBe(ids.indexOf("hero") + 1)
        const palette = home.sections.find((section) => section.id === "palette")
        expect(palette?.type).toBe("showcase")
        expect(palette?.variant).toBe("swatches")
        const items = (palette?.content as { items: { title: string; color?: string; url?: string }[] }).items
        expect(items).toHaveLength(5)
        for (const item of items) {
            expect(item.color, item.title).toMatch(/^#[0-9a-f]{6}$/i)
            expect(item.url, item.title).toBe("/services/quote")
        }
    })

    it("closes the storefront hero's copy on the credit line and keeps both asks", async () => {
        const builders = await buildersWithSeed(
            () => import("../../../src/View/Services/paintingSwissRemix.content"),
        )
        const hero = builders.homeLanding("", NOW).sections.find((section) => section.id === "hero")
        const content = hero?.content as {
            credit?: string
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(hero?.variant).toBe("split-media")
        expect(content.credit).toBe("New Orleans house painting")
        expect(content.primaryCta?.href).toBe("/quote")
        expect(content.secondaryCta?.href).toMatch(/^tel:/)
    })
})

type Section = LandingConfig["sections"][number]

function section(home: LandingConfig, id: string): Section {
    const found = home.sections.find((entry) => entry.id === id)
    expect(found, id).toBeDefined()
    return found as Section
}

/** The home page as the skin's catalog pins it over the base routes. */
function pinnedHome(builders: Builders, catalog: { landing: object }, basePath = ""): LandingConfig {
    const document = { ...servicesCatalog.landing, ...catalog.landing }
    return applySitePageDocument(builders.homeLanding(basePath, NOW), "home", document)
}

describe("services-hair-braids magazine cover", () => {
    const seed = () => import("../../../src/View/Services/hairBraidsRemix.content")

    it("prints the cover lines, kicker and credit over the full-bleed portrait", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("", NOW)
        const hero = section(home, "hero")
        const content = hero.content as {
            headline: string
            accent: string
            badge?: string
            credit?: string
            coverLines?: string[]
            primaryCta?: { href: string }
            media?: { kind: string }
        }
        expect(content.headline).toBe("The\nCrown Room")
        expect(content.accent).toBe("last-word")
        expect(content.badge).toMatch(/\S/)
        expect(content.credit).toBe("Braids & natural hair studio")
        expect(content.coverLines?.map((line) => line.replace(/\s+/g, " "))).toEqual([
            "Knotless · Boho · Locs retwist",
            "Book 3 weeks out",
            "Bed-Stuy's favorite chair",
        ])
        expect(content.primaryCta?.href).toBe("/quote")
        expect(content.media?.kind).toBe("image")
    })

    it("runs the price strip, then the style menu and the lookbook, and drops the stock services grid", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), hairCatalog)
        const ids = home.sections.map((entry) => entry.id)
        expect(ids.slice(0, 4)).toEqual(["hero", "now-building", "price-menu", "lookbook"])
        expect(ids).not.toContain("services")
        expect(ids).not.toContain("palette")
        expect((section(home, "now-building").content as { items: string[] }).items).toEqual([
            "Knotless from $220",
            "Boho from $260",
            "Retwist from $120",
        ])
        const menu = section(home, "price-menu")
        expect(menu.variant).toBe("price-list")
        const groups = (menu.content as { groups: { heading: string; items: { price: string }[] }[] }).groups
        expect(groups.length).toBeGreaterThanOrEqual(3)
        for (const group of groups) {
            expect(group.items.length, group.heading).toBeGreaterThan(0)
            for (const item of group.items) expect(item.price, group.heading).toMatch(/\$\d/)
        }
        expect((menu.content as { cta?: { href: string } }).cta?.href).toBe("/quote")
        const looks = (section(home, "lookbook").content as { items: { title: string; media?: unknown }[] })
            .items
        expect(looks.length).toBeGreaterThanOrEqual(6)
        for (const look of looks) expect(look.media, look.title).toBeDefined()
    })

    it("posts the house rules on one card beside the stylist's portrait", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("", NOW)
        const rules = section(home, "policies")
        expect(rules.type).toBe("feature-grid")
        const content = rules.content as {
            cardTitle?: string
            media?: unknown
            features: { title: string; description: string }[]
        }
        expect(content.cardTitle).toMatch(/\S/)
        expect(content.media).toBeDefined()
        expect(content.features.some((rule) => /deposit/i.test(rule.title))).toBe(true)
    })

    it("opens the projects page on the lookbook ahead of the before/afters", async () => {
        const projects = (await buildersWithSeed(seed)).projectsLanding("")
        expect(projects.sections.map((entry) => entry.id).slice(0, 3)).toEqual([
            "hero",
            "lookbook",
            "transformations",
        ])
    })
})

describe("services-makeup-counter beauty counter", () => {
    const seed = () => import("../../../src/View/Services/makeupCounterRemix.content")

    it("sets the headline over the portrait and closes on the artist's credit", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("", NOW)
        const content = section(home, "hero").content as {
            headline: string
            accent: string
            credit?: string
            coverLines?: string[]
            primaryCta?: { href: string }
        }
        expect(content.headline.replace(/\s+/g, " ").toUpperCase()).toBe("BEAT FOR THE GODS.")
        expect(content.accent).toBe("last-word")
        expect(content.credit).toMatch(/Los Angeles/)
        expect(content).not.toHaveProperty("coverLines")
        expect(content.primaryCta?.href).toBe("/quote")
    })

    it("deals the services as shade swatches with texture chips, each linking to the booking", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), makeupCatalog, "/services")
        const ids = home.sections.map((entry) => entry.id)
        expect(ids.indexOf("palette")).toBe(ids.indexOf("hero") + 1)
        expect(ids).not.toContain("services")
        const palette = section(home, "palette")
        expect(palette.variant).toBe("swatches")
        const items = (
            palette.content as {
                items: { title: string; meta: string; media?: { kind: string }; url?: string }[]
            }
        ).items
        expect(items.map((item) => [item.title, item.meta])).toEqual([
            ["Bridal", "From $450"],
            ["Editorial", "Day rate"],
            ["Lessons", "$180"],
        ])
        for (const item of items) {
            expect(item.media?.kind, item.title).toBe("image")
            expect(item.url, item.title).toBe("/services/quote")
        }
    })

    it("carries the portfolio, the bridal process, the rate card and the travel rules", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("", NOW)
        const tags = new Set(
            (section(home, "lookbook").content as { items: { tags: string[] }[] }).items.flatMap(
                (item) => item.tags,
            ),
        )
        expect([...tags]).toEqual(expect.arrayContaining(["Editorial", "Bridal", "Red carpet"]))
        expect(
            (section(home, "build-log").content as { steps: unknown[] }).steps.length,
        ).toBeGreaterThanOrEqual(3)
        const groups = (section(home, "price-menu").content as { groups: { heading: string }[] }).groups
        expect(groups.length).toBeGreaterThanOrEqual(2)
        const rules = (section(home, "policies").content as { features: { title: string }[] }).features
        expect(rules.some((rule) => /travel/i.test(rule.title))).toBe(true)
    })
})

describe("services-landscape-olivetta garden journal", () => {
    const seed = () => import("../../../src/View/Services/olivettaRemix.content")

    it("leads the home with the season's stories, each jumping to the gardens", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), olivettaCatalog, "/services")
        const ids = home.sections.map((entry) => entry.id)
        expect(ids.indexOf("journal")).toBe(ids.indexOf("hero") + 1)
        const journal = section(home, "journal")
        expect(journal.type).toBe("showcase")
        expect(journal.variant).toBe("stories")
        const items = (
            journal.content as {
                items: { meta?: string; media?: { kind: string }; url?: string; linkLabel?: string }[]
            }
        ).items
        expect(items.map((item) => item.meta)).toEqual(["Spring", "Summer", "Autumn", "Winter"])
        for (const item of items) {
            expect(item.media?.kind).toBe("image")
            expect(item.url).toBe("/services/projects")
            expect(item.linkLabel).toMatch(/\S/)
        }
    })
})

describe("services-landscape-koen garden walk", () => {
    const seed = () => import("../../../src/View/Services/koenRemix.content")

    it("walks one garden frame by frame under the seal on the title card", async () => {
        const home = pinnedHome(await buildersWithSeed(seed), koenCatalog)
        const hero = section(home, "hero")
        expect(hero.variant).toBe("full-bleed-media")
        expect((hero.content as { seal?: string }).seal).toBe("Kōen\n庭")
        const walk = section(home, "walk")
        expect(walk.type).toBe("gallery")
        expect(walk.variant).toBe("sequence")
        const items = (walk.content as { items: { caption?: string; media: { kind: string } }[] }).items
        expect(items).toHaveLength(6)
        for (const item of items) {
            expect(item.caption).toMatch(/\S/)
            expect(item.media.kind).toBe("image")
        }
    })
})
