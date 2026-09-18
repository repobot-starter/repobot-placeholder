import { MarketingGallery, type MarketingGalleryItem, type MarketingGalleryVariant } from "@ui"
import { cleanup, render } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * A gallery with exactly one item must render a full-content-width frame
 * (the `sequence` presentation) under EVERY variant. Composed landing
 * documents only carry `{id, type, variant}`, so a composer — remix, an
 * agent, a hand edit — can write any multi-photo variant over single-photo
 * content; the layouts themselves have to degrade gracefully. Observed
 * defect: `justified`'s end spacer (flex-grow 999999) devoured the row and
 * orphaned the band pack's one-photo marquee at ~300px.
 */

const photo: MarketingGalleryItem = {
    media: {
        kind: "image",
        src: "/photography/stage.webp",
        alt: "The band on stage",
        width: 1600,
        height: 1067,
    },
}

const secondPhoto: MarketingGalleryItem = {
    media: {
        kind: "image",
        src: "/photography/crowd.webp",
        alt: "The crowd",
        width: 1600,
        height: 1067,
    },
}

const MULTI_PHOTO_VARIANTS: readonly MarketingGalleryVariant[] = [
    "uniform",
    "masonry",
    "justified",
    "filmstrip",
    "scrapbook",
    "before-after",
]

/**
 * The justified layout's row-end spacer (an aria-hidden div; its flex-grow
 * lives in a class, so structure is the jsdom-visible signal).
 */
function spacerCount(container: HTMLElement): number {
    return container.querySelectorAll('div[aria-hidden="true"]').length
}

describe("MarketingGallery with a single item", () => {
    afterEach(() => {
        cleanup()
    })

    for (const variant of MULTI_PHOTO_VARIANTS) {
        it(`renders the sequence presentation under ${variant}, not a degenerate cell`, () => {
            // The fallback IS the sequence presentation: markup-identical
            // to the same item rendered under the single-safe variant.
            const { container } = render(<MarketingGallery variant={variant} items={[photo]} />)
            const sequence = render(<MarketingGallery variant="sequence" items={[photo]} />)
            expect(container.innerHTML).toBe(sequence.container.innerHTML)
            expect(container.querySelectorAll("figure").length).toBe(1)
            expect(spacerCount(container)).toBe(0)
        })
    }

    it("renders one full-width frame under sequence (the native single layout)", () => {
        const { container } = render(<MarketingGallery variant="sequence" items={[photo]} />)
        const figures = container.querySelectorAll("figure")
        expect(figures.length).toBe(1)
        // The frame carries the photo's own shape inline — the sequence
        // treatment, not a row cell's flex math (that rides the figure).
        const frame = figures[0]?.firstElementChild as HTMLElement
        expect(frame.style.aspectRatio).not.toBe("")
        expect((figures[0] as HTMLElement).style.flexGrow).toBe("")
        expect(spacerCount(container)).toBe(0)
    })

    it("spans the bled track when fullBleed is set", () => {
        const { container } = render(
            <MarketingGallery variant="justified" items={[photo]} fullBleed lightbox />,
        )
        const frame = container.querySelector("figure")?.firstElementChild as HTMLElement
        expect(frame.style.width).toBe("100%")
        expect(frame.style.maxHeight).toBe("92vh")
    })

    it("keeps a complete before/after pair as a comparison — two images is not degenerate", () => {
        const { container } = render(
            <MarketingGallery
                variant="before-after"
                items={[{ ...photo, beforeMedia: secondPhoto.media }]}
            />,
        )
        expect(container.querySelector('input[type="range"]')).not.toBeNull()
    })

    it("keeps the justified proofing layout when selection mode is on", () => {
        const { container } = render(
            <MarketingGallery
                variant="justified"
                items={[photo]}
                selectedIndexes={new Set<number>()}
                onToggleSelect={() => undefined}
            />,
        )
        // Selection mode is the client-proofing surface, not a composed
        // document: the select toggle must survive, so the native layout
        // (spacer included) stays.
        expect(container.querySelector("button[aria-pressed]")).not.toBeNull()
        expect(spacerCount(container)).toBe(1)
        // And the figure carries justified's flex math, not a sequence frame.
        expect((container.querySelector("figure") as HTMLElement).style.flexGrow).not.toBe("")
    })

    it("leaves multi-item justified rows untouched (spacer and flex math intact)", () => {
        const { container } = render(<MarketingGallery variant="justified" items={[photo, secondPhoto]} />)
        const figures = [...container.querySelectorAll("figure")]
        expect(figures.length).toBe(2)
        for (const figure of figures) {
            expect((figure as HTMLElement).style.flexGrow).not.toBe("")
        }
        expect(spacerCount(container)).toBe(1)
    })
})
