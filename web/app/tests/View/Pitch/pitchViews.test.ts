import { describe, expect, it } from "vitest"
import {
    accentPresets,
    formatPitchMoney,
    formatPitchMonth,
    isValidAccent,
    runwayLabel,
    slideKindLabels,
} from "../../../src/View/Pitch/pitchShared"

describe("pitch views", () => {
    it("formats money in the books' currency", () => {
        expect(formatPitchMoney(245_000, "usd")).toBe("$2,450.00")
        expect(formatPitchMoney(0, "usd")).toBe("$0.00")
    })

    it("formats series months without timezone drift", () => {
        expect(formatPitchMonth("2027-01")).toContain("2027")
        expect(formatPitchMonth("not-a-month")).toBe("not-a-month")
    })

    it("labels every slide kind in the fixed outline", () => {
        expect(Object.keys(slideKindLabels)).toEqual([
            "COVER",
            "TRACTION",
            "REVENUE",
            "MARGINS",
            "RUNWAY",
            "ASK",
        ])
        expect(slideKindLabels.ASK).toBe("The ask")
    })

    it("spells out the runway headline", () => {
        expect(runwayLabel(null)).toBe("Cash-flow positive")
        expect(runwayLabel(undefined)).toBe("Cash-flow positive")
        expect(runwayLabel(1)).toBe("1 month")
        expect(runwayLabel(14)).toBe("14 months")
    })

    it("validates accents the way the API does", () => {
        for (const preset of accentPresets) {
            expect(isValidAccent(preset)).toBe(true)
        }
        expect(isValidAccent("blue")).toBe(false)
        expect(isValidAccent("#12345")).toBe(false)
        expect(isValidAccent("#12345g")).toBe(false)
    })
})
