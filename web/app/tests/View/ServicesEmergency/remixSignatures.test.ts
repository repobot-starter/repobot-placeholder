import { afterEach, describe, expect, it, vi } from "vitest"
import electricCatalog from "../../../../../packs/services-electric-techno/catalog.json"
import emergencyCatalog from "../../../../../packs/services-emergency/catalog.json"
import hvacCatalog from "../../../../../packs/services-hvac-desert/catalog.json"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * Each emergency skin's home carries its own signature on top of the shared
 * dispatch builders: the electrician's full-bleed photo and ticker readout,
 * the HVAC skin's 115° readout beside the photo and its three price tags.
 * The catalog pins choose the variants; the seeds supply the content.
 */

type Builders = typeof import("../../../src/View/ServicesEmergency/servicesEmergencyLanding")

async function buildersWithSeed(seed: () => Promise<unknown>): Promise<Builders> {
    vi.resetModules()
    vi.doMock("../../../src/View/ServicesEmergency/content", seed)
    return import("../../../src/View/ServicesEmergency/servicesEmergencyLanding")
}

const electricSeed = () => import("../../../src/View/ServicesEmergency/electricTechnoRemix.content")
const hvacSeed = () => import("../../../src/View/ServicesEmergency/hvacDesertRemix.content")

afterEach(() => {
    vi.doUnmock("../../../src/View/ServicesEmergency/content")
})

describe("remix home signatures", () => {
    it("electric: full-bleed photo hero, trade on a ticker, no seal or readout", async () => {
        const builders = await buildersWithSeed(electricSeed)
        const applied = applySitePageDocument(builders.homeLanding(""), "home", {
            ...emergencyCatalog.landing,
            ...electricCatalog.landing,
        })
        const hero = applied.sections.find((section) => section.id === "hero")
        expect(hero?.variant).toBe("full-bleed-media")
        expect(hero?.content).not.toHaveProperty("seal")
        expect(hero?.content).not.toHaveProperty("readout")
        const proof = applied.sections.find((section) => section.id === "dispatch-proof")
        expect(proof?.variant).toBe("ticker")
        expect((proof?.content as { items: string[] }).items).toEqual([
            "200A panel upgrades",
            "Knob & tube rewires",
            "EV chargers, Level 2",
            "24/7 outage response",
        ])
    })

    it("hvac: the 115° readout beside the photo, three prices hung as tags", async () => {
        const builders = await buildersWithSeed(hvacSeed)
        const applied = applySitePageDocument(builders.homeLanding(""), "home", {
            ...emergencyCatalog.landing,
            ...hvacCatalog.landing,
        })
        const hero = applied.sections.find((section) => section.id === "hero")
        expect(hero?.variant).toBe("split-media")
        expect(hero?.content).toMatchObject({
            headline: "Cold air. Fast.",
            readout: { value: "115°", note: "72° inside" },
            media: { kind: "image" },
        })
        expect(applied.sections[1].id).toBe("price-book")
        expect(applied.sections[1].variant).toBe("price-tags")
        const items = (
            applied.sections[1].content as { groups: { items: { name: string; price: string }[] }[] }
        ).groups.flatMap((group) => group.items)
        expect(items.map((item) => `${item.name} ${item.price}`)).toEqual([
            "Tune-up $89",
            "Diagnostic $0",
            "New system $6,900",
        ])
        expect(applied.sections.at(-1)?.variant).toBe("full-bleed")
    })
})
