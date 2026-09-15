import path from "node:path"
import { describe, expect, it } from "vitest"
import photographyCatalog from "../../../../../packs/photography/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import { booking, codeAppointments } from "../../../src/View/Photography/content"
import { publicAssetPresent } from "../../helpers/publicAssets"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/**
 * The /book page's contract guards — the care pack's booking-content
 * discipline worn by the photography pack. `codeAppointments` is the
 * appointments domain's code fallback and the catalog's content seed is
 * its structural twin: the platform projects exactly the capacity-1
 * slots the sandbox simulation offers, and Manage opens on exactly the
 * sessions the site already shows.
 */
describe("photography booking content", () => {
    it("meets the content contract's minimums", () => {
        // packs/photography/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(codeAppointments.providers.length).toBeGreaterThanOrEqual(1)
        expect(booking.headline).not.toBe("")
        expect(booking.intro).not.toBe("")
    })

    it("parses contract-clean: the code fallback IS a valid appointments document", () => {
        // The export is contract-shaped on purpose — an owner's Manage
        // edit and this file walk the same rendering path, so the code
        // content must survive its own domain parser whole.
        expect(parseAppointmentsContent({ appointments: codeAppointments })).toEqual(codeAppointments)
    })

    it("mirrors the catalog's content seed entry for entry", () => {
        // The seed compose stamps into repobot.content.json must be a
        // structural twin of the module: a freshly composed template
        // books identically from the document or the code fallback.
        expect(photographyCatalog.content.appointments).toEqual(codeAppointments)
    })

    it("keeps every availability window inside a day", () => {
        for (const provider of codeAppointments.providers) {
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

    it("keeps ids on the contract grammar", () => {
        for (const type of codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of codeAppointments.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
    })

    it("keeps session durations bookable and the projection real", () => {
        for (const type of codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        // The projection must produce a real week's worth of slots without
        // hitting the deterministic-truncation ceiling — a truncated week
        // would silently drop late-week availability.
        const slots = generateAppointmentSlots(codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("fronts every session type with a real frame, and only session types", () => {
        // Art from code, facts from the contract: the join must hold both
        // ways, and every card image is a processed responsive entry.
        const typeIds = new Set(codeAppointments.types.map((type) => type.typeId))
        for (const typeId of typeIds) {
            expect(booking.sessionImages[typeId], `card image for ${typeId}`).toBeDefined()
        }
        for (const [typeId, image] of Object.entries(booking.sessionImages)) {
            expect(typeIds.has(typeId), `${typeId} is not a session type`).toBe(true)
            expect(image, `${typeId} image`).toBeDefined()
            if (image === undefined) continue
            expect(image.alt, `${typeId} needs alt text`).not.toBe("")
            expect(image.width, `${typeId} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${typeId} needs a height`).toBeGreaterThan(0)
            expect(
                image.srcSet.map((entry) => entry.src),
                `${typeId} src must be a srcSet variant`,
            ).toContain(image.src)
            for (const entry of image.srcSet) {
                expect(
                    publicAssetPresent(path.join(PUBLIC_DIR, entry.src)),
                    `${typeId}: missing ${entry.src}`,
                ).toBe(true)
            }
        }
    })

    it("keeps user-facing booking copy free of platform naming", () => {
        const copy = JSON.stringify({ booking, codeAppointments })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})
