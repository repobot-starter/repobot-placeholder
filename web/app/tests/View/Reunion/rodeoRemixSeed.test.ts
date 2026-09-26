import path from "node:path"
import { describe, expect, it } from "vitest"
import * as base from "../../../src/View/Reunion/content"
import * as rodeo from "../../../src/View/Reunion/rodeoRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The reunion-rodeo remix seed's parity gate (the services family's
 * remixSeeds discipline). The seed (packs/README.md "Derived templates")
 * is composed over the reunion pack's content module verbatim, so it must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, the sections its pinned skeleton names filled,
 * and every image real under the seed's own public directory. These
 * tests fail the moment the pack's contract moves without its seed — the
 * drift that would otherwise surface as a broken published template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/reunion-rodeo/"

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
function allImages(): { label: string; image: rodeo.SiteImage }[] {
    return [
        { label: "reunion.heroImage", image: rodeo.reunion.heroImage },
        ...(rodeo.lodging.image !== null ? [{ label: "lodging.image", image: rodeo.lodging.image }] : []),
        ...(rodeo.packing.image !== null ? [{ label: "packing.image", image: rodeo.packing.image }] : []),
        ...rodeo.activities.items.map((item) => ({ label: `activities ${item.title}`, image: item.image })),
        ...rodeo.memories.photos.map((entry, index) => ({ label: `memories[${index}]`, image: entry.image })),
    ]
}

describe("reunion-rodeo remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(rodeo).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy, the reunion, and home structural twins of the base's", () => {
        expect(keyShape(rodeo.landingCopy)).toEqual(keyShape(base.landingCopy))
        expect(keyShape(rodeo.reunion)).toEqual(keyShape(base.reunion))
        expect(keyShape(rodeo.home)).toEqual(keyShape(base.home))
    })

    it("meets the content contract's minimums", () => {
        // packs/reunion/catalog.json contentContract — inherited whole by
        // the remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(rodeo.reunion.title).not.toBe("")
        expect(rodeo.reunion.email).toMatch(/@/)
        expect(rodeo.reunion.startDateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(rodeo.weekend.days.length).toBeGreaterThanOrEqual(2)
        expect(rodeo.activities.items.length).toBeGreaterThanOrEqual(3)
        expect(rodeo.memories.photos.length).toBeGreaterThanOrEqual(3)
        expect(rodeo.rsvp.faqs.length).toBeGreaterThanOrEqual(2)
    })

    it("fills every section its pinned skeleton names", () => {
        // The poster hero, the stamped stops, the schedule, lodging, the
        // branches, getting there, and the pack list are content-driven in
        // the base builders — an empty one would drop a pinned section.
        expect(rodeo.home.layout).toBe("poster")
        expect(rodeo.reunion.ribbon).not.toBe("")
        expect(rodeo.reunion.seal).not.toBe("")
        for (const item of rodeo.activities.items) expect(item.when, item.title).not.toBe("")
        for (const day of rodeo.weekend.days) expect(day.items.length, day.label).toBeGreaterThanOrEqual(1)
        expect(rodeo.lodging.rooms.length).toBeGreaterThanOrEqual(1)
        expect(rodeo.lodging.image).not.toBeNull()
        expect(rodeo.branches.items.length).toBeGreaterThanOrEqual(2)
        expect(rodeo.gettingThere.steps.length).toBeGreaterThanOrEqual(2)
        expect(rodeo.packing.items.length).toBeGreaterThanOrEqual(3)
        expect(rodeo.packing.image).not.toBeNull()
    })

    it("keeps every image and the brand mark real, described, and under the seed's own directory", () => {
        const prefix = new RegExp(`^${PUBLIC_PREFIX.replace(/[/-]/g, "\\$&")}`)
        for (const { label, image } of allImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.src, `${label} must live under ${PUBLIC_PREFIX}`).toMatch(prefix)
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
        expect(rodeo.landingCopy.navMarkSrc).toMatch(prefix)
        expect(publicAssetPresent(path.join(PUBLIC_DIR, rodeo.landingCopy.navMarkSrc))).toBe(true)
    })
})
