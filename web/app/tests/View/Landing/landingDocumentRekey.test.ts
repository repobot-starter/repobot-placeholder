import type { LandingConfig } from "@ui"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import { applyLandingDocument, applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * Re-key survival: a remix/reimagine roll (or a template re-bake over an
 * older document) can rewrite a section entry's id. The content the entry
 * meant still stands in code, so the merge binds the entry to the UNIQUE
 * unclaimed code section of its declared type instead of dropping the
 * binding. Observed defect: the services packs' before/after gallery
 * (id "transformations", type "gallery") lost its real photo pairs to
 * sectionFromEntry's placeholder — no beforeMedia, so the comparison
 * divider and its drag vanished while the section visibly kept standing.
 *
 * The fallback is deliberately conservative: id bindings always land
 * first, and zero or several candidates of the type keep the old behavior
 * (root merge skips the entry; page merge scaffolds a placeholder — the
 * layout editor's "add a section" gesture must never steal a sibling's
 * content).
 */

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

/** The root-surface fixture: three sections, ids defaulting sensibly. */
function fixture(): LandingConfig {
    return {
        style: { preset: "editorial" },
        sections: [
            { id: "hero", type: "hero", variant: "statement", content: { headline: "Hello" } },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: { items: [{ question: "Q", answer: "A" }] },
            },
            {
                type: "lead-form",
                variant: "inline-email",
                content: { cta: "Join", confirmation: "Done" },
            },
        ],
    }
}

describe("applyLandingDocument with re-keyed entries", () => {
    it("binds a re-keyed entry to the unique unclaimed section of its type", () => {
        const merged = applyLandingDocument(fixture(), {
            sections: [
                { id: "hero-rolled", type: "hero", variant: "centered-stack" },
                { id: "faq", type: "faq" },
            ],
        })
        expect(merged.sections.map((section) => [section.type, section.variant])).toEqual([
            ["hero", "centered-stack"],
            ["faq", "accordion"],
            ["lead-form", "inline-email"],
        ])
        // The re-keyed entry's content is the CODE section's, untouched.
        expect(merged.sections[0]?.content).toEqual({ headline: "Hello" })
        expect(warn).toHaveBeenCalled()
    })

    it("never lets a re-keyed entry steal a section whose own entry binds it", () => {
        // Id bindings all land before any type fallback, regardless of
        // document order: the re-keyed entry finds "hero" claimed and drops.
        const merged = applyLandingDocument(fixture(), {
            sections: [
                { id: "hero-rolled", type: "hero", variant: "centered-stack" },
                { id: "hero", type: "hero", variant: "statement" },
            ],
        })
        expect(merged.sections.filter((section) => section.type === "hero")).toHaveLength(1)
        expect(merged.sections[0]?.variant).toBe("statement")
    })

    it("keeps the skip when a re-keyed type is ambiguous across sections", () => {
        const config = fixture()
        config.sections.push({
            id: "faq-2",
            type: "faq",
            variant: "accordion",
            content: { items: [{ question: "Q2", answer: "A2" }] },
        })
        const merged = applyLandingDocument(config, {
            sections: [{ id: "faq-rolled", type: "faq" }],
        })
        // Two unclaimed faq sections: binding either could cross-wire their
        // overrides, so the entry drops and both render from code.
        expect(merged.sections.filter((section) => section.type === "faq")).toHaveLength(2)
        expect(warn).toHaveBeenCalled()
    })

    it("still skips an entry whose type has no code section at all", () => {
        const merged = applyLandingDocument(fixture(), {
            sections: [
                { id: "pricing-rolled", type: "pricing" },
                { id: "hero", type: "hero" },
            ],
        })
        expect(merged.sections.map((section) => section.type)).toEqual(["hero", "faq", "lead-form"])
        expect(warn).toHaveBeenCalledOnce()
    })
})

/** A page config carrying the services-shaped before/after gallery. */
function galleryPage(): LandingConfig {
    return {
        style: { preset: "sitework" },
        sections: [
            { id: "hero", type: "hero", variant: "statement", content: { headline: "Proof" } },
            {
                id: "transformations",
                type: "gallery",
                variant: "before-after",
                content: {
                    items: [
                        {
                            media: { kind: "image", src: "/services/kitchen-after.webp", alt: "After" },
                            beforeMedia: {
                                kind: "image",
                                src: "/services/kitchen-before.webp",
                                alt: "Before",
                            },
                            caption: "Kitchen",
                        },
                        {
                            media: { kind: "image", src: "/services/deck-after.webp", alt: "After" },
                            beforeMedia: { kind: "image", src: "/services/deck-before.webp", alt: "Before" },
                            caption: "Deck",
                        },
                    ],
                    lightbox: true,
                },
            },
        ],
    }
}

type GalleryItems = { items: { beforeMedia?: unknown; media: { src: string } }[] }

describe("applySitePageDocument with re-keyed entries", () => {
    it("keeps the before/after gallery's photo pairs when a roll re-keys the entry", () => {
        const merged = applySitePageDocument(galleryPage(), "home", {
            pages: {
                home: {
                    sections: [
                        { id: "hero", type: "hero", variant: "statement" },
                        { id: "transformations-rolled", type: "gallery", variant: "before-after" },
                    ],
                },
            },
        })
        const gallery = merged.sections.find((section) => section.type === "gallery")
        expect(gallery).toBeDefined()
        const items = (gallery?.content as GalleryItems).items
        expect(items).toHaveLength(2)
        // The pairing survives: every item still carries its before frame,
        // so the comparison divider (and its drag) still renders.
        expect(items.every((item) => item.beforeMedia !== undefined)).toBe(true)
    })

    it("still scaffolds a placeholder for a genuinely added section", () => {
        const merged = applySitePageDocument(galleryPage(), "home", {
            pages: {
                home: {
                    sections: [
                        { id: "hero", type: "hero" },
                        { id: "transformations", type: "gallery", variant: "before-after" },
                        { id: "gallery-added", type: "gallery", variant: "masonry" },
                    ],
                },
            },
        })
        const galleries = merged.sections.filter((section) => section.type === "gallery")
        expect(galleries).toHaveLength(2)
        // The page's own gallery binds by id and keeps its pairs; the added
        // one binds nothing (its section is claimed) and scaffolds.
        const bound = (galleries[0]?.content as GalleryItems).items
        expect(bound.every((item) => item.beforeMedia !== undefined)).toBe(true)
        const added = (galleries[1]?.content as GalleryItems).items
        expect(added.every((item) => item.beforeMedia === undefined)).toBe(true)
    })

    it("a re-keyed duplicate never steals: the id-bound entry wins, the copy scaffolds", () => {
        const merged = applySitePageDocument(galleryPage(), "home", {
            pages: {
                home: {
                    sections: [
                        { id: "transformations-rolled", type: "gallery", variant: "before-after" },
                        { id: "transformations", type: "gallery", variant: "before-after" },
                    ],
                },
            },
        })
        const galleries = merged.sections.filter((section) => section.type === "gallery")
        expect(galleries).toHaveLength(2)
        // Document order holds; the first (re-keyed) entry found the real
        // section claimed by its own entry and scaffolded instead.
        const first = (galleries[0]?.content as GalleryItems).items
        expect(first.every((item) => item.beforeMedia === undefined)).toBe(true)
        const second = (galleries[1]?.content as GalleryItems).items
        expect(second.every((item) => item.beforeMedia !== undefined)).toBe(true)
    })
})
