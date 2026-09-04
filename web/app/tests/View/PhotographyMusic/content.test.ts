import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import { albums, heroSlides, reel, about, type PhotoImage } from "../../../src/View/PhotographyMusic/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: PhotoImage }[] {
    return [
        ...albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...reel.map((image, i) => ({ label: `reel[${i}]`, image })),
        { label: "about.portrait", image: about.portrait },
    ]
}

describe("photography-music content", () => {
    it("ships albums with covers, descriptions, and at least one image each", () => {
        expect(albums.length).toBeGreaterThan(0)
        for (const album of albums) {
            expect(album.title).not.toBe("")
            expect(album.description).not.toBe("")
            expect(album.images.length).toBeGreaterThan(0)
        }
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

    it("keeps the hero and the reel populated", () => {
        expect(heroSlides.length).toBeGreaterThan(0)
        expect(reel.length).toBeGreaterThanOrEqual(4)
    })

    it("edits the reel only from frames that exist in the albums", () => {
        // The reel is a cross-album edit: pulling from the albums keeps home
        // and album pages in sync when a frame is swapped.
        const albumSrcs = new Set(albums.flatMap((album) => album.images.map((image) => image.src)))
        for (const [i, image] of reel.entries()) {
            expect(albumSrcs.has(image.src), `reel[${i}] must come from an album`).toBe(true)
        }
    })
})
