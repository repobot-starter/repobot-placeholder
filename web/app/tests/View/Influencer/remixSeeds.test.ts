/**
 * The influencer derived-template seeds. A remix seed (packs/README.md
 * "Derived templates") is composed over the influencer pack's content
 * module verbatim, so each seed must stay a structural twin of
 * `content.ts` — the same export surface, the contract's minimums, a hub
 * and looks its own catalog mirrors, every image real under the seed's own
 * public directory — while its `home.edition` sets the home the base
 * builders read structurally (influencerLanding.ts `InfluencerEdition`).
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import luaCatalog from "../../../../../packs/influencer-lua/catalog.json"
import remiCatalog from "../../../../../packs/influencer-remi/catalog.json"
import { parseContentLinks } from "../../../src/View/Landing/linksDocument"
import { parseContentLooks } from "../../../src/View/Landing/looksDocument"
import type { InfluencerEdition } from "../../../src/View/Influencer/influencerLanding"
import * as base from "../../../src/View/Influencer/content"
import * as lua from "../../../src/View/Influencer/luaRemix.content"
import * as remi from "../../../src/View/Influencer/remiRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

type ContentModule = typeof base

interface RemixCatalog {
    content: { links: { entries: unknown }; looks: { entries: unknown } }
    landing: { style: { preset: string }; pages: { home: { sections: { id: string; variant?: string }[] } } }
}

const seeds: {
    name: string
    module: ContentModule
    edition: InfluencerEdition
    publicPrefix: string
    catalog: RemixCatalog
}[] = [
    {
        name: "lua",
        module: lua,
        edition: lua.home.edition,
        publicPrefix: "/influencer-lua/",
        catalog: luaCatalog,
    },
    {
        name: "remi",
        module: remi,
        edition: remi.home.edition,
        publicPrefix: "/influencer-remi/",
        catalog: remiCatalog,
    },
]

function allImages(module: ContentModule, edition: InfluencerEdition) {
    return [
        { label: "home.heroImage", image: module.home.heroImage },
        { label: "about.photo", image: module.about.photo },
        ...module.looks.map((look) => ({ label: `look ${look.slug}`, image: look.image })),
        ...(edition.story?.frames ?? []).map((frame, index) => ({
            label: `story ${index}`,
            image: frame.image,
        })),
    ]
}

describe.each(seeds)("influencer $name remix seed", ({ module, edition, publicPrefix, catalog }) => {
    it("mirrors the base module's export surface exactly", () => {
        expect(Object.keys(module).sort()).toEqual(Object.keys(base).sort())
    })

    it("meets the content contract's minimums", () => {
        expect(module.creator.handle).toMatch(/^@/)
        expect(module.creator.credentialLine).not.toBe("")
        expect(module.links.length).toBeGreaterThanOrEqual(5)
        expect(module.looks.length).toBeGreaterThanOrEqual(4)
        expect(module.platforms.length).toBeGreaterThanOrEqual(3)
        expect(module.metrics.length).toBeGreaterThanOrEqual(3)
        expect(module.collaborations.length).toBeGreaterThanOrEqual(3)
        expect(module.testimonials.length).toBeGreaterThanOrEqual(3)
        expect(module.about.paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("mirrors its own catalog's hub and looks, in order, and parses under both domains", () => {
        const facts = module.looks.map(({ image: _image, ...entry }) => entry)
        expect(catalog.content.links.entries).toEqual(module.links)
        expect(catalog.content.looks.entries).toEqual(facts)
        expect(parseContentLinks({ links: { entries: module.links } })).toEqual(module.links)
        expect(parseContentLooks({ looks: { entries: facts } })).toEqual(facts)
    })

    it("features some looks but not all, each shoppable", () => {
        const featured = module.looks.filter((look) => look.featured === true)
        expect(featured.length).toBeGreaterThan(0)
        expect(featured.length).toBeLessThan(module.looks.length)
        for (const look of module.looks) expect(look.productLinks?.length ?? 0, look.slug).toBeGreaterThan(0)
    })

    it("keeps every image real under the seed's own directory, with alt text", () => {
        for (const { label, image } of allImages(module, edition)) {
            expect(image.alt, label).not.toBe("")
            expect(image.src.startsWith(publicPrefix), label).toBe(true)
            expect(image.srcSet.map((entry) => entry.src)).toContain(image.src)
            for (const entry of image.srcSet) {
                expect(publicAssetPresent(path.join(PUBLIC_DIR, entry.src)), entry.src).toBe(true)
            }
        }
    })

    it("invents every partner domain", () => {
        for (const link of module.links) {
            const host = new URL(link.url).hostname
            if (link.category === "Partners") expect(host.endsWith(".example"), host).toBe(true)
        }
    })

    it("pins its home's hero and story to the edition", () => {
        const home = catalog.landing.pages.home.sections
        expect(home[0]).toMatchObject({ id: "hero", variant: edition.hero })
        if (edition.story !== null) expect(home[1].id).toBe("story")
    })
})

describe("influencer lua remix seed", () => {
    const edition = lua.home.edition
    const story = edition.story

    it("wears the miradouro register and opens on the diary stack", () => {
        expect(luaCatalog.landing.style.preset).toBe("miradouro")
        expect(story?.variant).toBe("sequence")
        expect(story?.frames.length ?? 0).toBeGreaterThanOrEqual(3)
    })

    it("shoots every diary frame at one size, the hero's shape", () => {
        const ratio = lua.home.heroImage.width / lua.home.heroImage.height
        for (const { image } of story?.frames ?? []) {
            expect(image.width / image.height, image.src).toBeCloseTo(ratio, 2)
            expect(image.width, image.src).toBe(story?.frames[0].image.width)
        }
    })

    it("captions every frame like a diary line: place and hour, then the outfit", () => {
        for (const frame of story?.frames ?? []) expect(frame.caption, frame.image.src).toMatch(/^.+ — .+$/)
    })

    it("sets the headline's last line as the accent line", () => {
        expect(edition.accent).toBe("last-line")
        expect(lua.home.headline.split("\n")).toHaveLength(2)
    })
})

describe("influencer remi remix seed", () => {
    const edition = remi.home.edition
    const story = edition.story

    it("wears the sprocket register and opens on his name over the photograph", () => {
        expect(remiCatalog.landing.style.preset).toBe("sprocket")
        expect(edition.hero).toBe("masthead-overlay")
        expect(remi.home.headline).toBe(remi.creator.name)
    })

    it("prints a whole week's roll: eight frames, one shape, numbered on from the roll, the stock on the edge", () => {
        expect(story.variant).toBe("contact-sheet")
        expect(story.frames).toHaveLength(8)
        expect(story.edgeCode).not.toBe("")
        expect(story.firstFrame).toBeGreaterThan(1)
        const ratio = remi.home.heroImage.width / remi.home.heroImage.height
        for (const { image } of story.frames)
            expect(image.width / image.height, image.src).toBeCloseTo(ratio, 2)
    })

    it("marks his picks in grease pencil: a few circled, one crossed out, notes under some", () => {
        const marks = story.frames.map((frame) => ("mark" in frame ? frame.mark : undefined))
        expect(marks.filter((mark) => mark === "circle").length).toBeGreaterThanOrEqual(2)
        expect(marks).toContain("cross")
        expect(story.frames.filter((frame) => "note" in frame).length).toBeGreaterThanOrEqual(2)
    })

    it("features a full row of fits on the numbered board", () => {
        expect(edition.looks).toBe("specimens")
        expect(remi.looks.filter((look) => look.featured === true)).toHaveLength(4)
    })

    it("speaks in its own words, not Lua's", () => {
        expect(remi.landingCopy.nav.looks).not.toBe(lua.landingCopy.nav.looks)
        expect(remi.landingCopy.finalCtaTitle).not.toBe(lua.landingCopy.finalCtaTitle)
    })
})
