import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import midcenturyCatalog from "../../../../../packs/interiors-midcentury/catalog.json"

// The catalog home ships in the interiors-midcentury remix: its seed is
// composed over content.ts, so the builders run on that seed here in
// every tree (the base studio's own content keeps the gallery home).
vi.mock(
    "../../../src/View/Interiors/content",
    () => import("../../../src/View/Interiors/midcenturyRemix.content"),
)
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    caseStudies,
    faq,
    fees,
    home,
    landingCopy,
    pieces,
    projects,
    type SiteImage,
} from "../../../src/View/Interiors/content"
import { homeLanding, servicesLanding } from "../../../src/View/Interiors/interiorsLanding"

/**
 * The `catalog` home (the interiors-midcentury remix's studio): before/after
 * case files joined to the featured projects by slug, a numbered catalog of
 * pieces, and an honest fee board — each from content, each in the remix's
 * pinned section order.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

function catalogImages(): { label: string; image: SiteImage }[] {
    return [
        ...caseStudies.befores.map((entry) => ({ label: `before ${entry.slug}`, image: entry.image })),
        ...pieces.items.map((piece) => ({ label: `piece ${piece.number}`, image: piece.image })),
    ]
}

describe("interiors catalog home", () => {
    it("ships the catalog layout", () => {
        expect(home.layout).toBe("catalog")
        expect(landingCopy.heroAccent).toBe("full-stop")
        expect(home.headline).toMatch(/[.!?]$/)
    })

    it("pairs a before photograph with every featured project, and only those", () => {
        const featured = projects
            .filter((project) => project.featured === true)
            .map((project) => project.slug)
        expect(caseStudies.befores.map((entry) => entry.slug).sort()).toEqual([...featured].sort())
    })

    it("numbers every piece uniquely and prices it", () => {
        const numbers = pieces.items.map((piece) => piece.number)
        expect(pieces.items.length).toBeGreaterThanOrEqual(3)
        expect(new Set(numbers).size).toBe(numbers.length)
        for (const piece of pieces.items) {
            expect(piece.number, piece.name).toMatch(/^No\. \d+$/)
            expect(piece.meta, piece.name).toMatch(/\$\d/)
        }
    })

    it("states a flat design fee and an hourly sourcing rate", () => {
        const prices = fees.groups.flatMap((group) => group.items.map((item) => item.price))
        expect(prices.length).toBeGreaterThan(0)
        for (const price of prices) expect(price).toMatch(/^\$\d/)
        expect(prices.some((price) => /\/\s*hr$/.test(price))).toBe(true)
    })

    it("answers the midcentury questions: remote, vintage vs reproduction, timelines, historic review", () => {
        const questions = faq.map((entry) => entry.question.toLowerCase()).join(" | ")
        expect(questions).toMatch(/remote/)
        expect(questions).toMatch(/reproduction/)
        expect(questions).toMatch(/how long/)
        expect(questions).toMatch(/hoa|historic/)
    })

    it("gives every case-file and catalog image dimensions, alt text, and files on disk", () => {
        for (const { label, image } of catalogImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.width, `${label} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${label} needs a height`).toBeGreaterThan(0)
            expect(
                image.srcSet.map((entry) => entry.src),
                `${label} src must be a srcSet variant`,
            ).toContain(image.src)
            for (const entry of image.srcSet) {
                expect(
                    publicAssetPresent(path.join(PUBLIC_DIR, entry.src)),
                    `${label}: missing ${entry.src}`,
                ).toBe(true)
            }
        }
    })

    it("composes the home in the catalog's section order", () => {
        const sections = homeLanding("").sections
        expect(sections.map((section) => section.id)).toEqual(
            midcenturyCatalog.landing.pages.home.sections.map((section) => section.id),
        )
        const caseFiles = sections.find((section) => section.id === "case-files")
        expect(caseFiles?.type).toBe("gallery")
        const items = (caseFiles?.content as { items: { beforeMedia?: unknown }[] }).items
        expect(items).toHaveLength(caseStudies.befores.length)
        for (const item of items) expect(item.beforeMedia).toBeDefined()
        const pieceSection = sections.find((section) => section.id === "pieces")
        const eyebrows = (pieceSection?.content as { items: { eyebrow: string }[] }).items.map(
            (item) => item.eyebrow,
        )
        expect(eyebrows).toEqual(pieces.items.map((piece) => piece.number))
    })

    it("puts the fee board on the services page", () => {
        const ids = servicesLanding("").sections.map((section) => section.id)
        expect(ids).toEqual(midcenturyCatalog.landing.pages.offerings.sections.map((section) => section.id))
        expect(ids).toContain("fees")
    })
})
