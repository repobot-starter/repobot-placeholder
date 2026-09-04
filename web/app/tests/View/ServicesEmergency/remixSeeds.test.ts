/**
 * The derived-template seeds' parity gate for the emergency/dispatch shape.
 * A remix seed (packs/README.md "Derived templates") is composed over the
 * services-emergency pack's content module verbatim, so each seed must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, and every image real under the seed's own
 * public directory. These tests fail the moment the pack's contract moves
 * without its seeds.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/ServicesEmergency/content"
import * as electric from "../../../src/View/ServicesEmergency/electricRemix.content"
import * as hvac from "../../../src/View/ServicesEmergency/hvacRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

const seeds: { name: string; module: ContentModule; publicPrefix: string }[] = [
    { name: "electric", module: electric, publicPrefix: "/services-electric/" },
    { name: "hvac", module: hvac, publicPrefix: "/services-hvac/" },
]

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
    ]
}

describe.each(seeds)("emergency $name remix seed", ({ module, publicPrefix }) => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module).sort()).toEqual(Object.keys(base).sort())
    })

    it("meets the content contract's minimums", () => {
        // The dispatch shape's product is the call: the number, the promise,
        // and flat printed prices all have to be present.
        expect(module.business.name).not.toBe("")
        expect(module.business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(module.business.license).not.toBe("")
        expect(module.dispatchBadge).not.toBe("")
        expect(module.serviceArea.length).toBeGreaterThan(0)
        expect(module.services.length).toBeGreaterThanOrEqual(3)
        expect(module.metrics.length).toBeGreaterThanOrEqual(2)
        expect(module.testimonials.length).toBeGreaterThanOrEqual(2)
        expect(module.faq.length).toBeGreaterThanOrEqual(3)
        expect(module.steps.items.length).toBeGreaterThanOrEqual(3)
        expect(module.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(module.about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(module.request.headline).not.toBe("")
        expect(module.request.body).not.toBe("")
    })

    it("keeps service slugs unique and every card priced", () => {
        const slugs = module.services.map((service) => service.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const service of module.services) {
            expect(service.priceNote, `${service.slug} price note`).not.toBe("")
        }
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        for (const { label, image } of allImages(module)) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.src, `${label} must live under ${publicPrefix}`).toMatch(
                new RegExp(`^${publicPrefix.replace(/[/-]/g, "\\$&")}`),
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
