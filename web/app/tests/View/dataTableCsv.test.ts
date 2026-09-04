import { describe, expect, it } from "vitest"

// The CSV builder is internal to the design system; imported via its source
// path because the download half (blob + anchor) is browser-only.
import { buildCsv } from "../../../design-system/src/components/dataTableCsv"

describe("buildCsv", () => {
    it("emits a header row and escapes quotes, commas, and newlines", () => {
        const csv = buildCsv(
            [
                { header: "Name", value: (row: { name: string; note: string }) => row.name },
                { header: "Notes, etc", value: (row) => row.note },
            ],
            [
                { name: "Plain", note: "fine" },
                { name: 'Has "quotes"', note: "a,b" },
                { name: "Multi", note: "line one\nline two" },
            ],
        )
        expect(csv.split("\n").slice(0, 3)).toEqual([
            'Name,"Notes, etc"',
            "Plain,fine",
            '"Has ""quotes""","a,b"',
        ])
        expect(csv).toContain('"line one\nline two"')
    })
})
