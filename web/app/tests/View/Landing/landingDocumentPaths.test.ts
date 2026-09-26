import type { LandingConfig } from "@ui"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import { applyLandingDocument } from "../../../src/View/Landing/landingDocument"

/**
 * Override paths beyond the canonical lists: photographs on any authored
 * list or single media slot (a vows booth strip's frames, a report's
 * before photo), and text on a field of an item nested in a list item (a
 * price-list line). Overrides only ever replace what the code authored.
 */

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

/** A small synthetic page mirroring the pinned suite's fixture. */
function fixture(): LandingConfig {
    return {
        style: { preset: "editorial", overrides: { "--marketing-font-display": "serif" } },
        shell: {
            nav: { variant: "inline", content: { logo: { name: "Fixture" } } },
            footer: { variant: "simple", content: { blurb: "Fixture" } },
        },
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

describe("applyLandingDocument nested override paths", () => {
    it("paints photographs on any authored list, nested lists and single slots", () => {
        const config = fixture()
        const print = (src: string) => ({ kind: "image", src, alt: src })
        config.sections[0] = {
            id: "hero",
            type: "hero",
            variant: "invitation",
            content: {
                headline: "Hello",
                snapshots: [
                    { media: print("/a.webp"), sticker: "Us" },
                    { frames: [print("/f0.webp"), print("/f1.webp")] },
                ],
            },
        }
        config.sections.push({
            id: "report",
            type: "content-split",
            variant: "report",
            content: {
                title: "Job",
                report: { title: "Report", rows: [], before: print("/before.webp") },
            },
        })
        const merged = applyLandingDocument(config, {
            sections: [
                {
                    id: "hero",
                    type: "hero",
                    media: {
                        snapshots: { "0": "/brand/us.jpg" },
                        "snapshots.1.frames": { "1": "/brand/f.jpg" },
                    },
                },
                { id: "report", type: "content-split", media: { "report.before": ["/brand/before.jpg"] } },
            ],
        })
        const hero = merged.sections[0]?.content as {
            snapshots: [{ media: { src: string }; sticker: string }, { frames: { src: string }[] }]
        }
        expect(hero.snapshots[0]).toEqual({
            media: { kind: "image", src: "/brand/us.jpg", alt: "" },
            sticker: "Us",
        })
        expect(hero.snapshots[1].frames.map((frame) => frame.src)).toEqual(["/f0.webp", "/brand/f.jpg"])
        const report = merged.sections[1]?.content as { report: { before: { src: string; alt: string } } }
        expect(report.report.before).toEqual({ kind: "image", src: "/brand/before.jpg", alt: "/before.webp" })
        expect(warn).not.toHaveBeenCalled()
    })

    it("never grows structure on non-canonical media paths", () => {
        const config = fixture()
        config.sections[0] = {
            id: "hero",
            type: "hero",
            variant: "invitation",
            content: {
                headline: "Hello",
                snapshots: [{ media: { kind: "image", src: "/a.webp", alt: "" } }],
            },
        }
        const merged = applyLandingDocument(config, {
            sections: [
                {
                    id: "hero",
                    type: "hero",
                    media: {
                        snapshots: ["/brand/1.jpg", "/brand/2.jpg"],
                        "snapshots.4.frames": ["/brand/x.jpg"],
                        headline: ["/brand/x.jpg"],
                        "constructor.prototype": ["/brand/x.jpg"],
                    },
                },
            ],
        })
        const hero = merged.sections[0]?.content as {
            headline: string
            snapshots: { media: { src: string } }[]
        }
        expect(hero.snapshots.map((piece) => piece.media.src)).toEqual(["/brand/1.jpg"])
        expect(hero.headline).toBe("Hello")
        expect(warn).toHaveBeenCalledTimes(3)
    })

    it("reaches a field of an item nested in a list item, and no deeper", () => {
        const config = fixture()
        config.sections[1] = {
            id: "prices",
            type: "pricing",
            variant: "price-list",
            content: {
                tiers: [],
                groups: [{ heading: "Cuts", items: [{ name: "Trim", price: "$30" }] }],
            },
        }
        const merged = applyLandingDocument(config, {
            sections: [
                {
                    id: "prices",
                    type: "pricing",
                    text: { "groups.0.items.0.price": "$35", "groups.0.items.0.price.a.b": "junk" },
                },
            ],
        })
        const prices = merged.sections[0]?.content as { groups: { items: { price: string }[] }[] }
        expect(prices.groups[0]?.items[0]?.price).toBe("$35")
        expect(warn).toHaveBeenCalledTimes(1)
    })
})
