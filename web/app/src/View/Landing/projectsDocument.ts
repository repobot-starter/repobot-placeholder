import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"

/**
 * The projects domain of the business-content contract
 * (repobot.content.json) — the portfolio family's inventory, the
 * body-of-work sibling of the estate family's listings domain
 * (`listingsDocument.ts`). The document owns the owner-run facts of each
 * portfolio entry: title, category, location, year, scope, description,
 * and the featured flag the home rail curates by. Code keeps everything
 * else — imagery above all: photos never live in the contract, the pack
 * joins its code-owned photographs back in BY REFERENCE via `slug`, so
 * the contract moves words and categories, never bytes.
 *
 * `category` is the domain's one taxonomy axis: a short label ("Full
 * home", "Kitchen & bath") the portfolio grid derives its filter chips
 * from (`projectCategories`). It is deliberately a free string, not an
 * enum — every portfolio vertical (interior design today; architecture
 * and creator link/look collections later) names its own shelves, and
 * the derived-chip discipline means an owner minting a new category in
 * Manage grows the filter row without a kernel change.
 *
 * Merge semantics mirror the listings resolver's graceful degradation —
 * no document a hand or the platform can write may crash the page:
 *
 * - A missing or malformed `projects.entries` falls back to code content.
 * - Each entry is validated alone; a bad one (junk year, empty title,
 *   duplicate slug) is dropped with a warning while the rest render.
 * - An EMPTY entries array is honored (the owner archived everything),
 *   but a non-empty array whose every entry is invalid reads as a broken
 *   document and falls back whole.
 *
 * Validation rules are kept in lockstep with the platform's
 * ContentContract.ts (parseProject) — the same mirror discipline as the
 * listings domain, so the platform never writes an entry the kernel
 * would drop.
 */

/** One portfolio entry's owner facts. Photos join by `slug`, never by value. */
export interface ContentProject {
    /** Stable identity — the code-owned photo set's join key. */
    slug: string
    /** The project's name — "Larch Street Residence". */
    title: string
    /** The taxonomy chip the portfolio grid filters by — "Full home". */
    category: string
    /** The town or neighborhood — the quiet second line on the card. */
    location?: string
    /** Completion year — drives the portfolio's reverse-chronological read. */
    year?: number
    /** One line of scope, e.g. "Full renovation — 2,400 sq ft". */
    scope?: string
    description: string
    /** Whether the home page's featured rail carries this entry. */
    featured?: boolean
}

/** Contract ids everywhere: short lower-kebab (the session-id grammar). */
const PROJECT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnInvalid(field: string, value: unknown, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field} ${JSON.stringify(value)}; ${fallback}.`)
}

function isShortString(value: unknown, max: number): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= max
}

/**
 * One document project validated alone, or undefined when it cannot render
 * (the caller warns and drops it). Unknown fields are ignored, so later
 * phases can grow the entry without breaking older kernels.
 */
function parseProject(entry: unknown, seen: Set<string>): ContentProject | undefined {
    if (!isRecord(entry)) return undefined
    const { slug, title, category, location, year, scope, description, featured } = entry
    if (typeof slug !== "string" || !PROJECT_SLUG_PATTERN.test(slug)) return undefined
    if (seen.has(slug)) return undefined
    if (!isShortString(title, 200)) return undefined
    if (!isShortString(category, 60)) return undefined
    if (location !== undefined && !isShortString(location, 120)) return undefined
    if (
        year !== undefined &&
        (typeof year !== "number" || !Number.isInteger(year) || year < 1900 || year > 2100)
    ) {
        return undefined
    }
    if (scope !== undefined && !isShortString(scope, 160)) return undefined
    if (typeof description !== "string" || description.length > 1000) return undefined
    if (featured !== undefined && typeof featured !== "boolean") return undefined
    seen.add(slug)
    return {
        slug,
        title,
        category,
        ...(location !== undefined ? { location } : {}),
        ...(year !== undefined ? { year } : {}),
        ...(scope !== undefined ? { scope } : {}),
        description,
        ...(featured !== undefined ? { featured } : {}),
    }
}

/**
 * The document's projects domain (`projects.entries`), or undefined when
 * the document doesn't speak for it — the caller then falls back to the
 * pack's code content. Exported pure for tests; pages go through
 * `useContentProjects`.
 */
export function parseContentProjects(document: unknown): ContentProject[] | undefined {
    if (!isRecord(document)) return undefined
    const projects = document.projects
    if (projects === undefined) return undefined
    if (!isRecord(projects)) {
        warnInvalid("projects", projects, "keeping the code portfolio")
        return undefined
    }
    const entries = projects.entries
    if (!Array.isArray(entries)) {
        warnInvalid("projects.entries", entries, "keeping the code portfolio")
        return undefined
    }
    const seen = new Set<string>()
    const parsed: ContentProject[] = []
    for (const entry of entries) {
        const project = parseProject(entry, seen)
        if (project === undefined) {
            warnInvalid("projects.entries entry", entry, "dropping it")
            continue
        }
        parsed.push(project)
    }
    if (entries.length > 0 && parsed.length === 0) {
        // Every entry invalid: a broken document, not an archived portfolio.
        warnInvalid("projects.entries", "(no valid entries)", "keeping the code portfolio")
        return undefined
    }
    return parsed
}

/**
 * The portfolio's derived taxonomy: every distinct category, in first-use
 * order — the filter-chip row of a portfolio grid. Derived per render so
 * an owner minting a new category in Manage grows the chips without any
 * kernel change; the empty string never appears (the parser requires a
 * non-empty category).
 */
export function projectCategories(projects: readonly ContentProject[]): string[] {
    const categories: string[] = []
    for (const project of projects) {
        if (!categories.includes(project.category)) categories.push(project.category)
    }
    return categories
}

/**
 * Pure resolve of a document over code projects — exported for tests;
 * pages go through `useContentProjects`.
 */
export function applyContentDocumentProjects(
    fallback: ContentProject[],
    document: unknown,
): ContentProject[] {
    return parseContentProjects(document) ?? fallback
}

/**
 * The portfolio a pack page should render: the committed document's
 * projects when `surface` names the ACTIVE pack (the document describes
 * the active pack's business, exactly like the listings domain), otherwise
 * the code projects untouched. Callers pass their own pack key.
 */
export function resolveContentProjects(fallback: ContentProject[], surface: PackKey): ContentProject[] {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentProjects(fallback, getContentDocument())
}

/** `resolveContentProjects` as a hook: re-renders on live document edits. */
export function useContentProjects(fallback: ContentProject[], surface: PackKey): ContentProject[] {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveContentProjects(fallback, surface)
}
