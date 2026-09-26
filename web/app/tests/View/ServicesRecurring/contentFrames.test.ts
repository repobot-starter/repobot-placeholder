/**
 * The content-picked frames of the recurring pack — the hero layout, the
 * ticket stubs, the specimen board — run on whichever content module this
 * tree composes (the base demo or a skin's seed): each frame's content is
 * filled in full or left out in full, never half-set copy the page drops.
 */

import path from "node:path"
import { describe, expect, it, vi } from "vitest"

// The shell appends the project manifest's pages to the nav; pin it empty
// so the assertions are about the pack, not the tree it shipped in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

import { publicAssetPresent } from "../../helpers/publicAssets"
import { home, plans, specimens } from "../../../src/View/ServicesRecurring/content"
import { homeLanding, plansLanding } from "../../../src/View/ServicesRecurring/servicesRecurringLanding"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const NOW = new Date(2026, 7, 25, 10, 30)

describe("services-recurring content-picked frames", () => {
    it("frames the hero by home.layout, the credit riding only full-bleed frames", () => {
        const hero = homeLanding("", NOW).sections[0]
        expect(hero.variant).toBe(
            { split: "split-media", "full-bleed": "full-bleed-media", masthead: "masthead-overlay" }[
                home.layout
            ],
        )
        const credit = (hero.content as { credit?: string }).credit
        expect(credit).toBe(home.layout !== "split" && home.credit !== "" ? home.credit : undefined)
        // A split hero has no credit slot — a filled one would be dropped copy.
        if (home.layout === "split") expect(home.credit).toBe("")
    })

    it("prints the plans as tickets exactly when every plan carries a stub", () => {
        const stubbed = plans.filter((plan) => plan.stub !== undefined).length
        expect([0, plans.length], "plans with a stub: all or none").toContain(stubbed)
        if (stubbed === 0) {
            expect(
                plans.filter((plan) => plan.period !== undefined),
                "a per-plan period prints on tickets only",
            ).toEqual([])
        }
        for (const page of [homeLanding("", NOW), plansLanding("")]) {
            const pricing = page.sections.find((section) => section.id === "plans")
            expect(pricing?.variant).toBe(stubbed > 0 ? "tickets" : "tiers")
            const tiers = (pricing?.content as { tiers: { stub?: string; period?: string }[] }).tiers
            expect(tiers.map((tier) => tier.stub)).toEqual(plans.map((plan) => plan.stub))
            expect(tiers.map((tier) => tier.period)).toEqual(plans.map((plan) => plan.period))
        }
    })

    it("fills the specimen board in full when it has any plates, before the prices", () => {
        const ids = homeLanding("", NOW).sections.map((section) => section.id)
        expect(ids.includes("specimens")).toBe(specimens.items.length > 0)
        if (specimens.items.length === 0) return
        expect(ids.indexOf("specimens")).toBeLessThan(ids.indexOf("plans"))
        expect(specimens.title, "specimens title").not.toBe("")
        expect(specimens.items.length, "specimen plates").toBeGreaterThanOrEqual(3)
        for (const item of specimens.items) {
            expect(item.name, "specimen name").not.toBe("")
            expect(item.description, `${item.name} description`).not.toBe("")
            expect(item.image.alt, `${item.name} alt text`).not.toBe("")
            expect(item.image.srcSet.map((entry) => entry.src)).toContain(item.image.src)
            for (const entry of item.image.srcSet) {
                expect(publicAssetPresent(path.join(PUBLIC_DIR, entry.src)), `missing ${entry.src}`).toBe(
                    true,
                )
            }
        }
    })
})
