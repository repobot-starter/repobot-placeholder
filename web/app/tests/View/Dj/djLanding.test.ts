import { describe, expect, it, vi } from "vitest"
import djCatalog from "../../../../../packs/dj/catalog.json"

// Pin the ambient manifest empty (see the photography-music suite).
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { bookLanding, DJ_STYLE_OVERRIDES, homeLanding } from "../../../src/View/Dj/djLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The dj pack's doc-aware pages (home and the booking form) and the
 * achromatic register discipline. The seeded skeletons must reproduce the
 * code configs exactly, and the style overrides must pin the accent to
 * the register's own inks — the pack's whole art direction is "no hue".
 */

const document = djCatalog.landing

const NOW = new Date(2026, 7, 27, 12, 0) // Aug 27 2026

describe("dj catalog landing seed", () => {
    it("maps the doc-aware routes to seeded pages", () => {
        expect(document.routes).toEqual({ "/": "home", "/book": "book" })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        const home = homeLanding("", NOW)
        expect(applySitePageDocument(home, "home", document)).toEqual(home)
        const book = bookLanding("")
        expect(applySitePageDocument(book, "book", document)).toEqual(book)
    })

    it("pins mono-utility worn achromatic — accent resolves to the text ink", () => {
        expect(document.style.preset).toBe("mono-utility")
        expect(document.style.overrides).toEqual(DJ_STYLE_OVERRIDES)
        expect(DJ_STYLE_OVERRIDES["--marketing-color-accent"]).toBe("var(--marketing-color-text)")
        expect(homeLanding("", NOW).style.overrides).toEqual(DJ_STYLE_OVERRIDES)
        expect(bookLanding("").style.overrides).toEqual(DJ_STYLE_OVERRIDES)
    })

    it("computes the hero badge from the sets with injected clocks", () => {
        const badge = (now: Date): string | undefined => {
            const hero = homeLanding("", now).sections.find((section) => section.id === "hero")
            return (hero?.content as { badge?: string }).badge
        }
        expect(badge(NOW)).toBe("Next set — Berlin, Sep 5")
        expect(badge(new Date(2026, 8, 5, 22, 0))).toBe("Tonight — Berlin") // Sep 5 — Verk
        expect(badge(new Date(2028, 0, 1))).toBe("Berlin") // calendar empty → home base
    })

    it("carries the tech-rider ask into the booking form", () => {
        const form = bookLanding("").sections.find((section) => section.id === "booking-form")
        const fields = (form?.content as { fields: { name: string }[] }).fields
        expect(fields.map((field) => field.name)).toContain("tech")
    })
})
