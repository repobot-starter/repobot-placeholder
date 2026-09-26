import { describe, expect, it, vi } from "vitest"
import type { LandingConfig } from "@ui"
import * as current from "../../../src/View/Gala/content"
import * as disco from "../../../src/View/Gala/discoRemix.content"
import * as otto from "../../../src/View/Gala/ottoRemix.content"
import * as walt from "../../../src/View/Gala/waltRemix.content"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The gala family's two home compositions, walked for EVERY seed the
 * family ships: the module this tree carries plus each remix seed. The
 * builders read one content module, so each seed is swapped in under it
 * and the home rebuilt from it — the same swap compose performs.
 *
 * The `stack` home's invariants: it opens on the photograph with the
 * headline and the date line and no ask of its own, each optional band
 * (the lines, the frames, the memory book) renders exactly when filled,
 * every frame is one sequence at the first frame's size, and it closes on
 * the colophon's link to the RSVP page. The `program` home never grows
 * the stack's sections.
 */

type Seed = typeof current

const SEEDS: [string, Seed][] = [
    ["content.ts", current],
    ["disco", disco],
    ["otto", otto],
    ["walt", walt],
]

const NOW = new Date(2026, 8, 24, 10, 30)

async function homeFor(seed: Seed): Promise<LandingConfig> {
    vi.resetModules()
    vi.doMock("../../../src/View/Gala/content", () => seed)
    const { homeLanding } = await import("../../../src/View/Gala/galaLanding")
    vi.doUnmock("../../../src/View/Gala/content")
    return homeLanding("", NOW)
}

describe.each(SEEDS)("gala home from the %s seed", (_label, seed) => {
    it("composes the layout the seed names", async () => {
        const home = await homeFor(seed)
        const ids = home.sections.map((section) => section.id)
        expect(ids[0]).toBe("hero")
        expect(ids[ids.length - 1]).toBe("rsvp-banner")
        if (seed.home.layout === "program") {
            for (const stackOnly of ["band", "frames", "memories"]) expect(ids).not.toContain(stackOnly)
            expect(ids).toContain("program")
            return
        }
        expect(ids.includes("band")).toBe(seed.home.bandTitle.trim() !== "" || seed.home.band.length > 0)
        expect(ids.includes("frames")).toBe(seed.home.stack.length > 0)
        expect(ids.includes("memories")).toBe(seed.home.memories.length > 0)
        expect(ids).not.toContain("program")
    })

    it.runIf(seed.home.layout === "stack")(
        "opens on the photograph and closes on the colophon's RSVP link",
        async () => {
            const home = await homeFor(seed)
            const hero = home.sections[0]
            expect(hero.variant).toBe("full-bleed-media")
            const heroContent = hero.content as {
                headline: string
                subheadline: string
                primaryCta?: unknown
            }
            expect(heroContent.headline).toBe(seed.event.headline)
            expect(heroContent.subheadline).toBe(seed.event.subtitle)
            expect(heroContent.primaryCta).toBeUndefined()

            const banner = home.sections[home.sections.length - 1]
            expect(banner.variant).toBe("colophon")
            const bannerContent = banner.content as { title: string; cta: { label: string; href: string } }
            expect(bannerContent.title).not.toBe("")
            expect(bannerContent.cta.href).toBe("/rsvp")
            expect(bannerContent.cta.label).toBe(
                seed.home.closingCta !== "" ? seed.home.closingCta : seed.landingCopy.rsvpCtaLabel,
            )
        },
    )

    it.runIf(seed.home.layout === "stack" && seed.home.stack.length > 0)(
        "sets every frame in one caption-band sequence",
        async () => {
            const frames = (await homeFor(seed)).sections.find((section) => section.id === "frames")
            expect(frames?.variant).toBe("sequence")
            const content = frames?.content as { items: { caption?: string }[]; captionStack?: string }
            expect(content.captionStack).toBe("band-center")
            expect(content.items).toHaveLength(seed.home.stack.length)
            content.items.forEach((item, index) => {
                const caption = seed.home.stack[index].caption.trim()
                expect(item.caption).toBe(caption !== "" ? seed.home.stack[index].caption : undefined)
            })
        },
    )

    it("keeps the memory book whole: every entry has words and a name", () => {
        for (const memory of seed.home.memories) {
            expect(memory.note.trim(), "memory note").not.toBe("")
            expect(memory.name.trim(), `${memory.note} name`).not.toBe("")
        }
        if (seed.home.memories.length > 0) expect(seed.home.memoriesKicker).not.toBe("")
    })
})
