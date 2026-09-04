/**
 * The derived-template seeds' parity gate for the résumé shape. A remix
 * seed (packs/README.md "Derived templates") is composed over the resume
 * pack's content module verbatim, so each seed must remain a structural
 * twin of `content.ts`: the same export surface, the contract's minimums
 * met, and the same date discipline — "YYYY-MM" data with durations never
 * hand-written into prose, because the page computes them (dates.ts).
 * These tests fail the moment the pack's contract moves without its seeds.
 */

import { describe, expect, it } from "vitest"
import devCatalog from "../../../../../packs/resume-dev/catalog.json"
import * as base from "../../../src/View/Resume/content"
import * as dev from "../../../src/View/Resume/devRemix.content"

type ContentModule = typeof base

const seeds: { name: string; module: ContentModule }[] = [{ name: "dev", module: dev }]

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const HAND_WRITTEN_DURATION = /\d+\s*\+?\s*(yrs?|years?|mos?|months?)\b/i

describe.each(seeds)("resume $name remix seed", ({ module }) => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(module).sort()).toEqual(Object.keys(base).sort())
    })

    it("re-values every landingCopy key the base declares — no more, no less", () => {
        // landingCopy is the remix's voice: a key the seed forgot would ship
        // the composed template with an undefined section title.
        const flatten = (value: object, prefix = ""): string[] =>
            Object.entries(value).flatMap(([key, entry]) =>
                typeof entry === "object" && entry !== null
                    ? flatten(entry, `${prefix}${key}.`)
                    : [`${prefix}${key}`],
            )
        expect(flatten(module.landingCopy).sort()).toEqual(flatten(base.landingCopy).sort())
    })

    it("keeps the date discipline: valid YYYY-MM, ends after starts, one current role", () => {
        for (const role of module.roles) {
            expect(role.start, `${role.company} start`).toMatch(YEAR_MONTH)
            if (role.end !== undefined) {
                expect(role.end, `${role.company} end`).toMatch(YEAR_MONTH)
                expect(role.end >= role.start, `${role.company}: end before start`).toBe(true)
            }
        }
        expect(module.roles.some((role) => role.end === undefined)).toBe(true)
    })

    it("never hand-writes a duration into prose — the page computes them", () => {
        for (const role of module.roles) {
            expect(role.summary, `${role.company} summary`).not.toMatch(HAND_WRITTEN_DURATION)
        }
        for (const paragraph of module.person.summary) {
            expect(paragraph, "person.summary").not.toMatch(HAND_WRITTEN_DURATION)
        }
    })

    it("meets the content contract's minimums", () => {
        expect(module.person.name).not.toBe("")
        expect(module.person.title).not.toBe("")
        expect(module.person.email).toContain("@")
        expect(module.person.summary.length).toBeGreaterThanOrEqual(1)
        expect(module.roles.length).toBeGreaterThanOrEqual(2)
        expect(module.education.length).toBeGreaterThanOrEqual(1)
        expect(module.skillGroups.length).toBeGreaterThanOrEqual(2)
        for (const group of module.skillGroups) {
            expect(group.skills.length, group.title).toBeGreaterThanOrEqual(2)
        }
        expect(module.projects.length).toBeGreaterThanOrEqual(2)
        expect(module.links.length).toBeGreaterThanOrEqual(2)
    })

    it("only links projects and channels that have a real destination", () => {
        // Seeds ship most urls omitted — demo destinations are fiction, and
        // an unlinked card beats navigation to a dead page. A url that IS
        // present must be a real scheme, never a placeholder domain.
        for (const project of module.projects) {
            if (project.url !== undefined) {
                expect(project.url, project.title).toMatch(/^https:\/\//)
                expect(project.url, project.title).not.toMatch(/\.example\b|example\.com/)
            }
        }
        for (const link of module.links) {
            if (link.url !== undefined) {
                expect(link.url, link.label).toMatch(/^(https:\/\/|mailto:)/)
            }
            expect(link.value, link.label).not.toBe("")
        }
    })
})

describe("resume-dev remix register", () => {
    it("re-seats the surface on monolith's true-black dark appearance", () => {
        // The remix's whole look is these two overlays: the landing style
        // override (resolveCatalog merges it over the base's landing, so
        // compose stamps monolith into the project's landing document) and
        // the dark-mode theme that selects its true-black appearance.
        expect(devCatalog.landing.style).toEqual({ preset: "monolith" })
        expect(devCatalog.theme.mode).toBe("dark")
        expect(devCatalog.theme.fontFamily).toBe("plex-mono")
    })

    it("keeps the brand achromatic so accent washes collapse to the ground", () => {
        // Equal RGB channels are what resolvePresetOverlay's achromatic()
        // check keys on — a hue here would put a color wash back on the
        // monochrome page.
        const achromatic = /^#([0-9a-f]{2})\1\1$/i
        expect(devCatalog.theme.brand.primary).toMatch(achromatic)
        expect(devCatalog.theme.brand.primaryDark).toMatch(achromatic)
    })
})
