import path from "node:path"
import { describe, expect, it } from "vitest"
import atwaterCatalog from "../../../../../packs/care-dental-atwater/catalog.json"
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
import * as atwater from "../../../src/View/Care/dentalAtwaterRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The care-dental-atwater remix seed's parity gate (the care-dental-bright
 * seed's sibling). The seed (packs/README.md "Derived templates") is
 * composed over the care pack's content module verbatim, so it must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, its catalog's content seeds mirrored entry for
 * entry, and every image real under the seed's own public directory — the
 * before/after pairs included, each pair one framing.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/care-dental-atwater/"

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
function allImages(): { label: string; image: atwater.CareImage }[] {
    return [
        { label: "home.hero", image: atwater.home.hero },
        { label: "story.image", image: atwater.story.image },
        ...(atwater.spotlight !== null ? [{ label: "spotlight.image", image: atwater.spotlight.image }] : []),
        ...(atwater.home.progress?.items ?? []).flatMap((item) => [
            { label: `${item.caption} before`, image: item.before },
            { label: `${item.caption} after`, image: item.after },
        ]),
        ...(atwater.home.journey?.steps ?? []).flatMap((step) =>
            step.image !== undefined ? [{ label: `journey ${step.title}`, image: step.image }] : [],
        ),
        ...Object.entries(atwater.providerPhotos).map(([providerId, image]) => ({
            label: `portrait ${providerId}`,
            image,
        })),
    ]
}

describe("care-dental-atwater remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        expect(Object.keys(atwater).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (careLanding reads every key)", () => {
        expect(keyShape(atwater.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's content seeds entry for entry, both domains", () => {
        expect(atwaterCatalog.content.practice).toEqual(atwater.codePractice)
        expect(atwaterCatalog.content.appointments).toEqual(atwater.codeAppointments)
        expect(parsePracticeContent({ practice: atwater.codePractice })).toEqual(atwater.codePractice)
        expect(parseAppointmentsContent({ appointments: atwater.codeAppointments })).toEqual(
            atwater.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        expect(atwater.practice.name).not.toBe("")
        expect(atwater.practice.tagline).not.toBe("")
        expect(atwater.practice.email).toMatch(/@/)
        expect(atwater.codePractice.providers.length).toBeGreaterThanOrEqual(3)
        expect(atwater.codePractice.services.length).toBeGreaterThanOrEqual(6)
        expect(atwater.codePractice.insurance.length).toBeGreaterThanOrEqual(6)
        expect(atwater.codePractice.reviews.length).toBeGreaterThanOrEqual(3)
        expect(atwater.codePractice.newPatient.length).toBeGreaterThanOrEqual(3)
        expect(atwater.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(atwater.codeAppointments.providers.length).toBeGreaterThanOrEqual(2)
        expect(atwater.clinicHours.length).toBeGreaterThanOrEqual(5)
        expect(Object.keys(atwater.providerPhotos).length).toBeGreaterThanOrEqual(3)
        expect(atwater.story.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("leads the home page with its proof: full-bleed hero, three pairs, the path to retainers", () => {
        expect(atwater.home.layout).toBe("full-bleed")
        const pairs = atwater.home.progress?.items ?? []
        expect(pairs.length).toBe(3)
        for (const item of pairs) {
            // One face, one framing: the divider drags across a single frame.
            expect(item.before.width, item.caption).toBe(item.after.width)
            expect(item.before.height, item.caption).toBe(item.after.height)
            expect(item.before.src, item.caption).not.toBe(item.after.src)
            expect(item.beforeLabel, item.caption).toBeDefined()
            expect(item.afterLabel, item.caption).toBeDefined()
        }
        expect(atwater.home.journey?.steps.every((step) => step.icon !== undefined)).toBe(true)
    })

    it("keeps ids on the contract grammar and joined across domains", () => {
        const practiceIds = new Set(atwater.codePractice.providers.map((provider) => provider.providerId))
        for (const provider of atwater.codePractice.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const type of atwater.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of atwater.codeAppointments.providers) {
            expect(practiceIds.has(provider.providerId), provider.providerId).toBe(true)
        }
        for (const providerId of Object.keys(atwater.providerPhotos)) {
            expect(practiceIds.has(providerId), providerId).toBe(true)
        }
        for (const providerId of practiceIds) {
            expect(atwater.providerPhotos[providerId], `portrait for ${providerId}`).toBeDefined()
        }
    })

    it("keeps appointment durations bookable and every window inside a day", () => {
        for (const type of atwater.codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const entry of atwater.clinicHours) {
            expect(entry.day).toBeGreaterThanOrEqual(0)
            expect(entry.day).toBeLessThanOrEqual(6)
            expect(entry.close).toBeGreaterThan(entry.open)
            expect(entry.close).toBeLessThanOrEqual(24 * 60)
        }
        for (const provider of atwater.codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.end, label).toBeGreaterThan(window.start)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(atwater.codeAppointments)
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
