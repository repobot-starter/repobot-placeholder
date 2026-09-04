import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    band,
    heroImages,
    pressKit,
    records,
    shows,
    videos,
    type BandImage,
} from "../../../src/View/Band/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: BandImage }[] {
    return [
        { label: "heroImages.marquee", image: heroImages.marquee },
        { label: "heroImages.crowd", image: heroImages.crowd },
        { label: "heroImages.portrait", image: heroImages.portrait },
        ...records.map((record) => ({ label: `records[${record.slug}].cover`, image: record.cover })),
        ...videos.map((video, i) => ({ label: `videos[${i}].poster`, image: video.poster })),
        ...pressKit.photos.map((photo, i) => ({ label: `pressKit.photos[${i}]`, image: photo.display })),
    ]
}

describe("band content", () => {
    it("names the band everywhere it must be named", () => {
        expect(band.name).not.toBe("")
        expect(band.tagline).not.toBe("")
        expect(band.email).toContain("@")
    })

    it("keeps every show a valid ISO local date with city and venue", () => {
        expect(shows.length).toBeGreaterThanOrEqual(4)
        for (const show of shows) {
            expect(show.date, `${show.city} needs YYYY-MM-DD`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            expect(Number.isNaN(new Date(show.date).getTime())).toBe(false)
            expect(show.city).not.toBe("")
            expect(show.venue).not.toBe("")
        }
    })

    it("keeps record slugs unique and gives every record a cover and tracks", () => {
        const slugs = records.map((record) => record.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const record of records) {
            expect(record.slug).toMatch(/^[a-z0-9-]+$/)
            expect(record.notes).not.toBe("")
            expect(record.tracks.length).toBeGreaterThan(0)
        }
    })

    it("gives every track a playable bundled source with waveform peaks", () => {
        for (const record of records) {
            for (const track of record.tracks) {
                expect(
                    publicAssetPresent(path.join(PUBLIC_DIR, track.audioSrc)),
                    `missing ${track.audioSrc}`,
                ).toBe(true)
                expect(track.seconds, `${track.title} needs a duration`).toBeGreaterThan(15)
                expect(track.peaks.length, `${track.title} needs peaks`).toBeGreaterThanOrEqual(48)
                for (const peak of track.peaks) {
                    expect(peak).toBeGreaterThanOrEqual(0)
                    expect(peak).toBeLessThanOrEqual(1)
                }
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

    it("press kit: bios in three lengths, real downloadable files, contacts", () => {
        expect(pressKit.bios.short.length).toBeGreaterThan(80)
        expect(pressKit.bios.medium.length).toBeGreaterThan(pressKit.bios.short.length)
        expect(pressKit.bios.long.join(" ").length).toBeGreaterThan(pressKit.bios.medium.length)
        for (const photo of pressKit.photos) {
            expect(
                publicAssetPresent(path.join(PUBLIC_DIR, photo.downloadHref)),
                `missing download ${photo.downloadHref}`,
            ).toBe(true)
            expect(photo.credit).not.toBe("")
        }
        for (const logo of pressKit.logos) {
            expect(
                publicAssetPresent(path.join(PUBLIC_DIR, logo.downloadHref)),
                `missing logo ${logo.downloadHref}`,
            ).toBe(true)
        }
        expect(pressKit.stage.lineup.length).toBeGreaterThanOrEqual(2)
        expect(pressKit.stage.specs.length).toBeGreaterThanOrEqual(3)
        expect(pressKit.contacts.length).toBeGreaterThanOrEqual(1)
        for (const contact of pressKit.contacts) {
            expect(contact.email).toContain("@")
        }
    })
})
