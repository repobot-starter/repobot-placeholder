import { describe, expect, it, vi } from "vitest"
import editionCatalog from "../../../../../packs/wedding-edition/catalog.json"

// The shared shell appends the project manifest's marketing pages to every
// nav ("adding a page rewires every nav"). These tests assert the pack's OWN
// chrome, but the ambient manifest differs per composed tree — pin it empty
// so the assertions are about the pack, not about which tree they shipped in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { LANDING_SECTION_VARIANTS, type LandingConfig } from "@ui"
import { classified, packages, photographer, rolls, stories } from "../../../src/View/WeddingEdition/content"
import {
    aboutLanding,
    editionDateline,
    homeLanding,
    inquireLanding,
    pricesLanding,
    weddingsLanding,
} from "../../../src/View/WeddingEdition/editionLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The Late Edition's doc-aware pages (WeddingEditionPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). Invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually.
 * 2. Isolation — roll interiors share /weddings but are a different
 *    composition; they merge under `roll-<slug>` and never bind to the
 *    index's skeleton.
 * 3. Register — every page is the tabloid preset over kernel variants
 *    only; the look never leans on style overrides.
 */

const document = editionCatalog.landing
const NOW = new Date("2026-09-26T16:00:00Z")

function allPages(): { name: string; config: LandingConfig }[] {
    return [
        { name: "home", config: homeLanding("", NOW) },
        { name: "weddings", config: weddingsLanding("", undefined) },
        ...rolls.map((roll) => ({ name: `roll-${roll.slug}`, config: weddingsLanding("", roll) })),
        { name: "prices", config: pricesLanding("") },
        { name: "about", config: aboutLanding("") },
        { name: "inquire", config: inquireLanding("") },
    ]
}

describe("wedding-edition catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/weddings": "weddings",
            "/prices": "prices",
            "/about": "about",
            "/inquire": "inquire",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(weddingsLanding("", undefined), "weddings", document)).toEqual(
            weddingsLanding("", undefined),
        )
        expect(applySitePageDocument(pricesLanding(""), "prices", document)).toEqual(pricesLanding(""))
        expect(applySitePageDocument(aboutLanding(""), "about", document)).toEqual(aboutLanding(""))
        expect(applySitePageDocument(inquireLanding(""), "inquire", document)).toEqual(inquireLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "classified" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["classified", "hero"])
    })

    it("applies the shared shell link order on every page", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            ...document,
            shell: { nav: { order: { links: ["/inquire", "/weddings"] } } },
        })
        expect(reordered.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Inquire",
            "Weddings",
            "Prices",
            "About",
        ])
    })

    it("bylines the photographer in the nav so the paper's name only runs on the nameplate", () => {
        const front = homeLanding("", NOW)
        expect(front.shell?.nav?.content.logo).toEqual({
            name: photographer.name,
            tagline: photographer.role,
        })
        const hero = front.sections.find((section) => section.type === "hero")
        expect(hero?.variant).toBe("front-page")
    })

    it("roll interiors merge under roll-<slug> and never collide with the index", () => {
        const roll = rolls[0]
        const view = weddingsLanding("", roll)
        expect(applySitePageDocument(view, "", document)).toEqual(view)
        const painted = applySitePageDocument(view, `roll-${roll.slug}`, {
            pages: {
                [`roll-${roll.slug}`]: {
                    sections: [
                        { id: "roll-hero", type: "hero" },
                        { id: "roll-sheet", type: "gallery", media: { items: ["/brand/one.jpg"] } },
                    ],
                },
            },
        })
        const sheet = painted.sections.find((section) => section.id === "roll-sheet")
        expect(
            (sheet?.content as { items: { media: { src: string } }[] }).items.map((item) => item.media.src),
        ).toEqual(["/brand/one.jpg"])
        const indexIds = new Set(document.pages.weddings.sections.map((section) => section.id))
        for (const section of view.sections) {
            expect(indexIds.has(section.id ?? "")).toBe(false)
        }
    })
})

