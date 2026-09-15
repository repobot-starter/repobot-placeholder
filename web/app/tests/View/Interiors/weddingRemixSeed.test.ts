import path from "node:path"
import { describe, expect, it } from "vitest"
import weddingCatalog from "../../../../../packs/interiors-wedding/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
} from "../../../src/View/Landing/practiceDocument"
import { parseContentProjects, projectCategories } from "../../../src/View/Landing/projectsDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/Interiors/content"
import * as wedding from "../../../src/View/Interiors/weddingRemix.content"

/**
 * The interiors-wedding remix seed's parity gate (the services family's
 * remixSeeds discipline, the architecture seed's sibling). The seed
 * (packs/README.md "Derived templates") is composed over the interiors
 * pack's content module verbatim, so it must remain a structural twin of
 * `content.ts`: the same export surface, the contract's minimums met, its
 * catalog's content seeds mirrored entry for entry (projects minus the
 * code-owned photographs, appointments exactly), and every image real
 * under the seed's own public directory. These tests fail the moment the
 * pack's contract moves without its seed — the drift that would otherwise
 * surface as a broken published template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/interiors-wedding/"

type ContentModule = typeof base

const module_: ContentModule = wedding

/** Deep key shape (arrays walk their first entry) — the landingCopy twin. */
function keyShape(value: unknown): unknown {
    if (Array.isArray(value)) return value.length > 0 ? [keyShape(value[0])] : []
    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, entry]) => [key, keyShape(entry)]),
        )
    }
    return typeof value
}

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.projects.map((project) => ({ label: `project ${project.slug}`, image: project.image })),
        ...module.services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
    ]
}

describe("interiors wedding remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module_).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (interiorsLanding reads every key)", () => {
        expect(keyShape(module_.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's content seeds entry for entry, both domains", () => {
        // resolveCatalog merges a remix's content per-domain over the
        // base's, so the catalog must reseed BOTH domains to match ITS
        // contentSeed module — projects minus the code-owned photographs
        // (the contract moves words, never bytes; inventory.ts joins the
        // images back by slug), appointments exactly.
        const facts = module_.projects.map(({ image: _image, ...entry }) => entry)
        expect(weddingCatalog.content.projects.entries).toEqual(facts)
        expect(parseContentProjects({ projects: { entries: facts } })).toEqual(facts)
        expect(weddingCatalog.content.appointments).toEqual(module_.codeAppointments)
        expect(parseAppointmentsContent({ appointments: module_.codeAppointments })).toEqual(
            module_.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        // packs/interiors/catalog.json contentContract — inherited whole by
        // the remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(module_.studio.name).not.toBe("")
        expect(module_.studio.principal).not.toBe("")
        expect(module_.studio.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(module_.studio.credentialLine).not.toBe("")
        expect(module_.projects.length).toBeGreaterThanOrEqual(5)
        expect(module_.services.length).toBeGreaterThanOrEqual(3)
        expect(module_.metrics.length).toBeGreaterThanOrEqual(3)
        expect(module_.testimonials.length).toBeGreaterThanOrEqual(3)
        expect(module_.process.steps.length).toBeGreaterThanOrEqual(3)
        expect(module_.faq.length).toBeGreaterThanOrEqual(3)
        expect(module_.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(module_.about.credentials.length).toBeGreaterThanOrEqual(3)
        expect(module_.contact.headline).not.toBe("")
        expect(module_.contact.body).not.toBe("")
    })

    it("derives a real taxonomy: several categories, each spelled once", () => {
        const categories = projectCategories(module_.projects)
        // The filterable grid is the pack family's signature — a
        // one-category portfolio would render a pointless chip row.
        expect(categories.length).toBeGreaterThanOrEqual(3)
        const folded = categories.map((category) => category.toLowerCase().trim())
        expect(new Set(folded).size).toBe(folded.length)
    })

    it("keeps slugs unique and URL-safe, and every fact filled", () => {
        const slugs = [...module_.projects.map((p) => p.slug), ...module_.services.map((s) => s.slug)]
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
        }
        for (const project of module_.projects) {
            expect(project.title, `${project.slug} title`).not.toBe("")
            expect(project.category, `${project.slug} category`).not.toBe("")
            expect(project.description, `${project.slug} description`).not.toBe("")
            expect(project.year, `${project.slug} year`).toBeGreaterThan(2000)
        }
        for (const service of module_.services) {
            expect(service.title, `${service.slug} title`).not.toBe("")
            expect(service.description, `${service.slug} description`).not.toBe("")
            expect(service.investment, `${service.slug} investment`).toMatch(/\$/)
        }
    })

    it("features some of the portfolio but not all of it", () => {
        const featured = module_.projects.filter((project) => project.featured === true)
        expect(featured.length).toBeGreaterThan(0)
        expect(featured.length).toBeLessThan(module_.projects.length)
    })

    it("keeps the booking calendar well-formed for the slot projection", () => {
        expect(module_.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        for (const type of module_.codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const provider of module_.codeAppointments.providers) {
            expect(provider.windows.length, `${provider.providerId} windows`).toBeGreaterThan(0)
            for (const window of provider.windows) {
                expect(window.day).toBeGreaterThanOrEqual(0)
                expect(window.day).toBeLessThanOrEqual(6)
                expect(window.end).toBeGreaterThan(window.start)
                expect(window.end).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(module_.codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
        expect(module_.booking.headline).not.toBe("")
        expect(module_.booking.statusLabels.new).not.toBe("")
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        for (const { label, image } of allImages(module_)) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.width, `${label} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${label} needs a height`).toBeGreaterThan(0)
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
})
