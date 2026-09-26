import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import careCatalog from "../../../../../packs/care/catalog.json"
import magnoliaCatalog from "../../../../../packs/care-primary-magnolia/catalog.json"
import * as magnolia from "../../../src/View/Care/magnoliaRemix.content"
import opentrailCatalog from "../../../../../packs/care-therapy-opentrail/catalog.json"
import * as opentrail from "../../../src/View/Care/opentrailRemix.content"
import kindredCatalog from "../../../../../packs/care-therapy-kindred/catalog.json"
import * as kindred from "../../../src/View/Care/kindredRemix.content"
import cambridgeCatalog from "../../../../../packs/care-psychology-cambridge/catalog.json"
import * as cambridge from "../../../src/View/Care/cambridgeRemix.content"
import northlightCatalog from "../../../../../packs/care-psychology-northlight/catalog.json"
import * as northlight from "../../../src/View/Care/northlightRemix.content"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))

/**
 * The pinned care remixes' skeletons (each catalog's `landing.pages`)
 * against the base builders running on that remix's seed, in every tree:
 * compose copies the seed over content.ts, so this is the remix's composed
 * site. The content-driven sections — and the seed-chosen hero and journey
 * variants — emit exactly the pinned ids, types, variants, and order.
 */

type Seed = typeof magnolia

const REMIXES: [string, { landing: { style: { preset: string } } }, Seed][] = [
    ["care-primary-magnolia", magnoliaCatalog, magnolia],
    ["care-therapy-opentrail", opentrailCatalog, opentrail],
    ["care-therapy-kindred", kindredCatalog, kindred],
    ["care-psychology-cambridge", cambridgeCatalog, cambridge],
    ["care-psychology-northlight", northlightCatalog, northlight],
]

/** A fixed "today": Thursday August 27, 2026, mid-morning. */
const NOW = new Date(2026, 7, 27, 10, 30)

async function buildersFor(seed: Seed) {
    vi.resetModules()
    vi.doMock("../../../src/View/Care/content", () => seed)
    const builders = await import("../../../src/View/Care/careLanding")
    vi.doUnmock("../../../src/View/Care/content")
    return builders
}

describe.each(REMIXES)("%s pinned layout", (_key, catalog, seed) => {
    const document = { ...catalog.landing, routes: careCatalog.landing.routes }
    const inDocumentRegister = (config: LandingConfig): LandingConfig => ({
        ...config,
        style: { ...config.style, preset: document.style.preset as never },
    })

    it("reproduces each pinned page from the seed exactly", async () => {
        const { bookLanding, homeLanding, newPatientsLanding, providersLanding, servicesLanding } =
            await buildersFor(seed)
        const content = seed.codePractice
        expect(applySitePageDocument(homeLanding("", NOW, content), "home", document)).toEqual(
            inDocumentRegister(homeLanding("", NOW, content)),
        )
        expect(applySitePageDocument(providersLanding("", content), "providers", document)).toEqual(
            inDocumentRegister(providersLanding("", content)),
        )
        expect(applySitePageDocument(servicesLanding("", content), "services", document)).toEqual(
            inDocumentRegister(servicesLanding("", content)),
        )
        expect(applySitePageDocument(newPatientsLanding("", content), "new-patients", document)).toEqual(
            inDocumentRegister(newPatientsLanding("", content)),
        )
        expect(applySitePageDocument(bookLanding("", content), "book", document)).toEqual(
            inDocumentRegister(bookLanding("", content)),
        )
    })

    it("pins exactly the home sections the seed emits", async () => {
        const { homeLanding } = await buildersFor(seed)
        const emitted = homeLanding("", NOW, seed.codePractice).sections.map((section) => [
            section.id,
            section.type,
            section.variant,
        ])
        const pinned = (
            catalog.landing as unknown as {
                pages: { home: { sections: { id: string; type: string; variant: string }[] } }
            }
        ).pages.home.sections.map((section) => [section.id, section.type, section.variant])
        expect(pinned).toEqual(emitted)
    })
})
