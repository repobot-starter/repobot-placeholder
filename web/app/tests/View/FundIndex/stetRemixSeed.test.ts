import { existsSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import baseCatalog from "../../../../../packs/fund-index/catalog.json"
import stetCatalog from "../../../../../packs/fund-index-stet/catalog.json"
import * as current from "../../../src/View/FundIndex/content"
import * as stet from "../../../src/View/FundIndex/stetRemix.content"
import type { FundIndexLine } from "../../../src/View/FundIndex/fundIndexLanding"

/**
 * The fund-index-stet remix seed's parity gate (the services family's
 * remixSeeds discipline, and the fund-index family's first). The seed is
 * copied over `content.ts` when the derived template composes, so it must
 * export the same surface in the same shapes — plus `home.line`, the
 * switch to the one-line home, and `contact.emailLabel` — and every fact the inner pages compute
 * from (sectors inside the focus areas, ISO dates, a settled exit, real
 * disclosures) must hold for it exactly as for the base.
 */

const repoRoot = path.resolve(__dirname, "../../../../..")
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const STATUSES = new Set(["active", "acquired", "public"])

type Surface = Record<string, unknown>

function keysOf(value: unknown): string[] {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? Object.keys(value).sort()
        : []
}

describe("fund-index stet remix seed", () => {
    it("exports exactly the content module's surface", () => {
        expect(Object.keys(stet).sort()).toEqual(Object.keys(current).sort())
    })

    it("keeps every record export's keys (adding only home.line and contact.emailLabel)", () => {
        const base = current as Surface
        const seed = stet as Surface
        for (const name of Object.keys(base)) {
            if (Array.isArray(base[name])) {
                expect(Array.isArray(seed[name]), name).toBe(true)
                continue
            }
            const added = name === "home" ? "line" : name === "contact" ? "emailLabel" : undefined
            expect(
                keysOf(seed[name]).filter((key) => key !== added),
                name,
            ).toEqual(keysOf(base[name]).filter((key) => key !== added))
        }
        expect(keysOf(stet.home.deckAsk)).toEqual(keysOf(current.home.deckAsk))
        expect(keysOf(stet.home.formula)).toEqual(keysOf(current.home.formula))
    })

    it("sets the one-line home", () => {
        const line: FundIndexLine = stet.home.line
        expect(line.badge).not.toBe("")
        expect(line.portfolioLabel).not.toBe("")
        // The line is the page: one sentence, short enough to hold two lines at poster scale.
        expect(stet.home.headline.split(/[.!?]\s/).length).toBe(1)
        expect(stet.home.headline.length).toBeLessThanOrEqual(40)
        expect(stet.home.headline).toMatch(/[.!?]$/)
        expect(stet.home.formula.expression.length).toBeLessThan(90)
    })

    it("keeps every company computable and inside the filed focus areas", () => {
        const filed = new Set(stet.focusAreas.map((area) => area.title))
        const names = stet.companies.map((company) => company.name)
        expect(stet.companies.length).toBeGreaterThanOrEqual(6)
        expect(new Set(names).size).toBe(names.length)
        for (const company of stet.companies) {
            expect(company.oneLiner, company.name).not.toBe("")
            expect(company.investedAt, company.name).toMatch(ISO_DATE)
            expect(STATUSES.has(company.status), company.name).toBe(true)
            for (const sector of company.sectors)
                expect(filed.has(sector), `${company.name}: ${sector}`).toBe(true)
        }
        expect(stet.companies.some((company) => company.status !== "active")).toBe(true)
    })

    it("fills the inner pages: principles, stated metrics, team, letters, fine print", () => {
        expect(stet.focusAreas.length).toBeGreaterThanOrEqual(3)
        expect(stet.principles.length).toBeGreaterThanOrEqual(3)
        for (const entry of [...stet.focusAreas, ...stet.principles]) {
            expect(entry.body.length, entry.title).toBeGreaterThan(60)
        }
        for (const metric of stet.statedMetrics) expect(/^\d+$/.test(metric.value), metric.value).toBe(false)
        expect(stet.team.length).toBeGreaterThanOrEqual(2)
        for (const member of stet.team) expect(member.bio.length, member.name).toBeGreaterThan(80)
        expect(stet.log.length).toBeGreaterThanOrEqual(3)
        for (const entry of stet.log) {
            expect(entry.date, entry.title).toMatch(ISO_DATE)
            expect(entry.href, entry.title).toMatch(/^https:\/\//)
        }
        expect(stet.disclosures.updated).toMatch(ISO_DATE)
        expect(stet.disclosures.paragraphs.length).toBeGreaterThanOrEqual(3)
        for (const paragraph of stet.disclosures.paragraphs) expect(paragraph.length).toBeGreaterThan(80)
        expect(stet.contact.fields.map((field) => field.name)).toEqual(
            current.contact.fields.map((field) => field.name),
        )
    })

    it("is the catalog's seed, on its own register, over the base's routes", () => {
        expect(stetCatalog.remixOf).toBe("fund-index")
        expect(existsSync(path.join(repoRoot, stetCatalog.contentSeed))).toBe(true)
        expect(stetCatalog.contentSeed).toBe("web/app/src/View/FundIndex/stetRemix.content.ts")
        expect(stetCatalog.landing.style).toEqual({ preset: "galleyproof" })
        expect(Object.keys(stetCatalog.landing.pages).sort()).toEqual(
            Object.keys(baseCatalog.landing.pages).sort(),
        )
        expect(stetCatalog.landing.pages.home.sections.map((section) => section.id)).toEqual([
            "hero",
            "portfolio",
            "deck-banner",
        ])
    })
})
