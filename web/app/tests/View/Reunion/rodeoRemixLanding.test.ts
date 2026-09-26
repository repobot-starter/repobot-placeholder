import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import rodeoCatalog from "../../../../../packs/reunion-rodeo/catalog.json"

// The builders run on the reunion-rodeo seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock("../../../src/View/Reunion/content", () => import("../../../src/View/Reunion/rodeoRemix.content"))
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { reunion } from "../../../src/View/Reunion/content"
import { countdownLabel, rsvpNudge } from "../../../src/View/Reunion/countdown"
import { homeLanding, memoriesLanding, rsvpLanding } from "../../../src/View/Reunion/reunionLanding"
import { reunionShell } from "../../../src/View/Reunion/reunionShell"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The reunion-rodeo remix's pinned skeletons (packs/reunion-rodeo/catalog.json
 * `landing.pages`) against the base builders running on the remix's seed:
 * the content-driven sections emit exactly the pinned ids, types,
 * variants, and order, so the remix keeps its layout while the base
 * weekend keeps its own.
 */

const document = {
    ...rodeoCatalog.landing,
    routes: { "/": "home", "/memories": "memories", "/rsvp": "rsvp" },
}

function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

/** A fixed "today": August 27, 2026, mid-morning — 414 days out. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("reunion-rodeo pinned layout", () => {
    it("reproduces each pinned page from the seed exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(
            inDocumentRegister(homeLanding("", NOW)),
        )
        expect(applySitePageDocument(memoriesLanding(""), "memories", document)).toEqual(
            inDocumentRegister(memoriesLanding("")),
        )
        expect(applySitePageDocument(rsvpLanding("", NOW), "rsvp", document)).toEqual(
            inDocumentRegister(rsvpLanding("", NOW)),
        )
    })

    it("speaks the ranch's countdown and nudge", () => {
        expect(countdownLabel(reunion.startDateIso, NOW)).toBe("414 days till we ride")
        expect(countdownLabel(reunion.startDateIso, new Date(2027, 9, 15, 10, 30))).toBe(
            "Reunion weekend — saddle up",
        )
        expect(rsvpNudge("2027-08-15", "August 15, 2027", NOW)).toBe(
            "Tell us by August 15, 2027 — 353 days off — so we hold enough casitas.",
        )
    })

    it("hangs the ranch sign: mark, two-line name, and the home-section anchors", () => {
        const logo = reunionShell("", "").nav?.content.logo
        expect(logo).toEqual({
            name: "The Calloway Family Reunion",
            tagline: "Wickenburg, Arizona",
            markSrc: "/reunion-rodeo/brand-c.svg",
        })
        expect(reunionShell("/reunion", "").nav?.content.links?.map((link) => link.href)).toEqual([
            "/reunion#schedule",
            "/reunion#content-split",
            "/reunion/memories",
        ])
        // The inline variant rides the remix's theme (it outranks the shell's pill links).
        expect(rodeoCatalog.theme.navigation.variant).toBe("inline")
    })
})
