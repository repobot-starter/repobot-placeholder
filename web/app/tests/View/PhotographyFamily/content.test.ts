import path from "node:path"
import { describe, expect, it } from "vitest"
import familyCatalog from "../../../../../packs/photography-family/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import {
    about,
    albums,
    book,
    codeAppointments,
    demoProofingAlbums,
    galleries,
    heroSlides,
    home,
    inquire,
    investment,
    photoId,
    photographer,
    selectedWork,
    type PhotoImage,
} from "../../../src/View/PhotographyFamily/content"
import { publicAssetPresent } from "../../helpers/publicAssets"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: PhotoImage }[] {
    return [
        ...albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...selectedWork.map((image, i) => ({ label: `selectedWork[${i}]`, image })),
        ...demoProofingAlbums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `proofing ${album.slug}[${i}]`, image })),
        ),
        { label: "about.portrait", image: about.portrait },
    ]
}

describe("photography-family content", () => {
    it("ships albums with covers, descriptions, and at least one image each", () => {
        // packs/photography-family/catalog.json contentContract minimums —
        // the module satisfies the contract; the contract never drifts
        // ahead of it.
        expect(albums.length).toBeGreaterThanOrEqual(2)
        for (const album of albums) {
            expect(album.title).not.toBe("")
            expect(album.eyebrow).not.toBe("")
            expect(album.description).not.toBe("")
            expect(album.images.length).toBeGreaterThanOrEqual(4)
        }
        expect(selectedWork.length).toBeGreaterThanOrEqual(4)
        expect(heroSlides.length).toBeGreaterThanOrEqual(1)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.testimonials.length).toBeGreaterThanOrEqual(1)
    })

    it("keeps album slugs unique and URL-safe", () => {
        const slugs = albums.map((album) => album.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
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

    it("keeps the investment page's offerings priced flat with one spine", () => {
        expect(investment.offerings.length).toBeGreaterThanOrEqual(2)
        for (const offering of investment.offerings) {
            expect(offering.name).not.toBe("")
            expect(offering.price, `${offering.name} price`).toBeGreaterThan(0)
            expect(Number.isInteger(offering.price), `${offering.name} price is whole dollars`).toBe(true)
            expect(offering.includes.length, `${offering.name} includes`).toBeGreaterThanOrEqual(2)
        }
        // Exactly one highlighted offering: the pricing section's spine.
        expect(investment.offerings.filter((offering) => offering.highlighted).length).toBe(1)
        expect(investment.faq.length).toBeGreaterThanOrEqual(3)
        for (const entry of investment.faq) {
            expect(entry.question).not.toBe("")
            expect(entry.answer).not.toBe("")
        }
    })

    it("keeps user-facing copy free of platform naming and clinical language", () => {
        const copy = JSON.stringify({
            photographer,
            home,
            about,
            investment,
            book,
            galleries,
            inquire,
            codeAppointments,
        })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
        // The booking door's NEW/RETURNING vocabulary wears photographer
        // copy here ("first session / returning family") — nothing on this
        // site may read as a clinical intake.
        expect(copy).not.toMatch(/patient/i)
    })
})

describe("photography-family booking contract", () => {
    it("parses contract-clean: the code fallback IS a valid appointments document", () => {
        // The export is contract-shaped on purpose — an owner's Manage
        // edit and this file walk the same rendering path, so the code
        // content must survive its own domain parser without the domain
        // dropping.
        const parsed = parseAppointmentsContent({ appointments: codeAppointments })
        expect(parsed).toEqual(codeAppointments)
    })

    it("mirrors the catalog's content seed entry for entry", () => {
        // The seed compose stamps into repobot.content.json must be a
        // structural twin of the module: a freshly composed template
        // renders identically from the document or the code fallback, and
        // the Manage session calendar opens on exactly the offering the
        // site already shows.
        expect(familyCatalog.content.appointments).toEqual(codeAppointments)
    })

    it("keeps session ids on the contract grammar and windows inside a day", () => {
        for (const type of codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const provider of codeAppointments.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.start, label).toBeGreaterThanOrEqual(0)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
                expect(window.end, label).toBeGreaterThan(window.start)
            }
        }
    })

    it("projects a real week of slots without hitting the truncation ceiling", () => {
        // A truncated week would silently drop late-week availability;
        // kernel and platform run the same derivation, so this pins both.
        const slots = generateAppointmentSlots(codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })
})

describe("photography-family proofing demo fixtures", () => {
    it("ships demo rooms with preview PINs, clients, and images", () => {
        expect(demoProofingAlbums.length).toBeGreaterThan(0)
        for (const album of demoProofingAlbums) {
            expect(album.title).not.toBe("")
            expect(album.clientName).not.toBe("")
            expect(album.note).not.toBe("")
            // Fictional preview PIN only — published sites never consult this.
            expect(album.accessCode, `${album.slug} demo access code`).toMatch(/^\d{4,6}$/)
            expect(album.images.length).toBeGreaterThan(0)
        }
        // The funnel screenshots the Ashford room; it must look populated.
        const ashford = demoProofingAlbums.find((album) => album.slug === "ashford-family")
        expect(ashford, "ashford-family is the funnel's demo gallery").toBeDefined()
        expect(ashford?.images.length).toBeGreaterThanOrEqual(8)
    })

    it("keeps demo proofing slugs unique, URL-safe, and unlisted from public albums", () => {
        const slugs = demoProofingAlbums.map((album) => album.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        const publicSlugs = new Set(albums.map((album) => album.slug))
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
            // A collision would make an unlisted gallery reachable from /work.
            expect(publicSlugs.has(slug), `${slug} collides with a public album`).toBe(false)
        }
    })

    it("keeps the Galleries page's sample room pointed at a live fixture", () => {
        // The /galleries page is the site's client-facing proofing story
        // (the owner mandate: templates must allude to proofing). Its
        // sample section walks visitors into a real demo room — the slug,
        // the code, and the code printed in the copy must all match the
        // fixture, or the walkthrough dead-ends at the gate.
        const sample = demoProofingAlbums.find((album) => album.slug === galleries.sample.slug)
        expect(sample, "galleries.sample.slug must name a demo room").toBeDefined()
        expect(galleries.sample.code).toBe(sample?.accessCode)
        expect(galleries.sample.body).toContain(galleries.sample.code)
        expect(galleries.steps.length).toBeGreaterThanOrEqual(3)
    })

    it("derives stable, unique frame ids inside each demo proofing album", () => {
        expect(photoId(albums[0].images[0])).toBe("golden-hour-01")
        for (const album of demoProofingAlbums) {
            const ids = album.images.map((image) => photoId(image))
            expect(new Set(ids).size, `${album.slug} frame ids must be unique`).toBe(ids.length)
            for (const id of ids) {
                expect(id).toMatch(/^[a-z0-9-]+$/)
            }
        }
    })
})
