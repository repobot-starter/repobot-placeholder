import { describe, expect, it, vi } from "vitest"
import careCatalog from "../../../../../packs/care/catalog.json"

// The shared shell appends the project manifest's marketing pages to every
// nav ("adding a page rewires every nav"). These tests assert the pack's OWN
// chrome, but the ambient manifest differs per composed tree — this suite
// runs inside EVERY composed template. Pin the manifest empty so the
// assertions are about the pack, not about which tree they shipped in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import {
    bookLanding,
    homeLanding,
    hoursLines,
    newPatientsLanding,
    providersLanding,
    servicesLanding,
    toDayHours,
} from "../../../src/View/Care/careLanding"
import { codePractice } from "../../../src/View/Care/content"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The care pack's doc-aware pages (CarePage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * The invariant is fidelity: the catalog's seeded skeletons reproduce
 * each page's code config exactly, so shipping the seed changes nothing
 * visually and the structural editor's first gesture starts from
 * documented truth.
 *
 * Home is time-dependent (the live open badge), so its fidelity check
 * pins one instant and builds both sides from it.
 */

const document = careCatalog.landing

/** A fixed "today": Thursday August 27, 2026, mid-morning — clinic open. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("care catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/providers": "providers",
            "/what-we-treat": "services",
            "/new-patients": "new-patients",
            "/book": "book",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(homeLanding("", NOW))
        expect(applySitePageDocument(providersLanding(""), "providers", document)).toEqual(
            providersLanding(""),
        )
        expect(applySitePageDocument(servicesLanding(""), "services", document)).toEqual(servicesLanding(""))
        expect(applySitePageDocument(newPatientsLanding(""), "new-patients", document)).toEqual(
            newPatientsLanding(""),
        )
        expect(applySitePageDocument(bookLanding(""), "book", document)).toEqual(bookLanding(""))
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "providers" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["providers", "hero"])
    })

    it("computes the live open badge from the clock and the contract hours", () => {
        // Thursday 10:30 AM — inside Mon–Fri 8–5.
        const open = homeLanding("", NOW).sections[0].content as { badge?: string }
        expect(open.badge).toBe("Open — closes 5 PM")
        // Sunday: the clinic rests; the badge points to Monday's opening.
        const sunday = homeLanding("", new Date(2026, 7, 30, 10, 30)).sections[0].content as {
            badge?: string
        }
        expect(sunday.badge).toBe("Closed — opens Monday 8 AM")
    })

    it("groups the hours into human lines from the contract entries", () => {
        expect(hoursLines(codePractice)).toEqual(["Monday – Friday · 8 AM – 5 PM", "Saturday · 9 AM – 1 PM"])
        expect(toDayHours(codePractice)).toHaveLength(6)
    })

    it("keeps the booking ask wired on every page that makes it", () => {
        const heroCtas = homeLanding("", NOW).sections[0].content as {
            primaryCta?: { href: string }
            secondaryCta?: { href: string }
        }
        expect(heroCtas.primaryCta?.href).toBe("/book")
        expect(heroCtas.secondaryCta?.href).toBe("/providers")
        for (const config of [homeLanding("", NOW), servicesLanding(""), newPatientsLanding("")]) {
            const banner = config.sections.find((section) => section.type === "cta-banner")
            expect((banner?.content as { cta: { href: string } }).cta.href).toBe("/book")
        }
        // The preview wiring prefixes every internal link.
        const previewHero = homeLanding("/care", NOW).sections[0].content as {
            primaryCta?: { href: string }
        }
        expect(previewHero.primaryCta?.href).toBe("/care/book")
    })

    it("renders business facts from the RESOLVED practice content", () => {
        // An owner's Manage edit must repaint the pages: builders render
        // whatever practice content they are handed, not the module.
        const edited = {
            ...codePractice,
            providers: [
                {
                    providerId: "dr-new",
                    name: "Dr. Test Provider",
                    credentials: "MD",
                    bio: "Bio.",
                },
            ],
            insurance: ["Test Mutual"],
        }
        const config = homeLanding("", NOW, edited)
        const team = config.sections.find((section) => section.id === "providers")
        expect((team?.content as { members: { name: string }[] }).members.map((m) => m.name)).toEqual([
            "Dr. Test Provider",
        ])
        const strip = config.sections.find((section) => section.id === "insurance")
        expect((strip?.content as { logos: { name: string }[] }).logos).toEqual([{ name: "Test Mutual" }])
    })

    it("wears the luxe-light register and the full-width nav everywhere", () => {
        for (const config of [
            homeLanding("", NOW),
            providersLanding(""),
            servicesLanding(""),
            newPatientsLanding(""),
            bookLanding(""),
        ]) {
            expect(config.style.preset).toBe("luxe-light")
            // The nav-variety audit's constraint: NOT the centered/
            // squared/inset treatment — the care pack wears full-width.
            expect(config.shell?.nav?.variant).toBe("full-width")
        }
    })

    it("keeps the book page's copy clinically empty in what it asks for", () => {
        const book = bookLanding("")
        const privacy = book.sections.find((section) => section.id === "privacy")
        const bullets = (privacy?.content as { bullets?: string[] }).bullets ?? []
        // The asks the page announces are exactly the booking schema's
        // fields — the widget's own tests enumerate the form inputs.
        expect(bullets).toHaveLength(3)
        const copy = JSON.stringify(book)
        expect(copy).not.toMatch(/symptom/i)
        expect(copy).not.toMatch(/reason for/i)
        expect(copy).not.toMatch(/hipaa/i)
    })
})
