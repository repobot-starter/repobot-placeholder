import path from "node:path"
import { describe, expect, it } from "vitest"
import remixCatalog from "../../../../../packs/care-therapy-kindred/catalog.json"
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
import * as kindred from "../../../src/View/Care/kindredRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The care-therapy-kindred remix seed's parity gate (the services family's
 * remixSeeds discipline, the magnoliaRemixSeed and opentrailRemixSeed siblings). The seed
 * (packs/README.md "Derived templates") is composed over the care pack's
 * content module verbatim, so it must remain a structural twin of
 * `content.ts`: the same export surface, the contract's minimums met, its
 * catalog's content seeds mirrored entry for entry, and every image real
 * under the seed's own public directory. These tests fail the moment the
 * pack's contract moves without its seed — the drift that would otherwise
 * surface as a broken published template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/care-therapy-kindred/"

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
function allImages(): { label: string; image: kindred.CareImage }[] {
    return [
        { label: "home.hero", image: kindred.home.hero },
        { label: "story.image", image: kindred.story.image },
        ...(kindred.spotlight !== null ? [{ label: "spotlight.image", image: kindred.spotlight.image }] : []),
        ...kindred.exhibits.items.map((item) => ({ label: `exhibit ${item.title}`, image: item.image })),
        ...kindred.journey.steps.flatMap((step) =>
            step.image !== undefined ? [{ label: `journey ${step.title}`, image: step.image }] : [],
        ),
        ...Object.entries(kindred.providerPhotos).map(([providerId, image]) => ({
            label: `portrait ${providerId}`,
            image,
        })),
    ]
}

describe("care-therapy-kindred remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(kindred).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (careLanding reads every key)", () => {
        expect(keyShape(kindred.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's content seeds entry for entry, both domains", () => {
        // resolveCatalog merges a remix's content per-domain over the
        // base's, so the catalog must reseed BOTH domains to match ITS
        // contentSeed module — the composed template renders and books
        // identically from the document or the code fallback.
        expect(remixCatalog.content.practice).toEqual(kindred.codePractice)
        expect(remixCatalog.content.appointments).toEqual(kindred.codeAppointments)
        expect(parsePracticeContent({ practice: kindred.codePractice })).toEqual(kindred.codePractice)
        expect(parseAppointmentsContent({ appointments: kindred.codeAppointments })).toEqual(
            kindred.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        // packs/care/catalog.json contentContract — inherited whole by the
        // remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(kindred.practice.name).not.toBe("")
        expect(kindred.practice.tagline).not.toBe("")
        expect(kindred.practice.email).toMatch(/@/)
        expect(kindred.codePractice.providers.length).toBeGreaterThanOrEqual(3)
        expect(kindred.codePractice.services.length).toBeGreaterThanOrEqual(6)
        expect(kindred.codePractice.insurance.length).toBeGreaterThanOrEqual(6)
        expect(kindred.codePractice.reviews.length).toBeGreaterThanOrEqual(3)
        expect(kindred.codePractice.newPatient.length).toBeGreaterThanOrEqual(3)
        expect(kindred.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(kindred.codeAppointments.providers.length).toBeGreaterThanOrEqual(2)
        expect(kindred.clinicHours.length).toBeGreaterThanOrEqual(5)
        expect(Object.keys(kindred.providerPhotos).length).toBeGreaterThanOrEqual(3)
        expect(kindred.story.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("keeps ids on the contract grammar and joined across domains", () => {
        const practiceIds = new Set(kindred.codePractice.providers.map((provider) => provider.providerId))
        for (const provider of kindred.codePractice.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const type of kindred.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of kindred.codeAppointments.providers) {
            expect(practiceIds.has(provider.providerId), provider.providerId).toBe(true)
        }
        for (const providerId of Object.keys(kindred.providerPhotos)) {
            expect(practiceIds.has(providerId), providerId).toBe(true)
        }
        for (const providerId of practiceIds) {
            expect(kindred.providerPhotos[providerId], `portrait for ${providerId}`).toBeDefined()
        }
    })

    it("keeps appointment durations bookable and every window inside a day", () => {
        for (const type of kindred.codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const entry of kindred.clinicHours) {
            expect(entry.day).toBeGreaterThanOrEqual(0)
            expect(entry.day).toBeLessThanOrEqual(6)
            expect(entry.close).toBeGreaterThan(entry.open)
            expect(entry.close).toBeLessThanOrEqual(24 * 60)
        }
        for (const provider of kindred.codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.end, label).toBeGreaterThan(window.start)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(kindred.codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("opens on a full-bleed photograph and leads with a filterable therapist directory", () => {
        expect(kindred.home.layout).toBe("full-bleed")
        expect(kindred.home.headline).toContain("\n")
        expect(kindred.home.accent).toBe("last-line")
        expect(kindred.promises.items.length).toBe(3)
        expect(kindred.exhibits.layout).toBe("directory")
        // The directory is the practice's providers themselves; the seed
        // only adds one blurb per provider, keyed by id.
        expect(kindred.exhibits.items).toEqual([])
        expect(kindred.exhibits.extras.map((extra) => extra.providerId)).toEqual(
            kindred.codePractice.providers.map((provider) => provider.providerId),
        )
        for (const extra of kindred.exhibits.extras) expect(extra.description, extra.providerId).not.toBe("")
        for (const provider of kindred.codePractice.providers) {
            expect(kindred.providerPhotos[provider.providerId], provider.name).toBeDefined()
        }
        const tags = new Set(
            kindred.codePractice.providers.flatMap((provider) =>
                (provider.tags ?? "").split("·").map((tag) => tag.trim()),
            ),
        )
        for (const filter of ["Couples", "Grief", "Faith-integrated", "Takes insurance", "Evenings"]) {
            expect(tags.has(filter), filter).toBe(true)
        }
        expect(kindred.journey.layout).toBe("cards")
        expect(kindred.journey.steps.length).toBe(3)
        expect(kindred.spotlight?.headline).toBe("")
    })

    it("names no insurer anywhere a visitor reads about paying", () => {
        const paying = [
            ...kindred.codePractice.insurance,
            kindred.menu.intro ?? "",
            ...kindred.menu.groups.flatMap((group) =>
                group.items.map((item) => `${item.name} ${item.note ?? ""}`),
            ),
        ].join(" ")
        expect(paying).not.toMatch(
            /aetna|cigna|blue ?cross|united ?health|optum|medicare|medicaid|humana|ambetter|amerigroup|kaiser/i,
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
