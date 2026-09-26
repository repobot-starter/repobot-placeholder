import { MarketingGallery, type MarketingGalleryItem } from "@ui"
import { cleanup, render } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * A `sequence` gallery with an `overlay-*` `captionStack` is the captioned
 * stack: every frame at the first photograph's aspect ratio, edge to edge,
 * each caption inside its figure (set over the photograph's foot, not under
 * it), stamped for the content editor like the band modes. A
 * plain `sequence` keeps each photo's own shape.
 */

const photo = (name: string, width: number, height: number, caption?: string): MarketingGalleryItem => ({
    media: {
        kind: "image",
        src: `/demo/${name}-1600w.webp`,
        alt: name,
        width,
        height,
        srcSet: [{ src: `/demo/${name}-1600w.webp`, width: 1600 }],
    },
    ...(caption !== undefined ? { caption } : {}),
})

const items = [
    photo("table", 1600, 1200, "Giulia & Tom · Masseria, Puglia"),
    photo("boat", 1200, 1600, "Chiara & Luca · Lake Como"),
    photo("steps", 1600, 900),
]

/** A frame's inline aspect ratio as a number (the DOM may serialize "4 / 3" or "1.33 / 1"). */
function frameRatio(figure: Element): number {
    const [width = "0", height = "1"] = (figure.firstElementChild as HTMLElement).style.aspectRatio.split("/")
    return Number(width.trim()) / Number(height.trim())
}

afterEach(cleanup)

describe("MarketingGallery sequence overlay captionStack", () => {
    it("renders every frame at the first photograph's ratio, captions inside the figure", () => {
        const { container } = render(
            <MarketingGallery variant="sequence" items={items} captionStack="overlay-start" />,
        )
        const figures = [...container.querySelectorAll("figure")]
        expect(figures).toHaveLength(3)
        for (const figure of figures) {
            expect(frameRatio(figure)).toBeCloseTo(1600 / 1200, 6)
            const frame = figure.firstElementChild as HTMLElement
            expect(frame.style.width).toBe("100%")
            expect(frame.style.maxHeight).toBe("92vh")
        }
        expect(figures[0]?.querySelector("figcaption")?.textContent).toBe("Giulia & Tom · Masseria, Puglia")
        expect(figures[1]?.querySelector("figcaption")?.textContent).toBe("Chiara & Luca · Lake Como")
        figures.slice(0, 2).forEach((figure, index) => {
            const caption = figure.querySelector("figcaption")
            expect(caption?.getAttribute("data-rb-text-field")).toBe("caption")
            expect(caption?.getAttribute("data-rb-text-list")).toBe("items")
            expect(caption?.getAttribute("data-rb-text-index")).toBe(String(index))
        })
        expect(figures[2]?.querySelector("figcaption")).toBeNull()
    })

    it("centers the caption class apart from the start-set one", () => {
        const start = render(
            <MarketingGallery variant="sequence" items={items} captionStack="overlay-start" />,
        )
        const startClass = start.container.querySelector("figcaption")?.className ?? ""
        cleanup()
        const center = render(
            <MarketingGallery variant="sequence" items={items} captionStack="overlay-center" />,
        )
        const centerClass = center.container.querySelector("figcaption")?.className ?? ""
        expect(centerClass).not.toBe(startClass)
        expect(centerClass.startsWith(startClass)).toBe(true)
    })

    it("sets the overlay caption apart from the band's", () => {
        const captionClass = (stack: "overlay-start" | "band-start"): string => {
            const { container } = render(
                <MarketingGallery variant="sequence" items={items} captionStack={stack} />,
            )
            const className = container.querySelector("figcaption")?.className ?? ""
            cleanup()
            return className
        }
        expect(captionClass("overlay-start")).not.toBe(captionClass("band-start"))
    })

    it("sets a stack caption's detail as its own stamped line under the caption", () => {
        const detailed: MarketingGalleryItem[] = [
            { ...items[0]!, detail: "Chuckanut Drive · $4,850,000 · New this week" },
            items[1]!,
        ]
        const { container } = render(
            <MarketingGallery variant="sequence" items={detailed} captionStack="overlay-start" />,
        )
        const [first, second] = [...container.querySelectorAll("figcaption")]
        const lines = [...(first?.children ?? [])]
        expect(lines.map((line) => line.textContent)).toEqual([
            "Giulia & Tom · Masseria, Puglia",
            "Chuckanut Drive · $4,850,000 · New this week",
        ])
        expect(lines.map((line) => line.getAttribute("data-rb-text-field"))).toEqual(["caption", "detail"])
        expect(lines.map((line) => line.getAttribute("data-rb-text-index"))).toEqual(["0", "0"])
        expect(first?.hasAttribute("data-rb-text-field")).toBe(false)
        // Without a detail the caption keeps its single stamped figcaption.
        expect(second?.children).toHaveLength(0)
        expect(second?.getAttribute("data-rb-text-field")).toBe("caption")
    })

    it("ignores a detail outside the captioned stack", () => {
        const { container } = render(
            <MarketingGallery variant="sequence" items={[{ ...items[0]!, detail: "Not shown" }]} />,
        )
        expect(container.textContent).not.toContain("Not shown")
    })

    it("leaves a plain sequence on each photograph's own shape", () => {
        const { container } = render(<MarketingGallery variant="sequence" items={items} />)
        const ratios = [...container.querySelectorAll("figure")].map(frameRatio)
        expect(ratios.map((ratio) => ratio.toFixed(4))).toEqual(
            [1600 / 1200, 1200 / 1600, 1600 / 900].map((ratio) => ratio.toFixed(4)),
        )
    })
})
