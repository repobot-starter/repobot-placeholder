import type { LandingConfig } from "@ui"
import { describe, expect, it } from "vitest"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The document's root `style` applies on PAGE-SCOPED surfaces too. The
 * platform's Looks control writes `style.preset` at the document root;
 * before this contract, only the root-`sections` merge honored it — pack
 * sites (photography, launch) never repainted on a Look change.
 */

function fixture(): LandingConfig {
    return {
        style: { preset: "atelier" },
        sections: [
            { id: "hero", type: "hero", content: { headline: "Hello" } },
            { id: "faq", type: "faq", content: { items: [] } },
        ],
    } as LandingConfig
}

describe("applySitePageDocument style", () => {
    it("a declared document preset outranks the page's pinned one", () => {
        const merged = applySitePageDocument(fixture(), "home", {
            style: { preset: "editorial" },
            pages: { home: { sections: [{ id: "hero", type: "hero" }] } },
        })
        expect(merged.style.preset).toBe("editorial")
    })

    it("applies even to pages the document has no sections for", () => {
        const merged = applySitePageDocument(fixture(), "about", {
            style: { preset: "editorial" },
            pages: { home: { sections: [{ id: "hero", type: "hero" }] } },
        })
        expect(merged.style.preset).toBe("editorial")
        // Sections untouched: the document doesn't speak for this page.
        expect(merged.sections.map((section) => section.id)).toEqual(["hero", "faq"])
    })

    it("keeps the pinned preset when the document declares none or junk", () => {
        expect(applySitePageDocument(fixture(), "home", { pages: {} }).style.preset).toBe("atelier")
        expect(
            applySitePageDocument(fixture(), "home", { style: { preset: "not-a-preset" } }).style.preset,
        ).toBe("atelier")
    })
})
