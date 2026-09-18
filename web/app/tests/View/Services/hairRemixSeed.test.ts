import path from "node:path"
import { describe, expect, it } from "vitest"
import hairCatalog from "../../../../../packs/services-hair/catalog.json"
import { parseAppointmentsContent } from "../../../src/View/Landing/practiceDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/Services/content"
import * as hair from "../../../src/View/Services/hairRemix.content"

/**
 * The services-hair remix seed's parity gate — the same discipline as the
 * landscape/painting seeds in remixSeeds.test.ts (that file is pinned, so
 * this wave's seed gets its own sibling suite). The seed is composed over
 * the services pack's content module verbatim, so it must remain a
 * structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, its catalog's appointments seed mirrored entry
 * for entry, and every image real under the seed's own public directory.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/services-hair/"

type ContentModule = typeof base

const module_: ContentModule = hair

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
        ...module.projects.flatMap((project) => [
            { label: `project ${project.slug} before`, image: project.before },
            { label: `project ${project.slug} after`, image: project.after },
        ]),
    ]
}

describe("services hair remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module_).sort()).toEqual(Object.keys(base).sort())
    })

    it("mirrors its own catalog's appointments seed entry for entry", () => {
        expect(hairCatalog.content.appointments).toEqual(module_.codeAppointments)
        const parsed = parseAppointmentsContent({ appointments: module_.codeAppointments })
        expect(parsed).toEqual(module_.codeAppointments)
    })

    it("meets the content contract's minimums", () => {
        expect(module_.business.name).not.toBe("")
        expect(module_.business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(module_.business.license).not.toBe("")
        expect(module_.serviceArea.length).toBeGreaterThan(0)
        expect(module_.services.length).toBeGreaterThanOrEqual(3)
        expect(module_.projects.length).toBeGreaterThanOrEqual(2)
        expect(module_.metrics.length).toBeGreaterThanOrEqual(2)
        expect(module_.testimonials.length).toBeGreaterThanOrEqual(2)
        expect(module_.faq.length).toBeGreaterThanOrEqual(3)
        expect(module_.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(module_.about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(module_.quote.headline).not.toBe("")
        expect(module_.quote.body).not.toBe("")
    })

    it("keeps slugs unique and every before/after pair distinct", () => {
        const slugs = [...module_.services, ...module_.projects].map((entry) => entry.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const project of module_.projects) {
            expect(project.before.src, `${project.slug} before must differ from after`).not.toBe(
                project.after.src,
            )
        }
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        for (const { label, image } of allImages(module_)) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.src, `${label} must live under ${PUBLIC_PREFIX}`).toMatch(
                new RegExp(`^${PUBLIC_PREFIX.replace(/[/-]/g, "\\$&")}`),
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

    it("keeps the home teaser drawn from real projects", () => {
        expect(module_.home.featuredProjects.length).toBeGreaterThan(0)
        for (const featured of module_.home.featuredProjects) {
            expect(module_.projects).toContain(featured)
        }
    })

    it("keeps weekly hours inside a day and the hero badge derivable", () => {
        for (const day of module_.weeklyHours) {
            expect(day.day).toBeGreaterThanOrEqual(0)
            expect(day.day).toBeLessThanOrEqual(6)
            for (const [open, close] of day.intervals) {
                expect(close).toBeGreaterThan(open)
                expect(close).toBeLessThanOrEqual(24 * 60)
            }
        }
    })
})
