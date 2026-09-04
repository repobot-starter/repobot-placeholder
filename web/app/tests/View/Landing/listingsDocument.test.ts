import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import committedDocument from "../../../../../repobot.content.json"
import {
    applyContentDocumentListings,
    parseContentListings,
    type ContentListing,
} from "../../../src/View/Landing/listingsDocument"

/**
 * The listings domain's merge semantics (listingsDocument.ts) — the
 * estate family's inventory read from repobot.content.json with code
 * fallback, rule for rule the schedule resolver's graceful degradation:
 * invalid entries drop alone, an empty list is a delisted inventory, a
 * non-empty list with no valid entry is a broken document that falls
 * back whole. Validation mirrors the platform's ContentContract.ts
 * parseListing, so the platform never writes an entry the kernel drops.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

const fallbackInventory: ContentListing[] = [
    {
        slug: "benefit-street",
        title: "14 Benefit Street",
        neighborhood: "College Hill",
        price: "$1,285,000",
        beds: 4,
        baths: 3,
        sqft: 2940,
        description: "A 1790s brick rowhouse.",
        status: "available",
        listedAt: "2026-08-24",
        featured: true,
    },
]

const validListing = {
    slug: "governor-cottage",
    title: "9 Governor Street",
    neighborhood: "Fox Point",
    price: "$685,000",
    beds: 3,
    baths: 2,
    sqft: 1610,
    description: "A brick garden cottage behind an iron gate.",
    status: "sold",
    listedAt: "2026-05-06",
    soldAt: "2026-06-12",
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("listings schema validation (parseContentListings)", () => {
    it("parses a well-formed listings domain, preserving the contract fields", () => {
        const parsed = parseContentListings({ listings: { entries: [validListing] } })
        expect(parsed).toEqual([validListing])
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps soldAt and featured optional (a live listing carries neither)", () => {
        const { soldAt: _s, ...live } = validListing
        const bare = { ...live, status: "available" }
        expect(parseContentListings({ listings: { entries: [bare] } })).toEqual([bare])
    })

    it("allows half baths and an empty description", () => {
        const halfBath = { ...validListing, baths: 2.5, description: "" }
        expect(parseContentListings({ listings: { entries: [halfBath] } })).toEqual([halfBath])
    })

    it("returns undefined when the document carries no listings domain", () => {
        expect(parseContentListings({})).toBeUndefined()
        expect(parseContentListings(undefined)).toBeUndefined()
        expect(parseContentListings("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseContentListings({ listings: "junk" })).toBeUndefined()
        expect(parseContentListings({ listings: { entries: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty inventory (owner delisted everything)", () => {
        expect(parseContentListings({ listings: { entries: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops invalid entries alone and keeps the rest of the inventory", () => {
        const invalid = [
            { ...validListing, slug: "UPPER CASE" },
            { ...validListing, slug: undefined },
            { ...validListing, slug: "untitled", title: "" },
            { ...validListing, slug: "bad-beds", beds: 2.5 },
            { ...validListing, slug: "many-beds", beds: 51 },
            { ...validListing, slug: "bad-baths", baths: -1 },
            { ...validListing, slug: "bad-sqft", sqft: 0 },
            { ...validListing, slug: "bad-status", status: "escrow" },
            { ...validListing, slug: "bad-date", listedAt: "yesterday" },
            { ...validListing, slug: "bad-sold", soldAt: "June 12" },
            { ...validListing, slug: "bad-featured", featured: "yes" },
            { ...validListing, slug: "bad-price", price: "" },
            "junk",
            null,
        ]
        const parsed = parseContentListings({ listings: { entries: [validListing, ...invalid] } })
        expect(parsed).toEqual([validListing])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate slug after the first (identity is the photo join key)", () => {
        const duplicate = { ...validListing, title: "Impostor House" }
        const parsed = parseContentListings({ listings: { entries: [validListing, duplicate] } })
        expect(parsed).toEqual([validListing])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid entries as broken, not delisted", () => {
        expect(parseContentListings({ listings: { entries: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("ignores unknown entry fields (forward compatibility for later phases)", () => {
        const parsed = parseContentListings({
            listings: { entries: [{ ...validListing, openHouse: "2026-09-01", lot: 0.2 }] },
        })
        expect(parsed).toEqual([validListing])
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentListings)", () => {
    it("the document's inventory wins over the code listings when both exist", () => {
        const resolved = applyContentDocumentListings(fallbackInventory, {
            listings: { entries: [validListing] },
        })
        expect(resolved).toEqual([validListing])
    })

    it("falls back to the code listings when the document has no listings domain", () => {
        expect(applyContentDocumentListings(fallbackInventory, {})).toEqual(fallbackInventory)
    })

    it("falls back whole on a corrupt domain instead of blanking the site", () => {
        const resolved = applyContentDocumentListings(fallbackInventory, {
            listings: { entries: ["junk"] },
        })
        expect(resolved).toEqual(fallbackInventory)
    })

    it("honors a delisted inventory (empty entries) instead of resurrecting the code listings", () => {
        expect(applyContentDocumentListings(fallbackInventory, { listings: { entries: [] } })).toEqual([])
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no listings (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseContentListings(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "a composed listings seed parses clean — every entry contract-valid, no warnings",
        () => {
            const parsed = parseContentListings(committedDocument)
            if (parsed === undefined) {
                // A pack without a listings seed (or the kernel itself):
                // nothing to validate, and nothing may have warned.
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { listings?: { entries?: unknown[] } }).listings?.entries
            expect(parsed, "a seed must parse without dropping entries").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
        },
    )
})
