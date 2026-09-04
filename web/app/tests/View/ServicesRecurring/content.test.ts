import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    book,
    business,
    faq,
    gallery,
    home,
    included,
    metrics,
    planComparison,
    plans,
    serviceArea,
    testimonials,
    weeklyHours,
    type SiteImage,
} from "../../../src/View/ServicesRecurring/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "home.heroImage", image: home.heroImage },
        { label: "about.photo", image: about.photo },
        ...gallery.map((entry, index) => ({ label: `gallery ${index}`, image: entry.image })),
    ]
}

describe("services-recurring content", () => {
    it("ships the business identity a home-services site can't render without", () => {
        expect(business.name).not.toBe("")
        expect(business.phone).not.toBe("")
        expect(business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(business.license).not.toBe("")
        expect(serviceArea.length).toBeGreaterThan(0)
    })

    it("meets the content contract's minimums", () => {
        // packs/services-recurring/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(plans.length).toBeGreaterThanOrEqual(2)
        expect(included.length).toBeGreaterThanOrEqual(4)
        expect(gallery.length).toBeGreaterThanOrEqual(2)
        expect(metrics.length).toBeGreaterThanOrEqual(2)
        expect(testimonials.length).toBeGreaterThanOrEqual(2)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(book.headline).not.toBe("")
        expect(book.body).not.toBe("")
    })

    it("keeps plan slugs unique and every plan honestly priced", () => {
        const slugs = plans.map((plan) => plan.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const plan of plans) {
            expect(plan.slug).toMatch(/^[a-z0-9-]+$/)
            expect(plan.name, `${plan.slug} name`).not.toBe("")
            expect(plan.perVisit, `${plan.slug} per-visit price`).toBeGreaterThan(0)
            expect(plan.features.length, `${plan.slug} features`).toBeGreaterThan(0)
        }
        // Exactly one plan wears the recommendation treatment.
        expect(plans.filter((plan) => plan.highlighted).length).toBe(1)
    })

    it("keeps the comparison table squared to its plans", () => {
        // One label column plus one column per plan, and every row carries
        // exactly one value per plan — a ragged table renders as a lie.
        expect(planComparison.columns.length).toBe(plans.length + 1)
        expect(planComparison.columns[0]).toBe("")
        for (const row of planComparison.rows) {
            expect(row.label, "comparison row label").not.toBe("")
            expect(row.values.length, `row "${row.label}" needs one value per plan`).toBe(plans.length)
        }
    })

    it("gives every image intrinsic dimensions, alt text, and a srcSet", () => {
        for (const { label, image } of allImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.width, `${label} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${label} needs a height`).toBeGreaterThan(0)
            expect(image.srcSet.length, `${label} needs srcSet entries`).toBeGreaterThan(0)
            // The default src must be one of the srcSet variants, so the
            // browser never fetches a size the responsive verb didn't emit.
            expect(
                image.srcSet.map((entry) => entry.src),
                `${label} src must be a srcSet variant`,
            ).toContain(image.src)
        }
    })

    it("points every srcSet variant at a file that exists in public/", () => {
        for (const { label, image } of allImages()) {
            for (const entry of image.srcSet) {
                const file = path.join(PUBLIC_DIR, entry.src)
                expect(publicAssetPresent(file), `${label}: missing ${entry.src}`).toBe(true)
            }
        }
    })

    it("keeps the weekly hours well-formed for the live badge", () => {
        expect(weeklyHours.length).toBeGreaterThan(0)
        for (const day of weeklyHours) {
            expect(day.day).toBeGreaterThanOrEqual(0)
            expect(day.day).toBeLessThanOrEqual(6)
            for (const [open, close] of day.intervals) {
                expect(open, `day ${day.day} opens in range`).toBeGreaterThanOrEqual(0)
                expect(close, `day ${day.day} closes in range`).toBeLessThanOrEqual(1440)
                expect(open, `day ${day.day} opens before it closes`).toBeLessThan(close)
            }
        }
    })
})
