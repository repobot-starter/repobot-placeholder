import { MarketingStats } from "@ui"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * stats `bars` — the report: the intro line, a ruled table of label,
 * value, and a bar drawn to the value's share of the largest value, then
 * the footnote and the note tag. The note is how demo figures stay
 * visibly marked (care-obgyn-clearwater's sample rates).
 */

afterEach(() => cleanup())

const stats = [
    { label: "Under 35", value: "52%" },
    { label: "35–37", value: "39%" },
    { label: "Over 40", value: "13%" },
    { label: "Pending", value: "—" },
]

function barWidths(container: HTMLElement): string[] {
    return [...container.querySelectorAll("dd[aria-hidden='true'] > span")].map(
        (bar) => (bar as HTMLElement).style.width,
    )
}

describe("stats bars", () => {
    it("draws each bar to its value's share of the largest, and none for a value without a number", () => {
        const { container } = render(<MarketingStats variant="bars" stats={stats} />)
        expect(barWidths(container)).toEqual(["100.0%", "75.0%", "25.0%", "0.0%"])
    })

    it("reads thousands and currency as numbers", () => {
        const { container } = render(
            <MarketingStats
                variant="bars"
                stats={[
                    { label: "IVF", value: "$16,900" },
                    { label: "IUI", value: "$1,690" },
                ]}
            />,
        )
        expect(barWidths(container)).toEqual(["100.0%", "10.0%"])
    })

    it("renders the rows as a definition list with every label and value editable in place", () => {
        const { container } = render(<MarketingStats variant="bars" stats={stats} />)
        const rows = container.querySelectorAll("dl > div")
        expect(rows).toHaveLength(stats.length)
        rows.forEach((row, index) => {
            expect(row.getAttribute("data-rb-item-list")).toBe("stats")
            expect(row.getAttribute("data-rb-item-index")).toBe(String(index))
            expect(row.querySelector("dt")?.textContent).toBe(stats[index].label)
            expect(row.querySelector("dt")?.getAttribute("data-rb-text-field")).toBe("label")
            expect(row.querySelector("dd")?.textContent).toBe(stats[index].value)
            expect(row.querySelector("dd")?.getAttribute("data-rb-text-field")).toBe("value")
        })
    })

    it("sets the intro, the footnote, and the note only when given", () => {
        const { container, rerender } = render(<MarketingStats variant="bars" stats={stats} />)
        expect(container.querySelectorAll("p")).toHaveLength(0)
        rerender(
            <MarketingStats
                variant="bars"
                kicker="The numbers, honestly"
                intro="Live-birth rates per retrieval, by age."
                footnote="Updated every year."
                note="Sample data"
                stats={stats}
            />,
        )
        for (const [text, field] of [
            ["Live-birth rates per retrieval, by age.", "intro"],
            ["Updated every year.", "footnote"],
            ["Sample data", "note"],
        ]) {
            expect(screen.getByText(text).getAttribute("data-rb-text-field")).toBe(field)
        }
        expect(screen.getByLabelText("The numbers, honestly")).toBeTruthy()
    })
})
