/**
 * The restyled recurring skins' own promises, beside the pinned parity gate
 * (remixSeeds.test.ts): every image a seed can render — the rail, the
 * checklist, the specimen board, not only the hero and gallery — is real
 * under the seed's own directory, each skin words its own booking strip,
 * and exactly one plan wears the recommendation.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/ServicesRecurring/content"
import * as lawncare from "../../../src/View/ServicesRecurring/lawncareCrewRemix.content"
import * as linen from "../../../src/View/ServicesRecurring/linenRemix.content"
import * as pest from "../../../src/View/ServicesRecurring/pestCreatureRemix.content"
import * as turnover from "../../../src/View/ServicesRecurring/turnoverRemix.content"
import * as worth from "../../../src/View/ServicesRecurring/worthRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

const seeds: { name: string; module: ContentModule; publicPrefix: string }[] = [
    { name: "turnover", module: turnover, publicPrefix: "/services-recurring-turnover/" },
    { name: "lawncare-crew", module: lawncare, publicPrefix: "/services-lawncare-crew/" },
    { name: "pest-creature", module: pest, publicPrefix: "/services-pest-creature/" },
    { name: "linen", module: linen, publicPrefix: "/services-recurring-linen/" },
    { name: "worth", module: worth, publicPrefix: "/services-recurring-worth/" },
]

/** Every image slot the seed fills beyond the hero, about photo, and gallery. */
function storyImages(module: ContentModule): { label: string; image: base.SiteImage }[] {
    return [
        ...module.turnover.steps.flatMap((step, index) =>
            step.image !== undefined ? [{ label: `turnover step ${index}`, image: step.image }] : [],
        ),
        ...(module.roomReady.photo ? [{ label: "roomReady.photo", image: module.roomReady.photo }] : []),
        ...module.specimens.items.map((item, index) => ({ label: `specimen ${index}`, image: item.image })),
    ]
}

describe.each(seeds)("recurring $name skin", ({ module, publicPrefix }) => {
    it("keeps every story image real, described, and under the seed's own directory", () => {
        for (const { label, image } of storyImages(module)) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.src.startsWith(publicPrefix), `${label} must live under ${publicPrefix}`).toBe(true)
            expect(
                image.srcSet.map((entry) => entry.src),
                `${label} src must be a srcSet variant`,
            ).toContain(image.src)
            for (const entry of image.srcSet) {
                expect(
                    publicAssetPresent(path.join(PUBLIC_DIR, entry.src)),
                    `${label}: missing ${entry.src}`,
                ).toBe(true)
            }
        }
    })

    it("words its own booking strip", () => {
        // A seed that inherits the base's privacy note or status labels
        // reads as another business's promise on the /book page.
        expect(module.booking.privacyNote, "booking privacy note").toBeDefined()
        // A composed skin tree copies its seed over content.ts — nothing to compare.
        if (module.business.name === base.business.name) return
        expect(module.booking.privacyNote).not.toBe(base.booking.privacyNote)
        expect(module.booking.statusLabels.new).not.toBe(base.booking.statusLabels.new)
    })

    it("recommends exactly one plan", () => {
        expect(module.plans.filter((plan) => plan.highlighted).length).toBe(1)
    })
})
