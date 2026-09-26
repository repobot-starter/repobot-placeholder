import type { LandingConfig } from "@ui"
import { afterEach, describe, expect, it, vi } from "vitest"
import kaitoCatalog from "../../../../../packs/photography-kaito/catalog.json"
import wrenCatalog from "../../../../../packs/photography-wren/catalog.json"
import photographyCatalog from "../../../../../packs/photography/catalog.json"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * Each photography remix pins its own register and page skeletons while
 * the base pack's builders emit the sections from the remix's seed. Every
 * pinned entry must bind a real code section built from that seed — an
 * unbound entry would render the builder's placeholder copy on a live
 * remix, and a pinned id the seed doesn't feed silently binds by type.
 */

type Builders = typeof import("../../../src/View/Photography/photographyLanding")

async function buildersWithSeed(seed: () => Promise<unknown>): Promise<Builders> {
    vi.resetModules()
    vi.doMock("../../../src/View/Photography/content", seed)
    return import("../../../src/View/Photography/photographyLanding")
}

const remixes = [
    {
        name: "wren",
        seed: () => import("../../../src/View/Photography/wrenRemix.content"),
        catalog: wrenCatalog,
        preset: "vitrine",
        align: "center",
        cta: "Book a sitting",
    },
    {
        name: "kaito",
        seed: () => import("../../../src/View/Photography/kaitoRemix.content"),
        catalog: kaitoCatalog,
        preset: "seamless",
        align: "start",
        cta: "Book a session",
    },
]

afterEach(() => {
    vi.doUnmock("../../../src/View/Photography/content")
})

function pagesFrom(builders: Builders): Record<string, LandingConfig> {
    return {
        home: builders.homeLanding(""),
        work: builders.workLanding("", undefined),
        about: builders.aboutLanding(""),
        galleries: builders.galleriesLanding(""),
        book: builders.bookLanding(""),
        inquire: builders.inquireLanding(""),
    }
}

describe.each(remixes)("photography-$name landing pin", ({ seed, catalog, preset, align, cta }) => {
    // resolveCatalog (scripts/lib/pack-switch.mjs): the remix's landing
    // shallow-merges over the base's, so routes stay the base pack's.
    const document = { ...photographyCatalog.landing, ...catalog.landing }

    it("pins its register over the base pack's routes", () => {
        expect(catalog.landing.style.preset).toBe(preset)
        expect(document.routes).toEqual(photographyCatalog.landing.routes)
        expect(Object.keys(catalog.landing.pages).sort()).toEqual(
            [...new Set(Object.values(photographyCatalog.landing.routes))].sort(),
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

    it("stacks every frame full bleed on caption bands and closes on one text link to /book", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("/photography")
        expect(home.sections.map((section) => [section.type, section.variant])).toEqual([
            ["gallery", "sequence"],
            ["cta-banner", "colophon"],
        ])
        const stack = home.sections[0].content as {
            items: { caption?: string; media: { kind: string } }[]
            fullBleed?: boolean
            captionStack?: string
        }
        expect(stack.fullBleed).toBe(true)
        expect(stack.captionStack).toBe(`band-${align}`)
        expect(stack.items.length).toBeGreaterThanOrEqual(4)
        for (const item of stack.items) {
            expect(item.caption).toMatch(/\S/)
            expect(item.media.kind).toBe("image")
        }
        const closing = home.sections[1].content as { cta: { label: string; href: string }; align?: string }
        expect(closing.cta).toEqual({ label: cta, href: "/photography/book" })
        expect(closing.align).toBe(align)
    })
})
