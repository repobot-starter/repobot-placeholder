import { describe, expect, it } from "vitest"
import {
    education,
    landingCopy,
    links,
    person,
    projects,
    roles,
    skillGroups,
} from "../../../src/View/Resume/content"

/**
 * The résumé pack's content integrity — the guards behind the catalog's
 * content contract. The load-bearing invariant: dates are data ("YYYY-MM")
 * and durations are NEVER written into prose, because the page computes
 * them (dates.ts) and a hand-written "6 years" would drift the day the
 * clock moves.
 */

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

describe("resume content", () => {
    it("keeps every role date a valid YYYY-MM, ends after starts", () => {
        for (const role of roles) {
            expect(role.start, `${role.company} start`).toMatch(YEAR_MONTH)
            if (role.end !== undefined) {
                expect(role.end, `${role.company} end`).toMatch(YEAR_MONTH)
                expect(role.end >= role.start, `${role.company}: end before start`).toBe(true)
            }
        }
    })

    it("ships at least one current role (the résumé of someone in the game)", () => {
        expect(roles.some((role) => role.end === undefined)).toBe(true)
    })

    it("never hand-writes a duration into prose — the page computes them", () => {
        const handWritten = /\d+\s*\+?\s*(yrs?|years?|mos?|months?)\b/i
        for (const role of roles) {
            expect(role.summary, `${role.company} summary hand-writes a duration`).not.toMatch(handWritten)
        }
        for (const paragraph of person.summary) {
            expect(paragraph, "person.summary hand-writes a duration").not.toMatch(handWritten)
        }
    })

    it("keeps role identities unique", () => {
        const keys = roles.map((role) => `${role.title}@${role.company}`)
        expect(new Set(keys).size).toBe(keys.length)
    })

    it("meets the content contract's minimums", () => {
        expect(person.name).not.toBe("")
        expect(person.title).not.toBe("")
        expect(person.email).toContain("@")
        expect(person.summary.length).toBeGreaterThanOrEqual(1)
        expect(roles.length).toBeGreaterThanOrEqual(2)
        expect(education.length).toBeGreaterThanOrEqual(1)
        expect(skillGroups.length).toBeGreaterThanOrEqual(2)
        for (const group of skillGroups) {
            expect(group.skills.length, `${group.title} needs 2+ skills`).toBeGreaterThanOrEqual(2)
        }
        expect(projects.length).toBeGreaterThanOrEqual(2)
        expect(links.length).toBeGreaterThanOrEqual(2)
    })

    it("only links projects and channels that have a real destination", () => {
        // The shipped content omits most urls — its destinations are demo
        // fiction, and an unlinked card beats navigation to a dead page. A
        // url that IS present must be a real scheme, never a placeholder
        // domain.
        for (const project of projects) {
            if (project.url !== undefined) {
                expect(project.url, project.title).toMatch(/^https:\/\//)
                expect(project.url, project.title).not.toMatch(/\.example\b|example\.com/)
            }
        }
        for (const link of links) {
            if (link.url !== undefined) {
                expect(link.url, link.label).toMatch(/^(https:\/\/|mailto:)/)
            }
            expect(link.value, link.label).not.toBe("")
        }
    })

    it("keeps the register-owned strings present for remix seeds", () => {
        // A seed re-values these; an empty one would blank a section title.
        expect(landingCopy.printCta).not.toBe("")
        expect(landingCopy.experience.kicker).not.toBe("")
        expect(landingCopy.experience.title).not.toBe("")
        expect(landingCopy.links.title).not.toBe("")
    })
})
