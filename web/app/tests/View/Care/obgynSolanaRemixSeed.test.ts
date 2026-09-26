import path from "node:path"
import { describe, expect, it } from "vitest"
import solanaCatalog from "../../../../../packs/care-obgyn-solana/catalog.json"
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
import * as solana from "../../../src/View/Care/obgynSolanaRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The care-obgyn-solana remix seed's parity gate (the care-dental-bright
 * seed's sibling). The seed (packs/README.md "Derived templates") is
 * composed over the care pack's content module verbatim, so it must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, its catalog's content seeds mirrored entry for
 * entry, and every image real under the seed's own public directory — the
 * before/after pairs included, each pair one framing.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/care-obgyn-solana/"

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
function allImages(): { label: string; image: solana.CareImage }[] {
    return [
        { label: "home.hero", image: solana.home.hero },
        { label: "story.image", image: solana.story.image },
        ...(solana.spotlight !== null ? [{ label: "spotlight.image", image: solana.spotlight.image }] : []),
        ...(solana.home.progress?.items ?? []).flatMap((item) => [
            { label: `${item.caption} before`, image: item.before },
            { label: `${item.caption} after`, image: item.after },
        ]),
        ...(solana.home.journey?.steps ?? []).flatMap((step) =>
            step.image !== undefined ? [{ label: `journey ${step.title}`, image: step.image }] : [],
        ),
        ...solana.exhibits.items.map((item) => ({ label: `stage ${item.title}`, image: item.image })),
        ...Object.entries(solana.providerPhotos).map(([providerId, image]) => ({
            label: `portrait ${providerId}`,
            image,
        })),
    ]
}

describe("care-obgyn-solana remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        expect(Object.keys(solana).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (careLanding reads every key)", () => {
        expect(keyShape(solana.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's content seeds entry for entry, both domains", () => {
        expect(solanaCatalog.content.practice).toEqual(solana.codePractice)
        expect(solanaCatalog.content.appointments).toEqual(solana.codeAppointments)
        expect(parsePracticeContent({ practice: solana.codePractice })).toEqual(solana.codePractice)
        expect(parseAppointmentsContent({ appointments: solana.codeAppointments })).toEqual(
            solana.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        expect(solana.practice.name).not.toBe("")
        expect(solana.practice.tagline).not.toBe("")
        expect(solana.practice.email).toMatch(/@/)
        expect(solana.codePractice.providers.length).toBeGreaterThanOrEqual(3)
        expect(solana.codePractice.services.length).toBeGreaterThanOrEqual(6)
        expect(solana.codePractice.insurance.length).toBeGreaterThanOrEqual(6)
        expect(solana.codePractice.reviews.length).toBeGreaterThanOrEqual(3)
        expect(solana.codePractice.newPatient.length).toBeGreaterThanOrEqual(3)
        expect(solana.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(solana.codeAppointments.providers.length).toBeGreaterThanOrEqual(2)
        expect(solana.clinicHours.length).toBeGreaterThanOrEqual(5)
        expect(Object.keys(solana.providerPhotos).length).toBeGreaterThanOrEqual(3)
        expect(solana.story.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("walks five life stages as stage cards: full-bleed hero, one arch size, emblem and list each", () => {
        expect(solana.home.layout).toBe("full-bleed")
        expect(solana.home.progress).toBeUndefined()
        expect(solana.home.journey).toBeUndefined()
        expect(solana.promises.items.length).toBe(0)
        const stages = solana.exhibits.items
        expect(stages.length).toBe(5)
        for (const stage of stages) {
            // Unlabeled cards: the emblem, not an eyebrow, heads each one.
            expect(stage.meta, stage.title).toBe("")
            expect(stage.icon, stage.title).toBeDefined()
            expect(stage.points?.length ?? 0, stage.title).toBeGreaterThanOrEqual(3)
            // One photograph size, so the arches line up across the row.
            expect(stage.image.width, stage.title).toBe(stages[0]?.image.width)
            expect(stage.image.height, stage.title).toBe(stages[0]?.image.height)
        }
    })

    it("keeps ids on the contract grammar and joined across domains", () => {
        const practiceIds = new Set(solana.codePractice.providers.map((provider) => provider.providerId))
        for (const provider of solana.codePractice.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const type of solana.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of solana.codeAppointments.providers) {
            expect(practiceIds.has(provider.providerId), provider.providerId).toBe(true)
        }
        for (const providerId of Object.keys(solana.providerPhotos)) {
            expect(practiceIds.has(providerId), providerId).toBe(true)
        }
        for (const providerId of practiceIds) {
            expect(solana.providerPhotos[providerId], `portrait for ${providerId}`).toBeDefined()
        }
    })

    it("keeps appointment durations bookable and every window inside a day", () => {
        for (const type of solana.codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const entry of solana.clinicHours) {
            expect(entry.day).toBeGreaterThanOrEqual(0)
            expect(entry.day).toBeLessThanOrEqual(6)
            expect(entry.close).toBeGreaterThan(entry.open)
            expect(entry.close).toBeLessThanOrEqual(24 * 60)
        }
        for (const provider of solana.codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.end, label).toBeGreaterThan(window.start)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(solana.codeAppointments)
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
