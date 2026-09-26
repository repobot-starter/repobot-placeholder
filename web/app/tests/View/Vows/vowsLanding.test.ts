import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import vowsCatalog from "../../../../../packs/vows/catalog.json"

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
    homeLanding,
    partyLanding,
    rsvpLanding,
    scheduleLanding,
    storyLanding,
    travelLanding,
} from "../../../src/View/Vows/vowsLanding"
import { couple, home, rsvp } from "../../../src/View/Vows/content"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { composedLandingSeed } from "../../helpers/composedSeed"

/**
 * The vows pack's doc-aware pages (VowsPage routes each page's config
 * through `useSitePageConfig`, keyed by the catalog's `landing.routes`).
 * The invariant is fidelity: the catalog's seeded skeletons reproduce each
 * page's code config exactly, so shipping the seed changes nothing
 * visually and the structural editor's first gesture starts from
 * documented truth.
 *
 * The home and rsvp configs are time-dependent (the hero countdown, the
 * reply-by nudge), so the fidelity checks pin one instant and build both
 * sides from it.
 *
 * The document is the one THIS tree composes: a vows remix that pins its
 * own register and page skeletons (vows-photobooth) is reproduced by the
 * builders running on that remix's content seed.
 */

const document = composedLandingSeed("vows", vowsCatalog.landing)

/** The code config wearing the document's register — the one field a pinned remix re-values. */
function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

/** A fixed "today": August 27, 2026, mid-morning — 289 days out. */
const NOW = new Date(2026, 7, 27, 10, 30)

/**
 * Local midnight of an ISO date, shifted by whole days. The suite runs
 * inside every composed vows template, so the dates come from the seed
 * this tree composed, not from the base's literals.
 */
function onDay(dateIso: string, shift = 0): Date {
    const [year, month, day] = dateIso.split("-").map(Number)
    return new Date(year, month - 1, day + shift, 10, 30)
}

/** Whole days from NOW's midnight to the date's. */
function daysFromNow(dateIso: string): number {
    const [year, month, day] = dateIso.split("-").map(Number)
    return Math.round(
        (new Date(year, month - 1, day).getTime() - new Date(2026, 7, 27).getTime()) / 86_400_000,
    )
}

/** The quiet homes (story, stack, letter) carry the ask in their closing line, not the hero. */
const quietHome = home.layout === "story" || home.layout === "stack" || home.layout === "letter"

describe("vows catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/story": "story",
            "/schedule": "schedule",
            "/travel": "travel",
            "/party": "party",
            "/rsvp": "rsvp",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        const pages: [string, LandingConfig][] = [
            ["home", homeLanding("", NOW)],
            ["story", storyLanding("")],
            ["schedule", scheduleLanding("")],
            ["travel", travelLanding("")],
            ["party", partyLanding("")],
            ["rsvp", rsvpLanding("", NOW)],
        ]
        for (const [pageId, config] of pages) {
            expect(applySitePageDocument(config, pageId, document), pageId).toEqual(
                inDocumentRegister(config),
            )
        }
    })

    it("reorders a page when the documented skeleton changes", () => {
        const [first, second] = homeLanding("", NOW).sections.map((section) => section.id)
        const reordered = applySitePageDocument(homeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: second }, { id: first }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual([second, first])
    })

    it("keeps the countdown computed: the hero badge recomputes per render", () => {
        const badgeOf = (config: ReturnType<typeof homeLanding>): unknown =>
            (config.sections[0].content as { badge?: string }).badge
        // At the pinned instant the wedding is months out…
        expect(badgeOf(homeLanding("", NOW))).toBe(`${daysFromNow(couple.weddingDateIso)} days to go`)
        // …on the day the badge flips…
        expect(badgeOf(homeLanding("", onDay(couple.weddingDateIso)))).toBe("Today's the day")
        // …and afterward the site reads as the keepsake, not a negative count.
        expect(badgeOf(homeLanding("", onDay(couple.weddingDateIso, 19)))).toBe("Just married")
    })

    it("keeps the reply nudge counting toward the reply-by date", () => {
        const heroOf = (now: Date): { subheadline?: string } =>
            rsvpLanding("", now).sections[0].content as { subheadline?: string }
        expect(heroOf(NOW).subheadline).toBe(
            `Please reply by ${rsvp.replyByLabel} — ${daysFromNow(rsvp.replyByIso)} days away.`,
        )
        expect(heroOf(onDay(rsvp.replyByIso, 2)).subheadline).toBe(
            `The reply-by date (${rsvp.replyByLabel}) has passed — send your reply and we'll do our best.`,
        )
    })

    it("keeps the one ask wired: RSVP leads the hero and closes every page", () => {
        const homeSections = homeLanding("", NOW).sections
        if (quietHome) {
            const closing = homeSections.at(-1)
            expect(closing?.id).toBe("closing")
            expect((closing?.content as { cta: { href: string } }).cta.href).toBe("/rsvp")
        } else {
            const hero = homeSections[0].content as { primaryCta?: { href: string } }
            expect(hero.primaryCta?.href).toBe("/rsvp")
        }
        for (const [name, config] of [
            ...(quietHome ? [] : [["home", homeLanding("", NOW)] as const]),
            ["story", storyLanding("")],
            ["schedule", scheduleLanding("")],
            ["travel", travelLanding("")],
            ["party", partyLanding("")],
        ] as const) {
            const banner = config.sections.find((section) => section.id === "rsvp-banner")
            expect(banner, `${name} closes on the RSVP banner`).toBeDefined()
            expect((banner?.content as { cta: { href: string } }).cta.href).toBe("/rsvp")
        }
    })

    it("sends every venue's directions link off-site to a maps app", () => {
        const venues = scheduleLanding("").sections.find((section) => section.id === "venues")
        const highlights = (venues?.content as { highlights: { cta?: { href: string } }[] }).highlights
        for (const highlight of highlights) {
            expect(highlight.cta?.href).toMatch(/^https:\/\/maps\.google\.com/)
        }
    })
})
