import type { LandingConfig } from "@ui"
import { afterEach, describe, expect, it, vi } from "vitest"
import musicCatalog from "../../../../../packs/photography-music/catalog.json"
import theoCatalog from "../../../../../packs/photography-music-theo/catalog.json"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * Each music-photography remix pins its own register and page skeletons while
 * the base pack's builders emit the sections from the remix's seed. Every
 * pinned entry must bind a real code section built from that seed — an
 * unbound entry would render the builder's placeholder copy on a live
 * remix, and a pinned id the seed doesn't feed silently binds by type.
 */

type Builders = typeof import("../../../src/View/PhotographyMusic/musicLanding")

async function buildersWithSeed(seed: () => Promise<unknown>): Promise<Builders> {
    vi.resetModules()
    vi.doMock("../../../src/View/PhotographyMusic/content", seed)
    return import("../../../src/View/PhotographyMusic/musicLanding")
}

const remixes = [
    {
        name: "theo",
        seed: () => import("../../../src/View/PhotographyMusic/theoRemix.content"),
        catalog: theoCatalog,
        preset: "liner",
    },
]

afterEach(() => {
    vi.doUnmock("../../../src/View/PhotographyMusic/content")
})

function pagesFrom(builders: Builders): Record<string, LandingConfig> {
    return {
        home: builders.homeLanding(""),
        work: builders.workLanding("", undefined),
        galleries: builders.galleriesLanding(""),
        about: builders.aboutLanding(""),
        book: builders.bookLanding(""),
    }
}

describe.each(remixes)("photography-music-$name landing pin", ({ seed, catalog, preset }) => {
    // resolveCatalog (scripts/lib/pack-switch.mjs): the remix's landing
    // shallow-merges over the base's, so routes stay the base pack's.
    const document = { ...musicCatalog.landing, ...catalog.landing }

    it("pins its register over the base pack's routes", () => {
        expect(catalog.landing.style.preset).toBe(preset)
        expect(document.routes).toEqual(musicCatalog.landing.routes)
        expect(Object.keys(catalog.landing.pages).sort()).toEqual(
            [...new Set(Object.values(musicCatalog.landing.routes))].sort(),
        )
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
            expect(applied.style.preset, pageId).toBe(preset)
        }
    })

    it("opens on one full-bleed frame, hangs the covers, and closes on one text link to /book", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("/photography-music")
        expect(home.sections.map((section) => [section.type, section.variant])).toEqual([
            ["gallery", "sequence"],
            ["gallery", "covers"],
            ["cta-banner", "colophon"],
        ])
        const frame = home.sections[0].content as {
            items: unknown[]
            fullBleed?: boolean
            captionStack?: string
        }
        expect(frame.items).toHaveLength(1)
        expect(frame.fullBleed).toBe(true)
        expect(frame.captionStack).toMatch(/^band-/)
        const covers = home.sections[1].content as { items: { caption?: string; note?: string }[] }
        expect(covers.items.length).toBeGreaterThanOrEqual(8)
        for (const item of covers.items) {
            expect(item.caption).toMatch(/\S/)
            expect(item.note).toMatch(/\S/)
        }
        const closing = home.sections[2].content as { cta: { label: string; href: string } }
        expect(closing.cta).toEqual({ label: "Get in touch", href: "/photography-music/book" })
    })
})
