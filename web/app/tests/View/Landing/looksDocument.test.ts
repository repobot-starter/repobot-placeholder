import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import committedDocument from "../../../../../repobot.content.json"
import {
    applyContentDocumentLooks,
    LOOK_MAX_PRODUCT_LINKS,
    lookCategories,
    parseContentLooks,
    type ContentLook,
} from "../../../src/View/Landing/looksDocument"

/**
 * The looks domain's merge semantics (looksDocument.ts) — the creator
 * family's style gallery read from repobot.content.json with code
 * fallback, rule for rule the projects resolver's graceful degradation:
 * invalid entries drop alone, an empty list is an archived gallery, a
 * non-empty list with no valid entry is a broken document that falls
 * back whole. The domain-specific rules this suite guards: product
 * links ride the links domain's https-only URL rule (one bad product
 * link drops its look, never the gallery), and photographs never live
 * in the contract — packs join their code-owned photos back by slug.
 * Validation mirrors the platform's ContentContract.ts parseLook, so
 * the platform never writes an entry the kernel drops.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

const fallbackGallery: ContentLook[] = [
    {
        slug: "canal-street-trench",
        title: "Canal Street Trench",
        category: "Everyday",
        description: "The trench that does the whole season.",
        productLinks: [{ label: "The trench", url: "https://example.com/trench" }],
        featured: true,
    },
]

const validLook = {
    slug: "market-day-linen",
    title: "Market-Day Linen",
    category: "Everyday",
    description: "Loose linen and flat sandals — the Saturday uniform.",
    productLinks: [
        { label: "The linen set", url: "https://example.com/linen-set" },
        { label: "Sandals", url: "https://example.com/sandals" },
    ],
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("looks schema validation (parseContentLooks)", () => {
    it("parses a well-formed looks domain, preserving the contract fields", () => {
        const parsed = parseContentLooks({ looks: { entries: [validLook] } })
        expect(parsed).toEqual([validLook])
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps description, productLinks, and featured optional (identity is title + category)", () => {
        const bare = {
            slug: validLook.slug,
            title: validLook.title,
            category: validLook.category,
        }
        expect(parseContentLooks({ looks: { entries: [bare] } })).toEqual([bare])
        const featured = { ...validLook, featured: true }
        expect(parseContentLooks({ looks: { entries: [featured] } })).toEqual([featured])
    })

    it("returns undefined when the document carries no looks domain", () => {
        expect(parseContentLooks({})).toBeUndefined()
        expect(parseContentLooks(undefined)).toBeUndefined()
        expect(parseContentLooks("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseContentLooks({ looks: "junk" })).toBeUndefined()
        expect(parseContentLooks({ looks: { entries: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty gallery (owner archived everything)", () => {
        expect(parseContentLooks({ looks: { entries: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops a look whose product links carry a non-https or malformed URL", () => {
        const badUrls = [
            [{ label: "Downgrade", url: "http://example.com/piece" }],
            [{ label: "Scriptable", url: "javascript:alert(1)" }],
            [{ label: "Bare", url: "example.com/piece" }],
            [{ label: "", url: "https://example.com/piece" }],
            [{ label: "No url" }],
            ["junk"],
            "junk",
        ]
        for (const productLinks of badUrls) {
            expect(
                parseContentLooks({
                    looks: { entries: [validLook, { ...validLook, slug: "bad", productLinks }] },
                }),
                `product links must be rejected whole: ${JSON.stringify(productLinks)}`,
            ).toEqual([validLook])
        }
        expect(warn).toHaveBeenCalled()
    })

    it("caps product links per look (an outfit, not a catalog)", () => {
        const pieces = Array.from({ length: LOOK_MAX_PRODUCT_LINKS + 1 }, (_, index) => ({
            label: `Piece ${index}`,
            url: `https://example.com/piece-${index}`,
        }))
        expect(
            parseContentLooks({
                looks: { entries: [validLook, { ...validLook, slug: "overfull", productLinks: pieces }] },
            }),
        ).toEqual([validLook])
        const atCap = pieces.slice(0, LOOK_MAX_PRODUCT_LINKS)
        const full = { ...validLook, slug: "full-fit", productLinks: atCap }
        expect(parseContentLooks({ looks: { entries: [full] } })).toEqual([full])
    })

    it("drops invalid entries alone and keeps the rest of the gallery", () => {
        const invalid = [
            { ...validLook, slug: "UPPER CASE" },
            { ...validLook, slug: undefined },
            { ...validLook, slug: "untitled", title: "" },
            { ...validLook, slug: "no-category", category: "" },
            { ...validLook, slug: "long-category", category: "x".repeat(61) },
            { ...validLook, slug: "bad-description", description: 42 },
            { ...validLook, slug: "long-description", description: "x".repeat(1001) },
            { ...validLook, slug: "bad-featured", featured: "yes" },
            "junk",
            null,
        ]
        const parsed = parseContentLooks({ looks: { entries: [validLook, ...invalid] } })
        expect(parsed).toEqual([validLook])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate slug after the first (identity is the photo join key)", () => {
        const duplicate = { ...validLook, title: "Impostor Look" }
        const parsed = parseContentLooks({ looks: { entries: [validLook, duplicate] } })
        expect(parsed).toEqual([validLook])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid entries as broken, not archived", () => {
        expect(parseContentLooks({ looks: { entries: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("ignores unknown entry fields (forward compatibility for later phases)", () => {
        const parsed = parseContentLooks({
            looks: { entries: [{ ...validLook, likes: 4800, season: "fall" }] },
        })
        expect(parsed).toEqual([validLook])
    })
})

describe("the derived category taxonomy (lookCategories)", () => {
    it("returns every distinct category once, in first-use order", () => {
        const looks: ContentLook[] = [
            { slug: "a", title: "A", category: "Everyday" },
            { slug: "b", title: "B", category: "Vintage flip" },
            { slug: "c", title: "C", category: "Everyday" },
            { slug: "d", title: "D", category: "Travel" },
        ]
        expect(lookCategories(looks)).toEqual(["Everyday", "Vintage flip", "Travel"])
    })

    it("is empty for an empty gallery", () => {
        expect(lookCategories([])).toEqual([])
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentLooks)", () => {
    it("the document's gallery wins over the code looks when both exist", () => {
        const resolved = applyContentDocumentLooks(fallbackGallery, {
            looks: { entries: [validLook] },
        })
        expect(resolved).toEqual([validLook])
    })

    it("falls back to the code looks when the document has no looks domain", () => {
        expect(applyContentDocumentLooks(fallbackGallery, {})).toEqual(fallbackGallery)
    })

    it("falls back whole on a corrupt domain instead of blanking the gallery", () => {
        const resolved = applyContentDocumentLooks(fallbackGallery, {
            looks: { entries: ["junk"] },
        })
        expect(resolved).toEqual(fallbackGallery)
    })

    it("honors an archived gallery (empty entries) instead of resurrecting the code looks", () => {
        expect(applyContentDocumentLooks(fallbackGallery, { looks: { entries: [] } })).toEqual([])
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no looks (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseContentLooks(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "a composed looks seed parses clean — every entry contract-valid, no warnings",
        () => {
            const parsed = parseContentLooks(committedDocument)
            if (parsed === undefined) {
                // A pack without a looks seed (or the kernel itself):
                // nothing to validate, and nothing may have warned.
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { looks?: { entries?: unknown[] } }).looks?.entries
            expect(parsed, "a seed must parse without dropping entries").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
        },
    )
})
