import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import committedDocument from "../../../../../repobot.content.json"
import {
    applyContentDocumentLinks,
    isValidLinkUrl,
    LINK_URL_MAX_LENGTH,
    linkCategories,
    parseContentLinks,
    type ContentLink,
} from "../../../src/View/Landing/linksDocument"

/**
 * The links domain's merge semantics (linksDocument.ts) — the creator
 * family's link hub read from repobot.content.json with code fallback,
 * rule for rule the projects resolver's graceful degradation: invalid
 * entries drop alone, an empty list is a cleared hub, a non-empty list
 * with no valid entry is a broken document that falls back whole. The
 * domain-specific rule this suite guards hardest: URLs are https only —
 * the contract must never be able to mint an http or scriptable link
 * into the owner's bio page. Validation mirrors the platform's
 * ContentContract.ts parseLink, so the platform never writes an entry
 * the kernel drops.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

const fallbackHub: ContentLink[] = [
    {
        slug: "newsletter",
        title: "The Sunday Edit",
        url: "https://example.com/newsletter",
        description: "One email a week.",
        category: "Watch & read",
    },
]

const validLink = {
    slug: "latest-video",
    title: "This week's video",
    url: "https://www.youtube.com/watch?v=fall-capsule",
    description: "Fall capsule — 12 pieces, 30 outfits.",
    badge: "New",
    category: "Watch & read",
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("links schema validation (parseContentLinks)", () => {
    it("parses a well-formed links domain, preserving the contract fields", () => {
        const parsed = parseContentLinks({ links: { entries: [validLink] } })
        expect(parsed).toEqual([validLink])
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps description, badge, and category optional (a link is a title and a URL)", () => {
        const bare = { slug: validLink.slug, title: validLink.title, url: validLink.url }
        expect(parseContentLinks({ links: { entries: [bare] } })).toEqual([bare])
    })

    it("returns undefined when the document carries no links domain", () => {
        expect(parseContentLinks({})).toBeUndefined()
        expect(parseContentLinks(undefined)).toBeUndefined()
        expect(parseContentLinks("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseContentLinks({ links: "junk" })).toBeUndefined()
        expect(parseContentLinks({ links: { entries: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty hub (owner cleared every link)", () => {
        expect(parseContentLinks({ links: { entries: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("accepts only https URLs — never http, protocol-relative, or scriptable schemes", () => {
        const schemes = [
            "http://example.com/downgrade",
            "//example.com/protocol-relative",
            "javascript:alert(1)",
            "ftp://example.com/file",
            "example.com/bare",
            "https://", // scheme alone is not a destination
            "https:// example.com/spaced",
        ]
        for (const url of schemes) {
            expect(
                parseContentLinks({ links: { entries: [validLink, { ...validLink, slug: "bad", url }] } }),
                `scheme must be rejected: ${url}`,
            ).toEqual([validLink])
        }
        expect(warn).toHaveBeenCalled()
    })

    it("caps URL length (campaign URLs are long; abuse is longer)", () => {
        const atCap = `https://example.com/${"x".repeat(LINK_URL_MAX_LENGTH - 20)}`
        expect(isValidLinkUrl(atCap)).toBe(true)
        const overCap = `https://example.com/${"x".repeat(LINK_URL_MAX_LENGTH)}`
        expect(isValidLinkUrl(overCap)).toBe(false)
        expect(
            parseContentLinks({
                links: { entries: [validLink, { ...validLink, slug: "long", url: overCap }] },
            }),
        ).toEqual([validLink])
    })

    it("drops invalid entries alone and keeps the rest of the hub", () => {
        const invalid = [
            { ...validLink, slug: "UPPER CASE" },
            { ...validLink, slug: undefined },
            { ...validLink, slug: "untitled", title: "" },
            { ...validLink, slug: "long-title", title: "x".repeat(121) },
            { ...validLink, slug: "no-url", url: undefined },
            { ...validLink, slug: "bad-description", description: "" },
            { ...validLink, slug: "long-badge", badge: "x".repeat(25) },
            { ...validLink, slug: "bad-category", category: 42 },
            "junk",
            null,
        ]
        const parsed = parseContentLinks({ links: { entries: [validLink, ...invalid] } })
        expect(parsed).toEqual([validLink])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate slug after the first (identity is the editor's row key)", () => {
        const duplicate = { ...validLink, title: "Impostor link" }
        const parsed = parseContentLinks({ links: { entries: [validLink, duplicate] } })
        expect(parsed).toEqual([validLink])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid entries as broken, not cleared", () => {
        expect(parseContentLinks({ links: { entries: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("preserves document order — the hub is a ranked list, never sorted", () => {
        const first = { ...validLink, slug: "z-last-alphabetically", title: "Z but first" }
        const second = { ...validLink, slug: "a-first-alphabetically", title: "A but second" }
        const parsed = parseContentLinks({ links: { entries: [first, second] } })
        expect(parsed?.map((link) => link.slug)).toEqual(["z-last-alphabetically", "a-first-alphabetically"])
    })

    it("ignores unknown entry fields (forward compatibility for later phases)", () => {
        const parsed = parseContentLinks({
            links: { entries: [{ ...validLink, clicks: 1200, pinned: true }] },
        })
        expect(parsed).toEqual([validLink])
    })
})

describe("the derived group taxonomy (linkCategories)", () => {
    it("returns every distinct category once, in first-use order, skipping uncategorized links", () => {
        const links: ContentLink[] = [
            { slug: "a", title: "A", url: "https://example.com/a", category: "Shop" },
            { slug: "b", title: "B", url: "https://example.com/b" },
            { slug: "c", title: "C", url: "https://example.com/c", category: "Watch & read" },
            { slug: "d", title: "D", url: "https://example.com/d", category: "Shop" },
        ]
        expect(linkCategories(links)).toEqual(["Shop", "Watch & read"])
    })

    it("is empty for an empty or uncategorized hub", () => {
        expect(linkCategories([])).toEqual([])
        expect(linkCategories([{ slug: "a", title: "A", url: "https://example.com/a" }])).toEqual([])
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentLinks)", () => {
    it("the document's hub wins over the code links when both exist", () => {
        const resolved = applyContentDocumentLinks(fallbackHub, {
            links: { entries: [validLink] },
        })
        expect(resolved).toEqual([validLink])
    })

    it("falls back to the code links when the document has no links domain", () => {
        expect(applyContentDocumentLinks(fallbackHub, {})).toEqual(fallbackHub)
    })

    it("falls back whole on a corrupt domain instead of blanking the hub", () => {
        const resolved = applyContentDocumentLinks(fallbackHub, {
            links: { entries: ["junk"] },
        })
        expect(resolved).toEqual(fallbackHub)
    })

    it("honors a cleared hub (empty entries) instead of resurrecting the code links", () => {
        expect(applyContentDocumentLinks(fallbackHub, { links: { entries: [] } })).toEqual([])
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no links (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseContentLinks(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "a composed links seed parses clean — every entry contract-valid, no warnings",
        () => {
            const parsed = parseContentLinks(committedDocument)
            if (parsed === undefined) {
                // A pack without a links seed (or the kernel itself):
                // nothing to validate, and nothing may have warned.
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { links?: { entries?: unknown[] } }).links?.entries
            expect(parsed, "a seed must parse without dropping entries").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
        },
    )
})
