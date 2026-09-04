import { describe, expect, it } from "vitest"
import {
    experienceLabel,
    formatDuration,
    formatRange,
    monthsBetween,
    rangeWithDuration,
    sortRolesByDate,
    totalExperienceMonths,
} from "../../../src/View/Resume/dates"

/**
 * The résumé's computed-from-content mechanics (dates.ts): the owner edits
 * role dates, the page computes every human-readable consequence. These
 * tests pin the math a recruiter would check with a calendar — durations,
 * the "· 6 yrs" annotations, the hero total, and the ordering.
 */

const NOW = new Date(2025, 8, 15) // Sep 2025

describe("resume date math", () => {
    it("counts months inclusively, the way recruiters do", () => {
        // Mar 2019 through Aug 2026 reads as 7 yrs 6 mos on LinkedIn.
        expect(monthsBetween({ start: "2019-03", end: "2026-08" }, NOW)).toBe(90)
        // A job started and left in the same month still counts as one.
        expect(monthsBetween({ start: "2024-05", end: "2024-05" }, NOW)).toBe(1)
        // An open range runs to the injected now.
        expect(monthsBetween({ start: "2025-07" }, NOW)).toBe(3)
    })

    it("formats durations trimmed and singular-aware", () => {
        expect(formatDuration(90)).toBe("7 yrs 6 mos")
        expect(formatDuration(12)).toBe("1 yr")
        expect(formatDuration(24)).toBe("2 yrs")
        expect(formatDuration(13)).toBe("1 yr 1 mo")
        expect(formatDuration(5)).toBe("5 mos")
        expect(formatDuration(1)).toBe("1 mo")
    })

    it("labels ranges by year, Present for open ends", () => {
        expect(formatRange({ start: "2016-01", end: "2019-06" })).toBe("2016 – 2019")
        expect(formatRange({ start: "2019-10" })).toBe("2019 – Present")
        expect(formatRange({ start: "2024-02", end: "2024-11" })).toBe("2024")
    })

    it("computes the line a role wears: range · duration", () => {
        // The signature mechanic: "2019 – Present · 6 yrs" from two fields.
        expect(rangeWithDuration({ start: "2019-10" }, NOW)).toBe("2019 – Present · 6 yrs")
        expect(rangeWithDuration({ start: "2016-01", end: "2018-12" }, NOW)).toBe("2016 – 2018 · 3 yrs")
    })

    it("totals experience as an interval union — overlaps never double count", () => {
        // A side gig fully inside a day job adds nothing.
        expect(
            totalExperienceMonths(
                [
                    { start: "2020-01", end: "2022-12" }, // 36
                    { start: "2021-03", end: "2021-09" }, // inside the above
                ],
                NOW,
            ),
        ).toBe(36)
        // A gap year is not experience.
        expect(
            totalExperienceMonths(
                [
                    { start: "2018-01", end: "2018-12" }, // 12
                    { start: "2020-01", end: "2020-12" }, // 12, after a gap
                ],
                NOW,
            ),
        ).toBe(24)
    })

    it("labels the hero total: exact years bare, a started year with +", () => {
        expect(experienceLabel(120)).toBe("10 yrs")
        expect(experienceLabel(121)).toBe("10+ yrs")
        expect(experienceLabel(12)).toBe("1 yr")
        expect(experienceLabel(7)).toBe("7 mos")
    })

    it("sorts roles most-recent-first at render time, current roles up top", () => {
        const sorted = sortRolesByDate(
            [
                { start: "2016-01", end: "2019-06" },
                { start: "2022-04" }, // current
                { start: "2019-07", end: "2022-03" },
            ],
            NOW,
        )
        expect(sorted.map((role) => role.start)).toEqual(["2022-04", "2019-07", "2016-01"])
        // Two current roles: the later start leads.
        const current = sortRolesByDate([{ start: "2020-05" }, { start: "2023-01" }], NOW)
        expect(current.map((role) => role.start)).toEqual(["2023-01", "2020-05"])
    })
})
