import path from "node:path"
import { describe, expect, it } from "vitest"
import * as base from "../../../src/View/Gala/content"
import * as otto from "../../../src/View/Gala/ottoRemix.content"
import * as walt from "../../../src/View/Gala/waltRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The gala family's `stack` remix seeds, parity-gated (the gala-disco
 * seed test's discipline). Each seed (packs/README.md "Derived
 * templates") is composed over the gala pack's content module verbatim,
 * so it must remain a structural twin of `content.ts`: the same export
 * surface, the contract's minimums met, the stack its pinned skeleton
 * names filled, and every image real under the seed's own public
 * directory.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type Seed = typeof base

const SEEDS: [string, Seed][] = [
    ["gala-otto", otto],
    ["gala-walt", walt],
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

/** Every image slot the seed can render, labeled for failure messages. */
function allImages(seed: Seed): { label: string; image: base.SiteImage }[] {
    return [
        { label: "event.heroImage", image: seed.event.heroImage },
        { label: "venue.image", image: seed.venue.image },
        ...(seed.stay.image !== null ? [{ label: "stay.image", image: seed.stay.image }] : []),
        ...(seed.after.image !== null ? [{ label: "after.image", image: seed.after.image }] : []),
        ...(seed.toastImage !== null ? [{ label: "toastImage", image: seed.toastImage }] : []),
        ...seed.home.stack.map((frame, index) => ({ label: `home.stack[${index}]`, image: frame.image })),
    ]
}

describe.each(SEEDS)("%s remix seed", (key, seed) => {
    const prefix = `/${key}/`

    it("mirrors the base module's export surface exactly", () => {
        expect(Object.keys(seed).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy, the event, and the home a structural twin of the base's", () => {
        expect(keyShape(seed.landingCopy)).toEqual(keyShape(base.landingCopy))
        expect(keyShape(seed.event)).toEqual(keyShape(base.event))
        expect(Object.keys(seed.home).sort()).toEqual(Object.keys(base.home).sort())
    })

    it("meets the content contract's minimums", () => {
        expect(seed.event.title).not.toBe("")
        expect(seed.event.email).toMatch(/@/)
        expect(seed.event.dateIso).toMatch(/^202[67]-\d{2}-\d{2}$/)
        expect(seed.program.items.length).toBeGreaterThanOrEqual(3)
        expect(seed.details.items.length).toBeGreaterThanOrEqual(2)
        expect(seed.rsvp.faqs.length).toBeGreaterThanOrEqual(2)
    })

    it("fills the stack its pinned skeleton names", () => {
        expect(seed.home.layout).toBe("stack")
        expect(seed.event.subtitle).not.toBe("")
        expect(seed.home.bandTitle !== "" || seed.home.band.length > 0).toBe(true)
        expect(seed.home.stack.length).toBeGreaterThanOrEqual(1)
        expect(seed.home.closing).not.toBe("")
        // One size: every frame shares the first frame's shape, and the
        // hero is the same shape, so the stack never changes size.
        const ratio = seed.event.heroImage.width / seed.event.heroImage.height
        for (const frame of seed.home.stack) {
            expect(frame.image.width / frame.image.height, frame.image.src).toBeCloseTo(ratio, 2)
        }
    })

    it("asks for a memory on the reply card whenever the home shows a memory book", () => {
        if (seed.home.memories.length === 0) return
        expect(seed.home.memoriesKicker).not.toBe("")
        const fields: { name: string; type?: string }[] = seed.rsvp.fields
        expect(fields.find((field) => field.name === "memory")?.type).toBe("textarea")
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        for (const { label, image } of allImages(seed)) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.src, `${label} must live under ${prefix}`).toMatch(
                new RegExp(`^${prefix.replace(/[/-]/g, "\\$&")}`),
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
