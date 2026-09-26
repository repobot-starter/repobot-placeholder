import path from "node:path"
import { describe, expect, it } from "vitest"
import therapyCatalog from "../../../../../packs/care-therapy-duet/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    parsePracticeContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import * as base from "../../../src/View/Care/content"
import * as duet from "../../../src/View/Care/therapyDuetRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The care-therapy-duet remix seed's parity gate (the services family's
 * remixSeeds discipline). The seed (packs/README.md "Derived templates")
 * is composed over the care pack's content module verbatim, so it must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, its catalog's content seeds mirrored entry for
 * entry, and every image real under the seed's own public directory.
 * These tests fail the moment the pack's contract moves without its seed
 * — the drift that would otherwise surface as a broken published
 * template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/care-therapy-duet/"

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
function allImages(): { label: string; image: duet.CareImage }[] {
    return [
        { label: "home.hero", image: duet.home.hero },
        { label: "story.image", image: duet.story.image },
        ...(duet.spotlight !== null ? [{ label: "spotlight.image", image: duet.spotlight.image }] : []),
        ...duet.exhibits.items.map((item) => ({ label: `exhibit ${item.title}`, image: item.image })),
        ...Object.entries(duet.providerPhotos).map(([providerId, image]) => ({
            label: `portrait ${providerId}`,
            image,
        })),
    ]
}

describe("care-therapy-duet remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(duet).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (careLanding reads every key)", () => {
        expect(keyShape(duet.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's content seeds entry for entry, both domains", () => {
        // resolveCatalog merges a remix's content per-domain over the
        // base's, so the catalog must reseed BOTH domains to match ITS
        // contentSeed module — the composed template renders and books
        // identically from the document or the code fallback.
        expect(therapyCatalog.content.practice).toEqual(duet.codePractice)
        expect(therapyCatalog.content.appointments).toEqual(duet.codeAppointments)
        expect(parsePracticeContent({ practice: duet.codePractice })).toEqual(duet.codePractice)
        expect(parseAppointmentsContent({ appointments: duet.codeAppointments })).toEqual(
            duet.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        // packs/care/catalog.json contentContract — inherited whole by the
        // remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(duet.practice.name).not.toBe("")
        expect(duet.practice.tagline).not.toBe("")
        expect(duet.practice.email).toMatch(/@/)
        expect(duet.codePractice.providers.length).toBeGreaterThanOrEqual(3)
        expect(duet.codePractice.services.length).toBeGreaterThanOrEqual(6)
        expect(duet.codePractice.insurance.length).toBeGreaterThanOrEqual(6)
        expect(duet.codePractice.reviews.length).toBeGreaterThanOrEqual(3)
        expect(duet.codePractice.newPatient.length).toBeGreaterThanOrEqual(3)
        expect(duet.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(duet.codeAppointments.providers.length).toBeGreaterThanOrEqual(2)
        expect(duet.clinicHours.length).toBeGreaterThanOrEqual(5)
        expect(Object.keys(duet.providerPhotos).length).toBeGreaterThanOrEqual(3)
        expect(duet.story.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("keeps ids on the contract grammar and joined across domains", () => {
        const practiceIds = new Set(duet.codePractice.providers.map((provider) => provider.providerId))
        for (const provider of duet.codePractice.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const type of duet.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of duet.codeAppointments.providers) {
            expect(practiceIds.has(provider.providerId), provider.providerId).toBe(true)
        }
        for (const providerId of Object.keys(duet.providerPhotos)) {
            expect(practiceIds.has(providerId), providerId).toBe(true)
        }
        for (const providerId of practiceIds) {
            expect(duet.providerPhotos[providerId], `portrait for ${providerId}`).toBeDefined()
        }
    })

    it("keeps session durations bookable and every window inside a day", () => {
        for (const type of duet.codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const entry of duet.clinicHours) {
            expect(entry.day).toBeGreaterThanOrEqual(0)
            expect(entry.day).toBeLessThanOrEqual(6)
            expect(entry.close).toBeGreaterThan(entry.open)
            expect(entry.close).toBeLessThanOrEqual(24 * 60)
        }
        for (const provider of duet.codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.end, label).toBeGreaterThan(window.start)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(duet.codeAppointments)
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
