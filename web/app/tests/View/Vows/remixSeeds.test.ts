import path from "node:path"
import { marketingPresetDefinitions } from "@ui"
import { describe, expect, it } from "vitest"
import bigsurCatalog from "../../../../../packs/vows-bigsur/catalog.json"
import orchardCatalog from "../../../../../packs/vows-orchard/catalog.json"
import parisCatalog from "../../../../../packs/vows-paris/catalog.json"
import * as bigsur from "../../../src/View/Vows/bigsurRemix.content"
import * as orchard from "../../../src/View/Vows/orchardRemix.content"
import * as paris from "../../../src/View/Vows/parisRemix.content"
import * as base from "../../../src/View/Vows/content"
import { PACK_REGISTERS } from "../../../src/View/Site/packRegisters.gen"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The quiet vows remixes' parity gate (vows-photobooth's discipline, one
 * table for the three seeds). Each seed (packs/README.md "Derived
 * templates") is composed over the vows pack's content module verbatim, so
 * it must remain a structural twin of `content.ts`: the same export
 * surface, the contract's minimums met, the slots its home layout reads
 * filled, every image real under the seed's own public directory — and
 * its catalog wearing the register end to end, brand equal to the preset's
 * accents.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

const remixes = [
    {
        key: "vows-bigsur" as const,
        seed: bigsur,
        catalog: bigsurCatalog,
        preset: "seafog" as const,
        layout: "story",
    },
    {
        key: "vows-orchard" as const,
        seed: orchard,
        catalog: orchardCatalog,
        preset: "harvest" as const,
        layout: "stack",
    },
    {
        key: "vows-paris" as const,
        seed: paris,
        catalog: parisCatalog,
        preset: "carton" as const,
        layout: "letter",
    },
]

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

type Seed = typeof base

/** Every image slot the seed fills, labeled for failure messages. */
function allImages(seed: Seed): { label: string; image: base.SiteImage }[] {
    const { home, story, schedule } = seed
    const slot = (label: string, image: base.SiteImage | undefined) =>
        image !== undefined ? [{ label, image }] : []
    return [
        ...slot("home.heroImage", home.heroImage),
        ...home.stack.map((frame, index) => ({ label: `stack[${index}]`, image: frame.image })),
        ...story.chapters.flatMap((chapter) => slot(`chapter ${chapter.title}`, chapter.image)),
        ...story.gallery.map((snapshot, index) => ({ label: `gallery[${index}]`, image: snapshot.image })),
        ...schedule.venues.flatMap((venue) => slot(`venue ${venue.name}`, venue.image)),
    ]
}

describe.each(remixes)("$key remix seed", ({ key, seed, catalog, preset, layout }) => {
    it("mirrors the base module's export surface exactly", () => {
        expect(Object.keys(seed).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy, the couple, and home structural twins of the base's", () => {
        expect(keyShape(seed.landingCopy)).toEqual(keyShape(base.landingCopy))
        expect(keyShape(seed.couple)).toEqual(keyShape(base.couple))
        const pick = (home: Seed["home"]) => {
            const {
                wall: _wall,
                details: _details,
                weekend: _weekend,
                stack: _stack,
                heroImage: _hero,
                ...rest
            } = home
            return rest
        }
        expect(keyShape(pick(seed.home))).toEqual(keyShape(pick(base.home)))
    })

    it("meets the content contract's minimums", () => {
        // packs/vows/catalog.json contentContract — inherited whole by the
        // remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(seed.couple.names).not.toBe("")
        expect(seed.couple.email).toMatch(/@/)
        expect(seed.couple.weddingDateIso).toMatch(/^2027-\d{2}-\d{2}$/)
        expect(seed.rsvp.replyByIso < seed.couple.weddingDateIso).toBe(true)
        expect(seed.story.chapters.length).toBeGreaterThanOrEqual(2)
        expect(seed.story.gallery.length).toBeGreaterThanOrEqual(3)
        expect(seed.schedule.days.length).toBe(3)
        expect(seed.travel.hotels.length).toBeGreaterThanOrEqual(2)
        expect(seed.party.members.length).toBeGreaterThanOrEqual(2)
        expect(seed.rsvp.faqs.length).toBeGreaterThanOrEqual(2)
        expect(seed.rsvp.fields.map((field) => field.name)).toEqual(
            base.rsvp.fields.map((field) => field.name),
        )
    })

    it("fills the slots its home layout reads", () => {
        expect(seed.home.layout).toBe(layout)
        expect(seed.home.closing).not.toBe("")
        if (layout === "story" || layout === "letter")
            expect(seed.home.weekend.length).toBe(seed.schedule.days.length)
        if (layout === "stack") expect(seed.home.stack.length).toBeGreaterThanOrEqual(2)
        if (layout === "letter") expect(seed.home.heroImage).toBeUndefined()
        else expect(seed.home.heroImage).toBeDefined()
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        const prefix = `/${key}/`
        for (const { label, image } of allImages(seed)) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.src.startsWith(prefix), `${label} must live under ${prefix}`).toBe(true)
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

    it("declares its register end to end, its brand equal to the preset's accents", () => {
        expect(catalog.landing.style.preset).toBe(preset)
        expect(PACK_REGISTERS[key]).toBe(preset)
        const definition = marketingPresetDefinitions[preset]
        expect(catalog.theme.brand.primary).toBe(definition.modes.light.palette.accent)
        expect(catalog.theme.brand.primaryDark).toBe(definition.modes.dark.palette.accent)
    })
})
