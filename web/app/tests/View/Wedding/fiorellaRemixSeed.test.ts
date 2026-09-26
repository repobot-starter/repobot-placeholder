import path from "node:path"
import { describe, expect, it } from "vitest"
import fiorellaCatalog from "../../../../../packs/wedding-fiorella/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import * as base from "../../../src/View/Wedding/content"
import * as fiorella from "../../../src/View/Wedding/fiorellaRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The wedding-fiorella remix seed's parity gate. The seed (packs/README.md
 * "Derived templates") is composed over the wedding pack's content module
 * verbatim, so it must remain a structural twin of `content.ts`: the same
 * export surface and landingCopy shape, the contract's minimums met, its
 * catalog's appointments seed mirrored entry for entry, and every image
 * real under the seed's own public directory.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/wedding-fiorella/"

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
function allImages(): { label: string; image: fiorella.PhotoImage }[] {
    return [
        ...fiorella.albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...fiorella.heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...fiorella.selectedWork.map((image, i) => ({ label: `selectedWork[${i}]`, image })),
        ...fiorella.home.stack.map((image, i) => ({ label: `stack[${i}]`, image })),
        ...(fiorella.home.closing !== null ? [{ label: "closing", image: fiorella.home.closing.image }] : []),
        ...Object.entries(fiorella.booking.sessionImages).map(([typeId, image]) => ({
            label: `session ${typeId}`,
            image,
        })),
        { label: "booking.notesImage", image: fiorella.booking.notesImage },
        { label: "galleries.sample", image: fiorella.galleries.sample.image },
        { label: "about.portrait", image: fiorella.about.portrait },
    ]
}

describe("wedding-fiorella remix seed", () => {
    it("mirrors the base module's export surface and landingCopy shape exactly", () => {
        expect(Object.keys(fiorella).sort()).toEqual(Object.keys(base).sort())
        expect(keyShape(fiorella.landingCopy)).toEqual(keyShape(base.landingCopy))
        expect(Object.keys(fiorella.home).sort()).toEqual(Object.keys(base.home).sort())
    })

    it("mirrors its own catalog's appointments seed entry for entry", () => {
        expect(fiorellaCatalog.content.appointments).toEqual(fiorella.codeAppointments)
        expect(parseAppointmentsContent({ appointments: fiorella.codeAppointments })).toEqual(
            fiorella.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        expect(fiorella.photographer.name).not.toBe("")
        expect(fiorella.photographer.email).toMatch(/@/)
        expect(fiorella.heroSlides.length).toBeGreaterThanOrEqual(1)
        expect(fiorella.selectedWork.length).toBeGreaterThanOrEqual(4)
        expect(fiorella.albums.length).toBeGreaterThanOrEqual(1)
        for (const album of fiorella.albums) {
            expect(album.images.length, album.slug).toBeGreaterThanOrEqual(4)
        }
        expect(fiorella.packages.length).toBeGreaterThanOrEqual(2)
        expect(fiorella.packages.filter((entry) => entry.highlighted === true)).toHaveLength(1)
        expect(fiorella.faq.length).toBeGreaterThanOrEqual(3)
        expect(fiorella.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(fiorella.about.testimonials.length).toBeGreaterThanOrEqual(1)
        expect(fiorella.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
    })

    it("opens on the captioned stack and prints the weddings as contact sheets", () => {
        expect(fiorella.home.layout).toBe("stack")
        expect(fiorella.home.wall).toBe("contact-sheet")
        expect(fiorella.home.albumWall).toBe("contact-sheet")
        expect(fiorella.home.stack.length).toBeGreaterThanOrEqual(3)
        const [first] = fiorella.home.stack
        for (const frame of fiorella.home.stack) {
            // One frame size, so the stack reads as one reel.
            expect(frame.caption, frame.src).toMatch(/ · /)
            expect(frame.width / frame.height, frame.src).toBe((first?.width ?? 0) / (first?.height ?? 1))
        }
        // The grease pencil: keepers circled, at least one note in the margin.
        expect(fiorella.selectedWork.some((image) => image.mark === "circle")).toBe(true)
        expect(fiorella.selectedWork.some((image) => image.note !== undefined)).toBe(true)
        expect(fiorella.home.closing).not.toBeNull()
    })

    it("quotes the collections in euros, whole units, and says so in the closing line", () => {
        expect(fiorella.landingCopy.currency).toBe("eur")
        for (const entry of fiorella.packages) {
            expect(Number.isInteger(entry.price), entry.name).toBe(true)
            expect(entry.price, entry.name).toBeGreaterThan(0)
        }
        const floor = Math.min(...fiorella.packages.map((entry) => entry.price))
        expect(fiorella.landingCopy.home.bannerTitle).toContain(`€${floor.toLocaleString("en-US")}`)
    })

    it("keeps the sample proofing room populated and joined to /galleries", () => {
        const room = fiorella.demoProofingAlbums.find(
            (album) => album.slug === fiorella.galleries.sample.slug,
        )
        expect(room).toBeDefined()
        expect(room?.images.length).toBeGreaterThanOrEqual(6)
        expect(fiorella.galleries.sample.body).toContain(room?.accessCode ?? "")
        const publicSlugs = new Set(fiorella.albums.map((album) => album.slug))
        for (const album of fiorella.demoProofingAlbums) {
            expect(publicSlugs.has(album.slug), album.slug).toBe(false)
            expect(album.accessCode).toMatch(/^\d{4,6}$/)
        }
    })

    it("keeps session art joined to the session types and the calendar real", () => {
        expect(Object.keys(fiorella.booking.sessionImages).sort()).toEqual(
            fiorella.codeAppointments.types.map((type) => type.typeId).sort(),
        )
        for (const type of fiorella.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
        }
        const slots = generateAppointmentSlots(fiorella.codeAppointments)
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
