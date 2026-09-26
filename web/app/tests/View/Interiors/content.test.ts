import path from "node:path"
import { describe, expect, it } from "vitest"
import interiorsCatalog from "../../../../../packs/interiors/catalog.json"
import { parseAppointmentsContent } from "../../../src/View/Landing/practiceDocument"
import { parseContentProjects, projectCategories } from "../../../src/View/Landing/projectsDocument"
import { composedContentSeed } from "../../helpers/composedSeed"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    booking,
    codeAppointments,
    contact,
    faq,
    home,
    metrics,
    process,
    projects,
    services,
    studio,
    testimonials,
    type SiteImage,
} from "../../../src/View/Interiors/content"
import { codePortfolio, withProjectImages } from "../../../src/View/Interiors/inventory"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "home.heroImage", image: home.heroImage },
        { label: "about.photo", image: about.photo },
        ...projects.map((project) => ({ label: `project ${project.slug}`, image: project.image })),
        ...services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
    ]
}

describe("interiors content", () => {
    it("ships the identity a studio site can't render without", () => {
        expect(studio.name).not.toBe("")
        expect(studio.principal).not.toBe("")
        expect(studio.phone).not.toBe("")
        // Click-to-call: the href must be a tel: link for the number the
        // site displays.
        expect(studio.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        // The credential line renders wherever trust is being earned —
        // the footer, the metrics strips, the about bullets.
        expect(studio.credentialLine).not.toBe("")
    })

    it("meets the content contract's minimums", () => {
        // packs/interiors/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(projects.length).toBeGreaterThanOrEqual(5)
        expect(services.length).toBeGreaterThanOrEqual(3)
        expect(metrics.length).toBeGreaterThanOrEqual(3)
        expect(testimonials.length).toBeGreaterThanOrEqual(3)
        expect(process.steps.length).toBeGreaterThanOrEqual(3)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.credentials.length).toBeGreaterThanOrEqual(3)
        expect(contact.headline).not.toBe("")
        expect(contact.body).not.toBe("")
    })

    it("keeps every project entry valid under the projects domain's parser", () => {
        // The portfolio IS the contract shape (plus its photograph): the
        // kernel's parser must accept every entry, or a Manage round-trip
        // would silently drop cards the code path renders.
        const facts = projects.map(({ image: _image, ...entry }) => entry)
        expect(parseContentProjects({ projects: { entries: facts } })).toEqual(facts)
    })

    it("mirrors the catalog's projects seed entry for entry (minus photographs)", () => {
        // The compose seed and the code fallback must be twins: the
        // composed template's Manage editor opens on exactly the portfolio
        // the pages render. Images stay out of the contract by design —
        // the pack joins them back by slug (inventory.ts).
        //
        // The twin is the seed of the pack THIS tree was composed for: a
        // remix of interiors replaces the module with its own contentSeed
        // and reseeds both domains in its catalog, so comparing the base
        // catalog here would fail every remix tree by construction.
        const seed = composedContentSeed("interiors", interiorsCatalog.content) as {
            projects: { entries: unknown }
            appointments: unknown
        }
        const facts = projects.map(({ image: _image, ...entry }) => entry)
        expect(seed.projects.entries).toEqual(facts)
    })

    it("mirrors the catalog's appointments seed exactly", () => {
        const seed = composedContentSeed("interiors", interiorsCatalog.content) as {
            appointments: unknown
        }
        expect(seed.appointments).toEqual(codeAppointments)
        const parsed = parseAppointmentsContent({ appointments: codeAppointments })
        expect(parsed).toEqual(codeAppointments)
    })

    it("derives a real taxonomy: several categories, each spelled once", () => {
        const categories = projectCategories(projects)
        // The filterable grid is the pack's signature — a one-category
        // portfolio would render a pointless chip row.
        expect(categories.length).toBeGreaterThanOrEqual(3)
        // Categories are the filter axis: near-duplicate spellings would
        // split one shelf into two chips.
        const folded = categories.map((category) => category.toLowerCase().trim())
        expect(new Set(folded).size).toBe(folded.length)
    })

    it("keeps project and service slugs unique and URL-safe", () => {
        const slugs = [...projects.map((p) => p.slug), ...services.map((s) => s.slug)]
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
        }
    })

    it("gives every project its facts and every service its honest number", () => {
        for (const project of projects) {
            expect(project.title, `${project.slug} title`).not.toBe("")
            expect(project.category, `${project.slug} category`).not.toBe("")
            expect(project.description, `${project.slug} description`).not.toBe("")
            expect(project.year, `${project.slug} year`).toBeGreaterThan(2000)
        }
        for (const service of services) {
            expect(service.title, `${service.slug} title`).not.toBe("")
            expect(service.description, `${service.slug} description`).not.toBe("")
            expect(service.investment, `${service.slug} investment`).toMatch(/\$/)
        }
    })

    it("features some of the portfolio but not all of it", () => {
        // The home rail is a curation: everything featured reads as no
        // curation at all, nothing featured empties the rail.
        const featured = projects.filter((project) => project.featured === true)
        expect(featured.length).toBeGreaterThan(0)
        expect(featured.length).toBeLessThan(projects.length)
    })

    it("keeps the booking calendar well-formed for the slot projection", () => {
        expect(codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        for (const type of codeAppointments.types) {
            expect(type.durationMinutes, `${type.typeId} duration`).toBeGreaterThan(0)
        }
        for (const provider of codeAppointments.providers) {
            expect(provider.windows.length, `${provider.providerId} windows`).toBeGreaterThan(0)
            for (const window of provider.windows) {
                expect(window.day).toBeGreaterThanOrEqual(0)
                expect(window.day).toBeLessThanOrEqual(6)
                expect(window.end).toBeGreaterThan(window.start)
                expect(window.end).toBeLessThanOrEqual(24 * 60)
            }
        }
        expect(booking.headline).not.toBe("")
        expect(booking.statusLabels.new).not.toBe("")
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

    it("joins photographs back by slug, signature room for unknown slugs", () => {
        // The inventory join: a document edit keeps its code photograph;
        // a project minted in Manage renders under the signature room
        // until a photograph is produced for its slug.
        expect(codePortfolio()).toEqual(projects)
        const facts = projects.map(({ image: _image, ...entry }) => entry)
        expect(withProjectImages(facts)).toEqual(projects)
        const minted = withProjectImages([
            { slug: "brand-new", title: "New Project", category: "Full home", description: "" },
        ])
        expect(minted[0].image).toEqual(home.heroImage)
    })
})
