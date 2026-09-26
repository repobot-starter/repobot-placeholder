import { beforeAll, describe, expect, it, vi } from "vitest"
import type { LandingConfig } from "@ui"
import * as current from "../../../src/View/FundIndex/content"
import * as stet from "../../../src/View/FundIndex/stetRemix.content"
import type { FundIndexLine } from "../../../src/View/FundIndex/fundIndexLanding"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The fund-index one-line home (`home.line`), walked for the module this
 * tree carries and the stet seed: a seed without `line` keeps the numbered
 * index and its achromatic pin; a seed with one gets the line alone (its
 * badge, the headline with its full stop as the accent, the pitch), every
 * company in the portfolio as one run of names, and the deck ask as a
 * colophon — and none of its pages carry mono-utility's style overrides.
 */

type Seed = typeof current

const SEEDS: [string, Seed][] = [
    ["content.ts", current],
    ["stet", stet as unknown as Seed],
]

const NOW = new Date(2026, 8, 25, 10, 30)

function lineOf(seed: Seed): FundIndexLine | undefined {
    return "line" in seed.home ? (seed.home.line as FundIndexLine | undefined) : undefined
}

async function buildersFor(seed: Seed) {
    vi.resetModules()
    vi.doMock("../../../src/View/FundIndex/content", () => seed)
    const builders = await import("../../../src/View/FundIndex/fundIndexLanding")
    vi.doUnmock("../../../src/View/FundIndex/content")
    return builders
}

function section(config: LandingConfig, id: string) {
    return config.sections.find((entry) => entry.id === id)
}

describe.each(SEEDS)("fund-index home from the %s seed", (_label, seed) => {
    const line = lineOf(seed)
    let builders: Awaited<ReturnType<typeof buildersFor>>

    // The first import of a freshly reset module graph is slow under a full
    // parallel suite; load once per seed, off the per-test clock.
    beforeAll(async () => {
        builders = await buildersFor(seed)
    }, 60_000)

    it("composes the one-line home exactly when the seed sets it", () => {
        const config = builders.homeLanding("")
        if (line === undefined) {
            expect(config.sections.map((entry) => entry.id)).toContain("focus")
            return
        }
        expect(config.sections.map((entry) => entry.id)).toEqual(["hero", "portfolio", "deck-banner"])
        const hero = config.sections[0]?.content as {
            badge?: string
            headline: string
            accent?: string
            subheadline?: string
            primaryCta?: unknown
        }
        expect(config.sections[0]?.variant).toBe("statement")
        expect(hero.badge).toBe(line.badge)
        expect(hero.headline).toBe(seed.home.headline)
        expect(hero.accent).toBe("full-stop")
        expect(hero.subheadline).toBe(seed.home.subheadline)
        expect(hero.primaryCta).toBeUndefined()
    })

    it("runs every company's name, in the portfolio's order", () => {
        if (line === undefined) return
        const run = section(builders.homeLanding(""), "portfolio")
        expect(run?.type).toBe("social-proof")
        expect(run?.variant).toBe("text-logos")
        const content = run?.content as { label?: string; items: string[] }
        expect(content.label).toBe(line.portfolioLabel)
        expect(content.items).toEqual(seed.companies.map((company) => company.name))
    })

    it("closes on the deck ask as one line, prefixed on the preview route", () => {
        if (line === undefined) return
        const banner = section(builders.homeLanding("/fund-index"), "deck-banner")
        expect(banner?.variant).toBe("colophon")
        const content = banner?.content as {
            title: string
            cta: { label: string; href: string }
            align?: string
        }
        expect(content.title).toBe(seed.home.deckAsk.title)
        expect(content.cta).toEqual({ label: seed.home.deckAsk.ctaLabel, href: "/fund-index/contact" })
        expect(content.align).toBe("start")
    })

    it("pins the achromatic overrides only without a line", () => {
        const pages = [
            builders.homeLanding(""),
            builders.portfolioLanding("", NOW),
            builders.teamLanding(""),
            builders.logLanding(""),
            builders.contactLanding(""),
            builders.disclosuresLanding(""),
        ]
        for (const page of pages) {
            if (line === undefined) expect(page.style?.overrides).toEqual(builders.FUND_INDEX_STYLE_OVERRIDES)
            else expect(page.style?.overrides).toBeUndefined()
        }
    })

    it("labels the nav's ask from the seed's deck ask", () => {
        const nav = builders.homeLanding("").shell?.nav as
            { content: { cta?: { label: string } } } | undefined
        expect(nav?.content.cta?.label).toBe(seed.home.deckAsk.ctaLabel)
    })
})
