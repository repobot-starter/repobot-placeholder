import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import remiCatalog from "../../../../../packs/influencer-remi/catalog.json"

// The builders run on the influencer-remi seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock(
    "../../../src/View/Influencer/content",
    () => import("../../../src/View/Influencer/remiRemix.content"),
)
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { creator, home } from "../../../src/View/Influencer/content"
import {
    aboutLanding,
    contactLanding,
    homeLanding,
    linksLanding,
    looksLanding,
} from "../../../src/View/Influencer/influencerLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The influencer-remi remix's pinned skeletons (packs/influencer-remi/catalog.json
 * `landing.pages`) against the base builders running on the remix's seed:
 * the edition's home — the name as the masthead, the roll as a contact
 * sheet, the fits as numbered plates, three quotes, the full-bleed band —
 * emits exactly the pinned ids, types, variants, and order.
 */

const document = {
    ...remiCatalog.landing,
    routes: { "/": "home", "/looks": "looks", "/links": "links", "/about": "about", "/contact": "contact" },
}

function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

describe("influencer-remi pinned layout", () => {
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

    it("sets his name as the masthead, the place as its kicker, the film as its credit", () => {
        const hero = homeLanding("").sections[0]
        expect(hero.variant).toBe("masthead-overlay")
        const content = hero.content as { badge?: string; headline: string; accent?: string; credit?: string }
        expect(content.headline).toBe(creator.name)
        expect(content.badge).toBe(creator.location)
        expect(content.accent).toBe("none")
        expect(content.credit).toBe(home.edition.credit)
    })

    it("prints the roll as a contact sheet: numbered from the roll, the stock on the edge, his picks marked", () => {
        const story = homeLanding("").sections.find((section) => section.id === "story")
        expect(story?.variant).toBe("contact-sheet")
        const content = story?.content as {
            edgeCode?: string
            firstFrame?: number
            lightbox?: boolean
            items: { mark?: string; note?: string }[]
        }
        expect(content.edgeCode).toBe(home.edition.story.edgeCode)
        expect(content.firstFrame).toBe(home.edition.story.firstFrame)
        expect(content.lightbox).toBe(true)
        expect(content.items).toHaveLength(home.edition.story.frames.length)
        expect(content.items.filter((item) => item.mark !== undefined).length).toBeGreaterThan(0)
        expect(content.items.filter((item) => item.note !== undefined).length).toBeGreaterThan(0)
    })

    it("numbers the featured fits as plates, the shelf after the number", () => {
        const board = homeLanding("").sections.find((section) => section.id === "featured-looks")
        expect(board?.variant).toBe("specimens")
        const items = (board?.content as { items: { eyebrow?: string; meta?: string }[] }).items
        expect(items.map((item) => item.eyebrow)).toEqual(
            items.map((_, index) => String(index + 1).padStart(2, "0")),
        )
    })

    it("closes every page on the full-bleed band, the brief as the ask", () => {
        for (const build of [homeLanding, looksLanding, linksLanding, aboutLanding]) {
            const band = build("").sections.find((section) => section.id === "contact-banner")
            expect(band?.variant).toBe("full-bleed")
            expect((band?.content as { cta: { href: string } }).cta.href).toBe("/contact")
        }
    })

    it("labels the looks grid with the seed's own kicker", () => {
        const grid = looksLanding("").sections.find((section) => section.id === "looks")
        expect((grid?.content as { kicker?: string }).kicker).toBe(home.edition.copy.featuredKicker)
    })
})
