import { describe, expect, it, vi } from "vitest"
import resumeCatalog from "../../../../../packs/resume/catalog.json"

// The shared shell appends the project manifest's marketing pages to the
// nav; the ambient manifest differs per composed tree and this suite runs
// inside every one of them. Pin it empty so the assertions are about the
// pack, not the tree it shipped in.
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { roles } from "../../../src/View/Resume/content"
import { experienceLabel, totalExperienceMonths } from "../../../src/View/Resume/dates"
import { resumeLanding } from "../../../src/View/Resume/resumeLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The résumé pack's doc-aware home surface. Two invariants:
 *
 * 1. Fidelity — the catalog's seeded skeleton reproduces the code config
 *    exactly, so shipping the seed changes nothing visually and the
 *    structural editor's first gesture starts from documented truth.
 * 2. Computed content — the sections carry the date math's output (the
 *    hero's total, each role's range · duration, the ordering), never
 *    hand-written numbers.
 */

const document = resumeCatalog.landing
const NOW = new Date(2025, 8, 15) // Sep 2025

describe("resume catalog landing seed", () => {
    it("maps the home route to a seeded page", () => {
        expect(document.routes).toEqual({ "/": "home" })
        expect(Object.keys(document.pages).sort()).toEqual(
            [...new Set(Object.values(document.routes))].sort(),
        )
    })

    it("reproduces the page's code skeleton exactly", () => {
        expect(applySitePageDocument(resumeLanding("", NOW), "home", document)).toEqual(
            resumeLanding("", NOW),
        )
    })

    it("mirrors the code sections' skeleton entries verbatim", () => {
        // The merge above is graceful — a drifted type/variant in the seed
        // falls back to code and still renders — so pin the seed entries
        // byte-for-byte too: the document is supposed to be TRUTH about the
        // page, and the structural editor starts from what it says.
        expect(document.pages.home.sections).toEqual(
            resumeLanding("", NOW).sections.map((section) => ({
                id: section.id,
                type: section.type,
                ...(section.variant !== undefined ? { variant: section.variant } : {}),
            })),
        )
    })

    it("pins the editorial register as the document style", () => {
        expect(document.style).toEqual({ preset: "editorial" })
        expect(resumeLanding("", NOW).style?.preset).toBe("editorial")
    })

    it("reorders the page when the documented skeleton changes", () => {
        const reordered = applySitePageDocument(resumeLanding("", NOW), "home", {
            pages: { home: { sections: [{ id: "experience" }, { id: "hero" }] } },
        })
        expect(reordered.sections.map((section) => section.id)).toEqual(["experience", "hero"])
    })
})

describe("resume computed sections", () => {
    const config = resumeLanding("", NOW)
    const section = (id: string) => config.sections.find((entry) => entry.id === id)

    it("computes the hero's total years of experience from the roles", () => {
        const hero = section("hero")?.content as { subheadline?: string }
        const expected = experienceLabel(totalExperienceMonths(roles, NOW))
        expect(hero.subheadline).toContain(`${expected} of experience`)
    })

    it("renders roles most-recent-first with computed range · duration lines", () => {
        const experience = section("experience")?.content as {
            highlights: { headline: string; body: string }[]
        }
        expect(experience.highlights).toHaveLength(roles.length)
        // The first entry is a current role wearing a computed Present line.
        expect(experience.highlights[0].body).toMatch(/^\d{4} – Present · /)
        // Every line leads with the computed range · duration annotation.
        for (const highlight of experience.highlights) {
            expect(highlight.body).toMatch(/^\d{4}(?: – (?:\d{4}|Present))? · \d+ (yrs?|mos?)/)
        }
    })

    it("keeps the stats strip computed from content counts", () => {
        const stats = section("stats")?.content as { stats: { value: string; label: string }[] }
        expect(stats.stats[0].value).toBe(experienceLabel(totalExperienceMonths(roles, NOW)))
        expect(stats.stats[1].value).toBe(`${roles.length}`)
    })

    it("wires every Download résumé CTA at the #print anchor the page intercepts", () => {
        const hero = section("hero")?.content as { primaryCta?: { anchor?: string; label?: string } }
        expect(hero.primaryCta?.anchor).toBe("print")
        expect(hero.primaryCta?.label).toBe("Download résumé")
        expect(config.shell?.nav?.content.cta).toEqual({ label: "Download résumé", anchor: "print" })
    })

    it("keeps the nav to the wordmark and the one CTA — a one-pager has no pages", () => {
        // The résumé navigates by scrolling; the chrome carries only the
        // name and the Download résumé conversion. Manifest extras join
        // only when the owner actually adds pages (pinned empty above).
        expect(config.shell?.nav?.content.links).toEqual([])
    })
})
