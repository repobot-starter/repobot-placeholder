import { MarketingGallery, MarketingHero, marketingPresetDefinitions } from "@ui"
import { cleanup, render, screen, within } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"
import galaDiscoCatalog from "../../../../../packs/gala-disco/catalog.json"
import vowsPhotoboothCatalog from "../../../../../packs/vows-photobooth/catalog.json"
import { PACK_REGISTERS } from "../../../src/View/Site/packRegisters.gen"

/**
 * The party set: hero `invitation` (a pasted-up photo wall of booth
 * strips and snapshots, or one portrait, beside a line-split headline and
 * a particulars strip) and gallery `photo-strip` (the album as booth
 * strips), worn by the `photobooth` (vows-photobooth) and `disco`
 * (gala-disco) registers — the vows and gala packs' derived templates.
 */

const photo = (name: string, width = 1600, height = 1200) => ({
    kind: "image" as const,
    src: `/vows/${name}.webp`,
    alt: name,
    width,
    height,
})

afterEach(() => {
    cleanup()
})

describe("party registers", () => {
    const packs = [
        { key: "vows-photobooth" as const, catalog: vowsPhotoboothCatalog, preset: "photobooth" as const },
        { key: "gala-disco" as const, catalog: galaDiscoCatalog, preset: "disco" as const },
    ]

    it.each(packs)("$key declares $preset end to end, its brand equal to the preset's accents", (pack) => {
        expect(pack.catalog.landing.style.preset).toBe(pack.preset)
        expect(PACK_REGISTERS[pack.key]).toBe(pack.preset)
        const definition = marketingPresetDefinitions[pack.preset]
        expect(pack.catalog.theme.brand.primary).toBe(definition.modes.light.palette.accent)
        expect(pack.catalog.theme.brand.primaryDark).toBe(definition.modes.dark.palette.accent)
    })

    it("opens the disco party in its native dark appearance", () => {
        expect(marketingPresetDefinitions.disco.nativeMode).toBe("dark")
        expect(galaDiscoCatalog.theme.mode).toBe("dark")
    })
})

describe("hero invitation", () => {
    it("pastes up the wall: strips as stacked frames, prints alone, stickers taped on", () => {
        const { container } = render(
            <MarketingHero
                variant="invitation"
                badge="261 days to go"
                headline={"Okay,\nwe're\ndoing it."}
                subheadline="Join us."
                primaryCta={{ label: "RSVP", href: "/rsvp" }}
                secondaryCta={{ label: "Details, maps & all that jazz", href: "/schedule" }}
                credit="Saturday, June 12 · Chicago · RSVP by May 1"
                snapshots={[
                    { frames: [photo("a1", 640, 480), photo("a2", 640, 480)] },
                    { media: photo("kitchen") },
                    { frames: [photo("b1", 640, 480), photo("b2", 640, 480)], sticker: "Picture us." },
                    { media: photo("platform", 1600, 2133) },
                    { media: photo("roadtrip", 1600, 2133), sticker: "Best people." },
                ]}
            />,
        )
        const heading = screen.getByRole("heading", { level: 1 })
        expect(heading.children).toHaveLength(3)
        expect(heading.textContent).toBe("Okay,we'redoing it.")
        expect(screen.getByText("261 days to go")).toBeTruthy()

        const wall = container.querySelector("[data-pieces]")
        expect(wall?.getAttribute("data-pieces")).toBe("5")
        const pieces = within(wall as HTMLElement).getAllByRole("figure")
        expect(pieces).toHaveLength(5)
        expect(within(pieces[0]).getAllByRole("img")).toHaveLength(2)
        expect(within(pieces[1]).getAllByRole("img")).toHaveLength(1)
        expect(within(pieces[2]).getByText("Picture us.")).toBeTruthy()
        expect(within(pieces[4]).getByText("Best people.")).toBeTruthy()

        expect(screen.getByText("Saturday, June 12")).toBeTruthy()
        expect(screen.getByText("Chicago")).toBeTruthy()
        expect(screen.getByText("RSVP by May 1")).toBeTruthy()
        expect(screen.getByRole("link", { name: /all that jazz/i }).getAttribute("href")).toBe("/schedule")
        expect(screen.getByRole("link", { name: "RSVP" }).getAttribute("href")).toBe("/rsvp")
    })

    it("hangs one portrait when there is no wall, with the readout and the seal", () => {
        const { container } = render(
            <MarketingHero
                variant="invitation"
                readout={{ value: "Vivienne", note: "turns" }}
                headline={"Sixty\nlooks good on me."}
                primaryCta={{ label: "RSVP", href: "/rsvp" }}
                seal={"Dancing\ntill late"}
                credit="Saturday, October 16 · The Starlight Room, Miami"
                media={photo("hero", 2400, 1350)}
            />,
        )
        expect(container.querySelector("[data-pieces]")).toBeNull()
        expect(screen.getByText("Vivienne")).toBeTruthy()
        expect(screen.getByText("turns")).toBeTruthy()
        expect(screen.getByRole("heading", { level: 1 }).children).toHaveLength(2)
        expect(screen.getByText("Dancing")).toBeTruthy()
        expect(screen.getByText("till late")).toBeTruthy()
        expect(screen.getByRole("img", { name: "hero" })).toBeTruthy()
        expect(screen.getByText("The Starlight Room, Miami")).toBeTruthy()
    })
})

describe("gallery photo-strip", () => {
    const items = (count: number) =>
        Array.from({ length: count }, (_, index) => ({
            media: photo(`frame-${index}`, 640, 480),
            note: index % 4 === 0 ? `Strip ${index / 4 + 1}` : undefined,
            caption: index % 4 === 0 ? `Caption ${index / 4 + 1}` : undefined,
        }))

    it("prints four frames a strip, the label and caption riding each strip's first frame", () => {
        render(<MarketingGallery variant="photo-strip" title="Booth" items={items(12)} />)
        const strips = screen.getAllByRole("figure")
        expect(strips).toHaveLength(3)
        for (const [index, strip] of strips.entries()) {
            expect(within(strip).getAllByRole("img")).toHaveLength(4)
            expect(within(strip).getByText(`Strip ${index + 1}`)).toBeTruthy()
            expect(within(strip).getByText(`Caption ${index + 1}`)).toBeTruthy()
        }
    })

    it("never prints a lone frame: a trailing single joins the strip before it", () => {
        render(<MarketingGallery variant="photo-strip" title="Booth" items={items(5)} />)
        const strips = screen.getAllByRole("figure")
        expect(strips).toHaveLength(1)
        expect(within(strips[0]).getAllByRole("img")).toHaveLength(5)
    })
})
