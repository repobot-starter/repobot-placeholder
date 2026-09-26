import { afterEach, describe, expect, it, vi } from "vitest"
import * as content from "../../../src/View/ServicesEmergency/vanRemix.content"
import {
    homeLanding,
    servicesPageLanding,
} from "../../../src/View/ServicesEmergency/servicesEmergencyLanding"

// The flat-rate home is services-emergency-van's: its seed stands in for the
// module in every tree (the pack's own content ships the original dispatch
// home, which has no board, report or thread).
vi.mock(
    "../../../src/View/ServicesEmergency/content",
    () => import("../../../src/View/ServicesEmergency/vanRemix.content"),
)

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The flat-rate home: reliability shown, not claimed. The on-call pill is
 * computed from the content's schedule (never a fake live tracker), the
 * price board on the hero photo prints every line the owner lettered (the
 * full price book stays on /services), the job report puts the quote beside
 * the final, and the text thread walks through how it works.
 */

function section(id: string) {
    const found = homeLanding("").sections.find((entry) => entry.id === id)
    expect(found, `home section ${id}`).toBeDefined()
    return found!
}

async function homeWithContent(patch: (real: typeof content) => Partial<typeof content>) {
    vi.resetModules()
    vi.doMock("../../../src/View/ServicesEmergency/content", async () => {
        const real = await vi.importActual<typeof content>(
            "../../../src/View/ServicesEmergency/vanRemix.content",
        )
        return { ...real, ...patch(real) }
    })
    const builders = await import("../../../src/View/ServicesEmergency/servicesEmergencyLanding")
    const home = builders.homeLanding("")
    vi.doUnmock("../../../src/View/ServicesEmergency/content")
    vi.resetModules()
    return home
}

describe("services-emergency-van flat-rate home", () => {
    it("runs the approved stack in order", () => {
        expect(homeLanding("").sections.map((entry) => entry.id)).toEqual([
            "hero",
            "dispatch-proof",
            "job-report",
            "when-you-call",
            "kind-words",
            "service-area",
            "call-banner",
        ])
    })

    it("wears a live 24/7 on-call pill with the measured typical arrival", () => {
        const hero = section("hero")
        expect(hero.content).toMatchObject({
            badge: `On call now, 24/7 · ${content.onCall.typicalArrival}`,
            badgeLive: true,
        })
    })

    it("fills the hero with the photograph and paints the seal on it", () => {
        const hero = section("hero")
        expect(hero.variant).toBe("full-bleed-media")
        expect(hero.content).toMatchObject({
            media: { kind: "image", src: content.home.heroImage?.src },
            seal: content.home.seal,
        })
        expect(content.home.seal).not.toBe("")
    })

    it("letters every price-board line on the hero, the quote form one tap away", () => {
        const aside = (
            section("hero").content as {
                aside: {
                    kind: string
                    title: string
                    items: { name: string; price: string; qualifier?: string }[]
                    footnote?: string
                    cta?: { href: string }
                }
            }
        ).aside
        expect(aside.kind).toBe("price-board")
        expect(aside.title).toBe(content.priceBoard.title)
        expect(aside.items.map((item) => `${item.name} ${item.price}`)).toEqual(
            content.priceBoard.items.map((item) => `${item.name} ${item.price}`),
        )
        expect(aside.footnote).toBe(content.priceBoard.footnote)
        expect(aside.cta?.href).toBe("/request")
    })

    it("keeps every price-book line under its group on /services", () => {
        const pricing = servicesPageLanding("").sections.find((entry) => entry.id === "price-book")
        expect(pricing?.variant).toBe("price-list")
        const groups = (pricing?.content as { groups: { heading?: string; items: { name: string }[] }[] })
            .groups
        expect(groups.flatMap((group) => group.items.map((item) => item.name))).toEqual(
            content.priceBook.items.map((item) => item.name),
        )
        expect(groups.map((group) => group.heading)).toEqual([
            ...new Set(content.priceBook.items.map((item) => item.group)),
        ])
    })

    it("files the first job report with the quote beside the final", () => {
        const report = section("job-report")
        expect(report.variant).toBe("report")
        const card = (
            report.content as { report: { rows: { label: string; value: string; highlight?: boolean }[] } }
        ).report
        const quoted = card.rows.find((row) => row.label === "Quoted")
        const final = card.rows.find((row) => row.label === "Final")
        expect(final?.highlight).toBe(true)
        expect(final?.value).toBe(quoted?.value)
    })

    it("walks through how it works as the text thread, photo attached", () => {
        const steps = section("when-you-call")
        expect(steps.variant).toBe("message-thread")
        const thread = steps.content as {
            thread: { name: string }
            steps: { title: string; description: string; side: string; media?: { kind: string } }[]
        }
        expect(thread.thread.name).toBe(content.heroThread.name)
        expect(thread.steps.map((step) => step.title)).toEqual(
            content.heroThread.messages.map((message) => message.text),
        )
        expect(thread.steps.map((step) => step.side)).toEqual(
            content.heroThread.messages.map((message) => message.side),
        )
        expect(thread.steps[0].description).toBe(content.steps.items[0].description)
        expect(thread.steps.some((step) => step.media?.kind === "image")).toBe(true)
    })

    it("puts the text thread beside the headline when there is no photograph", async () => {
        const home = await homeWithContent((real) => ({ home: { ...real.home, heroImage: null } }))
        const hero = home.sections[0]
        expect(hero.variant).toBe("split-media")
        expect(hero.content).not.toHaveProperty("media")
        const aside = (hero.content as { aside: { kind: string; messages: { text: string }[] } }).aside
        expect(aside.kind).toBe("thread")
        expect(aside.messages.map((message) => message.text)).toEqual(
            content.heroThread.messages.map((message) => message.text),
        )
        const steps = home.sections.find((entry) => entry.id === "when-you-call")
        expect(steps?.variant).toBe("numbered-cards")
        const titles = (steps?.content as { steps: { title: string }[] }).steps.map((step) => step.title)
        expect(titles.some((title) => aside.messages.some((message) => message.text === title))).toBe(false)
    })

    it("sets the photograph beside the call when there is no board", async () => {
        const home = await homeWithContent((real) => ({ priceBoard: { ...real.priceBoard, items: [] } }))
        expect(home.sections[0].variant).toBe("split-media")
        expect(home.sections[0].content).toMatchObject({ media: { src: content.home.heroImage?.src } })
    })

    it("sets the services grid and the full price book on the home when the board is empty", async () => {
        const home = await homeWithContent((real) => ({ priceBoard: { ...real.priceBoard, items: [] } }))
        const ids = home.sections.map((entry) => entry.id)
        expect(ids.slice(0, 4)).toEqual(["hero", "dispatch-proof", "services", "price-book"])
        expect(home.sections[0].content).not.toHaveProperty("aside")
    })
})

