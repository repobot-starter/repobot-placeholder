import path from "node:path"
import { describe, expect, it } from "vitest"
import documentaryCatalog from "../../../../../packs/photography-family-documentary/catalog.json"
import familyCatalog from "../../../../../packs/photography-family/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import * as base from "../../../src/View/PhotographyFamily/content"
import * as documentary from "../../../src/View/PhotographyFamily/documentaryRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The photography-family-documentary remix seed's parity gate (the
 * services family's remixSeeds discipline). The seed (packs/README.md
 * "Derived templates") is composed over the family pack's content module
 * verbatim, so it must remain a structural twin of `content.ts`: the same
 * export surface, the same landingCopy shape, the contract's minimums met,
 * its catalog's appointments seed mirrored entry for entry, and every
 * image real under the seed's own public directory. These tests fail the
 * moment the pack's contract moves without its seed — the drift that
 * would otherwise surface as a broken published template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/photography-family-documentary/"

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
function allImages(): { label: string; image: documentary.PhotoImage }[] {
    return [
        ...documentary.albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...documentary.heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...documentary.selectedWork.map((image, i) => ({ label: `selectedWork[${i}]`, image })),
        ...documentary.demoProofingAlbums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `proofing ${album.slug}[${i}]`, image })),
        ),
        { label: "about.portrait", image: documentary.about.portrait },
    ]
}

describe("photography-family documentary remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(documentary).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy and the page objects structural twins of the base's", () => {
        // familyLanding and familyShell read every key.
        expect(keyShape(documentary.landingCopy)).toEqual(keyShape(base.landingCopy))
        for (const name of ["photographer", "about", "investment", "book", "galleries", "inquire"] as const) {
            expect(keyShape(documentary[name]), name).toEqual(keyShape(base[name]))
        }
        expect(Object.keys(documentary.home).sort()).toEqual(Object.keys(base.home).sort())
        expect(Object.keys(documentary.proofing).sort()).toEqual(Object.keys(base.proofing).sort())
    })

    it("wears the pinboard home the catalog's pinned skeleton seeds", () => {
        // The pinned home carries the rail and the checklist, which the
        // builders emit only when the seed fills them.
        expect(documentary.home.layout).toBe("pinboard")
        expect(documentary.home.day.length).toBeGreaterThan(0)
        expect(documentary.home.expect.length).toBeGreaterThan(0)
        for (const step of documentary.home.day) {
            expect(documentary.albums[0].images[step.image], step.label).toBeDefined()
        }
        const homeIds = documentaryCatalog.landing.pages.home.sections.map((section) => section.id)
        expect(homeIds).toContain("how-a-day-goes")
        expect(homeIds).toContain("what-to-expect")
    })

    it("mirrors its own catalog's appointments seed entry for entry", () => {
        // resolveCatalog merges a remix's content per-domain over the
        // base's, so the catalog must reseed the domain to match ITS
        // contentSeed module — the composed template books identically
        // from the document or the code fallback.
        expect(documentaryCatalog.content.appointments).toEqual(documentary.codeAppointments)
        expect(parseAppointmentsContent({ appointments: documentary.codeAppointments })).toEqual(
            documentary.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        // packs/photography-family/catalog.json contentContract — inherited
        // whole by the remix (verify-pack-catalogs rejects a remix that
        // redeclares it).
        const slots = familyCatalog.contentContract.slots
        expect(documentary.photographer.name).not.toBe("")
        expect(documentary.photographer.email).toMatch(/@/)
        expect(documentary.heroSlides.length).toBeGreaterThanOrEqual(slots.heroSlides.min)
        expect(documentary.selectedWork.length).toBeGreaterThanOrEqual(slots.selectedWork.min)
        expect(documentary.albums.length).toBeGreaterThanOrEqual(slots.albums.min)
        for (const album of documentary.albums) {
            expect(album.images.length, album.slug).toBeGreaterThanOrEqual(slots.albums.item.images.min)
        }
        expect(documentary.about.paragraphs.length).toBeGreaterThanOrEqual(slots["about.paragraphs"].min)
        expect(documentary.investment.offerings.length).toBeGreaterThanOrEqual(
            slots["investment.offerings"].min,
        )
        expect(documentary.investment.offerings.filter((offering) => offering.highlighted).length).toBe(1)
        expect(documentary.investment.faq.length).toBeGreaterThanOrEqual(slots["investment.faq"].min)
        expect(documentary.home.scribble).not.toBeNull()
        expect(documentary.home.note).not.toBeNull()
    })

    it("keeps session durations bookable and every window inside a day", () => {
        for (const type of documentary.codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
        }
        for (const provider of documentary.codeAppointments.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.end, label).toBeGreaterThan(window.start)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
            }
        }
        const slots = generateAppointmentSlots(documentary.codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("keeps the Galleries sample room pointed at its own demo fixture", () => {
        const sample = documentary.demoProofingAlbums.find(
            (album) => album.slug === documentary.galleries.sample.slug,
        )
        expect(sample).toBeDefined()
        expect(documentary.galleries.sample.body).toContain(sample?.accessCode ?? "missing")
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
