import path from "node:path"
import { describe, expect, it } from "vitest"
import highlineCatalog from "../../../../../packs/wedding-highline/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import * as base from "../../../src/View/Wedding/content"
import * as highline from "../../../src/View/Wedding/highlineRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The wedding-highline remix seed's parity gate. The seed (packs/README.md
 * "Derived templates") is composed over the wedding pack's content module
 * verbatim, so it must remain a structural twin of `content.ts`: the same
 * export surface and landingCopy shape, the contract's minimums met, its
 * catalog's appointments seed mirrored entry for entry, and every image
 * real under the seed's own public directory.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/wedding-highline/"

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
function allImages(): { label: string; image: highline.PhotoImage }[] {
    return [
        ...highline.albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...highline.heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...highline.selectedWork.map((image, i) => ({ label: `selectedWork[${i}]`, image })),
        ...highline.home.stack.map((image, i) => ({ label: `stack[${i}]`, image })),
        ...(highline.home.closing !== null ? [{ label: "closing", image: highline.home.closing.image }] : []),
        ...Object.entries(highline.booking.sessionImages).map(([typeId, image]) => ({
            label: `session ${typeId}`,
            image,
        })),
        { label: "booking.notesImage", image: highline.booking.notesImage },
        { label: "galleries.sample", image: highline.galleries.sample.image },
        { label: "about.portrait", image: highline.about.portrait },
    ]
}

describe("wedding-highline remix seed", () => {
    it("mirrors the base module's export surface and landingCopy shape exactly", () => {
        expect(Object.keys(highline).sort()).toEqual(Object.keys(base).sort())
        expect(keyShape(highline.landingCopy)).toEqual(keyShape(base.landingCopy))
        expect(Object.keys(highline.home).sort()).toEqual(Object.keys(base.home).sort())
    })

    it("mirrors its own catalog's appointments seed entry for entry", () => {
        expect(highlineCatalog.content.appointments).toEqual(highline.codeAppointments)
        expect(parseAppointmentsContent({ appointments: highline.codeAppointments })).toEqual(
            highline.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        expect(highline.photographer.name).not.toBe("")
        expect(highline.photographer.email).toMatch(/@/)
        expect(highline.heroSlides.length).toBeGreaterThanOrEqual(1)
        expect(highline.selectedWork.length).toBeGreaterThanOrEqual(4)
        expect(highline.albums.length).toBeGreaterThanOrEqual(1)
        for (const album of highline.albums) {
            expect(album.images.length, album.slug).toBeGreaterThanOrEqual(4)
        }
        expect(highline.packages.length).toBeGreaterThanOrEqual(2)
        expect(highline.packages.filter((entry) => entry.highlighted === true)).toHaveLength(1)
        expect(highline.faq.length).toBeGreaterThanOrEqual(3)
        expect(highline.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(highline.about.testimonials.length).toBeGreaterThanOrEqual(1)
        expect(highline.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
    })

    it("opens on the captioned stack of places and compares them as a spec sheet", () => {
        expect(highline.home.layout).toBe("stack")
        expect(highline.home.albumWall).toBe("stack")
        expect(highline.home.stack.length).toBeGreaterThanOrEqual(3)
        const [first] = highline.home.stack
        for (const frame of highline.home.stack) {
            // One frame size, and every slate carries its coordinates.
            expect(frame.caption, frame.src).toMatch(/\d+\.\d+°N \d+\.\d+°W$/)
            expect(frame.width / frame.height, frame.src).toBe((first?.width ?? 0) / (first?.height ?? 1))
        }
        expect(highline.home.locations.length).toBeGreaterThanOrEqual(3)
        for (const place of highline.home.locations) {
            for (const [field, value] of Object.entries(place)) {
                expect(value, `${place.name}.${field}`).not.toBe("")
            }
            expect(place.coordinates, place.name).toMatch(/°N .*°W$/)
        }
        expect(highline.home.closing).not.toBeNull()
    })

    it("quotes the packages in dollars, whole units, and says so in the closing line", () => {
        expect(highline.landingCopy.currency).toBe("usd")
        for (const entry of highline.packages) {
            expect(Number.isInteger(entry.price), entry.name).toBe(true)
            expect(entry.price, entry.name).toBeGreaterThan(0)
        }
        const floor = Math.min(...highline.packages.map((entry) => entry.price))
        expect(highline.landingCopy.home.bannerTitle).toContain(`$${floor.toLocaleString("en-US")}`)
    })

    it("keeps the sample proofing room populated and joined to /galleries", () => {
        const room = highline.demoProofingAlbums.find(
            (album) => album.slug === highline.galleries.sample.slug,
        )
        expect(room).toBeDefined()
        expect(room?.images.length).toBeGreaterThanOrEqual(6)
        expect(highline.galleries.sample.body).toContain(room?.accessCode ?? "")
        const publicSlugs = new Set(highline.albums.map((album) => album.slug))
        for (const album of highline.demoProofingAlbums) {
            expect(publicSlugs.has(album.slug), album.slug).toBe(false)
            expect(album.accessCode).toMatch(/^\d{4,6}$/)
        }
    })

    it("keeps session art joined to the session types and the calendar real", () => {
        expect(Object.keys(highline.booking.sessionImages).sort()).toEqual(
            highline.codeAppointments.types.map((type) => type.typeId).sort(),
        )
        for (const type of highline.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
        }
        const slots = generateAppointmentSlots(highline.codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        for (const { label, image } of allImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
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
