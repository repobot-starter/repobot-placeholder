import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import { artist, booking, heroImages, mixes, sets, type DjImage } from "../../../src/View/Dj/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

function allImages(): { label: string; image: DjImage }[] {
    return [
        { label: "heroImages.booth", image: heroImages.booth },
        { label: "heroImages.club", image: heroImages.club },
        { label: "heroImages.portrait", image: heroImages.portrait },
        ...mixes.map((mix) => ({ label: `mixes[${mix.index}].cover`, image: mix.cover })),
    ]
}

describe("dj content", () => {
    it("names the artist and the series", () => {
        expect(artist.alias).not.toBe("")
        expect(artist.email).toContain("@")
        expect(artist.series).not.toBe("")
    })

    it("keeps every set a valid ISO local date with city and venue", () => {
        expect(sets.length).toBeGreaterThanOrEqual(4)
        for (const set of sets) {
            expect(set.date, `${set.city} needs YYYY-MM-DD`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            expect(Number.isNaN(new Date(set.date).getTime())).toBe(false)
            expect(set.city).not.toBe("")
            expect(set.venue).not.toBe("")
        }
    })

    it("keeps mix indexes unique, descending, and every mix playable", () => {
        const indexes = mixes.map((mix) => mix.index)
        expect(new Set(indexes).size).toBe(indexes.length)
        expect([...indexes].sort((a, b) => b.localeCompare(a))).toEqual(indexes)
        for (const mix of mixes) {
            expect(mix.bpm).toBeGreaterThan(60)
            expect(mix.notes).not.toBe("")
            expect(publicAssetPresent(path.join(PUBLIC_DIR, mix.audioSrc)), `missing ${mix.audioSrc}`).toBe(
                true,
            )
            expect(mix.seconds).toBeGreaterThan(15)
            expect(mix.peaks.length).toBeGreaterThanOrEqual(48)
            for (const peak of mix.peaks) {
                expect(peak).toBeGreaterThanOrEqual(0)
                expect(peak).toBeLessThanOrEqual(1)
            }
        }
    })

    it("gives every image intrinsic dimensions, alt text, and on-disk srcSet variants", () => {
        for (const { label, image } of allImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.width, `${label} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${label} needs a height`).toBeGreaterThan(0)
            expect(
                image.srcSet.map((entry) => entry.src),
                `${label} src must be a variant`,
            ).toContain(image.src)
            for (const entry of image.srcSet) {
                expect(
                    publicAssetPresent(path.join(PUBLIC_DIR, entry.src)),
                    `${label}: missing ${entry.src}`,
                ).toBe(true)
            }
        }
    })

    it("keeps the booking form's tech-rider ask with exactly one email field", () => {
        const emailFields = booking.fields.filter((field) => field.type === "email")
        expect(emailFields.length).toBe(1)
        expect(booking.fields.some((field) => field.name === "tech")).toBe(true)
        expect(booking.fields.some((field) => field.type === "date")).toBe(true)
    })
})
