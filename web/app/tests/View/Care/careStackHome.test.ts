import { describe, expect, it, vi } from "vitest"
import type { LandingConfig } from "@ui"
import * as current from "../../../src/View/Care/content"
import * as oakAdobe from "../../../src/View/Care/oakAdobeRemix.content"
import * as clearwater from "../../../src/View/Care/clearwaterRemix.content"
import * as direct from "../../../src/View/Care/directRemix.content"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The care `stack` home (`home.stack`), walked for the module this tree
 * carries, a clinic seed, and each stack seed: a seed without `stack`
 * keeps the clinic home; a seed with one gets the photograph, the band,
 * the frames as one caption-band sequence, the outcomes report as stats
 * `bars`, and the colophon ask to the
 * booking page — and the facts the clinic home carried (the team, the
 * coverage strip) still render from the resolved practice on the inner
 * pages.
 */

type Seed = typeof current

const SEEDS: [string, Seed][] = [
    ["content.ts", current],
    ["direct", direct],
    ["oak-adobe", oakAdobe],
    ["clearwater", clearwater],
]

const NOW = new Date(2026, 7, 27, 10, 30)

async function buildersFor(seed: Seed) {
    vi.resetModules()
    vi.doMock("../../../src/View/Care/content", () => seed)
    const builders = await import("../../../src/View/Care/careLanding")
    vi.doUnmock("../../../src/View/Care/content")
    return builders
}

function section(config: LandingConfig, id: string) {
    return config.sections.find((entry) => entry.id === id)
}

describe.each(SEEDS)("care home from the %s seed", (_label, seed) => {
    it("composes the stack exactly when the seed sets one", async () => {
        const { homeLanding } = await buildersFor(seed)
        const config = homeLanding("", NOW, seed.codePractice)
        const stack = seed.home.stack
        if (stack === undefined) {
            expect(config.sections[0].variant).toBe(
                seed.home.layout === "full-bleed" ? "full-bleed-media" : "split-media",
            )
            expect(config.sections.some((entry) => entry.id === "frames")).toBe(false)
            return
        }
        expect(config.sections.map((entry) => entry.id)).toEqual([
            "hero",
            ...(stack.band.trim() !== "" ? ["band"] : []),
            ...(stack.frames.length > 0 ? ["frames"] : []),
            ...((stack.report?.rows.length ?? 0) > 0 ? ["numbers"] : []),
            "book-banner",
        ])
        const hero = config.sections[0]
        expect(hero.variant).toBe("full-bleed-media")
        const heroContent = hero.content as { headline: string; primaryCta?: unknown; badge?: unknown }
        expect(heroContent.headline).toBe(seed.home.headline)
        // The photograph carries no ask; the colophon is the one.
        expect(heroContent.primaryCta).toBeUndefined()
        expect(heroContent.badge).toBeUndefined()
    })

    it.runIf((seed.home.stack?.frames.length ?? 0) > 0)(
        "sets the frames as one caption-band sequence",
        async () => {
            const { homeLanding } = await buildersFor(seed)
            const frames = section(homeLanding("", NOW, seed.codePractice), "frames")
            expect(frames?.type).toBe("gallery")
            expect(frames?.variant).toBe("sequence")
            const content = frames?.content as { captionStack?: string; items: { caption?: string }[] }
            expect(content.captionStack).toBe("band-center")
            expect(content.items.map((item) => item.caption ?? "")).toEqual(
                seed.home.stack?.frames.map((frame) => frame.caption.trim()),
            )
        },
    )

    it.runIf((seed.home.stack?.report?.rows.length ?? 0) > 0)(
        "sets the report as stats bars, every row and its note",
        async () => {
            const { homeLanding } = await buildersFor(seed)
            const numbers = section(homeLanding("", NOW, seed.codePractice), "numbers")
            expect(numbers?.type).toBe("stats")
            expect(numbers?.variant).toBe("bars")
            const report = seed.home.stack?.report
            const content = numbers?.content as {
                kicker?: string
                intro?: string
                stats: { label: string; value: string }[]
                footnote?: string
                note?: string
            }
            expect(content.stats).toEqual(report?.rows.map((row) => ({ label: row.label, value: row.value })))
            expect(content.kicker ?? "").toBe(report?.kicker)
            expect(content.intro ?? "").toBe(report?.intro)
            expect(content.footnote ?? "").toBe(report?.footnote)
            expect(content.note ?? "").toBe(report?.note)
        },
    )

    it.runIf(seed.home.stack !== undefined)(
        "closes on the booking ask, prefixed on the preview route",
        async () => {
            const { homeLanding } = await buildersFor(seed)
            for (const [basePath, href] of [
                ["", "/book"],
                ["/care", "/care/book"],
            ]) {
                const banner = section(homeLanding(basePath, NOW, seed.codePractice), "book-banner")
                expect(banner?.variant).toBe("colophon")
                const content = banner?.content as { title: string; cta: { label: string; href: string } }
                expect(content.title).not.toBe("")
                expect(content.cta.label).not.toBe("")
                expect(content.cta.href).toBe(href)
            }
        },
    )

    it("keeps the team and the coverage strip on the inner pages, from the resolved practice", async () => {
        const { providersLanding, servicesLanding, newPatientsLanding } = await buildersFor(seed)
        const edited = {
            ...seed.codePractice,
            providers: [{ providerId: "new-cnm", name: "Test Midwife", credentials: "CNM", bio: "Bio." }],
            insurance: ["Test Mutual"],
        }
        const team = section(providersLanding("", edited), "providers")
        expect((team?.content as { members: { name: string }[] }).members.map((m) => m.name)).toEqual([
            "Test Midwife",
        ])
        for (const config of [servicesLanding("", edited), newPatientsLanding("", edited)]) {
            const strip = section(config, "insurance")
            expect((strip?.content as { logos: { name: string }[] }).logos).toEqual([{ name: "Test Mutual" }])
        }
    })
})
