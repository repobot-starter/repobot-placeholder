import path from "node:path"
import { describe, expect, it } from "vitest"
import remixCatalog from "../../../../../packs/care-psychology-cambridge/catalog.json"
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
import * as cambridge from "../../../src/View/Care/cambridgeRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The care-psychology-cambridge remix seed's parity gate (the services family's
 * remixSeeds discipline, the psychologyStudioRemixSeed and kindredRemixSeed siblings). The seed
 * (packs/README.md "Derived templates") is composed over the care pack's
 * content module verbatim, so it must remain a structural twin of
 * `content.ts`: the same export surface, the contract's minimums met, its
 * catalog's content seeds mirrored entry for entry, and every image real
 * under the seed's own public directory. These tests fail the moment the
 * pack's contract moves without its seed — the drift that would otherwise
 * surface as a broken published template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/care-psychology-cambridge/"

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
function allImages(): { label: string; image: cambridge.CareImage }[] {
    return [
        { label: "home.hero", image: cambridge.home.hero },
        { label: "story.image", image: cambridge.story.image },
        ...(cambridge.spotlight !== null
            ? [{ label: "spotlight.image", image: cambridge.spotlight.image }]
            : []),
        ...cambridge.exhibits.items.map((item) => ({ label: `exhibit ${item.title}`, image: item.image })),
        ...Object.entries(cambridge.providerPhotos).map(([providerId, image]) => ({
            label: `portrait ${providerId}`,
            image,
        })),
    ]
}

describe("care-psychology-cambridge remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(cambridge).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (careLanding reads every key)", () => {
        expect(keyShape(cambridge.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's content seeds entry for entry, both domains", () => {
        // resolveCatalog merges a remix's content per-domain over the
        // base's, so the catalog must reseed BOTH domains to match ITS
        // contentSeed module — the composed template renders and books
        // identically from the document or the code fallback.
        expect(remixCatalog.content.practice).toEqual(cambridge.codePractice)
        expect(remixCatalog.content.appointments).toEqual(cambridge.codeAppointments)
        expect(parsePracticeContent({ practice: cambridge.codePractice })).toEqual(cambridge.codePractice)
        expect(parseAppointmentsContent({ appointments: cambridge.codeAppointments })).toEqual(
            cambridge.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        // packs/care/catalog.json contentContract — inherited whole by the
        // remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(cambridge.practice.name).not.toBe("")
        expect(cambridge.practice.tagline).not.toBe("")
        expect(cambridge.practice.email).toMatch(/@/)
        expect(cambridge.codePractice.providers.length).toBeGreaterThanOrEqual(3)
        expect(cambridge.codePractice.services.length).toBeGreaterThanOrEqual(6)
        expect(cambridge.codePractice.insurance.length).toBeGreaterThanOrEqual(6)
        expect(cambridge.codePractice.reviews.length).toBeGreaterThanOrEqual(3)
        expect(cambridge.codePractice.newPatient.length).toBeGreaterThanOrEqual(3)
        expect(cambridge.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(cambridge.codeAppointments.providers.length).toBeGreaterThanOrEqual(2)
        expect(cambridge.clinicHours.length).toBeGreaterThanOrEqual(5)
        expect(Object.keys(cambridge.providerPhotos).length).toBeGreaterThanOrEqual(3)
        expect(cambridge.story.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("keeps ids on the contract grammar and joined across domains", () => {
        const practiceIds = new Set(cambridge.codePractice.providers.map((provider) => provider.providerId))
        for (const provider of cambridge.codePractice.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const type of cambridge.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of cambridge.codeAppointments.providers) {
            expect(practiceIds.has(provider.providerId), provider.providerId).toBe(true)
        }
        for (const providerId of Object.keys(cambridge.providerPhotos)) {
            expect(practiceIds.has(providerId), providerId).toBe(true)
        }
        for (const providerId of practiceIds) {
            expect(cambridge.providerPhotos[providerId], `portrait for ${providerId}`).toBeDefined()
        }
    })

    it("keeps appointment durations bookable and every window inside a day", () => {
        for (const type of cambridge.codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const entry of cambridge.clinicHours) {
            expect(entry.day).toBeGreaterThanOrEqual(0)
            expect(entry.day).toBeLessThanOrEqual(6)
            expect(entry.close).toBeGreaterThan(entry.open)
            expect(entry.close).toBeLessThanOrEqual(24 * 60)
        }
        for (const provider of cambridge.codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.end, label).toBeGreaterThan(window.start)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(cambridge.codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("opens on a full-bleed photograph and leads with an annotated sample report", () => {
        expect(cambridge.home.layout).toBe("full-bleed")
        expect(cambridge.home.headline).toContain("\n")
        expect(cambridge.promises.items.length).toBe(0)
        expect(cambridge.exhibits.items.length).toBe(0)
        const report = cambridge.spotlight?.report
        expect(report?.title).not.toBe("")
        expect(report?.rows.length).toBeGreaterThanOrEqual(4)
        expect(report?.stamp).toBe("Sample")
        expect(cambridge.spotlight?.bullets.length).toBe(4)
        expect(cambridge.journey.layout).toBe("cards")
        expect(cambridge.journey.steps.map((step) => step.title.split(" ")[0])).toEqual([
            "Testing",
            "Feedback",
            "Your",
        ])
        expect(cambridge.menu.title).toContain("$2,800")
        expect(cambridge.landingCopy.home.bannerTitle).toContain("superbills")
    })

    it("dates nothing on the sample report and names no patient", () => {
        const report = cambridge.spotlight?.report
        const printed = [
            report?.label,
            report?.title,
            report?.summary,
            report?.signature,
            report?.stamp,
            ...(report?.rows ?? []).flatMap((row) => [row.label, row.value]),
        ].join(" ")
        expect(printed).not.toMatch(/\b(19|20)\d{2}\b/)
        expect(printed).not.toMatch(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? \d/i)
        expect(printed).not.toMatch(/\b(patient|client|dob|date of birth)\b/i)
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
