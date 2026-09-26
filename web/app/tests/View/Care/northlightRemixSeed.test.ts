import path from "node:path"
import { describe, expect, it } from "vitest"
import remixCatalog from "../../../../../packs/care-psychology-northlight/catalog.json"
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
import * as northlight from "../../../src/View/Care/northlightRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The care-psychology-northlight remix seed's parity gate (the services family's
 * remixSeeds discipline, the kindredRemixSeed and cambridgeRemixSeed siblings). The seed
 * (packs/README.md "Derived templates") is composed over the care pack's
 * content module verbatim, so it must remain a structural twin of
 * `content.ts`: the same export surface, the contract's minimums met, its
 * catalog's content seeds mirrored entry for entry, and every image real
 * under the seed's own public directory. These tests fail the moment the
 * pack's contract moves without its seed — the drift that would otherwise
 * surface as a broken published template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/care-psychology-northlight/"

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
function allImages(): { label: string; image: northlight.CareImage }[] {
    return [
        { label: "home.hero", image: northlight.home.hero },
        { label: "story.image", image: northlight.story.image },
        ...(northlight.spotlight !== null
            ? [{ label: "spotlight.image", image: northlight.spotlight.image }]
            : []),
        ...northlight.exhibits.items.map((item) => ({ label: `exhibit ${item.title}`, image: item.image })),
        ...Object.entries(northlight.providerPhotos).map(([providerId, image]) => ({
            label: `portrait ${providerId}`,
            image,
        })),
    ]
}

describe("care-psychology-northlight remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(northlight).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (careLanding reads every key)", () => {
        expect(keyShape(northlight.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's content seeds entry for entry, both domains", () => {
        // resolveCatalog merges a remix's content per-domain over the
        // base's, so the catalog must reseed BOTH domains to match ITS
        // contentSeed module — the composed template renders and books
        // identically from the document or the code fallback.
        expect(remixCatalog.content.practice).toEqual(northlight.codePractice)
        expect(remixCatalog.content.appointments).toEqual(northlight.codeAppointments)
        expect(parsePracticeContent({ practice: northlight.codePractice })).toEqual(northlight.codePractice)
        expect(parseAppointmentsContent({ appointments: northlight.codeAppointments })).toEqual(
            northlight.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        // packs/care/catalog.json contentContract — inherited whole by the
        // remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(northlight.practice.name).not.toBe("")
        expect(northlight.practice.tagline).not.toBe("")
        expect(northlight.practice.email).toMatch(/@/)
        expect(northlight.codePractice.providers.length).toBeGreaterThanOrEqual(3)
        expect(northlight.codePractice.services.length).toBeGreaterThanOrEqual(6)
        expect(northlight.codePractice.insurance.length).toBeGreaterThanOrEqual(6)
        expect(northlight.codePractice.reviews.length).toBeGreaterThanOrEqual(3)
        expect(northlight.codePractice.newPatient.length).toBeGreaterThanOrEqual(3)
        expect(northlight.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(northlight.codeAppointments.providers.length).toBeGreaterThanOrEqual(2)
        expect(northlight.clinicHours.length).toBeGreaterThanOrEqual(5)
        expect(Object.keys(northlight.providerPhotos).length).toBeGreaterThanOrEqual(3)
        expect(northlight.story.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("keeps ids on the contract grammar and joined across domains", () => {
        const practiceIds = new Set(northlight.codePractice.providers.map((provider) => provider.providerId))
        for (const provider of northlight.codePractice.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const type of northlight.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of northlight.codeAppointments.providers) {
            expect(practiceIds.has(provider.providerId), provider.providerId).toBe(true)
        }
        for (const providerId of Object.keys(northlight.providerPhotos)) {
            expect(practiceIds.has(providerId), providerId).toBe(true)
        }
        for (const providerId of practiceIds) {
            expect(northlight.providerPhotos[providerId], `portrait for ${providerId}`).toBeDefined()
        }
    })

    it("keeps appointment durations bookable and every window inside a day", () => {
        for (const type of northlight.codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const entry of northlight.clinicHours) {
            expect(entry.day).toBeGreaterThanOrEqual(0)
            expect(entry.day).toBeLessThanOrEqual(6)
            expect(entry.close).toBeGreaterThan(entry.open)
            expect(entry.close).toBeLessThanOrEqual(24 * 60)
        }
        for (const provider of northlight.codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.end, label).toBeGreaterThan(window.start)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(northlight.codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("opens on a full-bleed photograph and leads with the first ninety days as one track", () => {
        expect(northlight.home.layout).toBe("full-bleed")
        expect(northlight.home.headline).toContain("\n")
        expect(northlight.promises.items.length).toBe(0)
        expect(northlight.exhibits.items.length).toBe(0)
        expect(northlight.journey.layout).toBe("rail")
        expect(northlight.journey.steps.map((step) => step.label)).toEqual([
            "Day 1",
            "Week 2",
            "Week 4",
            "Week 8",
            "Day 90",
        ])
        expect(northlight.journey.steps.every((step) => step.image === undefined)).toBe(true)
        // The conditions print as plain words beside a photograph, not a report.
        expect(northlight.spotlight?.bullets).toEqual(
            expect.arrayContaining(["Depression", "Anxiety", "ADHD", "Bipolar disorder", "Postpartum"]),
        )
        expect(northlight.spotlight?.report.title).toBe("")
        expect(northlight.codePractice.insurance[0]).toBe("In-network with most Minnesota plans")
    })

    it("names no insurer anywhere a visitor reads about paying", () => {
        const paying = [
            ...northlight.codePractice.insurance,
            northlight.menu.title,
            northlight.menu.intro ?? "",
            northlight.menu.footnote ?? "",
            ...northlight.menu.groups.flatMap((group) =>
                group.items.map((item) => `${item.name} ${item.note ?? ""}`),
            ),
            ...northlight.faq.items.map((item) => item.answer),
        ].join(" ")
        expect(paying).not.toMatch(
            /aetna|cigna|blue ?cross|united ?health|optum|medica\b|medicare|medicaid|humana|healthpartners|ucare|preferredone|kaiser/i,
        )
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
