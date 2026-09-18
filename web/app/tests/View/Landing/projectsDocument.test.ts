import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import committedDocument from "../../../../../repobot.content.json"
import {
    applyContentDocumentProjects,
    parseContentProjects,
    projectCategories,
    type ContentProject,
} from "../../../src/View/Landing/projectsDocument"

/**
 * The projects domain's merge semantics (projectsDocument.ts) — the
 * portfolio family's body of work read from repobot.content.json with
 * code fallback, rule for rule the listings resolver's graceful
 * degradation: invalid entries drop alone, an empty list is an archived
 * portfolio, a non-empty list with no valid entry is a broken document
 * that falls back whole. Validation mirrors the platform's
 * ContentContract.ts parseProject, so the platform never writes an entry
 * the kernel drops.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.content.json")

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

const fallbackPortfolio: ContentProject[] = [
    {
        slug: "larch-street",
        title: "Larch Street Residence",
        category: "Full home",
        location: "Portland",
        year: 2026,
        scope: "Whole-house renovation",
        description: "A 1920s foursquare opened to the garden.",
        featured: true,
    },
]

const validProject = {
    slug: "quimby-loft",
    title: "Quimby Street Loft",
    category: "Lofts",
    location: "Northwest District",
    year: 2025,
    scope: "Full interior — 1,400 sq ft",
    description: "A warehouse loft warmed up with walnut and wool.",
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("projects schema validation (parseContentProjects)", () => {
    it("parses a well-formed projects domain, preserving the contract fields", () => {
        const parsed = parseContentProjects({ projects: { entries: [validProject] } })
        expect(parsed).toEqual([validProject])
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps location, year, scope, and featured optional (identity is title + category)", () => {
        const bare = {
            slug: validProject.slug,
            title: validProject.title,
            category: validProject.category,
            description: validProject.description,
        }
        expect(parseContentProjects({ projects: { entries: [bare] } })).toEqual([bare])
    })

    it("allows an empty description (a card can carry title and category alone)", () => {
        const terse = { ...validProject, description: "" }
        expect(parseContentProjects({ projects: { entries: [terse] } })).toEqual([terse])
    })

    it("returns undefined when the document carries no projects domain", () => {
        expect(parseContentProjects({})).toBeUndefined()
        expect(parseContentProjects(undefined)).toBeUndefined()
        expect(parseContentProjects("junk")).toBeUndefined()
    })

    it("returns undefined (with a warning) on a malformed domain", () => {
        expect(parseContentProjects({ projects: "junk" })).toBeUndefined()
        expect(parseContentProjects({ projects: { entries: "junk" } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("honors an explicitly empty portfolio (owner archived everything)", () => {
        expect(parseContentProjects({ projects: { entries: [] } })).toEqual([])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops invalid entries alone and keeps the rest of the portfolio", () => {
        const invalid = [
            { ...validProject, slug: "UPPER CASE" },
            { ...validProject, slug: undefined },
            { ...validProject, slug: "untitled", title: "" },
            { ...validProject, slug: "no-category", category: "" },
            { ...validProject, slug: "bad-year", year: 2025.5 },
            { ...validProject, slug: "ancient", year: 1850 },
            { ...validProject, slug: "future", year: 2200 },
            { ...validProject, slug: "bad-location", location: "" },
            { ...validProject, slug: "bad-scope", scope: 42 },
            { ...validProject, slug: "bad-featured", featured: "yes" },
            { ...validProject, slug: "bad-description", description: 42 },
            "junk",
            null,
        ]
        const parsed = parseContentProjects({ projects: { entries: [validProject, ...invalid] } })
        expect(parsed).toEqual([validProject])
        expect(warn).toHaveBeenCalled()
    })

    it("drops a duplicate slug after the first (identity is the photo join key)", () => {
        const duplicate = { ...validProject, title: "Impostor Loft" }
        const parsed = parseContentProjects({ projects: { entries: [validProject, duplicate] } })
        expect(parsed).toEqual([validProject])
        expect(warn).toHaveBeenCalled()
    })

    it("reads a non-empty list with zero valid entries as broken, not archived", () => {
        expect(parseContentProjects({ projects: { entries: ["junk", 42] } })).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("ignores unknown entry fields (forward compatibility for later phases)", () => {
        const parsed = parseContentProjects({
            projects: { entries: [{ ...validProject, awards: ["AIA"], sqft: 1400 }] },
        })
        expect(parsed).toEqual([validProject])
    })
})

describe("the derived category taxonomy (projectCategories)", () => {
    it("returns every distinct category once, in first-use order", () => {
        const projects: ContentProject[] = [
            { slug: "a", title: "A", category: "Full home", description: "" },
            { slug: "b", title: "B", category: "Kitchen & bath", description: "" },
            { slug: "c", title: "C", category: "Full home", description: "" },
            { slug: "d", title: "D", category: "Commercial", description: "" },
        ]
        expect(projectCategories(projects)).toEqual(["Full home", "Kitchen & bath", "Commercial"])
    })

    it("is empty for an empty portfolio", () => {
        expect(projectCategories([])).toEqual([])
    })
})

describe("contract-over-content.ts precedence and fallback (applyContentDocumentProjects)", () => {
    it("the document's portfolio wins over the code projects when both exist", () => {
        const resolved = applyContentDocumentProjects(fallbackPortfolio, {
            projects: { entries: [validProject] },
        })
        expect(resolved).toEqual([validProject])
    })

    it("falls back to the code projects when the document has no projects domain", () => {
        expect(applyContentDocumentProjects(fallbackPortfolio, {})).toEqual(fallbackPortfolio)
    })

    it("falls back whole on a corrupt domain instead of blanking the site", () => {
        const resolved = applyContentDocumentProjects(fallbackPortfolio, {
            projects: { entries: ["junk"] },
        })
        expect(resolved).toEqual(fallbackPortfolio)
    })

    it("honors an archived portfolio (empty entries) instead of resurrecting the code projects", () => {
        expect(applyContentDocumentProjects(fallbackPortfolio, { projects: { entries: [] } })).toEqual([])
    })
})

describe("committed document fidelity", () => {
    it("the kernel default document declares no projects (packs seed their own)", () => {
        const kernelDefault: unknown = existsSync(composedDefaultPath)
            ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
            : committedDocument
        expect(parseContentProjects(kernelDefault)).toBeUndefined()
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "a composed projects seed parses clean — every entry contract-valid, no warnings",
        () => {
            const parsed = parseContentProjects(committedDocument)
            if (parsed === undefined) {
                // A pack without a projects seed (or the kernel itself):
                // nothing to validate, and nothing may have warned.
                expect(warn).not.toHaveBeenCalled()
                return
            }
            const raw = (committedDocument as { projects?: { entries?: unknown[] } }).projects?.entries
            expect(parsed, "a seed must parse without dropping entries").toHaveLength(raw?.length ?? 0)
            expect(warn).not.toHaveBeenCalled()
        },
    )
})
