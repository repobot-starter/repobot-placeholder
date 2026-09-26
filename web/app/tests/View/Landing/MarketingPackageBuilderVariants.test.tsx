import { MarketingHero, MarketingPricing } from "@ui"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * The multi-event variants: `pricing` `builder` (a package the visitor
 * assembles — a checkbox per line over a running total) and the hero's
 * `panel-collage` panel row (captioned photographs under the centered
 * copy). Landing documents only carry `{id, type, variant}`, so each must
 * also degrade gracefully over content written for its siblings.
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

describe("pricing builder", () => {
    const groups = [
        {
            heading: "Look inclusions",
            items: [
                { name: "Mehndi", note: "Airbrush makeup + hair", price: "$450" },
                { name: "Wedding", note: "Bridal makeup + hair + trial", price: "$1,250" },
                { name: "Trial", price: "By quote" },
            ],
        },
    ]

    it("opens with every line ticked and totals the priced lines", () => {
        render(
            <MarketingPricing
                variant="builder"
                title="Build your wedding weekend look"
                groups={groups}
                totalLabel="Running total"
                footnote="A 30% retainer holds your dates"
                cta={{ label: "Book your consultation", href: "/quote" }}
            />,
        )
        expect(screen.getByRole("heading", { name: "Build your wedding weekend look" })).toBeTruthy()
        const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[]
        expect(boxes).toHaveLength(3)
        for (const box of boxes) expect(box.checked).toBe(true)
        expect(screen.getByRole("status").textContent).toContain("$1,700")
        expect(screen.getByText("A 30% retainer holds your dates")).toBeTruthy()
        expect(screen.getByRole("link", { name: "Book your consultation" }).getAttribute("href")).toBe(
            "/quote",
        )
    })

    it("recomputes the total as lines are unticked and ticked again", () => {
        render(<MarketingPricing variant="builder" groups={groups} />)
        const [mehndi] = screen.getAllByRole("checkbox") as HTMLInputElement[]
        fireEvent.click(mehndi)
        expect(mehndi.checked).toBe(false)
        expect(screen.getByRole("status").textContent).toContain("$1,250")
        fireEvent.click(mehndi)
        expect(screen.getByRole("status").textContent).toContain("$1,700")
    })

    it("builds from tier content when a composer re-rolls a tiers section", () => {
        render(
            <MarketingPricing
                variant="builder"
                period=""
                tiers={[
                    {
                        name: "Sangeet",
                        monthly: 550,
                        yearlyPerMonth: 550,
                        description: "Party look",
                        features: [],
                    },
                    {
                        name: "Reception",
                        monthly: 650,
                        yearlyPerMonth: 650,
                        description: "Glam",
                        features: [],
                    },
                ]}
            />,
        )
        expect(screen.getAllByRole("checkbox")).toHaveLength(2)
        expect(screen.getByRole("status").textContent).toContain("$1,200")
    })
})

describe("hero panel-collage panels", () => {
    it("sets the captioned panel row under the centered copy in place of the product frame", () => {
        const { container } = render(
            <MarketingHero
                variant="panel-collage"
                headline="Studio Noor"
                subheadline="Every event, every look."
                media={photo("wedding")}
                panels={[
                    { label: "Mehndi", media: photo("mehndi") },
                    { label: "Sangeet", media: photo("sangeet") },
                    { label: "Wedding", media: photo("wedding") },
                    { label: "Reception", media: photo("reception") },
                ]}
            />,
        )
        expect(screen.getByRole("heading", { name: "Studio Noor" })).toBeTruthy()
        const items = container.querySelectorAll("ul > li")
        expect(items).toHaveLength(4)
        expect([...items].map((item) => item.textContent)).toEqual([
            "Mehndi",
            "Sangeet",
            "Wedding",
            "Reception",
        ])
        expect(container.querySelectorAll("img")).toHaveLength(4)
    })

    it("keeps the framed product when there are no panels", () => {
        const { container } = render(
            <MarketingHero variant="panel-collage" headline="Launch" media={photo("wedding")} panels={[]} />,
        )
        expect(container.querySelector("ul")).toBeNull()
        expect(container.querySelectorAll("img").length).toBeGreaterThan(0)
    })
})
