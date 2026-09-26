import { describe, expect, it, vi } from "vitest"
import galaCatalog from "../../../../../packs/gala/catalog.json"

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
import type { LandingConfig } from "@ui"
import { event, home, rsvp } from "../../../src/View/Gala/content"
import { daysUntil } from "../../../src/View/Gala/countdown"
import { homeLanding, rsvpLanding } from "../../../src/View/Gala/galaLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { composedLandingSeed } from "../../helpers/composedSeed"

/**
 * The gala pack's doc-aware pages (GalaPage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * The invariant is fidelity: the catalog's seeded skeletons reproduce each
 * page's code config exactly, so shipping the seed changes nothing
 * visually and the structural editor's first gesture starts from
 * documented truth.
 *
 * Both configs are time-dependent (the hero countdown, the reply-by
 * nudge), so the fidelity checks pin one instant and build both sides
 * from it — an instant derived from the evening's own date, because this
 * suite runs against whatever seed `content.ts` carries.
 *
 * The document is the one THIS tree composes: a gala remix that pins its
 * own register and page skeletons (gala-disco) is reproduced by the
 * builders running on that remix's content seed.
 */

const document = composedLandingSeed("gala", galaCatalog.landing)

/** The code config wearing the document's register — the one field a pinned remix re-values. */
function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

/** `days` calendar days from the event date, at a given local time. */
function dayFromEvent(days: number, hour: number, minute = 0): Date {
    const [year, month, day] = event.dateIso.split("-").map(Number)
    return new Date(year, month - 1, day + days, hour, minute)
}

/** A fixed "today": fifty days out, mid-morning. */
const NOW = dayFromEvent(-50, 10, 30)

describe("gala catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/rsvp": "rsvp",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding("", NOW), "home", document)).toEqual(
            inDocumentRegister(homeLanding("", NOW)),
        )
        expect(applySitePageDocument(rsvpLanding("", NOW), "rsvp", document)).toEqual(
            inDocumentRegister(rsvpLanding("", NOW)),
        )
    })

    it("reorders a page when the documented skeleton changes", () => {
        const [first, second] = homeLanding("", NOW).sections.map((section) => section.id as string)
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: second }, { id: first }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual([second, first])
    })
})

// The `program` home's own beats; the `stack` home is walked seed by seed
// in stackHome.test.ts.
describe.runIf(home.layout === "program")("gala program home", () => {
    it("keeps the countdown computed: the hero badge recomputes per render", () => {
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        expect(badgeOf(homeLanding("", NOW))).toBe("50 days to go")
        expect(badgeOf(homeLanding("", dayFromEvent(0, 10, 30)))).toBe("Tonight's the night")
        // Afterward the site reads as the keepsake, not a negative count.
        expect(badgeOf(homeLanding("", dayFromEvent(5, 10, 30)))).toBe("What an evening")
    })

    it("closes the evening on the ticket-stub ask, nudge included", () => {
        const banner = homeLanding("", NOW).sections.find((section) => section.id === "rsvp-banner")
        expect(banner?.variant).toBe("ticket")
        const content = banner?.content as { body?: string; cta: { href: string } }
        expect(content.cta.href).toBe("/rsvp")
        expect(content.body).toBe(
            `Kindly reply by ${rsvp.replyByLabel} — ${daysUntil(rsvp.replyByIso, NOW)} days away.`,
        )
    })

    it("sends the venue's directions link off-site to a maps app", () => {
        const venueSection = homeLanding("", NOW).sections.find((section) => section.id === "venue")
        const highlights = (venueSection?.content as { highlights: { cta?: { href: string } }[] }).highlights
        expect(highlights[0].cta?.href).toMatch(/^https:\/\/maps\.google\.com/)
    })
})
