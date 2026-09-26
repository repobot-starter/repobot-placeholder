import { beforeAll, describe, expect, it, vi } from "vitest"
import type { LandingConfig } from "@ui"
import * as current from "../../../src/View/Interiors/content"
import * as aokifarrow from "../../../src/View/Interiors/aokifarrowRemix.content"
import type { InteriorsMonograph } from "../../../src/View/Interiors/interiorsLanding"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The interiors monograph home (`home.monograph`), walked for the module
 * this tree carries and the aokifarrow seed: a seed without `monograph`
 * keeps its own layout; a seed with one gets the full-bleed hero with the
 * photograph's caption and both asks, the featured projects as one
 * `band-start` plate stack (each caption the title over its place, year,
 * and scope), the feature told from the seed's own photographs, the index
 * of every project in the portfolio, and the colophon's letter.
 */

type Seed = typeof current

const SEEDS: [string, Seed][] = [
    ["content.ts", current],
    ["aokifarrow", aokifarrow],
]

function monographOf(seed: Seed): InteriorsMonograph | undefined {
    return "monograph" in seed.home ? (seed.home.monograph as InteriorsMonograph | undefined) : undefined
}

async function buildersFor(seed: Seed) {
    vi.resetModules()
    vi.doMock("../../../src/View/Interiors/content", () => seed)
    const builders = await import("../../../src/View/Interiors/interiorsLanding")
    vi.doUnmock("../../../src/View/Interiors/content")
    return builders
}

function section(config: LandingConfig, id: string) {
    return config.sections.find((entry) => entry.id === id)
}

describe.each(SEEDS)("interiors home from the %s seed", (_label, seed) => {
    const monograph = monographOf(seed)
    let builders: Awaited<ReturnType<typeof buildersFor>>

    // The first import of a freshly reset module graph is slow under a full
    // parallel suite; load once per seed, off the per-test clock.
    beforeAll(async () => {
        builders = await buildersFor(seed)
    }, 60_000)

    it("composes the monograph exactly when the seed sets it", () => {
        const { homeLanding } = builders
        const config = homeLanding("")
        if (monograph === undefined) {
            expect(section(config, "plates")).toBeUndefined()
            expect(config.sections[0]?.variant).not.toBe("full-bleed-media")
            return
        }
        expect(config.sections.map((entry) => entry.id)).toEqual([
            "hero",
            "plates",
            "feature",
            "featured-work",
            "kind-words",
            "credentials",
            "contact-banner",
        ])
        const hero = config.sections[0]
        expect(hero?.variant).toBe("full-bleed-media")
        expect((hero?.content as { mediaCaption?: string }).mediaCaption).toBe(monograph.heroCaption)
        expect(section(config, "feature")?.variant).toBe("feature")
        expect(section(config, "contact-banner")?.variant).toBe("colophon")
    })

    it("sets the featured projects as the plates, each with its particulars", () => {
        if (monograph === undefined) return
        const { homeLanding } = builders
        const plates = section(homeLanding(""), "plates")
        expect(plates?.type).toBe("gallery")
        expect(plates?.variant).toBe("sequence")
        const content = plates?.content as {
            captionStack?: string
            items: { caption?: string; detail?: string }[]
        }
        expect(content.captionStack).toBe("band-start")
        const featured = seed.projects.filter((project) => project.featured === true)
        expect(content.items.map((item) => item.caption)).toEqual(featured.map((project) => project.title))
        featured.forEach((project, index) => {
            expect(content.items[index]?.detail).toContain(String(project.year))
            expect(content.items[index]?.detail).toContain(project.location ?? "")
        })
    })

    it("indexes every project in the portfolio it is handed", () => {
        if (monograph === undefined) return
        const { homeLanding } = builders
        const index = section(homeLanding(""), "featured-work")
        expect(index?.variant).toBe("card-grid")
        const items = (index?.content as { items: { title: string; meta?: string; media?: unknown }[] }).items
        expect(items.map((item) => item.title)).toEqual(seed.projects.map((project) => project.title))
        expect(items.every((item) => item.media === undefined)).toBe(true)
        const edited = [{ ...seed.projects[1], title: "Renamed by the owner", featured: false }]
        const resolved = homeLanding("", edited)
        expect(
            (section(resolved, "featured-work")?.content as { items: { title: string }[] }).items.map(
                (item) => item.title,
            ),
        ).toEqual(["Renamed by the owner"])
        expect((section(resolved, "plates")?.content as { items: unknown[] }).items).toEqual([])
    })

    it("closes the portfolio page on the monograph's own line when it sets one", () => {
        const { portfolioLanding } = builders
        const banner = JSON.stringify(portfolioLanding("").sections.at(-1)?.content)
        if (monograph?.portfolioClosing !== undefined) {
            expect(banner).toContain(monograph.portfolioClosing)
        } else {
            expect(banner).toContain("kinds of work in the portfolio")
        }
    })

    it("prefixes the monograph's links on the preview route", () => {
        if (monograph === undefined) return
        const { homeLanding } = builders
        const config = homeLanding("/interiors")
        const hero = config.sections[0]?.content as {
            primaryCta: { href: string }
            secondaryCta: { href: string }
        }
        expect(hero.primaryCta.href).toBe("/interiors/portfolio")
        expect(hero.secondaryCta.href).toBe("/interiors/contact")
        const banner = section(config, "contact-banner")?.content as { cta: { href: string } }
        expect(banner.cta.href).toBe("/interiors/contact")
    })
})
