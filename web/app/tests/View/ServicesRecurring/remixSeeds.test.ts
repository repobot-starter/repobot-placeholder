/**
 * The derived-template seeds' parity gate for the recurring/booking shape.
 * A remix seed (packs/README.md "Derived templates") is composed over the
 * services-recurring pack's content module verbatim, so each seed must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, and every image real under the seed's own
 * public directory. These tests fail the moment the pack's contract moves
 * without its seeds.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/ServicesRecurring/content"
import * as lawncare from "../../../src/View/ServicesRecurring/lawncareRemix.content"
import * as pest from "../../../src/View/ServicesRecurring/pestRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

const seeds: { name: string; module: ContentModule; publicPrefix: string }[] = [
    { name: "lawncare", module: lawncare, publicPrefix: "/services-lawncare/" },
    { name: "pest", module: pest, publicPrefix: "/services-pest/" },
]

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.gallery.map((entry, index) => ({ label: `gallery ${index}`, image: entry.image })),
    ]
}

describe.each(seeds)("recurring $name remix seed", ({ module, publicPrefix }) => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module).sort()).toEqual(Object.keys(base).sort())
    })

    it("meets the content contract's minimums", () => {
        expect(module.business.name).not.toBe("")
        expect(module.business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(module.business.license).not.toBe("")
        expect(module.serviceArea.length).toBeGreaterThan(0)
        expect(module.plans.length).toBeGreaterThanOrEqual(2)
        expect(module.included.length).toBeGreaterThanOrEqual(3)
        expect(module.metrics.length).toBeGreaterThanOrEqual(2)
        expect(module.testimonials.length).toBeGreaterThanOrEqual(2)
        expect(module.gallery.length).toBeGreaterThanOrEqual(2)
        expect(module.faq.length).toBeGreaterThanOrEqual(3)
        expect(module.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(module.about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(module.book.headline).not.toBe("")
        expect(module.book.body).not.toBe("")
    })

    it("keeps plans priced, unique, and the comparison table aligned", () => {
        const slugs = module.plans.map((plan) => plan.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const plan of module.plans) {
            expect(plan.perVisit, `${plan.slug} per-visit price`).toBeGreaterThan(0)
            expect(plan.features.length, `${plan.slug} features`).toBeGreaterThan(0)
        }
        // One criterion column plus one column per plan, and every row
        // carries exactly one value per plan — the table renders blind.
        expect(module.planComparison.columns.length).toBe(module.plans.length + 1)
        for (const row of module.planComparison.rows) {
            expect(row.values.length, `comparison row '${row.label}'`).toBe(module.plans.length)
        }
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        for (const { label, image } of allImages(module)) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.src, `${label} must live under ${publicPrefix}`).toMatch(
                new RegExp(`^${publicPrefix.replace(/[/-]/g, "\\$&")}`),
            )
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
})
