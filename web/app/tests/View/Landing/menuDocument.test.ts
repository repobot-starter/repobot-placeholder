import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import committedDocument from "../../../../../repobot.content.json"
import {
    applyContentDocumentMenu,
    parseContentMenu,
    type ContentMenuSection,
} from "../../../src/View/Landing/menuDocument"

/**
 * The menu domain's merge semantics (menuDocument.ts) — the restaurant
 * family's card read from repobot.content.json with code fallback, rule
 * for rule the schedule resolver's graceful degradation, plus the menu's
 * own read rule mirrored from the platform's ContentContract.ts
 * parseMenuSection: one bad dish spoils its section (a half-parsed card
 * would misprice the kitchen), while the other sections still render.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

const fallbackCard: ContentMenuSection[] = [
    {
        title: "Breakfast",
        items: [{ name: "Oat porridge", description: "Steel-cut oats", priceCents: 950, dietary: ["VG"] }],
    },
]

const validSection = {
    title: "Drinks",
    note: "Espresso from Heart Roasters",
    items: [
        {
            name: "Drip coffee",
            description: "Bottomless with any plate",
            priceCents: 400,
            dietary: ["VG", "GF"],
        },
        { name: "Cappuccino", description: "Double shot", priceCents: 550, dietary: ["V"], popular: true },
    ],
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("menu schema validation (parseContentMenu)", () => {
    it("parses a well-formed menu domain, preserving the contract fields", () => {
        const parsed = parseContentMenu({ menu: { sections: [validSection] } })
        expect(parsed).toEqual([validSection])
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps note and popular optional", () => {
        const bare = {
            title: "Sweets",
            items: [{ name: "Olive oil cake", description: "", priceCents: 650, dietary: [] }],
        }
        expect(parseContentMenu({ menu: { sections: [bare] } })).toEqual([bare])
    })

    it("returns undefined when the document carries no menu domain", () => {
        expect(parseContentMenu({})).toBeUndefined()
        expect(parseContentMenu(undefined)).toBeUndefined()
        expect(parseContentMenu("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseContentMenu({ menu: "junk" })).toBeUndefined()
        expect(parseContentMenu({ menu: { sections: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty card (owner cleared the menu)", () => {
        expect(parseContentMenu({ menu: { sections: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops invalid sections alone — and one bad dish spoils its section", () => {
        const goodDish = validSection.items[0]
        const invalid = [
            { ...validSection, title: "" },
            { ...validSection, title: "Empty", items: [] },
            { ...validSection, title: "Bad note", note: "" },
            // The poisoned section: one junk price among good dishes.
            {
                title: "Poisoned",
                items: [goodDish, { name: "Mystery", description: "", priceCents: 10.5, dietary: [] }],
            },
            { title: "Bad dietary", items: [{ ...goodDish, dietary: ["KETO"] }] },
            { title: "Nameless dish", items: [{ ...goodDish, name: "" }] },
            { title: "Free caviar", items: [{ ...goodDish, priceCents: -1 }] },
            "junk",
            null,
        ]
        const parsed = parseContentMenu({ menu: { sections: [validSection, ...invalid] } })
        expect(parsed).toEqual([validSection])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate section title after the first", () => {
        const duplicate = { ...validSection, note: undefined }
        const parsed = parseContentMenu({ menu: { sections: [validSection, duplicate] } })
        expect(parsed).toEqual([validSection])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid sections as broken, not cleared", () => {
        expect(parseContentMenu({ menu: { sections: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentMenu)", () => {
    it("the document's card wins over the code menu when both exist", () => {
        expect(applyContentDocumentMenu(fallbackCard, { menu: { sections: [validSection] } })).toEqual([
            validSection,
        ])
    })

    it("falls back to the code menu when the document has no menu domain", () => {
        expect(applyContentDocumentMenu(fallbackCard, {})).toEqual(fallbackCard)
    })

    it("falls back whole on a corrupt domain instead of blanking the card", () => {
        expect(applyContentDocumentMenu(fallbackCard, { menu: { sections: ["junk"] } })).toEqual(fallbackCard)
    })

    it("honors a cleared card (empty sections) instead of resurrecting the code menu", () => {
        expect(applyContentDocumentMenu(fallbackCard, { menu: { sections: [] } })).toEqual([])
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no menu (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseContentMenu(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "a composed menu seed parses clean — every section contract-valid, no warnings",
        () => {
            const parsed = parseContentMenu(committedDocument)
            if (parsed === undefined) {
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { menu?: { sections?: unknown[] } }).menu?.sections
            expect(parsed, "a seed must parse without dropping sections").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
        },
    )
})
