import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    business,
    faq,
    home,
    metrics,
    projects,
    quote,
    serviceArea,
    services,
    testimonials,
    weeklyHours,
    type SiteImage,
} from "../../../src/View/Services/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "home.heroImage", image: home.heroImage },
        { label: "about.photo", image: about.photo },
        ...services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
        ...projects.flatMap((project) => [
            { label: `project ${project.slug} before`, image: project.before },
            { label: `project ${project.slug} after`, image: project.after },
        ]),
    ]
}

describe("services content", () => {
    it("ships the business identity a trades site can't render without", () => {
        expect(business.name).not.toBe("")
        expect(business.phone).not.toBe("")
        // Click-to-call is the pack's point: the href must be a tel: link
        // for the number the site displays.
        expect(business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(business.license).not.toBe("")
        expect(serviceArea.length).toBeGreaterThan(0)
    })

    it("meets the content contract's minimums", () => {
        // packs/services/catalog.json contentContract — the module satisfies
        // the contract; the contract never drifts ahead of it.
        expect(services.length).toBeGreaterThanOrEqual(3)
        expect(projects.length).toBeGreaterThanOrEqual(2)
        expect(metrics.length).toBeGreaterThanOrEqual(2)
        expect(testimonials.length).toBeGreaterThanOrEqual(2)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(quote.headline).not.toBe("")
        expect(quote.body).not.toBe("")
    })

    it("keeps service and project slugs unique and URL-safe", () => {
        const serviceSlugs = services.map((service) => service.slug)
        expect(new Set(serviceSlugs).size).toBe(serviceSlugs.length)
        const projectSlugs = projects.map((project) => project.slug)
        expect(new Set(projectSlugs).size).toBe(projectSlugs.length)
        for (const slug of [...serviceSlugs, ...projectSlugs]) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
        }
    })

    it("ships every service with a description and an honest price note", () => {
        for (const service of services) {
            expect(service.title, `${service.slug} title`).not.toBe("")
            expect(service.description, `${service.slug} description`).not.toBe("")
            expect(service.priceNote, `${service.slug} price note`).not.toBe("")
        }
    })

    it("keeps every before/after pair complete and distinct", () => {
        for (const project of projects) {
            expect(project.title, `${project.slug} title`).not.toBe("")
            expect(project.scope, `${project.slug} scope`).not.toBe("")
            // The comparison only convinces when both frames exist and the
            // divider actually uncovers a different photograph.
            expect(project.before.src, `${project.slug} needs a before frame`).not.toBe("")
            expect(project.after.src, `${project.slug} needs an after frame`).not.toBe("")
            expect(project.before.src, `${project.slug} before must differ from after`).not.toBe(
                project.after.src,
            )
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

    it("keeps the home teaser drawn from real projects", () => {
        expect(home.featuredProjects.length).toBeGreaterThan(0)
        for (const featured of home.featuredProjects) {
            expect(projects).toContain(featured)
        }
    })
})
