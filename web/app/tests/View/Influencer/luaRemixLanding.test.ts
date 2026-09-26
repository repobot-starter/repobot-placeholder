import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import luaCatalog from "../../../../../packs/influencer-lua/catalog.json"

// The builders run on the influencer-lua seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock("../../../src/View/Influencer/content", () => import("../../../src/View/Influencer/luaRemix.content"))
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { home } from "../../../src/View/Influencer/content"
import {
    aboutLanding,
    contactLanding,
    homeLanding,
    linksLanding,
    looksLanding,
} from "../../../src/View/Influencer/influencerLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The influencer-lua remix's pinned skeletons (packs/influencer-lua/catalog.json
 * `landing.pages`) against the base builders running on the remix's seed:
 * the edition's home — the diary stack after the hero, the looks on a
 * rail, the colophon closing — emits exactly the pinned ids, types,
 * variants, and order, while the base creator keeps her own.
 */

const document = {
    ...luaCatalog.landing,
    routes: { "/": "home", "/looks": "looks", "/links": "links", "/about": "about", "/contact": "contact" },
}

function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

describe("influencer-lua pinned layout", () => {
    it("reproduces each pinned page from the seed exactly", () => {
        for (const [page, build] of [
            ["home", homeLanding],
            ["looks", looksLanding],
            ["links", linksLanding],
            ["about", aboutLanding],
            ["contact", contactLanding],
        ] as const) {
            expect(applySitePageDocument(build(""), page, document), page).toEqual(
                inDocumentRegister(build("")),
            )
        }
    })

    it("opens on the photograph, the headline's last line set as the accent", () => {
        const hero = homeLanding("").sections[0]
        expect(hero.variant).toBe("full-bleed-media")
        const content = hero.content as { headline: string; accent?: string; credit?: string }
        expect(content.headline).toBe(home.headline)
        expect(content.accent).toBe("last-line")
        expect(content.credit).toBe(home.edition.credit)
    })

    it("runs the diary as one full-bleed sequence, captions burned into each frame", () => {
        const story = homeLanding("").sections.find((section) => section.id === "story")
        expect(story?.type).toBe("gallery")
        expect(story?.variant).toBe("sequence")
        const content = story?.content as { captionStack?: string; items: { caption?: string }[] }
        expect(content.captionStack).toBe("overlay-start")
        expect(content.items.map((item) => item.caption)).toEqual(
            home.edition.story.frames.map((frame) => frame.caption),
        )
    })

    it("keeps the two asks wired: looks, then the partnership inquiry", () => {
        const hero = homeLanding("").sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(hero.primaryCta?.href).toBe("/looks")
        expect(hero.secondaryCta?.href).toBe("/contact")
    })
})
