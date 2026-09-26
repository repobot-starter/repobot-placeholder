import path from "node:path"
import { describe, expect, it } from "vitest"
import aldercottCatalog from "../../../../../packs/estate-aldercott/catalog.json"
import { parseContentListings } from "../../../src/View/Landing/listingsDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/Estate/content"
import * as aldercott from "../../../src/View/Estate/aldercottRemix.content"
import type { EstateStack } from "../../../src/View/Estate/estateLanding"

/**
 * The estate-aldercott remix seed's parity gate (the estate family's
 * first). The seed (packs/README.md "Derived templates") is composed over
 * the estate pack's content module verbatim, so it must remain a
 * structural twin of `content.ts`: the same export surface, landingCopy
 * key for key, the contract's minimums met, its catalog's listings seed
 * mirrored entry for entry (minus the code-owned photographs, plus the
 * featured flags), and every image real under the seed's own public
 * directory. The plates home is the seed's `home.stack`.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/estate-aldercott/"

type ContentModule = typeof base

const module_: ContentModule = aldercott

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

function allImages(module: ContentModule) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.listings.map((listing) => ({ label: `listing ${listing.slug}`, image: listing.image })),
        ...module.neighborhoods.map((hood) => ({ label: `neighborhood ${hood.slug}`, image: hood.image })),
    ]
}

describe("estate aldercott remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        expect(Object.keys(module_).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy a structural twin of the base's (estateLanding reads every key)", () => {
        expect(keyShape(module_.landingCopy)).toEqual(keyShape(base.landingCopy))
    })

    it("mirrors its own catalog's listings seed entry for entry", () => {
        const featured = new Set(module_.home.featuredListings.map((listing) => listing.slug))
        const facts = module_.listings.map(({ image: _image, ...entry }) => ({
            ...entry,
            ...(featured.has(entry.slug) ? { featured: true } : {}),
        }))
        expect(aldercottCatalog.content.listings.entries).toEqual(facts)
        expect(parseContentListings({ listings: { entries: facts } })).toEqual(facts)
    })

    it("meets the content contract's minimums", () => {
        // packs/estate/catalog.json contentContract — inherited whole.
        expect(module_.agency.name).not.toBe("")
        expect(module_.agency.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(module_.agency.license).not.toBe("")
        expect(module_.listings.length).toBeGreaterThanOrEqual(4)
        expect(module_.neighborhoods.length).toBeGreaterThanOrEqual(2)
        expect(module_.metrics.length).toBeGreaterThanOrEqual(2)
        expect(module_.testimonials.length).toBeGreaterThanOrEqual(2)
        expect(module_.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(module_.about.credentials.length).toBeGreaterThanOrEqual(1)
    })

    it("ships the inventory in every state and features only live listings", () => {
        const statuses = new Set(module_.listings.map((listing) => listing.status))
        expect([...statuses].sort()).toEqual(["available", "pending", "sold"])
        for (const featured of module_.home.featuredListings) {
            expect(module_.listings).toContain(featured)
            expect(featured.status).toBe("available")
        }
    })

    it("sets the plates home: a closing line and the broker's link", () => {
        const stack = (module_.home as { stack?: EstateStack }).stack
        expect(stack).toBeDefined()
        expect(stack?.closing).not.toBe("")
        expect(stack?.agentCta).not.toBe("")
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        for (const { label, image } of allImages(module_)) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.width, `${label} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${label} needs a height`).toBeGreaterThan(0)
            expect(image.src.startsWith(PUBLIC_PREFIX), `${label} must live under ${PUBLIC_PREFIX}`).toBe(
                true,
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

    it("holds the featured plates to one shape, so the stack keeps one size", () => {
        const ratios = module_.home.featuredListings.map((listing) =>
            (listing.image.width / listing.image.height).toFixed(4),
        )
        const hero = (module_.home.heroImage.width / module_.home.heroImage.height).toFixed(4)
        expect(new Set([hero, ...ratios]).size).toBe(1)
    })
})
