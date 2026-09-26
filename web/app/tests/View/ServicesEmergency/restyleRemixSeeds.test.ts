/**
 * The restyled derived templates' parity gate for the emergency/dispatch
 * shape (services-emergency-van, services-electric-techno,
 * services-hvac-desert, services-emergency-hartwell,
 * services-emergency-bayou) — remixSeeds.test.ts's discipline, which is pinned
 * to the original trade seeds.
 *
 * A remix seed (packs/README.md "Derived templates") is composed over the
 * services-emergency pack's content module verbatim, so each seed must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, and every image real under the seed's own
 * public directory. These tests fail the moment the pack's contract moves
 * without its seeds.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import electricCatalog from "../../../../../packs/services-electric-techno/catalog.json"
import bayouCatalog from "../../../../../packs/services-emergency-bayou/catalog.json"
import hartwellCatalog from "../../../../../packs/services-emergency-hartwell/catalog.json"
import vanCatalog from "../../../../../packs/services-emergency-van/catalog.json"
import hvacCatalog from "../../../../../packs/services-hvac-desert/catalog.json"
import { parseAppointmentsContent } from "../../../src/View/Landing/practiceDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/ServicesEmergency/content"
import * as bayou from "../../../src/View/ServicesEmergency/bayouRemix.content"
import * as electric from "../../../src/View/ServicesEmergency/electricTechnoRemix.content"
import * as hartwell from "../../../src/View/ServicesEmergency/hartwellRemix.content"
import * as hvac from "../../../src/View/ServicesEmergency/hvacDesertRemix.content"
import * as van from "../../../src/View/ServicesEmergency/vanRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

interface RemixCatalog {
    key: string
    remixOf: string
    content: { appointments: unknown }
}

const seeds: { name: string; module: ContentModule; publicPrefix: string; catalog: RemixCatalog }[] = [
    { name: "van", module: van, publicPrefix: "/services-emergency-van/", catalog: vanCatalog },
    {
        name: "electric-techno",
        module: electric,
        publicPrefix: "/services-electric-techno/",
        catalog: electricCatalog,
    },
    { name: "hvac-desert", module: hvac, publicPrefix: "/services-hvac-desert/", catalog: hvacCatalog },
    {
        name: "hartwell",
        module: hartwell,
        publicPrefix: "/services-emergency-hartwell/",
        catalog: hartwellCatalog,
    },
    { name: "bayou", module: bayou, publicPrefix: "/services-emergency-bayou/", catalog: bayouCatalog },
]

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
        ...module.systems.items.map((system) => ({ label: `system ${system.code}`, image: system.image })),
        ...module.restorations.items.flatMap((item) => [
            { label: `restoration ${item.title} before`, image: item.before },
            { label: `restoration ${item.title} after`, image: item.after },
        ]),
    ]
}

describe.each(seeds)("emergency $name restyle seed", ({ module, publicPrefix, catalog }) => {
    it("is a derived template of services-emergency on its own key", () => {
        expect(catalog.key).toBe(publicPrefix.slice(1, -1))
        expect(catalog.remixOf).toBe("services-emergency")
    })

    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module).sort()).toEqual(Object.keys(base).sort())
    })

    it("mirrors its own catalog's appointments seed entry for entry", () => {
        // resolveCatalog merges a remix's content per-domain over the
        // base's, so each remix catalog reseeds appointments to match ITS
        // contentSeed module — the composed template books identically
        // from the document or the code fallback, on this trade's own
        // provider.
        expect(catalog.content.appointments).toEqual(module.codeAppointments)
        const parsed = parseAppointmentsContent({ appointments: module.codeAppointments })
        expect(parsed).toEqual(module.codeAppointments)
    })

    it("meets the content contract's minimums", () => {
        // The dispatch shape's product is the call: the number, the promise,
        // and flat printed prices all have to be present.
        expect(module.business.name).not.toBe("")
        expect(module.business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(module.business.license).not.toBe("")
        expect(module.business.dispatchBadge).not.toBe("")
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
