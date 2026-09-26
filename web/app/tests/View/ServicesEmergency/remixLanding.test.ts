import type { LandingConfig } from "@ui"
import { afterEach, describe, expect, it, vi } from "vitest"
import electricCatalog from "../../../../../packs/services-electric-techno/catalog.json"
import bayouCatalog from "../../../../../packs/services-emergency-bayou/catalog.json"
import hartwellCatalog from "../../../../../packs/services-emergency-hartwell/catalog.json"
import emergencyCatalog from "../../../../../packs/services-emergency/catalog.json"
import hvacCatalog from "../../../../../packs/services-hvac-desert/catalog.json"
import vanCatalog from "../../../../../packs/services-emergency-van/catalog.json"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The remixes pin their own look: each remix catalog carries its own page
 * skeletons and register, while the base pack's builders keep emitting the
 * remix's sections from its seed content (an empty price board keeps the
 * services grid and the price book on the home page). Every pinned entry
 * must bind a real code section — an unbound entry would render
 * placeholder copy on a live remix site.
 */

type Builders = typeof import("../../../src/View/ServicesEmergency/servicesEmergencyLanding")

async function buildersWithSeed(seed: () => Promise<unknown>): Promise<Builders> {
    vi.resetModules()
    vi.doMock("../../../src/View/ServicesEmergency/content", seed)
    return import("../../../src/View/ServicesEmergency/servicesEmergencyLanding")
}

const remixes = [
    {
        name: "emergency-van",
        seed: () => import("../../../src/View/ServicesEmergency/vanRemix.content"),
        catalog: vanCatalog,
        preset: "jacaranda",
        boardFree: false,
    },
    {
        name: "electric-techno",
        seed: () => import("../../../src/View/ServicesEmergency/electricTechnoRemix.content"),
        catalog: electricCatalog,
        preset: "schematic",
        boardFree: true,
    },
    {
        name: "hvac-desert",
        seed: () => import("../../../src/View/ServicesEmergency/hvacDesertRemix.content"),
        catalog: hvacCatalog,
        preset: "sunbelt",
        boardFree: true,
    },
    {
        name: "emergency-hartwell",
        seed: () => import("../../../src/View/ServicesEmergency/hartwellRemix.content"),
        catalog: hartwellCatalog,
        preset: "plantroom",
        boardFree: false,
    },
    {
        name: "emergency-bayou",
        seed: () => import("../../../src/View/ServicesEmergency/bayouRemix.content"),
        catalog: bayouCatalog,
        preset: "stormline",
        boardFree: false,
    },
]

afterEach(() => {
    vi.doUnmock("../../../src/View/ServicesEmergency/content")
})

describe.each(remixes)("services-$name remix landing pin", ({ seed, catalog, preset, boardFree }) => {
    // resolveCatalog (scripts/lib/pack-switch.mjs): the remix's landing
    // shallow-merges over the base's, so routes stay the base pack's.
    const document = { ...emergencyCatalog.landing, ...catalog.landing }

    it("wears its own register over the base pack's routes", () => {
        expect(catalog.landing.style.preset).toBe(preset)
        expect(preset).not.toBe(emergencyCatalog.landing.style.preset)
        expect(document.routes).toEqual(emergencyCatalog.landing.routes)
    })

    it("binds every pinned section to real seed content on every page", async () => {
        const builders = await buildersWithSeed(seed)
        const pages: Record<string, LandingConfig> = {
            home: builders.homeLanding(""),
            services: builders.servicesPageLanding(""),
            about: builders.aboutLanding(""),
            request: builders.requestLanding(""),
        }
        for (const [pageId, code] of Object.entries(pages)) {
            const pinned = catalog.landing.pages[pageId as keyof typeof catalog.landing.pages].sections
            const applied = applySitePageDocument(code, pageId, document)
            expect(applied.sections.map((section) => section.id)).toEqual(pinned.map((entry) => entry.id))
            for (const entry of pinned) {
                const fromCode = code.sections.find((section) => section.id === entry.id)
                expect(fromCode, `${pageId}/${entry.id} must come from the builders`).toBeDefined()
                expect(fromCode?.type).toBe(entry.type)
                const rendered = applied.sections.find((section) => section.id === entry.id)
                expect(rendered?.content, `${pageId}/${entry.id} renders seed content`).toEqual(
                    fromCode?.content,
                )
                if ("variant" in entry) {
                    expect(rendered?.variant).toBe(entry.variant)
                }
            }
        }
    })

    it.runIf(boardFree)(
        "builds a board-free home: live pill, photo hero, services grid, price book, job report",
        async () => {
            const builders = await buildersWithSeed(seed)
            const home = builders.homeLanding("")
            const hero = home.sections.find((section) => section.id === "hero")
            expect(hero?.content).toHaveProperty("media")
            expect(hero?.content).toHaveProperty("badgeLive", true)
            expect(hero?.content).not.toHaveProperty("aside")
            const ids = home.sections.map((section) => section.id)
            expect(ids).toEqual(expect.arrayContaining(["services", "price-book", "job-report"]))
            const steps = home.sections.find((section) => section.id === "when-you-call")
            expect(steps?.variant).toBe("numbered-cards")
        },
    )
})

