import { describe, expect, it } from "vitest"
import type { MarketingPageEntry } from "../../../src/Config/projectManifest"
import { landingConfigForPage } from "../../../src/View/Site/blueprints"

function pageWith(overrides: Partial<MarketingPageEntry>): MarketingPageEntry {
    return {
        id: "home",
        path: "/",
        title: "Home",
        blueprint: "landing",
        ...overrides,
    }
}

function heroOf(page: MarketingPageEntry) {
    const hero = landingConfigForPage(page).sections.find((section) => section.type === "hero")
    if (hero?.type !== "hero") throw new Error("blueprint output needs a hero")
    return hero
}

// The seed contract (docs/project-ia.md): copy the user wrote during setup
// renders verbatim over the blueprint placeholders, so their words (and
// pinned hero image) are on the page before any agent runs.
describe("blueprint page seeds", () => {
    const seeded = pageWith({
        seed: {
            headline: "Hand-poured soy candles from a garage studio",
            subheadline: "Small batches, natural wicks.",
            bullets: ["Three signature scents", "Free shipping over $50"],
            ctaLabel: "Shop the collection",
            heroImage: "/brand/hero.jpg",
        },
    })

    it("renders every seed field verbatim in the hero", () => {
        const hero = heroOf(seeded)
        expect(hero.content.headline).toBe("Hand-poured soy candles from a garage studio")
        expect(hero.content.subheadline).toBe("Small batches, natural wicks.")
        expect(hero.content.primaryCta?.label).toBe("Shop the collection")
        expect(hero.content.media).toEqual({
            kind: "image",
            src: "/brand/hero.jpg",
            alt: "Home",
        })
    })

    it("replaces the landing placeholder pitch with the user's key points", () => {
        const grid = landingConfigForPage(seeded).sections.find((section) => section.type === "feature-grid")
        if (grid?.type !== "feature-grid") throw new Error("landing blueprint needs a feature grid")
        expect(grid.content.features.map((feature) => feature.title)).toEqual([
            "Three signature scents",
            "Free shipping over $50",
        ])
    })

    it("adds a key-points section to non-landing blueprints without dropping their own", () => {
        const config = landingConfigForPage(
            pageWith({
                id: "faq",
                path: "/faq",
                title: "FAQ",
                blueprint: "faq",
                seed: { bullets: ["Shipping times", "Returns"] },
            }),
        )
        const types = config.sections.map((section) => section.type)
        expect(types).toContain("feature-grid")
        expect(types).toContain("faq")
    })

    it("keeps blueprint placeholders when there is no seed", () => {
        const hero = heroOf(pageWith({}))
        expect(hero.content.headline).toBeTypeOf("string")
        expect(hero.content.media).toBeUndefined()
    })
})
