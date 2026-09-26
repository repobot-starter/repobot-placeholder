import { describe, expect, it, vi } from "vitest"
import type { LandingConfig } from "@ui"
import * as current from "../../../src/View/Estate/content"
import * as aldercott from "../../../src/View/Estate/aldercottRemix.content"
import type { EstateStack } from "../../../src/View/Estate/estateLanding"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The estate plates home (`home.stack`), walked for the module this tree
 * carries and the aldercott seed: a seed without `stack` keeps the
 * masthead and the media rail; a seed with one gets the full-bleed hero
 * with the market pulse and both asks, the featured listings as one
 * `overlay-start` stack whose captions carry the address over its place,
 * price, and computed status, and the colophon's contact link.
 */

type Seed = typeof current

const SEEDS: [string, Seed][] = [
    ["content.ts", current],
    ["aldercott", aldercott],
]

const NOW = new Date(2026, 8, 23, 10, 30)

function stackOf(seed: Seed): EstateStack | undefined {
    return "stack" in seed.home ? (seed.home.stack as EstateStack | undefined) : undefined
}

async function buildersFor(seed: Seed) {
    vi.resetModules()
    vi.doMock("../../../src/View/Estate/content", () => seed)
    const builders = await import("../../../src/View/Estate/estateLanding")
    vi.doUnmock("../../../src/View/Estate/content")
    return builders
}

function section(config: LandingConfig, id: string) {
    return config.sections.find((entry) => entry.id === id)
}

describe.each(SEEDS)("estate home from the %s seed", (_label, seed) => {
    const stack = stackOf(seed)

    it("composes the plates exactly when the seed sets them", async () => {
        const { homeLanding } = await buildersFor(seed)
        const config = homeLanding("", NOW)
        const featured = section(config, "featured-listings")
        if (stack === undefined) {
            expect(config.sections[0]?.variant).toBe("masthead-overlay")
            expect(featured?.variant).toBe("media-rail")
            return
        }
        expect(config.sections.map((entry) => entry.id)).toEqual([
            "hero",
            "featured-listings",
            "proof",
            "agent",
            "neighborhoods",
            "kind-words",
            "contact-banner",
        ])
        expect(config.sections[0]?.variant).toBe("full-bleed-media")
        expect(featured?.type).toBe("gallery")
        expect(featured?.variant).toBe("sequence")
        const content = featured?.content as {
            captionStack?: string
            items: { caption?: string; detail?: string }[]
        }
        expect(content.captionStack).toBe("overlay-start")
        expect(content.items.map((item) => item.caption)).toEqual(
            seed.home.featuredListings.map((listing) => listing.title),
        )
        seed.home.featuredListings.forEach((listing, index) => {
            expect(content.items[index]?.detail).toContain(listing.price)
            expect(content.items[index]?.detail).toContain(listing.neighborhood)
        })
        expect(section(config, "contact-banner")?.variant).toBe("colophon")
    })

    it("keeps the plates' status computed from the clock", async () => {
        if (stack === undefined) return
        const { homeLanding } = await buildersFor(seed)
        const details = (at: Date) =>
            (
                section(homeLanding("", at), "featured-listings")?.content as { items: { detail?: string }[] }
            ).items.map((item) => item.detail ?? "")
        expect(details(NOW).some((detail) => detail.endsWith("New this week"))).toBe(true)
        expect(details(new Date(2027, 8, 23, 10, 30)).every((detail) => detail.endsWith("For sale"))).toBe(
            true,
        )
    })

    it("keeps both asks on the hero and prefixes every link on the preview route", async () => {
        const { homeLanding } = await buildersFor(seed)
        const hero = homeLanding("/estate", NOW).sections[0]?.content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(hero.primaryCta?.href).toBe("/estate/listings")
        expect(hero.secondaryCta?.href).toMatch(/^tel:/)
        if (stack === undefined) return
        const banner = section(homeLanding("/estate", NOW), "contact-banner")?.content as {
            cta: { href: string }
        }
        expect(banner.cta.href).toBe("/estate/contact")
    })
})