describe("services-emergency-hartwell systems index", () => {
    const seed = () => import("../../../src/View/ServicesEmergency/hartwellRemix.content")

    it("leads with the coded systems, moves the book to /services, and asks for a survey", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("")
        const ids = home.sections.map((section) => section.id)
        expect(ids.indexOf("systems")).toBe(ids.indexOf("hero") + 1)
        expect(ids).not.toContain("services")
        expect(ids).not.toContain("price-book")
        const hero = home.sections.find((section) => section.id === "hero")
        expect(hero?.content).toHaveProperty("credit", "24/7 estate line (203) 555-0142 · On site in 60 min")
        const systems = home.sections.find((section) => section.id === "systems")
        expect(systems?.variant).toBe("specimens")
        const items = (systems?.content as { items: { eyebrow?: string; meta?: string }[] }).items
        expect(items).toHaveLength(6)
        expect(items.map((item) => item.eyebrow)).toEqual([
            "SYS-01",
            "SYS-02",
            "SYS-03",
            "SYS-04",
            "SYS-05",
            "SYS-06",
        ])
        for (const item of items) expect(item.meta).toMatch(/\S/)
        const banner = home.sections.find((section) => section.id === "call-banner")
        expect(banner?.content).toMatchObject({
            body: "All systems. One standard. Peace of mind.",
            cta: { label: "Request a systems survey", href: "/request" },
        })
    })
})

describe("services-emergency-bayou dispatch", () => {
    const seed = () => import("../../../src/View/ServicesEmergency/bayouRemix.content")

    it("asks the dispatcher's question over the storm photograph", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("")
        const hero = home.sections.find((section) => section.id === "hero")
        expect(hero?.variant).toBe("form-first")
        const content = hero?.content as {
            media?: { kind: string }
            secondaryCta?: { href: string }
            primaryCta?: { href: string }
            form?: {
                heading?: string
                choices?: { label: string; icon?: string }[]
                field?: { name: string }
                contact?: string
                cta: string
            }
        }
        expect(content.media?.kind).toBe("image")
        expect(content.primaryCta?.href).toMatch(/^tel:/)
        expect(content.secondaryCta?.href).toBe("/request")
        expect(content.form?.heading).toBe("What happened?")
        expect(content.form?.choices).toEqual([
            { label: "Water", icon: "droplet" },
            { label: "Fire", icon: "flame" },
            { label: "Storm", icon: "storm" },
            { label: "Mold", icon: "spores" },
        ])
        expect(content.form?.field?.name).toBe("zip")
        expect(content.form?.contact).toBe("tel")
        expect(content.form?.cta).toBe("Send a crew")
    })

    it("sets the dispatch board before the strip and closes on a before/after", async () => {
        const home = (await buildersWithSeed(seed)).homeLanding("")
        const ids = home.sections.map((section) => section.id)
        expect(ids.indexOf("dispatch-board")).toBe(ids.indexOf("dispatch-proof") - 1)
        const pinned = bayouCatalog.landing.pages.home.sections.map((section) => section.id)
        expect(pinned).toContain("dispatch-board")
        expect(pinned).not.toContain("dispatch-proof")
        const board = home.sections.find((section) => section.id === "dispatch-board")
        expect(board?.type).toBe("schedule")
        expect(board?.variant).toBe("day-rows")
        const days = board?.content as {
            days: { label: string; sessions: { title: string }[] }[]
            note?: string
        }
        expect(days.days.map((day) => day.label)).toEqual([
            "Crew 4 · Heights",
            "Crew 2 · Bellaire",
            "Crew 6 · Katy",
            "Crew 1 · Montrose",
        ])
        expect(days.note).toMatch(/Average arrival/)
        const restorations = home.sections.find((section) => section.id === "restorations")
        expect(restorations?.variant).toBe("before-after")
        const items = (restorations?.content as { items: { beforeMedia?: unknown }[] }).items
        expect(items.length).toBeGreaterThan(0)
        for (const item of items) expect(item.beforeMedia).toBeDefined()
    })
})
