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
    if (hero?.type !== "hero") throw new Error("scaffold output needs a hero")
    return hero
}

// The scaffold's hero flourishes are setup-chosen design decisions
// (docs/project-ia.md): a badge or secondary CTA in the manifest renders,
// and their absence renders bare — the kernel never re-injects the stock
// flourishes a synthesis deliberately omitted.
describe("scaffold hero badge and secondary CTA", () => {
    it("passes both through, anchoring the secondary CTA at the story", () => {
        const hero = heroOf(
            pageWith({
                sections: [
                    {
                        id: "hero",
                        type: "hero",
                        headline: "Nights, fully lit",
                        badge: "Currently glowing",
                        ctaLabel: "See what I can do",
                        secondaryCtaLabel: "Read the reviews",
                    },
                    { id: "steps", type: "steps" },
                    { id: "lead-form", type: "lead-form" },
                ],
            }),
        )
        expect(hero.content.badge).toBe("Currently glowing")
        expect(hero.content.primaryCta).toEqual({ label: "See what I can do", anchor: "lead-form" })
        expect(hero.content.secondaryCta).toEqual({ label: "Read the reviews", anchor: "steps" })
    })

    it("renders a bare hero when setup chose neither", () => {
        const hero = heroOf(
            pageWith({
                sections: [
                    { id: "hero", type: "hero", headline: "Quiet by design" },
                    { id: "faq", type: "faq" },
                ],
            }),
        )
        expect(hero.content.badge).toBeUndefined()
        expect(hero.content.secondaryCta).toBeUndefined()
    })
})
