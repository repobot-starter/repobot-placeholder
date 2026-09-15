import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { packsWithSiteChrome } from "../../../src/View/Site/packShell"

/**
 * The pack landing conformance contract — what keeps the platform's design
 * controls mapped through on every template. A pack that ships a marketing
 * home surface (a `landing` seed in its catalog) must:
 *
 * 1. Be DOC-AWARE: `landing.routes` maps each pack route to a page id and
 *    `landing.pages` seeds every one of those pages. The root-`sections`
 *    document shape is permutation-only — the platform's structural editor
 *    (add / delete / drop a photograph) declines on it, which users read
 *    as "editing is broken on this template".
 * 2. Keep chrome OUT of the section list: nav and footer are SHELL chrome
 *    (`packShell.ts`), never sections. A nav section ignores the theme
 *    contract, so the platform's Site navigation control changes nothing —
 *    and pages added from the Pages panel never join the link row.
 * 3. Register its site chrome in `packShell.ts`, so manifest pages wear
 *    the pack's own masthead and the "adding a page rewires every nav"
 *    contract holds.
 *
 * New marketing packs: follow photography or launch. This test is the
 * checklist.
 */

const packsDir = path.resolve(__dirname, "../../../../../packs")

interface LandingSeed {
    routes?: Record<string, unknown>
    pages?: Record<string, { sections?: { type?: string }[] }>
    sections?: unknown
}

/**
 * Conformance subjects are the seeds compose actually stamps. A derived
 * template (`remixOf`) carries only a landing OVERLAY — resolveCatalog
 * (scripts/lib/pack-switch.mjs) merges it over the base pack's landing, and
 * active.json records the BASE key, so the base's chrome builder is the one
 * a composed remix repo resolves at runtime. The seed asserted here is that
 * merge, and `chromeKey` is the base's.
 */
function landingSeeds(): { key: string; chromeKey: string; landing: LandingSeed }[] {
    const readCatalog = (dir: string) => {
        try {
            return JSON.parse(readFileSync(path.join(packsDir, dir, "catalog.json"), "utf8")) as {
                key?: string
                remixOf?: string
                landing?: LandingSeed
            }
        } catch {
            return undefined
        }
    }
    return readdirSync(packsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
            const catalog = readCatalog(entry.name)
            if (catalog === undefined) {
                return undefined
            }
            const key = catalog.key ?? entry.name
            if (catalog.remixOf === undefined) {
                return catalog.landing !== undefined
                    ? { key, chromeKey: key, landing: catalog.landing }
                    : undefined
            }
            const base = readCatalog(catalog.remixOf)
            const landing =
                catalog.landing !== undefined || base?.landing !== undefined
                    ? { ...base?.landing, ...catalog.landing }
                    : undefined
            return landing !== undefined ? { key, chromeKey: catalog.remixOf, landing } : undefined
        })
        .filter(
            (seed): seed is { key: string; chromeKey: string; landing: LandingSeed } => seed !== undefined,
        )
}

describe("pack landing conformance", () => {
    const seeds = landingSeeds()

    it("finds the marketing packs (the contract has subjects)", () => {
        expect(seeds.map((seed) => seed.key)).toContain("photography")
        expect(seeds.map((seed) => seed.key)).toContain("launch")
    })

    it("every landing seed is doc-aware: routes + pages, never root sections", () => {
        for (const { key, landing } of seeds) {
            expect(landing.sections, `${key}: root sections are permutation-only`).toBeUndefined()
            expect(landing.routes, `${key}: routes map missing`).toBeTypeOf("object")
            expect(Object.keys(landing.routes ?? {}).length, `${key}: routes empty`).toBeGreaterThan(0)
            expect(landing.pages, `${key}: pages map missing`).toBeTypeOf("object")
        }
    })

    it("every route target has a seeded page skeleton", () => {
        for (const { key, landing } of seeds) {
            for (const [route, pageId] of Object.entries(landing.routes ?? {})) {
                expect(pageId, `${key}: route ${route} names no page id`).toBeTypeOf("string")
                expect(
                    landing.pages?.[pageId as string],
                    `${key}: route ${route} -> "${String(pageId)}" has no pages entry`,
                ).toBeDefined()
            }
        }
    })

    it("chrome is shell chrome, never a section (the navigation control must map)", () => {
        for (const { key, landing } of seeds) {
            for (const [pageId, page] of Object.entries(landing.pages ?? {})) {
                const types = (page.sections ?? []).map((section) => section.type)
                expect(types, `${key}/${pageId}: nav must be shell chrome`).not.toContain("nav")
                expect(types, `${key}/${pageId}: footer must be shell chrome`).not.toContain("footer")
            }
        }
    })

    it("every doc-aware pack registers its site chrome for manifest pages", () => {
        for (const { key, chromeKey } of seeds) {
            expect(
                packsWithSiteChrome,
                `${key}: add its chrome builder (key "${chromeKey}") to packShell.ts`,
            ).toContain(chromeKey)
        }
    })
})
