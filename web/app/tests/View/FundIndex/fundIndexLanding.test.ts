import { describe, expect, it, vi } from "vitest"
import fundIndexCatalog from "../../../../../packs/fund-index/catalog.json"

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
import { companies, focusAreas, home, principles, statedMetrics } from "../../../src/View/FundIndex/content"
import {
    contactLanding,
    disclosuresLanding,
    FUND_INDEX_STYLE_OVERRIDES,
    homeLanding,
    logLanding,
    portfolioLanding,
    teamLanding,
} from "../../../src/View/FundIndex/fundIndexLanding"
import { companyBadge, indexNumber } from "../../../src/View/FundIndex/portfolio"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The fund-index pack's doc-aware pages (FundIndexPage routes each page's
 * config through `useSitePageConfig`, keyed by the catalog's
 * `landing.routes`). Two invariants:
 *
 * 1. Fidelity — the catalog's seeded skeletons reproduce each page's code
 *    config exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Computation — the page builders never hand-write a count, a badge, a
 *    sort, or a numeral: what the sections carry is exactly what
 *    portfolio.ts derives.
 */

const document = fundIndexCatalog.landing

/** A fixed "today" so the computed badges are deterministic under test. */
const NOW = new Date(2026, 7, 27, 10, 30)

describe("fund-index catalog landing seed", () => {
    it("maps every doc-aware route to a seeded page", () => {
        expect(document.routes).toEqual({
            "/": "home",
            "/portfolio": "portfolio",
            "/team": "team",
            "/log": "log",
            "/contact": "contact",
            "/disclosures": "disclosures",
        })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces each page's code skeleton exactly", () => {
        expect(applySitePageDocument(homeLanding(""), "home", document)).toEqual(homeLanding(""))
        expect(applySitePageDocument(portfolioLanding("", NOW), "portfolio", document)).toEqual(
            portfolioLanding("", NOW),
        )
        expect(applySitePageDocument(teamLanding(""), "team", document)).toEqual(teamLanding(""))
        expect(applySitePageDocument(logLanding(""), "log", document)).toEqual(logLanding(""))
        expect(applySitePageDocument(contactLanding(""), "contact", document)).toEqual(contactLanding(""))
        expect(applySitePageDocument(disclosuresLanding(""), "disclosures", document)).toEqual(
            disclosuresLanding(""),
        )
    })

    it("pins mono-utility worn achromatic — accent resolves to the text ink", () => {
        // The numbered index only reads in the spec-sheet register — mono
        // display, graph-paper hairlines, pure paper-on-ink: the style
        // overrides pin the accent to the register's own text ink (the dj
        // pack's move) so no color reaches the page. The document style
        // must ride the catalog seed or the composed site would open in
        // the kernel default register with the kernel accent.
        expect(document.style).toEqual({
            preset: "mono-utility",
            overrides: FUND_INDEX_STYLE_OVERRIDES,
        })
        expect(FUND_INDEX_STYLE_OVERRIDES["--marketing-color-accent"]).toBe("var(--marketing-color-text)")
        expect(homeLanding("").style.overrides).toEqual(FUND_INDEX_STYLE_OVERRIDES)
        expect(homeLanding("").sections.map((section) => section.id)).toEqual([
            "hero",
            "focus",
            "formula",
            "metrics",
            "principles",
            "deck-banner",
        ])
    })

    it("reorders a page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(homeLanding(""), "home", {
            pages: { home: { sections: [{ id: "metrics" }, { id: "hero" }] } },
        })
        // A page's documented skeleton is exhaustive: unclaimed sections drop.
        expect(reordered.sections.map((section) => section.id)).toEqual(["metrics", "hero"])
    })
})

describe("fund-index computed sections", () => {
    it("numbers the focus areas from array position", () => {
        const focus = homeLanding("").sections.find((section) => section.id === "focus")
        const items = (focus?.content as { items: { eyebrow?: string; title: string }[] }).items
        expect(items.length).toBe(focusAreas.length)
        for (const [position, area] of focusAreas.entries()) {
            expect(items[position].eyebrow).toBe(indexNumber(position))
            expect(items[position].title).toBe(area.title)
        }
        // The register's signature reads 001, 002, … — never bare integers.
        expect(items[0].eyebrow).toBe("001")
    })

    it("numbers the principles 01/02/03 in their titles", () => {
        const section = homeLanding("").sections.find((item) => item.id === "principles")
        const steps = (section?.content as { steps: { title: string }[] }).steps
        expect(steps.length).toBe(principles.length)
        for (const [position, principle] of principles.entries()) {
            expect(steps[position].title).toBe(`${indexNumber(position, 2)} — ${principle.title}`)
        }
    })

    it("mixes stated metrics with computed counts in the metrics band", () => {
        const band = homeLanding("").sections.find((section) => section.id === "metrics")
        const metrics = (band?.content as { metrics: { value: string; label: string }[] }).metrics
        // Stated figures ride first, verbatim from content.
        for (const [index, stated] of statedMetrics.entries()) {
            expect(metrics[index]).toEqual(stated)
        }
        // The counted ones are arithmetic over the portfolio list.
        expect(metrics.find((metric) => metric.label === "portfolio companies")?.value).toBe(
            `${companies.length}`,
        )
        expect(metrics.find((metric) => metric.label === "exits")?.value).toBe(
            `${companies.filter((company) => company.status !== "active").length}`,
        )
    })

    it("renders the underwriting formula as the featured quote", () => {
        const section = homeLanding("").sections.find((item) => item.id === "formula")
        const quotes = (section?.content as { quotes: { quote: string; author: string }[] }).quotes
        expect(quotes[0].quote).toBe(home.formula.expression)
        expect(quotes[0].author).toBe(home.formula.caption)
    })

    it("gives every portfolio row its computed badge, tags, and year", () => {
        const grid = portfolioLanding("", NOW).sections.find((section) => section.id === "companies")
        const items = (
            grid?.content as {
                items: {
                    title: string
                    eyebrow?: string
                    tags?: string[]
                    badge?: { label: string; tone: string }
                }[]
            }
        ).items
        expect(items.length).toBe(companies.length)
        for (const [index, company] of companies.entries()) {
            expect(items[index].title).toBe(company.name)
            expect(items[index].eyebrow).toBe(company.investedAt.slice(0, 4))
            expect(items[index].tags).toEqual(company.sectors)
            expect(items[index].badge).toEqual(companyBadge(company, NOW))
        }
    })

    it("badges a brand-new investment as New under an injected clock", () => {
        // Pin the clock right after the newest first check: that row must
        // wear the accent New pill, computed — never hand-written.
        const newest = [...companies].sort((a, b) => b.investedAt.localeCompare(a.investedAt))[0]
        const justAfter = new Date(newest.investedAt)
        justAfter.setDate(justAfter.getDate() + 30)
        const grid = portfolioLanding("", justAfter).sections.find((section) => section.id === "companies")
        const items = (grid?.content as { items: { title: string; badge?: { label: string } }[] }).items
        expect(items.find((item) => item.title === newest.name)?.badge?.label).toBe("New")
    })

    it("renders the log newest-first", () => {
        const list = logLanding("").sections.find((section) => section.id === "entries")
        const posts = (list?.content as { posts: { date?: string }[] }).posts
        const dates = posts.map((post) => post.date ?? "")
        expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)))
    })
})
