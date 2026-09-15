import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { business } from "./content"

/**
 * The services pack's shared chrome (full-width signage band + simple
 * footer), split from `servicesLanding.ts` so manifest-driven pages can wear it
 * without pulling the pack's full page content into their chunk — the
 * photography pack's pattern.
 *
 * The nav's link list is the pack's canonical trio (Projects / Services /
 * About) plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/services`
 * preview route those paths don't exist under the prefix.
 *
 * The nav CTA is the quote ask; the footer carries the license line —
 * trust chrome a trades site should never render without.
 *
 * Variant: `full-width` — the flush edge-to-edge band. A four-page trades
 * site wants substantial, storefront-awning chrome, and the band keeps the
 * quote CTA pinned top-right on every page. (Nav-variety audit: the whole
 * services family wore the inset `inline` card; the family now spreads
 * across the vocabulary — remixes re-pin via their catalogs' theme
 * `navigation` blocks, which outrank this prop.)
 */

const CANONICAL_LINKS = [
    { label: "Projects", path: "/projects" },
    { label: "Services", path: "/services" },
    { label: "About", path: "/about" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/quote" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/projects", "/services", "/about", "/quote"]

function siteLinks(basePath: string): { label: string; path: string }[] {
    if (basePath !== "") {
        return [...CANONICAL_LINKS]
    }
    const extras = projectManifest.marketing.pages
        .filter((page) => !PACK_OWNED_PATHS.includes(page.path))
        .map((page) => ({ label: page.title, path: page.path }))
    return [...CANONICAL_LINKS, ...extras]
}

/**
 * The shell for one page: the current page drops out of its own links.
 * `currentPath` is site-relative ("" for home, "/projects", …).
 */
export function servicesShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "full-width",
            content: {
                logo: { name: business.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Get a quote", href: `${basePath}/quote` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${business.name} · ${business.location} · ${business.license}`,
                note: `© ${new Date().getFullYear()} ${business.name}`,
            },
        },
    }
}
