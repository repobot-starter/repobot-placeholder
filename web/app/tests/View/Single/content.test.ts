import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    artist,
    listenLinks,
    mailingList,
    portrait,
    record,
    tracklist,
    video,
    type SingleImage,
} from "../../../src/View/Single/content"
import { releaseStatus } from "../../../src/View/Music/schedule"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

const allImages: { label: string; image: SingleImage }[] = [
    { label: "record.cover", image: record.cover },
    { label: "video.poster", image: video.poster },
    { label: "portrait", image: portrait },
]

describe("single content", () => {
    it("names the artist and the record", () => {
        expect(artist.name).not.toBe("")
        expect(artist.email).toContain("@")
        expect(record.title).not.toBe("")
        expect(record.statement).not.toBe("")
        expect(record.label).not.toBe("")
    })

    it("keeps the release date a valid ISO local date the countdown can compute from", () => {
        expect(record.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(Number.isNaN(new Date(record.releaseDate).getTime())).toBe(false)
        // The mechanic itself: unreleased the day before, out on the day.
        const [y, m, d] = record.releaseDate.split("-").map(Number)
        expect(releaseStatus(record.releaseDate, new Date(y, m - 1, d - 1, 12)).released).toBe(false)
        expect(releaseStatus(record.releaseDate, new Date(y, m - 1, d, 0, 1)).released).toBe(true)
    })

    it("bundles a playable excerpt with waveform peaks", () => {
        expect(publicAssetPresent(path.join(PUBLIC_DIR, record.excerpt.audioSrc))).toBe(true)
        expect(record.excerpt.seconds).toBeGreaterThan(15)
        expect(record.excerpt.peaks.length).toBeGreaterThanOrEqual(48)
        for (const peak of record.excerpt.peaks) {
            expect(peak).toBeGreaterThanOrEqual(0)
            expect(peak).toBeLessThanOrEqual(1)
        }
    })

    it("ships the listen rail inert until real store links exist", () => {
        expect(listenLinks.length).toBeGreaterThanOrEqual(1)
        for (const link of listenLinks) {
            expect(link.label).not.toBe("")
            // Empty href = a non-navigating platform badge (the shipped
            // state). A filled slot must be a real https URL — never a
            // placeholder domain, which navigates visitors to a dead page.
            if (link.href !== "") {
                expect(link.href).toMatch(/^https:\/\//)
                expect(link.href).not.toMatch(/\.example\b|example\.com/)
            }
        }
        expect(tracklist.length).toBeGreaterThanOrEqual(4)
        for (const entry of tracklist) {
            expect(entry.title).not.toBe("")
            expect(entry.duration).toMatch(/^\d+:\d{2}$/)
        }
    })

    it("gives every image intrinsic dimensions, alt text, and on-disk srcSet variants", () => {
        for (const { label, image } of allImages) {
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

    it("keeps the video a YouTube link and the mailing list complete", () => {
        expect(video.videoUrl).toContain("youtube.com")
        expect(mailingList.title).not.toBe("")
        expect(mailingList.cta).not.toBe("")
        expect(mailingList.confirmation).not.toBe("")
    })
})
