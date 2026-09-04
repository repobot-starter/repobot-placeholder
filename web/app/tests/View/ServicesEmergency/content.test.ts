import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    business,
    dispatchBadge,
    faq,
    home,
    metrics,
    request,
    serviceArea,
    services,
    steps,
    testimonials,
    type SiteImage,
} from "../../../src/View/ServicesEmergency/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "home.heroImage", image: home.heroImage },
        { label: "about.photo", image: about.photo },
        ...services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
    ]
}

describe("services-emergency content", () => {
    it("ships the business identity a dispatch site can't render without", () => {
        expect(business.name).not.toBe("")
        expect(business.phone).not.toBe("")
        // Click-to-call is the pack's point: the href must be a tel: link
        // for the number the site displays.
        expect(business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(business.license).not.toBe("")
        expect(dispatchBadge).not.toBe("")
        expect(serviceArea.length).toBeGreaterThan(0)
    })

    it("meets the content contract's minimums", () => {
        // packs/services-emergency/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(services.length).toBeGreaterThanOrEqual(3)
        expect(metrics.length).toBeGreaterThanOrEqual(2)
        expect(steps.items.length).toBeGreaterThanOrEqual(3)
        expect(testimonials.length).toBeGreaterThanOrEqual(2)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(request.headline).not.toBe("")
        expect(request.body).not.toBe("")
    })

    it("keeps service slugs unique and URL-safe", () => {
        const slugs = services.map((service) => service.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
        }
    })

    it("ships every service with a description and a flat price note", () => {
        for (const service of services) {
            expect(service.title, `${service.slug} title`).not.toBe("")
            expect(service.description, `${service.slug} description`).not.toBe("")
            // The shape's credibility rests on printed prices: every card
            // says something honest about cost, even when it's "no
            // after-hours upcharge".
            expect(service.priceNote, `${service.slug} price note`).not.toBe("")
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
})
