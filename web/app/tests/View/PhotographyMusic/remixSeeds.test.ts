/**
 * The photography-music derived-template seeds' parity gate. A remix seed
 * (packs/README.md "Derived templates") is composed over the music-
 * photography pack's content module verbatim, so each seed must remain a structural
 * twin of `content.ts`: the same export surface, the contract's minimums
 * met, its catalog's appointments seed mirrored entry for entry, and every
 * image real under the seed's own public directory. These tests fail the
 * moment the pack's contract moves without its seeds — the drift that
 * would otherwise surface as a broken published template.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import theoCatalog from "../../../../../packs/photography-music-theo/catalog.json"
import {
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/PhotographyMusic/content"
import * as theo from "../../../src/View/PhotographyMusic/theoRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

const seeds: {
    name: string
    module: ContentModule
    publicPrefix: string
    catalog: { content: { appointments: unknown } }
}[] = [{ name: "theo", module: theo, publicPrefix: "/photography-music-theo/", catalog: theoCatalog }]

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule): { label: string; image: base.PhotoImage }[] {
    return [
        ...module.albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...module.heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...module.reel.map((image, i) => ({ label: `reel[${i}]`, image })),
        ...module.home.records.covers.map((cover, i) => ({
            label: `records.covers[${i}]`,
            image: cover.image,
        })),
        ...module.demoProofingAlbums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `proofing ${album.slug}[${i}]`, image })),
        ),
        ...Object.entries(module.sessionBooking.sessionImages).map(([typeId, image]) => ({
            label: `session ${typeId}`,
            image,
        })),
        { label: "about.portrait", image: module.about.portrait },
        { label: "galleries.sample.image", image: module.galleries.sample.image },
    ]
}

describe.each(seeds)("photography-music $name remix seed", ({ module, publicPrefix, catalog }) => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps home a structural twin of the base's (the builders read every key)", () => {
        expect(Object.keys(module.home).sort()).toEqual(Object.keys(base.home).sort())
        expect(Object.keys(module.home.records.closing).sort()).toEqual(
            Object.keys(base.home.records.closing).sort(),
        )
    })

    it("mirrors its own catalog's appointments seed entry for entry", () => {
        expect(catalog.content.appointments).toEqual(module.codeAppointments)
        expect(parseAppointmentsContent({ appointments: module.codeAppointments })).toEqual(
            module.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        // packs/photography-music/catalog.json contentContract — inherited whole by
        // the remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(module.photographer.name).not.toBe("")
        expect(module.photographer.email).toMatch(/@/)
        expect(module.heroSlides.length).toBeGreaterThanOrEqual(1)
        expect(module.reel.length).toBeGreaterThanOrEqual(4)
        expect(module.albums.length).toBeGreaterThanOrEqual(2)
        for (const album of module.albums) {
            expect(album.images.length, album.slug).toBeGreaterThanOrEqual(4)
        }
        expect(module.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(module.about.testimonials.length).toBeGreaterThanOrEqual(1)
        expect(module.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(module.codeAppointments.providers.length).toBeGreaterThanOrEqual(1)
        expect(module.galleries.steps.length).toBeGreaterThanOrEqual(2)
    })

    it("hangs the record wall: square sleeves, each with an artist and a title", () => {
        expect(module.home.layout).toBe("records")
        expect(module.home.records.covers.length).toBeGreaterThanOrEqual(8)
        // Four across: a full last row.
        expect(module.home.records.covers.length % 4).toBe(0)
        for (const [i, cover] of module.home.records.covers.entries()) {
            expect(cover.artist, `covers[${i}] artist`).toMatch(/\S/)
            expect(cover.title, `covers[${i}] title`).toMatch(/\S/)
            expect(cover.image.width, `covers[${i}] is square`).toBe(cover.image.height)
        }
        expect(module.home.records.closing.line).toMatch(/\S/)
        expect(module.home.records.closing.cta).toMatch(/\S/)
    })

    it("keeps session art joined to the session types and the week bookable", () => {
        const typeIds = new Set(module.codeAppointments.types.map((type) => type.typeId))
        expect(new Set(Object.keys(module.sessionBooking.sessionImages))).toEqual(typeIds)
        for (const typeId of typeIds) {
            expect(typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of module.codeAppointments.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        const slots = generateAppointmentSlots(module.codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("points the galleries sample at a real demo room", () => {
        expect(module.demoProofingAlbums.map((album) => album.slug)).toContain(module.galleries.sample.slug)
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        for (const { label, image } of allImages(module)) {
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
})