describe("services-emergency on-call pill off the 24/7 schedule", () => {
    afterEach(() => {
        vi.doUnmock("../../../src/View/ServicesEmergency/content")
        vi.resetModules()
    })

    async function homeWithWeek(week: { day: number; intervals: [number, number][] }[], now: Date) {
        vi.resetModules()
        vi.doMock("../../../src/View/ServicesEmergency/content", async () => {
            const real = await vi.importActual<typeof content>(
                "../../../src/View/ServicesEmergency/vanRemix.content",
            )
            return { ...real, onCall: { ...real.onCall, week } }
        })
        const builders = await import("../../../src/View/ServicesEmergency/servicesEmergencyLanding")
        return builders.homeLanding("", now).sections[0].content as { badge: string; badgeLive?: boolean }
    }

    // Tuesday 2026-09-22 at 10:00 local; on call weekdays 7 AM–10 PM.
    const weekdays = [1, 2, 3, 4, 5].map((day) => ({
        day,
        intervals: [[7 * 60, 22 * 60]] as [number, number][],
    }))

    it("reads the engine's close time while on call", async () => {
        const hero = await homeWithWeek(weekdays, new Date(2026, 8, 22, 10, 0))
        expect(hero.badge).toBe(`On call now — until 10 PM · ${content.onCall.typicalArrival}`)
        expect(hero.badgeLive).toBe(true)
    })

    it("says when it's back, without the live dot, while off call", async () => {
        const hero = await homeWithWeek(weekdays, new Date(2026, 8, 26, 12, 0))
        expect(hero.badge).toMatch(/^Back on call Monday 7 AM/)
        expect(hero.badgeLive).toBeUndefined()
    })

    it("falls back to the static dispatch badge with no schedule", async () => {
        const hero = await homeWithWeek([], new Date(2026, 8, 22, 10, 0))
        expect(hero.badge).toBe(content.business.dispatchBadge)
        expect(hero.badgeLive).toBeUndefined()
    })
})
