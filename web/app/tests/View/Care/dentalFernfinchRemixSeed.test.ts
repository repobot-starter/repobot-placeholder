import path from "node:path"
import { describe, expect, it } from "vitest"
import fernfinchCatalog from "../../../../../packs/care-dental-fernfinch/catalog.json"
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
import * as fernfinch from "../../../src/View/Care/dentalFernfinchRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The care-dental-fernfinch remix seed's parity gate (the care-dental-bright
 * seed's sibling). The seed (packs/README.md "Derived templates") is
 * composed over the care pack's content module verbatim, so it must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, its catalog's content seeds mirrored entry for
 * entry, and every image real under the seed's own public directory — the
 * before/after pairs included, each pair one framing.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/care-dental-fernfinch/"

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
function allImages(): { label: string; image: fernfinch.CareImage }[] {
    return [
        { label: "home.hero", image: fernfinch.home.hero },
        { label: "story.image", image: fernfinch.story.image },
        ...(fernfinch.spotlight !== null
            ? [{ label: "spotlight.image", image: fernfinch.spotlight.image }]
            : []),
        ...(fernfinch.home.progress?.items ?? []).flatMap((item) => [
            { label: `${item.caption} before`, image: item.before },
            { label: `${item.caption} after`, image: item.after },
        ]),
        ...(fernfinch.home.journey?.steps ?? []).flatMap((step) =>
            step.image !== undefined ? [{ label: `journey ${step.title}`, image: step.image }] : [],
        ),
        ...Object.entries(fernfinch.providerPhotos).map(([providerId, image]) => ({
            label: `portrait ${providerId}`,
            image,
        })),
    ]
}

describe("care-dental-fernfinch remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        expect(Object.keys(fernfinch).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (careLanding reads every key)", () => {
        expect(keyShape(fernfinch.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's content seeds entry for entry, both domains", () => {
        expect(fernfinchCatalog.content.practice).toEqual(fernfinch.codePractice)
        expect(fernfinchCatalog.content.appointments).toEqual(fernfinch.codeAppointments)
        expect(parsePracticeContent({ practice: fernfinch.codePractice })).toEqual(fernfinch.codePractice)
        expect(parseAppointmentsContent({ appointments: fernfinch.codeAppointments })).toEqual(
            fernfinch.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        expect(fernfinch.practice.name).not.toBe("")
        expect(fernfinch.practice.tagline).not.toBe("")
        expect(fernfinch.practice.email).toMatch(/@/)
        expect(fernfinch.codePractice.providers.length).toBeGreaterThanOrEqual(3)
        expect(fernfinch.codePractice.services.length).toBeGreaterThanOrEqual(6)
        expect(fernfinch.codePractice.insurance.length).toBeGreaterThanOrEqual(6)
        expect(fernfinch.codePractice.reviews.length).toBeGreaterThanOrEqual(3)
        expect(fernfinch.codePractice.newPatient.length).toBeGreaterThanOrEqual(3)
        expect(fernfinch.codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(fernfinch.codeAppointments.providers.length).toBeGreaterThanOrEqual(2)
        expect(fernfinch.clinicHours.length).toBeGreaterThanOrEqual(5)
        expect(Object.keys(fernfinch.providerPhotos).length).toBeGreaterThanOrEqual(3)
        expect(fernfinch.story.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("tells the first visit as a picture book: full-bleed hero, five numbered pages, a fact strip", () => {
        expect(fernfinch.home.layout).toBe("full-bleed")
        expect(fernfinch.home.progress).toBeUndefined()
        const pages = fernfinch.home.journey?.steps ?? []
        expect(pages.length).toBe(5)
        pages.forEach((page, index) => {
            expect(page.label, page.title).toBe(String(index + 1))
            expect(page.image, page.title).toBeDefined()
            // Every page is one plate size, so the book reads as one row.
            expect(page.image?.width, page.title).toBe(pages[0]?.image?.width)
            expect(page.image?.height, page.title).toBe(pages[0]?.image?.height)
        })
        // An unheaded promise list renders as the strip of facts.
        expect(fernfinch.promises.kicker).toBe("")
        expect(fernfinch.promises.title).toBe("")
        expect(fernfinch.promises.items.length).toBe(3)
    })

    it("keeps ids on the contract grammar and joined across domains", () => {
        const practiceIds = new Set(fernfinch.codePractice.providers.map((provider) => provider.providerId))
        for (const provider of fernfinch.codePractice.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const type of fernfinch.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of fernfinch.codeAppointments.providers) {
            expect(practiceIds.has(provider.providerId), provider.providerId).toBe(true)
        }
        for (const providerId of Object.keys(fernfinch.providerPhotos)) {
            expect(practiceIds.has(providerId), providerId).toBe(true)
        }
        for (const providerId of practiceIds) {
            expect(fernfinch.providerPhotos[providerId], `portrait for ${providerId}`).toBeDefined()
        }
    })

    it("keeps appointment durations bookable and every window inside a day", () => {
        for (const type of fernfinch.codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const entry of fernfinch.clinicHours) {
            expect(entry.day).toBeGreaterThanOrEqual(0)
            expect(entry.day).toBeLessThanOrEqual(6)
            expect(entry.close).toBeGreaterThan(entry.open)
            expect(entry.close).toBeLessThanOrEqual(24 * 60)
        }
        for (const provider of fernfinch.codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.end, label).toBeGreaterThan(window.start)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(fernfinch.codeAppointments)
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
