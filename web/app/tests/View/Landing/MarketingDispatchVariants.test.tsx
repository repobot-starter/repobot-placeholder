import { MarketingHero, MarketingPricing } from "@ui"
import { cleanup, render, screen, within } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * The dispatch set's newer pieces: pricing `price-tags` (the price book's
 * lines hung as tags), and the hero's `price-board` aside (a menu board
 * lettered on the photograph), its `seal` roundel, and its `readout`
 * figure — a brand statement over the headline, never a live reading.
 */

const photo = (name: string) => ({
    kind: "image" as const,
    src: `/services-emergency/${name}.webp`,
    alt: name,
    width: 2160,
    height: 1350,
})

afterEach(() => {
    cleanup()
})

describe("pricing price-tags", () => {
    it("hangs every line from every group as one tag, with the footnote and one ask", () => {
        render(
            <MarketingPricing
                variant="price-tags"
                title="Three prices to know."
                groups={[
                    { heading: "Cooling", items: [{ name: "Tune-up", price: "$89", note: "New filter" }] },
                    {
                        items: [
                            { name: "Diagnostic", price: "$0" },
                            { name: "New system", price: "$6,900", qualifier: "from" },
                        ],
                    },
                ]}
                footnote="The quote is the invoice."
                cta={{ label: "Book a tune-up", href: "/request" }}
            />,
        )
        expect(screen.getByRole("heading", { name: "Three prices to know." })).toBeTruthy()
        const tags = within(screen.getByRole("list")).getAllByRole("listitem")
        expect(tags).toHaveLength(3)
        expect(within(tags[0]).getByText("Tune-up")).toBeTruthy()
        expect(within(tags[0]).getByText("New filter")).toBeTruthy()
        expect(within(tags[2]).getByText("from")).toBeTruthy()
        expect(within(tags[2]).getByText(/\$6,900/)).toBeTruthy()
        expect(screen.getByText("The quote is the invoice.")).toBeTruthy()
        expect(screen.getByRole("link", { name: "Book a tune-up" }).getAttribute("href")).toBe("/request")
    })
})

describe("hero price board, seal, and readout", () => {
    const board = {
        kind: "price-board" as const,
        title: "Upfront pricing.",
        items: [
            { name: "Drains", price: "$189" },
            { name: "Water heaters", price: "$1,850", qualifier: "from" },
        ],
        footnote: "Same price at 3 AM.",
        cta: { label: "Get an exact quote", href: "/request" },
    }

    it("letters the board on the full-bleed photograph, after the headline's CTAs", () => {
        render(
            <MarketingHero
                variant="full-bleed-media"
                headline="The price is the price."
                primaryCta={{ label: "Call now", href: "tel:+16265550148" }}
                media={photo("van")}
                aside={board}
                seal={"On call\n24/7"}
            />,
        )
        const sign = screen.getByRole("complementary", { name: "Upfront pricing." })
        expect(within(sign).getAllByRole("listitem")).toHaveLength(2)
        expect(within(sign).getByText("$1,850")).toBeTruthy()
        expect(within(sign).getByText(/from/)).toBeTruthy()
        expect(within(sign).getByText("Same price at 3 AM.")).toBeTruthy()
        expect(within(sign).getByRole("link", { name: "Get an exact quote" }).getAttribute("href")).toBe(
            "/request",
        )
        const cta = screen.getByRole("link", { name: "Call now" })
        expect(cta.compareDocumentPosition(sign) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
        // The seal's line break splits the small top line from the big one.
        expect(screen.getByText("On call")).toBeTruthy()
        expect(screen.getByText("24/7")).toBeTruthy()
    })

    it("letters the board beside the split copy when there is no photograph", () => {
        render(<MarketingHero variant="split-media" headline="Hi" aside={board} />)
        expect(screen.getByRole("complementary", { name: "Upfront pricing." })).toBeTruthy()
    })

    it("sets the readout over the headline, the note under the figure", () => {
        render(
            <MarketingHero
                variant="split-media"
                headline="Cold air. Fast."
                media={photo("rooftop")}
                readout={{ value: "115°", note: "72° inside" }}
            />,
        )
        const value = screen.getByText("115°")
        const note = screen.getByText("72° inside")
        const headline = screen.getByRole("heading", { level: 1 })
        expect(value.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
        expect(note.compareDocumentPosition(headline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("drops the readout note when it is absent", () => {
        render(<MarketingHero variant="statement" headline="Hi" readout={{ value: "115°" }} />)
        expect(screen.getByText("115°")).toBeTruthy()
    })
})
