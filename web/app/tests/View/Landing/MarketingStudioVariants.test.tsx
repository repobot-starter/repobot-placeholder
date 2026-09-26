import { MarketingGallery, MarketingSteps, type MarketingGalleryItem } from "@ui"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * The studio vocabulary: a before/after pair's own chip words (a treatment
 * timeline's "Month 0" / "Month 14") and a rail step's pictogram in place
 * of its dot. Both are optional fields on existing variants, so a section
 * without them must render exactly as before.
 */

function pair(extra: Partial<MarketingGalleryItem> = {}): MarketingGalleryItem {
    return {
        media: {
            kind: "image",
            src: "/studio/smile-after.webp",
            alt: "Smile after",
            width: 1600,
            height: 1200,
        },
        beforeMedia: {
            kind: "image",
            src: "/studio/smile-before.webp",
            alt: "Smile before",
            width: 1600,
            height: 1200,
        },
        caption: "Clear aligners · Age 34",
        ...extra,
    }
}

describe("before/after chip labels", () => {
    afterEach(() => cleanup())

    it("keeps Before / After when a pair names no labels", () => {
        const { container } = render(<MarketingGallery variant="before-after" items={[pair(), pair()]} />)
        expect(container.textContent).toContain("Before")
        expect(container.textContent).toContain("After")
    })

    it("prints the pair's own words on the chips and in the lightbox", () => {
        const { container } = render(
            <MarketingGallery
                variant="before-after"
                lightbox
                items={[pair({ beforeLabel: "Month 0", afterLabel: "Month 14" }), pair()]}
            />,
        )
        const chips = [...container.querySelectorAll("figure")][0]?.textContent ?? ""
        expect(chips).toContain("Month 0")
        expect(chips).toContain("Month 14")
        expect(chips).not.toContain("Before")
        fireEvent.click(screen.getAllByRole("button", { name: /full screen/ })[0] as HTMLElement)
        expect(document.body.textContent).toContain("Month 14 — Clear aligners · Age 34")
    })
})

describe("rail step icons", () => {
    afterEach(() => cleanup())

    const steps = [
        { title: "Free consult", description: "No charge.", icon: "users" as const },
        { title: "3D scan", description: "Two minutes.", icon: "layers" as const },
        { title: "Retainers", description: "Included.", label: "END" },
    ]

    it("sets a named icon on the line in place of the dot", () => {
        const { container } = render(<MarketingSteps variant="horizontal-rail" steps={steps} />)
        const items = [...container.querySelectorAll("li")]
        expect(items).toHaveLength(3)
        expect(items[0]?.querySelector("svg")).not.toBeNull()
        expect(items[1]?.querySelector("svg")).not.toBeNull()
        // A step without an icon keeps its dot and its label.
        expect(items[2]?.querySelector("svg")).toBeNull()
        expect(items[2]?.textContent).toContain("END")
    })

    it("ignores an icon name outside the vocabulary", () => {
        const { container } = render(
            <MarketingSteps
                variant="horizontal-rail"
                steps={[{ title: "Odd", description: "x", icon: "not-an-icon" as never }]}
            />,
        )
        expect(container.querySelector("li svg")).toBeNull()
    })
})
