import { MarketingCtaBanner, MarketingGallery, marketingPresetDefinitions } from "@ui"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"
import kaitoCatalog from "../../../../../packs/photography-kaito/catalog.json"
import theoCatalog from "../../../../../packs/photography-music-theo/catalog.json"
import wrenCatalog from "../../../../../packs/photography-wren/catalog.json"
import { PACK_REGISTERS } from "../../../src/View/Site/packRegisters.gen"

/**
 * The portfolio-stack set: gallery `sequence` with `captionStack` `band-*`
 * (every frame one size, a caption band under each), gallery `covers` (the record
 * wall), and cta-banner `colophon` (one line and a text link), worn by the
 * `vitrine` (photography-wren), `seamless` (photography-kaito) and `liner`
 * (photography-music-theo) registers.
 */

const photo = (name: string, width = 1600, height = 1200) => ({
    kind: "image" as const,
    src: `/stack/${name}.webp`,
    alt: name,
    width,
    height,
})

afterEach(() => {
    cleanup()
})

/** The element's text stamp as a dotted content path ("items.0.caption"), or null. */
function stampOf(element: Element | null): string | null {
    const field = element?.getAttribute("data-rb-text-field") ?? null
    if (field === null) return null
    const list = element?.getAttribute("data-rb-text-list")
    const index = element?.getAttribute("data-rb-text-index")
    return list != null && index != null ? `${list}.${index}.${field}` : field
}

describe("portfolio-stack registers", () => {
    const packs = [
        { key: "photography-wren" as const, catalog: wrenCatalog, preset: "vitrine" as const },
        { key: "photography-kaito" as const, catalog: kaitoCatalog, preset: "seamless" as const },
        { key: "photography-music-theo" as const, catalog: theoCatalog, preset: "liner" as const },
    ]

    it.each(packs)("$key declares $preset end to end, its brand equal to the preset's accents", (pack) => {
        expect(pack.catalog.landing.style.preset).toBe(pack.preset)
        expect(PACK_REGISTERS[pack.key]).toBe(pack.preset)
        const definition = marketingPresetDefinitions[pack.preset]
        expect(pack.catalog.theme.brand.primary).toBe(definition.modes.light.palette.accent)
        expect(pack.catalog.theme.brand.primaryDark).toBe(definition.modes.dark.palette.accent)
        expect(pack.catalog.theme.mode).toBe(definition.nativeMode)
    })
})

describe("gallery sequence with a band captionStack", () => {
    const items = [
        { media: photo("a"), caption: "Adaeze, novelist — Echo Park" },
        // A remixed or uploaded photo of another shape must not break the rhythm.
        { media: photo("b", 1024, 1536), caption: "Mr. Tanaka, tailor — Little Tokyo" },
        { media: photo("c", 2400, 1000), caption: "The Reyes sisters — Boyle Heights" },
    ]

    it("frames every photograph at the first one's shape, full width, whatever its own", () => {
        const { container } = render(
            <MarketingGallery variant="sequence" items={items} captionStack="band-center" />,
        )
        const figures = container.querySelectorAll("figure")
        expect(figures).toHaveLength(3)
        for (const figure of figures) {
            const frame = figure.firstElementChild as HTMLElement
            expect(frame.style.aspectRatio).toBe(`${1600 / 1200} / 1`)
            expect(frame.style.width).toBe("100%")
            expect(frame.style.maxHeight).toBe("92vh")
        }
    })

    it("sets each caption on its band, stamped for the content editor", () => {
        const { container } = render(
            <MarketingGallery variant="sequence" items={items} captionStack="band-start" />,
        )
        const captions = [...container.querySelectorAll("figcaption")]
        expect(captions.map((caption) => caption.textContent)).toEqual(items.map((item) => item.caption))
        captions.forEach((caption, index) => {
            expect(stampOf(caption)).toBe(`items.${index}.caption`)
        })
    })

    it("leaves a sequence without captionStack on its photos' own shapes", () => {
        const { container } = render(<MarketingGallery variant="sequence" items={items} fullBleed />)
        const ratios = [...container.querySelectorAll("figure")].map(
            (figure) => (figure.firstElementChild as HTMLElement).style.aspectRatio,
        )
        expect(new Set(ratios).size).toBe(3)
        expect(stampOf(container.querySelector("figcaption"))).toBeNull()
    })
})

describe("gallery covers", () => {
    it("hangs square sleeves with the artist over the album title, both editable", () => {
        const { container } = render(
            <MarketingGallery
                variant="covers"
                items={[
                    { media: photo("a", 1024, 1024), caption: "The Harpeth Line", note: "Low Water" },
                    { media: photo("b", 1024, 1024), caption: "Wes Tolliver", note: "Cumberland" },
                ]}
            />,
        )
        expect(stampOf(screen.getByText("The Harpeth Line"))).toBe("items.0.caption")
        expect(stampOf(screen.getByText("Cumberland"))).toBe("items.1.note")
        expect(container.querySelectorAll("figure")).toHaveLength(2)
    })
})

describe("cta-banner colophon", () => {
    it("closes on one line, its second line, and a text link — never a button", () => {
        render(
            <MarketingCtaBanner
                variant="colophon"
                title="Ninety minutes, three looks, retouched selects in two days."
                body="$650."
                cta={{ label: "Book a session", href: "/book" }}
                align="start"
            />,
        )
        expect(screen.getByRole("heading", { name: /Ninety minutes/ })).toBeTruthy()
        expect(stampOf(screen.getByText("$650."))).toBe("body")
        const link = screen.getByRole("link", { name: "Book a session" })
        expect(link.getAttribute("href")).toBe("/book")
        expect(stampOf(link)).toBe("cta.label")
        expect(screen.queryByRole("button")).toBeNull()
    })
})
