import { MarketingPricing } from "@ui"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * `pricing` `builder`, the session-builder reading: `builderLayout:
 * "tiles"` photograph tiles beside a summary card, a pick-one group
 * (`choose: "one"`), and lines that start `selected`. The board reading (a
 * checkbox per line over a running total, degrading from tier content) is
 * pinned in MarketingPackageBuilderVariants.test.tsx, and holds with none
 * of these fields set.
 */

const photo = (name: string) => ({
    kind: "image" as const,
    src: `/services-makeup-noor/${name}.webp`,
    alt: name,
    width: 1200,
    height: 1600,
})

afterEach(() => {
    cleanup()
})

describe("pricing builder tiles", () => {
    const session = [
        {
            heading: "Session",
            choose: "one" as const,
            items: [
                { name: "Newborn, studio", price: "$650", media: photo("newborn"), selected: true },
                { name: "Motherhood", price: "$550", media: photo("motherhood") },
                { name: "Fresh 48", note: "At the hospital", price: "$750", media: photo("fresh48") },
            ],
        },
        {
            heading: "Keepsakes",
            items: [
                { name: "Linen heirloom album", price: "$1,200", media: photo("album"), selected: true },
                { name: "Ten fine-art prints", price: "$480", media: photo("prints") },
                { name: "Digital gallery", price: "Included", media: photo("gallery") },
            ],
        },
    ]

    const renderTiles = () =>
        render(
            <MarketingPricing
                variant="builder"
                builderLayout="tiles"
                anchorId="build"
                title="Build your session"
                summaryTitle="Your session"
                totalLabel="Total"
                groups={session}
                cta={{ label: "Reserve your due date", href: "/book" }}
                footnote="Secure booking · No payment today"
            />,
        )

    it("opens on the selected lines only and lists them in the summary over the total", () => {
        renderTiles()
        const radios = screen.getAllByRole("radio") as HTMLInputElement[]
        expect(radios.map((radio) => radio.checked)).toEqual([true, false, false])
        const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[]
        expect(boxes.map((box) => box.checked)).toEqual([true, false, false])
        expect(screen.getByRole("heading", { name: "Your session" })).toBeTruthy()
        const summary = screen.getByRole("complementary", { name: "Your session" })
        expect(summary.textContent).toContain("Newborn, studio")
        expect(summary.textContent).toContain("Linen heirloom album")
        expect(summary.textContent).not.toContain("Motherhood")
        expect(screen.getByRole("status").textContent).toContain("$1,850")
        expect(screen.getByRole("link", { name: "Reserve your due date" }).getAttribute("href")).toBe("/book")
        expect(screen.getAllByRole("img")).toHaveLength(6)
    })

    it("keeps exactly one session picked and totals as keepsakes tick", () => {
        renderTiles()
        const [, motherhood] = screen.getAllByRole("radio") as HTMLInputElement[]
        fireEvent.click(motherhood)
        const radios = screen.getAllByRole("radio") as HTMLInputElement[]
        expect(radios.map((radio) => radio.checked)).toEqual([false, true, false])
        expect(screen.getByRole("status").textContent).toContain("$1,750")
        const [, prints, gallery] = screen.getAllByRole("checkbox") as HTMLInputElement[]
        fireEvent.click(prints)
        fireEvent.click(gallery)
        expect(screen.getByRole("status").textContent).toContain("$2,230")
        // An unpriced line ticks but prints no summary line and adds nothing.
        const summary = screen.getByRole("complementary", { name: "Your session" })
        expect(summary.textContent).not.toContain("Digital gallery")
    })

    it("holds a pick-one group to its first line on the board when nothing is selected", () => {
        render(
            <MarketingPricing
                variant="builder"
                groups={[
                    {
                        heading: "Session",
                        choose: "one",
                        items: session[0].items.map(({ selected: _, ...item }) => item),
                    },
                ]}
            />,
        )
        const radios = screen.getAllByRole("radio") as HTMLInputElement[]
        expect(radios.map((radio) => radio.checked)).toEqual([true, false, false])
        expect(screen.getByRole("status").textContent).toContain("$650")
    })
})
