import path from "node:path"
import { describe, expect, it } from "vitest"
import * as base from "../../../src/View/Gala/content"
import * as disco from "../../../src/View/Gala/discoRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The gala-disco remix seed's parity gate (the services family's
 * remixSeeds discipline). The seed (packs/README.md "Derived templates")
 * is composed over the gala pack's content module verbatim, so it must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, the sections its pinned skeleton names filled,
 * and every image real under the seed's own public directory. These
 * tests fail the moment the pack's contract moves without its seed — the
 * drift that would otherwise surface as a broken published template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/gala-disco/"

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
function allImages(): { label: string; image: disco.SiteImage }[] {
    return [
        { label: "event.heroImage", image: disco.event.heroImage },
        { label: "venue.image", image: disco.venue.image },
        ...(disco.stay.image !== null ? [{ label: "stay.image", image: disco.stay.image }] : []),
        ...disco.entertainment.items.map((item) => ({
            label: `entertainment ${item.title}`,
            image: item.image,
        })),
        ...disco.decades.photos.map((entry, index) => ({ label: `decades[${index}]`, image: entry.image })),
    ]
}

describe("gala-disco remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(disco).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy and the event a structural twin of the base's", () => {
        expect(keyShape(disco.landingCopy)).toEqual(keyShape(base.landingCopy))
        expect(keyShape(disco.event)).toEqual(keyShape(base.event))
    })

    it("meets the content contract's minimums", () => {
        // packs/gala/catalog.json contentContract — inherited whole by the
        // remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(disco.event.title).not.toBe("")
        expect(disco.event.email).toMatch(/@/)
        expect(disco.event.dateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(disco.program.items.length).toBeGreaterThanOrEqual(3)
        expect(disco.details.items.length).toBeGreaterThanOrEqual(2)
        expect(disco.rsvp.faqs.length).toBeGreaterThanOrEqual(2)
    })

    it("fills every section its pinned skeleton names", () => {
        // The invitation hero, the floor show, the swatches, the hotel
        // block, the decades wall, and the requests are all content-gated
        // in the base builders — an empty one would drop a pinned section.
        expect(disco.event.name).not.toBe("")
        expect(disco.event.seal).not.toBe("")
        expect(disco.entertainment.items.length).toBeGreaterThanOrEqual(1)
        expect(disco.dressCode.swatches.length).toBeGreaterThanOrEqual(2)
        for (const swatch of disco.dressCode.swatches) {
            expect(swatch.color, `${swatch.name} color`).toMatch(/^#[0-9a-f]{6}$/i)
        }
        expect(disco.stay.title).not.toBe("")
        expect(disco.decades.photos.length).toBeGreaterThanOrEqual(3)
        expect(disco.songs.requests.length).toBeGreaterThanOrEqual(1)
        // The base evening's own beats stay empty: no toast photograph, no
        // after-party card, and the nav carries anchors into the scroll.
        expect(disco.toastImage).toBeNull()
        expect(disco.after.title).toBe("")
        expect(disco.homeAnchors.length).toBeGreaterThan(0)
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
