/**
 * The restyled derived templates' parity gate: services-builder (Tideline
 * Builders) and the four skins (services-hair-braids,
 * services-landscape-native, services-makeup-counter,
 * services-painting-swiss) and the estate-set studios
 * (services-landscape-olivetta, services-landscape-koen), and the room
 * stack (services-painting-casacal). Each seed is composed over the services pack's
 * content module verbatim, so it must remain a structural twin of
 * `content.ts` — the same export surface, the contract's minimums met, its
 * catalog's appointments seed mirrored entry for entry, and every image it
 * can render real under its own public directory.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import builderCatalog from "../../../../../packs/services-builder/catalog.json"
import hairBraidsCatalog from "../../../../../packs/services-hair-braids/catalog.json"
import landscapeNativeCatalog from "../../../../../packs/services-landscape-native/catalog.json"
import koenCatalog from "../../../../../packs/services-landscape-koen/catalog.json"
import olivettaCatalog from "../../../../../packs/services-landscape-olivetta/catalog.json"
import makeupCounterCatalog from "../../../../../packs/services-makeup-counter/catalog.json"
import paintingSwissCatalog from "../../../../../packs/services-painting-swiss/catalog.json"
import casacalCatalog from "../../../../../packs/services-painting-casacal/catalog.json"
import { parseAppointmentsContent } from "../../../src/View/Landing/practiceDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/Services/content"
import * as builder from "../../../src/View/Services/builderRemix.content"
import * as hairBraids from "../../../src/View/Services/hairBraidsRemix.content"
import * as landscapeNative from "../../../src/View/Services/landscapeNativeRemix.content"
import * as koen from "../../../src/View/Services/koenRemix.content"
import * as makeupCounter from "../../../src/View/Services/makeupCounterRemix.content"
import * as olivetta from "../../../src/View/Services/olivettaRemix.content"
import * as paintingSwiss from "../../../src/View/Services/paintingSwissRemix.content"
import * as casacal from "../../../src/View/Services/casacalRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

interface RemixCatalog {
    key: string
    remixOf: string
    contentSeed: string
    content: { appointments: unknown }
}

const seeds: { name: string; module: ContentModule; catalog: RemixCatalog; seedFile: string }[] = [
    { name: "services-builder", module: builder, catalog: builderCatalog, seedFile: "builderRemix" },
    {
        name: "services-hair-braids",
        module: hairBraids,
        catalog: hairBraidsCatalog,
        seedFile: "hairBraidsRemix",
    },
    {
        name: "services-landscape-native",
        module: landscapeNative,
        catalog: landscapeNativeCatalog,
        seedFile: "landscapeNativeRemix",
    },
    {
        name: "services-makeup-counter",
        module: makeupCounter,
        catalog: makeupCounterCatalog,
        seedFile: "makeupCounterRemix",
    },
    {
        name: "services-painting-swiss",
        module: paintingSwiss,
        catalog: paintingSwissCatalog,
        seedFile: "paintingSwissRemix",
    },
    {
        name: "services-landscape-olivetta",
        module: olivetta,
        catalog: olivettaCatalog,
        seedFile: "olivettaRemix",
    },
    { name: "services-landscape-koen", module: koen, catalog: koenCatalog, seedFile: "koenRemix" },
    {
        name: "services-painting-casacal",
        module: casacal,
        catalog: casacalCatalog,
        seedFile: "casacalRemix",
    },
]

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
        ...module.projects.flatMap((project) => [
            { label: `project ${project.slug} before`, image: project.before },
            { label: `project ${project.slug} after`, image: project.after },
        ]),
        ...module.buildLog.steps.map((step) => ({ label: `build log ${step.title}`, image: step.image })),
        ...module.species.items.map((item) => ({ label: `species ${item.name}`, image: item.image })),
        ...module.lookbook.items.map((item) => ({ label: `lookbook ${item.name}`, image: item.image })),
        ...module.journal.items.map((entry) => ({ label: `journal ${entry.season}`, image: entry.image })),
        ...module.walk.frames.map((frame) => ({ label: `walk ${frame.caption}`, image: frame.image })),
        ...module.palette.items.flatMap((swatch) =>
            swatch.image !== undefined ? [{ label: `swatch ${swatch.name}`, image: swatch.image }] : [],
        ),
        ...(module.policies.image !== null
            ? [{ label: "policies.image", image: module.policies.image }]
            : []),
        ...(module.home.bannerImage !== null
            ? [{ label: "home.bannerImage", image: module.home.bannerImage }]
            : []),
    ]
}

describe.each(seeds)("$name remix seed", ({ name, module, catalog, seedFile }) => {
    it("is a derived template of the services pack on its own seed", () => {
        expect(catalog.key).toBe(name)
        expect(catalog.remixOf).toBe("services")
        expect(catalog.contentSeed).toBe(`web/app/src/View/Services/${seedFile}.content.ts`)
    })

    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module).sort()).toEqual(Object.keys(base).sort())
    })

    it("mirrors its own catalog's appointments seed entry for entry", () => {
        expect(catalog.content.appointments).toEqual(module.codeAppointments)
        expect(parseAppointmentsContent({ appointments: module.codeAppointments })).toEqual(
            module.codeAppointments,
        )
    })

    it("meets the content contract's minimums", () => {
        expect(module.business.name).not.toBe("")
        expect(module.business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(module.business.license).not.toBe("")
        expect(module.serviceArea.length).toBeGreaterThan(0)
        expect(module.services.length).toBeGreaterThanOrEqual(3)
        expect(module.projects.length).toBeGreaterThanOrEqual(2)
        expect(module.metrics.length).toBeGreaterThanOrEqual(2)
        expect(module.testimonials.length).toBeGreaterThanOrEqual(2)
        expect(module.faq.length).toBeGreaterThanOrEqual(3)
        expect(module.about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(module.about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(module.quote.headline).not.toBe("")
        expect(module.quote.body).not.toBe("")
    })

    it("keeps the metrics strip on the about page (the home leaves proofMetrics empty)", () => {
        expect(module.home.proofMetrics).toHaveLength(0)
    })

    it("keeps slugs unique and every before/after pair distinct", () => {
        const slugs = [...module.services, ...module.projects].map((entry) => entry.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const project of module.projects) {
            expect(project.before.src, `${project.slug} before must differ from after`).not.toBe(
                project.after.src,
            )
        }
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        const prefix = `/${name}/`
        for (const { label, image } of allImages(module)) {
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

    it("draws the home teaser from real projects", () => {
        for (const featured of module.home.featuredProjects) {
            expect(module.projects).toContain(featured)
        }
    })
})
