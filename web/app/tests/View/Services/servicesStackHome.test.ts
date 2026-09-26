import { describe, expect, it, vi } from "vitest"
import type { LandingConfig } from "@ui"
import * as current from "../../../src/View/Services/content"
import * as casacal from "../../../src/View/Services/casacalRemix.content"
import * as paintingSwiss from "../../../src/View/Services/paintingSwissRemix.content"
import type { ServicesStack } from "../../../src/View/Services/servicesLanding"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The services `stack` home (`home.stack`), walked for the module this
 * tree carries, a storefront seed, and the stack seed: a seed without
 * `stack` keeps its storefront or title-card home; a seed with one gets
 * the first room with the headline as its line and no ask, the other
 * rooms as one `overlay-start` stack sequence at the hero's size, and the
 * colophon's visit link to the quote page — prefixed on the preview route.
 */

type Seed = typeof current

const SEEDS: [string, Seed][] = [
    ["content.ts", current],
    ["painting-swiss", paintingSwiss],
    ["casacal", casacal],
]

const NOW = new Date(2026, 7, 27, 10, 30)

function stackOf(seed: Seed): ServicesStack | undefined {
    return "stack" in seed.home ? (seed.home.stack as ServicesStack | undefined) : undefined
}

async function buildersFor(seed: Seed) {
    vi.resetModules()
    vi.doMock("../../../src/View/Services/content", () => seed)
    const builders = await import("../../../src/View/Services/servicesLanding")
    vi.doUnmock("../../../src/View/Services/content")
    return builders
}

function section(config: LandingConfig, id: string) {
    return config.sections.find((entry) => entry.id === id)
}

describe.each(SEEDS)("services home from the %s seed", (_label, seed) => {
    const stack = stackOf(seed)

    it("composes the stack exactly when the seed sets one", async () => {
        const { homeLanding } = await buildersFor(seed)
        const config = homeLanding("", NOW)
        if (stack === undefined) {
            expect(config.sections.some((entry) => entry.id === "rooms")).toBe(false)
            expect(config.sections.some((entry) => entry.id === "kind-words")).toBe(true)
            return
        }
        expect(config.sections.map((entry) => entry.id)).toEqual([
            "hero",
            ...(stack.frames.length > 0 ? ["rooms"] : []),
            "quote-banner",
        ])
    })

    it.runIf(stack !== undefined)(
        "opens on the first room with the headline as its line and no ask",
        async () => {
            const { homeLanding } = await buildersFor(seed)
            const hero = section(homeLanding("", NOW), "hero")
            expect(hero?.variant).toBe("full-bleed-media")
            const content = hero?.content as {
                headline: string
                primaryCta?: unknown
                media: { src: string }
            }
            expect(content.headline).toBe(seed.home.headline)
            expect(content.primaryCta).toBeUndefined()
            expect(content.media.src).toBe(seed.home.heroImage.src)
        },
    )

    it.runIf((stack?.frames.length ?? 0) > 0)(
        "sets the rooms as one overlay-captioned sequence, every caption in its frame",
        async () => {
            const { homeLanding } = await buildersFor(seed)
            const rooms = section(homeLanding("", NOW), "rooms")
            expect(rooms?.type).toBe("gallery")
            expect(rooms?.variant).toBe("sequence")
            const content = rooms?.content as {
                captionStack?: string
                items: { caption?: string; media: { src: string } }[]
            }
            expect(content.captionStack).toBe("overlay-start")
            expect(content.items.map((item) => item.media.src)).toEqual(stack?.frames.map((f) => f.image.src))
            expect(content.items.map((item) => item.caption ?? "")).toEqual(
                stack?.frames.map((f) => f.caption),
            )
        },
    )

    it.runIf(stack !== undefined)("closes on the visit link, prefixed on the preview route", async () => {
        const { homeLanding } = await buildersFor(seed)
        for (const basePath of ["", "/services"]) {
            const banner = section(homeLanding(basePath, NOW), "quote-banner")
            expect(banner?.variant).toBe("colophon")
            const content = banner?.content as {
                title: string
                cta: { label: string; href: string }
                align?: string
            }
            expect(content.title).toBe(stack?.closing)
            expect(content.cta).toEqual({ label: stack?.closingCta, href: `${basePath}/quote` })
            expect(content.align).toBe("start")
        }
    })

    it("keeps the inner pages whether or not the home is a stack", async () => {
        const { projectsLanding, servicesPageLanding, aboutLanding, quoteLanding } = await buildersFor(seed)
        expect(section(projectsLanding(""), "transformations")).toBeDefined()
        expect(section(servicesPageLanding(""), "services")).toBeDefined()
        expect(section(aboutLanding(""), "story")).toBeDefined()
        expect(section(quoteLanding(""), "quote-form")).toBeDefined()
    })
})
