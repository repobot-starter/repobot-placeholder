import { readFileSync } from "node:fs"
import path from "node:path"
import { LANDING_PAIRED_MEDIA_VARIANTS, MarketingGallery, type MarketingGalleryItem } from "@ui"
import { cleanup, fireEvent, render } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * The before/after comparison must keep its drag through everything a
 * remix press does to the tree: document edits rebuild every section's
 * props (fresh object identities each merge), theme hot-updates re-render
 * the page, and a variant roll can unmount the comparison and a later
 * roll bring it back. The divider rides an invisible full-frame range
 * input whose value paints `--mk-reveal` on the frame — after any number
 * of re-renders, moving the input must still move the paint.
 */

function pair(after: string, before: string, caption: string): MarketingGalleryItem {
    return {
        media: { kind: "image", src: after, alt: `${caption} after`, width: 1600, height: 1067 },
        beforeMedia: { kind: "image", src: before, alt: `${caption} before`, width: 1600, height: 1067 },
        caption,
    }
}

/** Fresh item identities every call — what the document merge produces. */
function items(): MarketingGalleryItem[] {
    return [
        pair("/services/kitchen-after.webp", "/services/kitchen-before.webp", "Kitchen"),
        pair("/services/deck-after.webp", "/services/deck-before.webp", "Deck"),
    ]
}

function firstRange(container: HTMLElement): HTMLInputElement {
    const range = container.querySelector('input[type="range"]')
    expect(range).not.toBeNull()
    return range as HTMLInputElement
}

/** Drive the range (the drag's DOM effect) and read back the painted reveal. */
function dragTo(container: HTMLElement, value: number): string {
    const range = firstRange(container)
    fireEvent.change(range, { target: { value: String(value) } })
    const frame = range.parentElement as HTMLElement
    expect(range.value).toBe(String(value))
    return frame.style.getPropertyValue("--mk-reveal")
}

describe("MarketingGallery before/after drag across remix re-renders", () => {
    afterEach(() => {
        cleanup()
    })

    it("moves the divider on first render", () => {
        const { container } = render(<MarketingGallery variant="before-after" items={items()} lightbox />)
        expect(dragTo(container, 75)).toBe("75%")
    })

    it("keeps dragging after props rebuild (a document edit re-render)", () => {
        const { container, rerender } = render(
            <MarketingGallery variant="before-after" items={items()} lightbox />,
        )
        expect(dragTo(container, 75)).toBe("75%")
        // A theme hot-update / text override re-renders with rebuilt props:
        // every item is a fresh object, captions included.
        rerender(<MarketingGallery variant="before-after" items={items()} lightbox />)
        expect(dragTo(container, 30)).toBe("30%")
        // And again — the widget must survive any number of edits.
        rerender(<MarketingGallery variant="before-after" items={items()} lightbox />)
        expect(dragTo(container, 60)).toBe("60%")
    })

    it("keeps dragging after the variant rolls away and back", () => {
        const { container, rerender } = render(
            <MarketingGallery variant="before-after" items={items()} lightbox />,
        )
        expect(dragTo(container, 80)).toBe("80%")
        // The layout chooser (a user's explicit pick — remix itself must
        // never do this, see the pairing tests below) moves the gallery to
        // another layout: the comparison unmounts (no range input in a
        // masonry grid) ...
        rerender(<MarketingGallery variant="masonry" items={items()} lightbox />)
        expect(container.querySelector('input[type="range"]')).toBeNull()
        // ... and a later pick moves it back: fresh comparison, live drag.
        rerender(<MarketingGallery variant="before-after" items={items()} lightbox />)
        expect(dragTo(container, 20)).toBe("20%")
    })

    it("keeps dragging after item reorders and media replacement", () => {
        const { container, rerender } = render(
            <MarketingGallery variant="before-after" items={items()} lightbox />,
        )
        // The preview editor's drag-an-item gesture reverses the list; a
        // Replace swaps an after frame. The pairing (and drag) must hold.
        const reordered = items().reverse()
        reordered[0] = {
            ...reordered[0],
            media: { kind: "image", src: "/brand/replaced.jpg", alt: "" },
        } as MarketingGalleryItem
        rerender(<MarketingGallery variant="before-after" items={reordered} lightbox />)
        expect(container.querySelectorAll('input[type="range"]')).toHaveLength(2)
        expect(dragTo(container, 45)).toBe("45%")
    })
})

/**
 * The dice path's kernel half: a before/after gallery's content is
 * semantically PAIRED (before frame + after frame + drag affordance), so
 * composers must never re-roll it onto a layout that drops the pairing —
 * the owner's "two flat cards where the drag used to be" remix. The roll
 * itself happens in the platform's remix/compose engines; the kernel's
 * contract is this vocabulary rule and its publication in the design
 * manifest, which those engines consume (and mirror, under a drift test).
 */
describe("before/after pairing rule for composers (the dice path)", () => {
    it("declares before-after paired in the landing vocabulary", () => {
        expect(LANDING_PAIRED_MEDIA_VARIANTS.gallery).toEqual(["before-after"])
    })

    it("publishes the pairing in the design manifest", () => {
        const manifest = JSON.parse(
            readFileSync(path.resolve(__dirname, "../../../../../docs/design-manifest.json"), "utf8"),
        ) as {
            landing: { sections: Record<string, { pairedMediaVariants?: string[] }> }
        }
        expect(manifest.landing.sections.gallery.pairedMediaVariants).toEqual(["before-after"])
    })
})
