import { describe, expect, it } from "vitest"
import {
    companies,
    disclosures,
    firm,
    focusAreas,
    home,
    log,
    principles,
    statedMetrics,
    team,
} from "../../../src/View/FundIndex/content"

/**
 * Guards the fund-index pack's content contract
 * (packs/fund-index/catalog.json): the computed mechanics (portfolio.ts)
 * trust these shapes, so drift here is a broken badge, an empty chip row,
 * or a numeral filed out of order at render time.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const STATUSES = new Set(["active", "acquired", "public"])

describe("fund-index content", () => {
    it("ships a real firm identity and a formula short enough to display", () => {
        expect(firm.name).not.toBe("")
        expect(firm.email).toContain("@")
        expect(home.headline).not.toBe("")
        // The formula renders at display scale — it has to fit on a wall.
        expect(home.formula.expression.length).toBeGreaterThan(0)
        expect(home.formula.expression.length).toBeLessThan(90)
        expect(home.formula.caption).not.toBe("")
    })

    it("files enough focus areas and principles to number", () => {
        expect(focusAreas.length).toBeGreaterThanOrEqual(3)
        for (const area of focusAreas) {
            expect(area.title).not.toBe("")
            expect(area.body.length).toBeGreaterThan(60)
        }
        expect(principles.length).toBeGreaterThanOrEqual(3)
        for (const principle of principles) {
            expect(principle.title).not.toBe("")
            expect(principle.body.length).toBeGreaterThan(60)
        }
    })

    it("keeps stated metrics as worded strings, never bare counts", () => {
        expect(statedMetrics.length).toBeGreaterThanOrEqual(2)
        for (const metric of statedMetrics) {
            expect(metric.value).not.toBe("")
            expect(metric.label).not.toBe("")
            // A bare integer here would shadow the computed counts beside it.
            expect(/^\d+$/.test(metric.value), `"${metric.value}" reads as a countable`).toBe(false)
        }
    })

    it("keeps every company's facts computable", () => {
        expect(companies.length).toBeGreaterThanOrEqual(6)
        const names = companies.map((company) => company.name)
        expect(new Set(names).size).toBe(names.length)
        for (const company of companies) {
            expect(company.oneLiner, `${company.name} needs a one-liner`).not.toBe("")
            expect(company.sectors.length, `${company.name} needs a sector`).toBeGreaterThan(0)
            expect(company.investedAt, `${company.name} needs an ISO date`).toMatch(ISO_DATE)
            expect(STATUSES.has(company.status), `${company.name} has status ${company.status}`).toBe(true)
        }
    })

    it("keeps every company's sectors inside the filed focus areas", () => {
        // The index is the thesis: a company outside every focus area is
        // either a drifted tag or a missing 00N entry.
        const filed = new Set(focusAreas.map((area) => area.title))
        for (const company of companies) {
            for (const sector of company.sectors) {
                expect(filed.has(sector), `${company.name} tagged "${sector}"`).toBe(true)
            }
        }
    })

    it("carries at least one settled exit so the exits count means something", () => {
        expect(companies.some((company) => company.status !== "active")).toBe(true)
    })

    it("ships a team with roles and briefs", () => {
        expect(team.length).toBeGreaterThanOrEqual(2)
        for (const member of team) {
            expect(member.name).not.toBe("")
            expect(member.role).not.toBe("")
            expect(member.bio.length).toBeGreaterThan(80)
        }
    })

    it("dates every log entry so the newest-first sort has something to sort", () => {
        expect(log.length).toBeGreaterThanOrEqual(3)
        for (const entry of log) {
            expect(entry.title).not.toBe("")
            expect(entry.excerpt).not.toBe("")
            expect(entry.date).toMatch(ISO_DATE)
            expect(entry.href).toMatch(/^https?:\/\//)
        }
    })

    it("never ships empty disclosures — the fine print is a feature here", () => {
        expect(disclosures.paragraphs.length).toBeGreaterThanOrEqual(3)
        expect(disclosures.updated).toMatch(ISO_DATE)
        for (const paragraph of disclosures.paragraphs) {
            expect(paragraph.length).toBeGreaterThan(80)
        }
    })
})
