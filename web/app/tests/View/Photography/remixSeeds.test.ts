/**
 * The photography derived-template seeds' parity gate. A remix seed
 * (packs/README.md "Derived templates") is composed over the photography
 * pack's content module verbatim, so each seed must remain a structural
 * twin of `content.ts`: the same export surface, the contract's minimums
 * met, its catalog's appointments seed mirrored entry for entry, and every
 * image real under the seed's own public directory. These tests fail the
 * moment the pack's contract moves without its seeds — the drift that
 * would otherwise surface as a broken published template.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import kaitoCatalog from "../../../../../packs/photography-kaito/catalog.json"
import wrenCatalog from "../../../../../packs/photography-wren/catalog.json"
import {
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/Photography/content"
import * as kaito from "../../../src/View/Photography/kaitoRemix.content"
import * as wren from "../../../src/View/Photography/wrenRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

const seeds: {
    name: string
    module: ContentModule
    publicPrefix: string
    catalog: { content: { appointments: unknown } }
}[] = [
    { name: "wren", module: wren, publicPrefix: "/photography-wren/", catalog: wrenCatalog },
    { name: "kaito", module: kaito, publicPrefix: "/photography-kaito/", catalog: kaitoCatalog },
]

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule): { label: string; image: base.PhotoImage }[] {
    return [
        ...module.albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...module.heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...module.selectedWork.map((image, i) => ({ label: `selectedWork[${i}]`, image })),
        ...module.demoProofingAlbums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `proofing ${album.slug}[${i}]`, image })),
        ),
        ...Object.entries(module.booking.sessionImages).map(([typeId, image]) => ({
            label: `session ${typeId}`,
            image,
        })),
        { label: "about.portrait", image: module.about.portrait },
        { label: "booking.notes.image", image: module.booking.notes.image },
        { label: "galleries.sample.image", image: module.galleries.sample.image },
    ]
}

describe.each(seeds)("photography $name remix seed", ({ module, publicPrefix, catalog }) => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps home a structural twin of the base's (the builders read every key)", () => {
        expect(Object.keys(module.home).sort()).toEqual(Object.keys(base.home).sort())
        expect(Object.keys(module.home.stack.closing).sort()).toEqual(
            Object.keys(base.home.stack.closing).sort(),
        )
    })

    it("mirrors its own catalog's appointments seed entry for entry", () => {
        expect(catalog.content.appointments).toEqual(module.codeAppointments)
        expect(parseAppointmentsContent({ appointments: module.codeAppointments })).toEqual(
            module.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        // packs/photography/catalog.json contentContract — inherited whole by
        // the remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(module.photographer.name).not.toBe("")
        expect(module.photographer.email).toMatch(/@/)
        expect(module.heroSlides.length).toBeGreaterThanOrEqual(1)
        expect(module.selectedWork.length).toBeGreaterThanOrEqual(4)
        expect(module.albums.length).toBeGreaterThanOrEqual(1)
        for (const album of module.albums) {
            expect(album.images.length, album.slug).toBeGreaterThanOrEqual(4)
        }
        expect(module.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(module.about.testimonials.length).toBeGreaterThanOrEqual(1)
        expect(module.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(module.codeAppointments.providers.length).toBeGreaterThanOrEqual(1)
        expect(module.galleries.steps.length).toBeGreaterThanOrEqual(2)
    })

    it("opens the stack: every frame captioned, one shape, one closing line and ask", () => {
        expect(module.home.layout).toBe("stack")
        for (const [i, image] of module.selectedWork.entries()) {
            expect(image.caption, `selectedWork[${i}] needs its label`).toMatch(/\S/)
        }
        // The renderer enforces one frame size anyway; a matched set keeps
        // every crop the photographer's own.
        const ratios = new Set(module.selectedWork.map((image) => (image.width / image.height).toFixed(3)))
        expect(ratios.size).toBe(1)
        expect(module.home.stack.closing.line).toMatch(/\S/)
        expect(module.home.stack.closing.cta).toMatch(/\S/)
    })

    it("keeps session art joined to the session types and the week bookable", () => {
        const typeIds = new Set(module.codeAppointments.types.map((type) => type.typeId))
        expect(new Set(Object.keys(module.booking.sessionImages))).toEqual(typeIds)
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
