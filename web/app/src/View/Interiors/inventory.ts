import { useContentProjects, type ContentProject } from "../Landing/projectsDocument"
import { home, projects, type SiteImage, type StudioProject } from "./content"

/**
 * The interiors pack's portfolio, resolved through the business-content
 * contract (repobot.content.json's projects domain) with `content.ts`
 * fallback — the estate family's inventory discipline applied to a body
 * of work. The contract owns the owner-run facts (title, category,
 * location, year, scope, description, the featured flag); the code keeps
 * the photographs, and this module joins them back in BY REFERENCE via
 * `slug`, so a Manage edit moves words and categories while the imagery
 * stays code-owned.
 *
 * A project the owner adds in Manage has no code photograph yet — it
 * renders under the pack's signature room (the home hero) until a
 * photograph is produced for its slug. The portfolio's filter chips stay
 * derived from whatever categories the resolved entries carry
 * (`projectCategories` in projectsDocument.ts) whichever side the facts
 * came from — the taxonomy is data, not code.
 */

/** A contract project wearing its code-owned photograph — the render shape. */
export type { StudioProject }

/**
 * The code portfolio in contract shape — the fallback the resolver hands
 * back when the document doesn't speak for projects, and the default the
 * landing builders render with (pinned tests, the preview route). The
 * image rides alongside untouched: `StudioProject` IS the contract shape
 * plus the photograph.
 */
export function codePortfolio(): StudioProject[] {
    return projects
}

const imagesBySlug = new Map<string, SiteImage>(projects.map((project) => [project.slug, project.image]))

/** Contract projects joined with their code-owned photographs by slug. */
export function withProjectImages(resolved: ContentProject[]): StudioProject[] {
    return resolved.map((project) => ({
        ...project,
        image: imagesBySlug.get(project.slug) ?? home.heroImage,
    }))
}

/**
 * The portfolio the interiors pages render: the committed document's
 * projects over the code fallback when interiors is the ACTIVE pack,
 * photographs joined back in — re-rendering on live document edits (dev
 * HMR), the same subscription discipline as `useEstateInventory`.
 */
export function useInteriorsPortfolio(): StudioProject[] {
    const resolved = useContentProjects(codePortfolio(), "interiors")
    return withProjectImages(resolved)
}