describe("wedding-edition pages", () => {
    it("wears the tabloid register everywhere, with no style overrides", () => {
        expect(document.style.preset).toBe("tabloid")
        for (const { name, config } of allPages()) {
            expect(config.style.preset, name).toBe("tabloid")
            expect(config.style.overrides, `${name} must not override tokens`).toBeUndefined()
        }
    })

    it("composes only from the kernel's registered variants", () => {
        for (const { name, config } of allPages()) {
            for (const section of config.sections) {
                const variants = LANDING_SECTION_VARIANTS[section.type] as readonly string[]
                expect(variants, `${name}/${section.id} ${section.type}`).toContain(section.variant)
            }
        }
    })

    it("opens on the front page and closes on the classified", () => {
        const home = homeLanding("", NOW)
        expect(home.sections.map((section) => `${section.type}:${section.variant}`)).toEqual([
            "hero:front-page",
            "showcase:stories",
            "pricing:tiers",
            "testimonials:quote-grid",
            "cta-banner:classified",
        ])
    })

    it("prints today's date in the paper's time zone on the front page", () => {
        expect(editionDateline(NOW)).toBe("Saturday, September 26, 2026")
        // 11:30pm Saturday in Brooklyn is already Sunday in UTC — the paper keeps New York time.
        expect(editionDateline(new Date("2026-09-27T03:30:00Z"))).toBe("Saturday, September 26, 2026")
        const hero = homeLanding("", NOW).sections[0]
        const edition = (hero?.content as { edition: { dateline: string; masthead: string; byline: string } })
            .edition
        expect(edition.dateline).toBe("Saturday, September 26, 2026")
        expect(edition.masthead).toBe(photographer.paper)
        expect(edition.byline).toBe(photographer.name)
    })

    it("jumps every story to its roll's contact sheet", () => {
        const home = homeLanding("/wedding-edition", NOW)
        const section = home.sections.find((entry) => entry.id === "stories")
        const items = (section?.content as { items: { url: string; linkLabel: string }[] }).items
        expect(items).toHaveLength(stories.length)
        stories.forEach((story, index) => {
            const roll = rolls.find((entry) => entry.slug === story.roll)
            expect(items[index]?.url).toBe(`/wedding-edition/weddings?roll=${story.roll}`)
            expect(items[index]?.linkLabel).toContain(`Roll ${roll?.number}`)
        })
    })

    it("prints each roll as a lightboxed contact sheet with its marks and notes", () => {
        for (const roll of rolls) {
            const sheet = weddingsLanding("", roll).sections.find((section) => section.id === "roll-sheet")
            expect(sheet?.variant).toBe("contact-sheet")
            const content = sheet?.content as {
                edgeCode: string
                firstFrame: number
                lightbox: boolean
                items: { mark?: string; note?: string; media: { srcSet: unknown[] } }[]
            }
            expect(content.lightbox).toBe(true)
            expect(content.edgeCode).toBe(roll.edgeCode)
            expect(content.firstFrame).toBe(roll.firstFrame)
            expect(content.items.map((item) => item.mark)).toEqual(roll.frames.map((frame) => frame.mark))
            expect(content.items.map((item) => item.note)).toEqual(roll.frames.map((frame) => frame.note))
            for (const item of content.items) {
                expect(item.media.srcSet.length).toBeGreaterThan(0)
            }
        }
    })

    it("sends every classified ask to the inquiry page", () => {
        for (const { name, config } of allPages()) {
            for (const section of config.sections.filter((entry) => entry.variant === "classified")) {
                const content = section.content as { title: string; cta: { href: string } }
                expect(content.title, name).toBe(classified.title)
                expect(content.cta.href, name).toBe("/inquire")
            }
        }
    })

    it("renders the packages flat-priced (no monthly reading, no billing toggle)", () => {
        const section = pricesLanding("").sections.find((entry) => entry.id === "packages")
        const content = section?.content as {
            period: string
            tiers: { monthly: number; yearlyPerMonth: number }[]
        }
        expect(content.period).toBe("")
        expect(content.tiers.map((tier) => tier.monthly)).toEqual(packages.map((entry) => entry.price))
        for (const tier of content.tiers) {
            expect(tier.yearlyPerMonth).toBe(tier.monthly)
        }
    })
})
