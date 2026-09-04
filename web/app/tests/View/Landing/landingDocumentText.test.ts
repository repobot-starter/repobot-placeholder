import type { LandingConfig } from "@ui"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import { applyLandingDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The document's `sections[].text` overrides (docs/landing.md): per-field
 * copy replacements from the platform editor's click-to-edit gesture.
 * Keys are dotted paths into the section's code content using CODE
 * indices, applied before `order`; only an existing string is ever
 * replaced, so a stale or junk override degrades to the authored copy
 * with a warning instead of inventing structure.
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

describe("applyLandingDocument text overrides", () => {
    it("applies text overrides onto scalar, nested, and per-item fields", () => {
        const config = fixture()
        config.sections[0] = {
            id: "hero",
            type: "hero",
            variant: "statement",
            content: { headline: "Hello", primaryCta: { label: "Start", href: "/x" } },
        }
        config.sections[1] = {
            id: "faq",
            type: "faq",
            variant: "accordion",
            content: {
                items: [
                    { question: "Q1", answer: "A1" },
                    { question: "Q2", answer: "A2" },
                ],
            },
        }
        const merged = applyLandingDocument(config, {
            sections: [
                {
                    id: "hero",
                    type: "hero",
                    text: { headline: "Edited", "primaryCta.label": "Go" },
                },
                { id: "faq", type: "faq", text: { "items.1.question": "Q2 edited" } },
                { id: "lead-form", type: "lead-form" },
            ],
        })
        const hero = merged.sections[0]?.content as {
            headline: string
            primaryCta: { label: string; href: string }
        }
        expect(hero.headline).toBe("Edited")
        expect(hero.primaryCta).toEqual({ label: "Go", href: "/x" })
        const faq = merged.sections[1]?.content as { items: { question: string; answer: string }[] }
        expect(faq.items.map((item) => item.question)).toEqual(["Q1", "Q2 edited"])
        expect(warn).not.toHaveBeenCalled()
    })

    it("text overrides apply on code indices before order, so an edit rides its item across a reorder", () => {
        const config = fixture()
        config.sections[1] = {
            id: "faq",
            type: "faq",
            variant: "accordion",
            content: {
                items: [
                    { question: "Q1", answer: "A1" },
                    { question: "Q2", answer: "A2" },
                    { question: "Q3", answer: "A3" },
                ],
            },
        }
        const merged = applyLandingDocument(config, {
            sections: [
                {
                    id: "faq",
                    type: "faq",
                    text: { "items.0.question": "Q1 edited" },
                    order: { items: [2, 0, 1] },
                },
            ],
        })
        const faq = merged.sections[0]?.content as { items: { question: string }[] }
        expect(faq.items.map((item) => item.question)).toEqual(["Q3", "Q1 edited", "Q2"])
    })

    it("degrades gracefully: stale paths, non-strings, and junk shapes keep the code copy", () => {
        const config = fixture()
        for (const text of [
            null,
            "headline=Hi",
            { gone: "value" },
            { "items.9.question": "stale" },
            { headline: 42 },
            { headline: "" },
            { "bad path!": "x" },
        ]) {
            const merged = applyLandingDocument(config, {
                sections: [{ id: "hero", type: "hero", text }],
            })
            expect(merged.sections[0]?.content).toEqual({ headline: "Hello" })
        }
    })
})
