import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    albums,
    faq,
    heroSlides,
    packages,
    photoId,
    proofingAlbums,
    selectedWork,
    type PhotoImage,
} from "../../../src/View/Wedding/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: PhotoImage }[] {
    return [
        ...albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...selectedWork.map((image, i) => ({ label: `selectedWork[${i}]`, image })),
        ...proofingAlbums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `proofing ${album.slug}[${i}]`, image })),
        ),
        { label: "about.portrait", image: about.portrait },
    ]
}

describe("wedding content", () => {
    it("ships weddings with covers, descriptions, and at least one image each", () => {
        expect(albums.length).toBeGreaterThan(0)
        for (const album of albums) {
            expect(album.title).not.toBe("")
            expect(album.description).not.toBe("")
            expect(album.images.length).toBeGreaterThan(0)
        }
    })

    it("keeps wedding slugs unique and URL-safe", () => {
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

    it("keeps the hero and selected-work edits populated", () => {
        expect(heroSlides.length).toBeGreaterThan(0)
        expect(selectedWork.length).toBeGreaterThan(0)
    })
})

describe("wedding packages and FAQ", () => {
    it("ships flat-priced packages with descriptions and features", () => {
        expect(packages.length).toBeGreaterThanOrEqual(2)
        for (const entry of packages) {
            expect(entry.name).not.toBe("")
            expect(entry.description).not.toBe("")
            // Flat one-off prices: positive whole dollars, never 0 ("Free"
            // would render) and never fractional cents in the price line.
            expect(entry.price, `${entry.name} price`).toBeGreaterThan(0)
            expect(Number.isInteger(entry.price), `${entry.name} price must be whole dollars`).toBe(true)
            expect(entry.features.length, `${entry.name} needs features`).toBeGreaterThanOrEqual(2)
        }
    })

    it("highlights exactly one package (the page needs a spine)", () => {
        expect(packages.filter((entry) => entry.highlighted === true)).toHaveLength(1)
    })

    it("ships an FAQ with real questions and answers", () => {
        expect(faq.length).toBeGreaterThanOrEqual(3)
        for (const entry of faq) {
            expect(entry.question).not.toBe("")
            expect(entry.answer).not.toBe("")
        }
    })
})

describe("wedding proofing content", () => {
    it("ships proofing albums with codes, clients, and images", () => {
        expect(proofingAlbums.length).toBeGreaterThan(0)
        for (const album of proofingAlbums) {
            expect(album.title).not.toBe("")
            expect(album.clientName).not.toBe("")
            expect(album.note).not.toBe("")
            // A shareable short code: 4–6 digits, like an unlisted-link PIN.
            expect(album.accessCode, `${album.slug} access code`).toMatch(/^\d{4,6}$/)
            expect(album.images.length).toBeGreaterThan(0)
        }
    })

    it("keeps proofing slugs unique, URL-safe, and unlisted from public weddings", () => {
        const slugs = proofingAlbums.map((album) => album.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        const publicSlugs = new Set(albums.map((album) => album.slug))
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
            // A collision would make an unlisted gallery reachable from /weddings.
            expect(publicSlugs.has(slug), `${slug} collides with a public wedding`).toBe(false)
        }
    })

    it("derives stable, unique frame ids inside each proofing album", () => {
        // The submitted pick list is these ids; the photographer must be able
        // to match them to files, so they are the processed base names.
        expect(photoId(albums[0].images[0])).toBe("saltwater-01")
        for (const album of proofingAlbums) {
            const ids = album.images.map((image) => photoId(image))
            expect(new Set(ids).size, `${album.slug} frame ids must be unique`).toBe(ids.length)
            for (const id of ids) {
                expect(id).toMatch(/^[a-z0-9-]+$/)
            }
        }
    })
})
