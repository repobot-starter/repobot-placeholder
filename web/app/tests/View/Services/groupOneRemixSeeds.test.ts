/**
 * The parity gate for the services remixes that ride the kernel's newer
 * content slots (the photographic timeline's frames, the hero's panel row,
 * the long-form feature): services-makeup-tidewater and its siblings. Each
 * seed is composed over the services pack's content module verbatim, so it
 * must remain a structural twin of `content.ts` — the same export surface,
 * the contract's minimums met, its catalog's appointments seed mirrored
 * entry for entry, and every image it can render real under its own public
 * directory.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import hallockCatalog from "../../../../../packs/services-contractor-hallock/catalog.json"
import marenCatalog from "../../../../../packs/services-hair-maren/catalog.json"
import sableCatalog from "../../../../../packs/services-hair-sable/catalog.json"
import meridianCatalog from "../../../../../packs/services-contractor-meridian/catalog.json"
import noorCatalog from "../../../../../packs/services-makeup-noor/catalog.json"
import tidewaterCatalog from "../../../../../packs/services-makeup-tidewater/catalog.json"
import { parseAppointmentsContent } from "../../../src/View/Landing/practiceDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/Services/content"
import * as hallock from "../../../src/View/Services/hallockRemix.content"
import * as maren from "../../../src/View/Services/marenRemix.content"
import * as sable from "../../../src/View/Services/sableRemix.content"
import * as meridian from "../../../src/View/Services/meridianRemix.content"
import * as noor from "../../../src/View/Services/noorRemix.content"
import * as tidewater from "../../../src/View/Services/tidewaterRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

interface RemixCatalog {
    key: string
    remixOf: string
    contentSeed: string
    content: { appointments: unknown }
}

const seeds: { name: string; module: ContentModule; catalog: RemixCatalog; seedFile: string }[] = [
    {
        name: "services-makeup-tidewater",
        module: tidewater,
        catalog: tidewaterCatalog,
        seedFile: "tidewaterRemix",
    },
    { name: "services-makeup-noor", module: noor, catalog: noorCatalog, seedFile: "noorRemix" },
    {
        name: "services-contractor-meridian",
        module: meridian,
        catalog: meridianCatalog,
        seedFile: "meridianRemix",
    },
    {
        name: "services-contractor-hallock",
        module: hallock,
        catalog: hallockCatalog,
        seedFile: "hallockRemix",
    },
    { name: "services-hair-maren", module: maren, catalog: marenCatalog, seedFile: "marenRemix" },
    { name: "services-hair-sable", module: sable, catalog: sableCatalog, seedFile: "sableRemix" },
]

/** Every image slot the site can render, labeled for failure messages. */
function allImages(module: ContentModule) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.home.hero.panels.map((panel) => ({
            label: `hero panel ${panel.label}`,
            image: panel.image,
        })),
        ...module.services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
        ...module.projects.flatMap((project) => [
            { label: `project ${project.slug} before`, image: project.before },
            { label: `project ${project.slug} after`, image: project.after },
        ]),
        ...module.buildLog.steps.flatMap((step) => [
            { label: `build log ${step.title}`, image: step.image },
            ...(step.frames ?? []).map((frame, index) => ({
                label: `build log ${step.title} frame ${index + 1}`,
                image: frame,
            })),
        ]),
        ...module.species.items.map((item) => ({ label: `species ${item.name}`, image: item.image })),
        ...module.lookbook.items.map((item) => ({ label: `lookbook ${item.name}`, image: item.image })),
        ...module.palette.items.flatMap((swatch) =>
            swatch.image !== undefined ? [{ label: `swatch ${swatch.name}`, image: swatch.image }] : [],
        ),
        ...(module.policies.image !== null
            ? [{ label: "policies.image", image: module.policies.image }]
            : []),
        ...(module.home.bannerImage !== null
            ? [{ label: "home.bannerImage", image: module.home.bannerImage }]
            : []),
        ...(module.feature.image !== null ? [{ label: "feature.image", image: module.feature.image }] : []),
        ...(module.feature.plate !== null ? [{ label: "feature.plate", image: module.feature.plate }] : []),
        ...module.feature.figures.map((figure) => ({
            label: `feature figure ${figure.title}`,
            image: figure.image,
        })),
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

    it("writes its own booking privacy note", () => {
        expect(module.booking.privacyNote).not.toBe("")
        if (base.business.name !== module.business.name) {
            expect(module.booking.privacyNote).not.toBe(base.booking.privacyNote)
        }
    })
})

describe("services-makeup-tidewater wedding morning", () => {
    it("runs the morning from set-up to the group photograph, every hour photographed and written", () => {
        const steps = tidewater.buildLog.steps
        expect(steps.map((step) => step.label)).toEqual(["6:30", "7:15", "8:00", "8:45", "9:00"])
        for (const step of steps) {
            expect(step.description, step.label).toMatch(/\S/)
            expect(step.image.alt, step.label).toMatch(/\S/)
        }
        expect(steps.some((step) => (step.frames ?? []).length > 0)).toBe(true)
    })

    it("posts the rate as one line and hides the stock services grid", () => {
        expect(tidewater.nowBuilding).toEqual(["Bride $450", "each additional face $140"])
        expect(tidewater.home.serviceGrid).toBe(false)
        expect(tidewater.home.hero.credit).toMatch(/\S/)
    })
})

