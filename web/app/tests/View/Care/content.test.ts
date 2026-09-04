import path from "node:path"
import { describe, expect, it } from "vitest"
import careCatalog from "../../../../../packs/care/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    parsePracticeContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import {
    booking,
    clinicHours,
    codeAppointments,
    codePractice,
    home,
    practice,
    providerPhotos,
    story,
    type CareImage,
} from "../../../src/View/Care/content"
import { publicAssetPresent } from "../../helpers/publicAssets"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: CareImage }[] {
    return [
        { label: "home.hero", image: home.hero },
        { label: "story.image", image: story.image },
        ...Object.entries(providerPhotos).map(([providerId, image]) => ({
            label: `portrait ${providerId}`,
            image,
        })),
    ]
}

describe("care content", () => {
    it("ships the identity a practice site can't render without", () => {
        expect(practice.name).not.toBe("")
        expect(practice.tagline).not.toBe("")
        expect(practice.city).not.toBe("")
        expect(practice.address).not.toBe("")
        expect(practice.phone).not.toBe("")
        expect(practice.email).toMatch(/@/)
        expect(practice.mapsQuery).not.toBe("")
    })

    it("meets the content contract's minimums", () => {
        // packs/care/catalog.json contentContract — the module satisfies
        // the contract; the contract never drifts ahead of it.
        expect(codePractice.providers.length).toBeGreaterThanOrEqual(3)
        expect(codePractice.services.length).toBeGreaterThanOrEqual(6)
        expect(codePractice.insurance.length).toBeGreaterThanOrEqual(6)
        expect(codePractice.reviews.length).toBeGreaterThanOrEqual(3)
        expect(codePractice.newPatient.length).toBeGreaterThanOrEqual(3)
        expect(codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(codeAppointments.providers.length).toBeGreaterThanOrEqual(2)
        expect(clinicHours.length).toBeGreaterThanOrEqual(5)
        expect(Object.keys(providerPhotos).length).toBeGreaterThanOrEqual(3)
        expect(story.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("parses contract-clean: the code fallbacks ARE valid domain documents", () => {
        // The exports are contract-shaped on purpose — an owner's Manage
        // edit and this file walk the same rendering path, so the code
        // content must survive its own domain parser without a single
        // section (or the whole appointments domain) dropping.
        const practiceParsed = parsePracticeContent({ practice: codePractice })
        expect(practiceParsed).toEqual(codePractice)
        const appointmentsParsed = parseAppointmentsContent({ appointments: codeAppointments })
        expect(appointmentsParsed).toEqual(codeAppointments)
    })

    it("mirrors the catalog's content seed entry for entry, both domains", () => {
        // The seed compose stamps into repobot.content.json must be a
        // structural twin of the module: a freshly composed template
        // renders identically from the document or the code fallback, and
        // Manage opens on exactly the facts the site already shows.
        expect(careCatalog.content.practice).toEqual(codePractice)
        expect(careCatalog.content.appointments).toEqual(codeAppointments)
    })

    it("keeps every hours entry and availability window inside a day", () => {
        for (const entry of clinicHours) {
            expect(entry.day).toBeGreaterThanOrEqual(0)
            expect(entry.day).toBeLessThanOrEqual(6)
            expect(entry.open).toBeGreaterThanOrEqual(0)
            expect(entry.close).toBeLessThanOrEqual(24 * 60)
            expect(entry.close).toBeGreaterThan(entry.open)
        }
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

    it("keeps ids on the contract grammar and joined across domains", () => {
        const practiceIds = new Set(codePractice.providers.map((provider) => provider.providerId))
        for (const provider of codePractice.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const type of codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        // Every bookable provider is a practice provider, and every
        // practice provider has a portrait — the site renders the join.
        for (const provider of codeAppointments.providers) {
            expect(practiceIds.has(provider.providerId), provider.providerId).toBe(true)
        }
        for (const providerId of Object.keys(providerPhotos)) {
            expect(practiceIds.has(providerId), providerId).toBe(true)
        }
        for (const providerId of practiceIds) {
            expect(providerPhotos[providerId], `portrait for ${providerId}`).toBeDefined()
        }
    })

    it("keeps visit-type durations bookable and windows slot-aligned", () => {
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

    it("gives every image intrinsic dimensions, alt text, and a srcSet", () => {
        for (const { label, image } of allImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.width, `${label} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${label} needs a height`).toBeGreaterThan(0)
            expect(image.srcSet.length, `${label} needs srcSet entries`).toBeGreaterThan(0)
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

    it("keeps user-facing copy free of platform naming and compliance claims", () => {
        const copy = JSON.stringify({
            practice,
            home,
            story,
            booking,
            codePractice,
            codeAppointments,
        })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
        // Deliberate architecture, not a certification: template copy
        // never claims HIPAA (or any compliance) — the booking surface
        // avoids the problem by holding no medical information at all.
        expect(copy).not.toMatch(/hipaa/i)
        expect(copy).not.toMatch(/complian/i)
    })
})
