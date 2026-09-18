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

/**
 * This suite runs against whatever business `content.ts` carries: the base
 * clinic in the kernel checkout, a remix's practice in a composed derived
 * template (compose copies the remix's contentSeed module over content.ts).
 * So every hours- and badge-shaped expectation below is DERIVED from the
 * module's contract entries through small independent formatters — never
 * hardcoded to one business — and the suite stays green for every current
 * and future care remix without a per-remix fork.
 */

/** The contract hours of the practice's primary location (the pack ships one). */
const contractHours = codePractice.locations[0].hours

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/** "8 AM" / "12:30 PM" — the hours engine's shape, reimplemented for independence. */
function clock(minute: number): string {
    const hour24 = Math.floor((minute % 1440) / 60)
    const minutes = minute % 60
    const suffix = hour24 < 12 ? "AM" : "PM"
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    return minutes === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`
}

/** A Date in a fixed reference week (Aug 23–29, 2026 runs Sunday–Saturday). */
function at(day: number, minute: number): Date {
    return new Date(2026, 7, 23 + day, Math.floor(minute / 60), minute % 60)
}

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
        // Just inside the week's first open window: whatever business the
        // module carries, the badge must read open and name that window's
        // close.
        const [first] = [...contractHours].sort((a, b) => a.day - b.day || a.open - b.open)
        const open = homeLanding("", at(first.day, first.open + 1)).sections[0].content as {
            badge?: string
        }
        expect(open.badge).toBe(`Open — closes ${clock(first.close)}`)

        // A rest day: the badge points at the next day with a contract
        // entry. Every care business ships at least one closed day.
        const closedDay = [0, 1, 2, 3, 4, 5, 6].find(
            (day) => !contractHours.some((entry) => entry.day === day),
        )
        expect(closedDay).toBeDefined()
        if (closedDay === undefined) return
        let nextOpen: { day: number; open: number } | undefined
        for (let offset = 1; offset <= 7 && nextOpen === undefined; offset++) {
            const day = (closedDay + offset) % 7
            const entries = contractHours.filter((entry) => entry.day === day).sort((a, b) => a.open - b.open)
            if (entries.length > 0) nextOpen = { day, open: entries[0].open }
        }
        expect(nextOpen).toBeDefined()
        if (nextOpen === undefined) return
        const closed = homeLanding("", at(closedDay, 10 * 60 + 30)).sections[0].content as {
            badge?: string
        }
        expect(closed.badge).toBe(`Closed — opens ${DAY_LABELS[nextOpen.day]} ${clock(nextOpen.open)}`)
    })

    it("groups the hours into human lines from the contract entries", () => {
        // Independent grouping: consecutive days with identical hours fold
        // into one "Monday – Friday · 8 AM – 5 PM"-shaped line.
        const sorted = [...contractHours].sort((a, b) => a.day - b.day)
        const runs: { first: (typeof sorted)[number]; last: (typeof sorted)[number] }[] = []
        for (const entry of sorted) {
            const run = runs[runs.length - 1]
            if (
                run !== undefined &&
                entry.day === run.last.day + 1 &&
                entry.open === run.last.open &&
                entry.close === run.last.close
            ) {
                run.last = entry
            } else {
                runs.push({ first: entry, last: entry })
            }
        }
        const expected = runs.map(({ first, last }) => {
            const days =
                first.day === last.day
                    ? DAY_LABELS[first.day]
                    : `${DAY_LABELS[first.day]} – ${DAY_LABELS[last.day]}`
            return `${days} · ${clock(first.open)} – ${clock(first.close)}`
        })
        expect(expected.length).toBeGreaterThan(0)
        expect(hoursLines(codePractice)).toEqual(expected)
        expect(toDayHours(codePractice)).toHaveLength(new Set(contractHours.map((entry) => entry.day)).size)
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