describe("services-makeup-noor wedding weekend", () => {
    it("arches the four events over the name, each named", () => {
        expect(noor.home.hero.panels.map((panel) => panel.label)).toEqual([
            "Mehndi",
            "Sangeet",
            "Wedding",
            "Reception",
        ])
        expect(noor.home.subheadline).toMatch(/\S/)
    })

    it("prices every event on the package board with a number to add", () => {
        const lines = noor.priceMenu.groups.flatMap((group) => group.items)
        expect(lines.map((line) => line.name)).toEqual(["Mehndi", "Sangeet", "Wedding", "Reception"])
        for (const line of lines) expect(line.price, line.name).toMatch(/^\$\d[\d,]*$/)
    })

    it("runs the weekend Thursday to Sunday and hides the stock services grid", () => {
        expect(noor.buildLog.steps.map((step) => step.label)).toEqual([
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ])
        expect(noor.lookbook.items.length).toBeGreaterThanOrEqual(5)
        expect(noor.home.serviceGrid).toBe(false)
    })
})

describe("services-contractor-meridian coastal masthead", () => {
    it("sets the name alone over a ruled line of places, no panels or kicker", () => {
        expect(meridian.home.headline).toBe("Meridian")
        expect(meridian.home.hero.credit).toMatch(/\S/)
        expect(meridian.home.hero.panels).toEqual([])
        expect(meridian.home.hero.kicker).toBe("")
    })

    it("carries the residences, three numbers and one design story on home", () => {
        expect(meridian.lookbook.items.length).toBeGreaterThanOrEqual(4)
        for (const item of meridian.lookbook.items) expect(item.meta, item.name).toMatch(/sq ft/)
        expect(meridian.home.proofMetrics).toHaveLength(3)
        expect(meridian.feature.headline).not.toBe("")
        expect(meridian.feature.image).not.toBeNull()
        expect(meridian.feature.linkLabel).not.toBe("")
        expect(meridian.home.serviceGrid).toBe(false)
    })
})

describe("services-contractor-hallock long-form feature", () => {
    it("says heirlooms and asks for a commission in the firm's own words", () => {
        expect(hallock.home.headline).toBe("Built to become heirlooms.")
        expect(hallock.landingCopy.quoteCta).toBe("Discuss a commission")
        expect(hallock.landingCopy.nav.cta).toBe("Discuss a commission")
        expect(hallock.home.hero.kicker).toMatch(/\S/)
    })

    it("tells one estate with its quote, two detail figures and the elevation", () => {
        expect(hallock.feature.headline).not.toBe("")
        expect(hallock.feature.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(hallock.feature.pullQuote).not.toBe("")
        expect(hallock.feature.figures.map((figure) => figure.title)).toEqual([
            "Cedar shingle detail",
            "Hand-carved newel post",
        ])
        expect(hallock.feature.plate).not.toBeNull()
        expect(hallock.feature.plateCaption).not.toBe("")
        expect(hallock.home.serviceGrid).toBe(false)
    })
})

describe("services-hair-maren stylist directory", () => {
    it("ranks every stylist Master, Senior or Artisan, two to a level", () => {
        const levels = maren.lookbook.items.map((item) => item.group)
        expect([...new Set(levels)]).toEqual(["Master", "Senior", "Artisan"])
        for (const level of ["Master", "Senior", "Artisan"]) {
            expect(
                levels.filter((entry) => entry === level),
                level,
            ).toHaveLength(2)
        }
    })

    it("gives each stylist specialties, a cut rate and the next open suite", () => {
        for (const item of maren.lookbook.items) {
            expect(item.tags.length, item.name).toBeGreaterThan(0)
            expect(item.meta, item.name).toMatch(/^Cut from \$\d+$/)
            expect(item.description, item.name).toMatch(/^Next suite: /)
        }
        expect(maren.home.headline).toBe("Hair,\nconsidered.")
        expect(maren.home.serviceGrid).toBe(false)
    })
})

describe("services-hair-sable ritual", () => {
    it("times every step of the ritual and lets the rail number them", () => {
        expect(sable.buildLog.steps).toHaveLength(5)
        for (const step of sable.buildLog.steps) {
            expect(step.label, step.title).toBe("")
            expect(step.duration, step.title).toMatch(/^\d+ min$/)
        }
        const minutes = sable.buildLog.steps.reduce(
            (sum, step) => sum + Number.parseInt(step.duration ?? "0"),
            0,
        )
        expect(minutes).toBe(125)
    })

    it("sets the rates as one line and the headline in two", () => {
        for (const rate of sable.nowBuilding) expect(rate).toMatch(/ from \$\d+$/)
        expect(sable.home.headline).toBe("Silk,\npressed.")
        expect(sable.home.serviceGrid).toBe(false)
    })
})
