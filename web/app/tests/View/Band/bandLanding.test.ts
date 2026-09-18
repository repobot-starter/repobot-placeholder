import { describe, expect, it, vi } from "vitest"
import bandCatalog from "../../../../../packs/band/catalog.json"

// Pin the ambient manifest empty (see the photography-music suite): these
// tests assert the pack's OWN chrome, whatever composed tree they run in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { homeLanding } from "../../../src/View/Band/bandLanding"
import { shows } from "../../../src/View/Band/content"
import { splitShows } from "../../../src/View/Music/schedule"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The band pack's doc-aware home (BandPage merges it under page id "home",
 * per the catalog's landing.routes) and the computed tour-date mechanics
 * with injected clocks. Two invariants:
 *
 * 1. Fidelity — the catalog's seeded skeleton reproduces the code config
 *    exactly, so shipping the seed changes nothing visually.
 * 2. Computation — the hero badge and the next-show banner are functions
 *    of (shows, now): show days read "Tonight", the day after moves on.
 */

const document = bandCatalog.landing

// A stable clock with confirmed upcoming shows in the demo content.
const NOW = new Date(2026, 7, 27, 12, 0) // Aug 27 2026

describe("band catalog landing seed", () => {
    it("maps the doc-aware home and seeds exactly its skeleton", () => {
        expect(document.routes).toEqual({ "/": "home" })
        expect(Object.keys(document.pages)).toEqual(["home"])
        expect(document.pages.home.sections.map((section) => section.id)).toEqual(
            homeLanding("", NOW).sections.map((section) => section.id),
        )
    })

    it("reproduces the home page's code skeleton exactly", () => {
        const config = homeLanding("", NOW)
        expect(applySitePageDocument(config, "home", document)).toEqual(config)
    })

    it("pins the broadside register as the document style", () => {
        expect(document.style).toEqual({ preset: "broadside" })
        expect(homeLanding("", NOW).style.preset).toBe("broadside")
    })

    it("reorders the home when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "records" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["records", "hero"])
    })
})

describe("band home computed mechanics (injected clocks)", () => {
    function hero(now: Date): { badge?: string } {
        const section = homeLanding("", now).sections.find((entry) => entry.id === "hero")
        return (section?.content ?? {}) as { badge?: string }
    }

    it("wears On tour while dates remain", () => {
        expect(hero(NOW).badge).toBe("On tour")
    })

    it("wears Tonight — City on a show day, all day", () => {
        const showDay = new Date(2026, 8, 4, 9, 0) // Sep 4 — The Wonder Bar
        expect(hero(showDay).badge).toBe("Tonight — Asbury Park")
    })

    it("falls back to the hometown when the calendar empties", () => {
        const after = new Date(2028, 0, 1)
        expect(splitShows(shows, after).upcoming).toEqual([])
        expect(hero(after).badge).toBe("Asbury Park, New Jersey")
    })

    it("names the next confirmed show in the banner", () => {
        const banner = homeLanding("", NOW).sections.find((entry) => entry.id === "next-show")
        const title = (banner?.content as { title: string }).title
        const next = splitShows(shows, NOW).next
        expect(next).not.toBeNull()
        expect(title).toContain(next?.city ?? "")
        expect(title).toContain(next?.venue ?? "")
    })
})
