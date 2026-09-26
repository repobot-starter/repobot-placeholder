import { MarketingShowcase } from "@ui"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * showcase `directory`: the people of a practice set out by rank — one
 * column per `eyebrow`, each entry a portrait over its name, specialties
 * (`tags`), rate (`meta`) and availability (`description`) — with tag
 * filters that narrow every column at once. Landing documents only carry
 * `{id, type, variant}`, so it must also read over items with no eyebrow.
 */

const portrait = (name: string) => ({
    kind: "image" as const,
    src: `/services-hair-maren/${name}.webp`,
    alt: name,
    width: 1200,
    height: 1600,
})

const stylists = [
    {
        title: "Camille Moreau",
        eyebrow: "Master",
        meta: "Cut from $250",
        description: "Next suite: Thursday",
        tags: ["Precision cuts", "Color"],
        media: portrait("camille"),
    },
    {
        title: "Lena Ellison",
        eyebrow: "Senior",
        meta: "Cut from $180",
        description: "Next suite: Thursday",
        tags: ["Color", "Blonding"],
        media: portrait("lena"),
    },
    {
        title: "Hélène Bastide",
        eyebrow: "Master",
        meta: "Cut from $250",
        description: "Next suite: Saturday",
        tags: ["Blonding"],
        media: portrait("helene"),
    },
]

afterEach(() => {
    cleanup()
})

describe("showcase directory", () => {
    it("sets one column per rank in first-appearance order, every entry in full", () => {
        render(<MarketingShowcase variant="directory" items={stylists} />)
        const headings = screen.getAllByRole("heading", { level: 3 })
        expect(headings.map((heading) => heading.textContent)).toEqual(["Master", "Senior"])
        const master = headings[0].parentElement as HTMLElement
        expect(
            within(master)
                .getAllByRole("heading", { level: 4 })
                .map((name) => name.textContent),
        ).toEqual(["Camille Moreau", "Hélène Bastide"])
        expect(within(master).getByText("Precision cuts · Color")).toBeTruthy()
        expect(within(master).getAllByText("Cut from $250")).toHaveLength(2)
        expect(within(master).getByText("Next suite: Saturday")).toBeTruthy()
    })

    it("filters every column by specialty without moving the ranks", () => {
        render(<MarketingShowcase variant="directory" allLabel="All" items={stylists} />)
        const chips = screen.getAllByRole("button")
        expect(chips.map((chip) => chip.textContent)).toEqual(["All", "Precision cuts", "Color", "Blonding"])
        fireEvent.click(screen.getByRole("button", { name: "Blonding" }))
        expect(screen.getByRole("button", { name: "Blonding" }).getAttribute("aria-pressed")).toBe("true")
        expect(screen.queryByRole("heading", { name: "Camille Moreau" })).toBeNull()
        expect(screen.getByRole("heading", { name: "Hélène Bastide" })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Lena Ellison" })).toBeTruthy()
        expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
            "Master",
            "Senior",
        ])
        fireEvent.click(screen.getByRole("button", { name: "All" }))
        expect(screen.getByRole("heading", { name: "Camille Moreau" })).toBeTruthy()
    })

    it("keeps items without an eyebrow in one unheaded column", () => {
        render(
            <MarketingShowcase
                variant="directory"
                items={[{ title: "Walk-in chair", description: "Open daily", media: portrait("chair") }]}
            />,
        )
        expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0)
        expect(screen.getByRole("heading", { name: "Walk-in chair" })).toBeTruthy()
        expect(screen.queryAllByRole("button")).toHaveLength(0)
    })
})
