import { afterEach, describe, expect, it, vi } from "vitest"
import { season, thread } from "../../../src/View/ServicesRecurring/content"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The estate-set recurring spines, built from each remix's own seed: the
 * base builders stay silent on the base content (empty `thread`/`season`
 * drop their sections) and speak only when a seed fills them.
 */

type Builders = typeof import("../../../src/View/ServicesRecurring/servicesRecurringLanding")

afterEach(() => {
    vi.doUnmock("../../../src/View/ServicesRecurring/content")
    vi.resetModules()
})

async function buildersWithSeed(seed: () => Promise<unknown>): Promise<Builders> {
    vi.resetModules()
    vi.doMock("../../../src/View/ServicesRecurring/content", seed)
    return import("../../../src/View/ServicesRecurring/servicesRecurringLanding")
}

/** A fixed instant inside the Palm Beach season (January). */
const JANUARY = new Date(2026, 0, 14, 10, 0)

describe("services-recurring estate spines", () => {
    // A composed tree's content.ts is its seed; only a silent seed proves silence.
    const silent = thread.messages.length === 0 && season.windows.length === 0

    it.runIf(silent)("emits neither the thread nor the season on the base content", async () => {
        const { homeLanding } = await buildersWithSeed(
            () => import("../../../src/View/ServicesRecurring/content"),
        )
        const ids = homeLanding("", JANUARY).sections.map((section) => section.id)
        expect(ids).not.toContain("thread")
        expect(ids).not.toContain("season")
    })
})

describe("services-recurring-linen house-manager thread", () => {
    const seed = () => import("../../../src/View/ServicesRecurring/linenRemix.content")

    it("follows the hero with the day as a text thread, each bubble beside its plain line", async () => {
        const { homeLanding } = await buildersWithSeed(seed)
        const { thread } = await seed()
        const home = homeLanding("", JANUARY)
        const ids = home.sections.map((section) => section.id)
        expect(ids.indexOf("thread")).toBe(ids.indexOf("hero") + 1)
        const section = home.sections.find((entry) => entry.id === "thread")
        expect(section?.type).toBe("steps")
        expect(section?.variant).toBe("message-thread")
        const content = section?.content as {
            thread: { name: string }
            steps: { title: string; description: string; side: string; media?: unknown }[]
        }
        expect(content.thread.name).toBe(thread.name)
        expect(content.steps).toHaveLength(thread.messages.length)
        expect(new Set(content.steps.map((step) => step.side))).toEqual(new Set(["start", "end"]))
        for (const step of content.steps) expect(step.description).toMatch(/\S/)
        expect(content.steps.some((step) => step.media !== undefined)).toBe(true)
    })
})

describe("services-recurring-worth season calendar", () => {
    const seed = () => import("../../../src/View/ServicesRecurring/worthRemix.content")

    it("prints the year as windows and marks the one the clock is in", async () => {
        const { homeLanding } = await buildersWithSeed(seed)
        const { season } = await seed()
        const home = homeLanding("", JANUARY)
        const ids = home.sections.map((section) => section.id)
        expect(ids.indexOf("season")).toBe(ids.indexOf("hero") + 1)
        const section = home.sections.find((entry) => entry.id === "season")
        expect(section?.type).toBe("schedule")
        expect(section?.variant).toBe("week-grid")
        const days = (section?.content as { days: { label: string; today?: boolean }[] }).days
        expect(days.map((day) => day.label)).toEqual(season.windows.map((window) => window.label))
        const marked = days.filter((day) => day.today === true)
        expect(marked).toHaveLength(1)
        const january = season.windows.findIndex((window) => window.months.includes(1))
        expect(days[january].today).toBe(true)
    })
})
