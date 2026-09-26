import { MarketingShowcase, type MarketingShowcaseItem } from "@ui"
import { cleanup, render } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * The showcase `swatches` variant prints each item as a flat paint chip:
 * the item's `color` fills the field and the type follows the chip, not
 * the theme — dark ink on a light chip, white on a dark one — so a
 * marigold and a bayou teal both stay legible. A missing or unreadable
 * color falls back to the accent field rather than an unstyled chip.
 */

const chips: MarketingShowcaseItem[] = [
    { title: "Bywater Teal", meta: "027", description: "Bold & calm.", color: "#0e6f73", url: "/quote" },
    { title: "Marigold Heights", meta: "039", description: "Joyful. Bright.", color: "#f5a623" },
    { title: "House Accent", description: "No chip color given." },
    { title: "Named Red", description: "Not a hex.", color: "red" },
]

function chip(container: HTMLElement, title: string): HTMLElement {
    const heading = [...container.querySelectorAll("article h3")].find((node) => node.textContent === title)
    const article = heading?.closest("article")
    if (!(article instanceof HTMLElement)) throw new Error(`no chip titled ${title}`)
    return article
}

afterEach(cleanup)

describe("MarketingShowcase swatches", () => {
    it("fills each chip with its color and sets the ink that reads on it", () => {
        const { container } = render(<MarketingShowcase variant="swatches" items={chips} />)
        const teal = chip(container, "Bywater Teal")
        expect(teal.style.backgroundColor).toBe("#0e6f73")
        expect(teal.style.color).toBe("#ffffff")
        const marigold = chip(container, "Marigold Heights")
        expect(marigold.style.backgroundColor).toBe("#f5a623")
        expect(marigold.style.color).toBe("#141414")
    })

    it("falls back to the accent field for a missing or non-hex color", () => {
        const { container } = render(<MarketingShowcase variant="swatches" items={chips} />)
        for (const title of ["House Accent", "Named Red"]) {
            const field = chip(container, title)
            expect(field.getAttribute("style"), title).toBeNull()
            expect(field.className.split(" ").length, `${title} carries the accent class`).toBe(2)
        }
    })

    it("prints the name, the code, and the note, and links the chip when it has a url", () => {
        const { container, getByRole } = render(<MarketingShowcase variant="swatches" items={chips} />)
        const teal = chip(container, "Bywater Teal")
        expect(teal.textContent).toContain("027")
        expect(teal.textContent).toContain("Bold & calm.")
        expect(getByRole("link", { name: "Bywater Teal" }).getAttribute("href")).toBe("/quote")
        expect(chip(container, "Marigold Heights").querySelector("a")).toBeNull()
    })

    it("labels the deck by its title, then its kicker", () => {
        const titled = render(
            <MarketingShowcase variant="swatches" kicker="The deck" title="House colors" items={chips} />,
        )
        expect(titled.getByRole("region", { name: "House colors" })).toBeTruthy()
        expect(titled.getByRole("heading", { level: 2, name: "House colors" })).toBeTruthy()
        cleanup()
        const bare = render(<MarketingShowcase variant="swatches" kicker="The deck" items={chips} />)
        expect(bare.getByRole("region", { name: "The deck" })).toBeTruthy()
    })
})
