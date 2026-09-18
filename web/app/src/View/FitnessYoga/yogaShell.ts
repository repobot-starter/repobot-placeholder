import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { studio } from "./content"

/**
 * The yoga & pilates pack's shared chrome, split from `yogaLanding.ts` so
 * manifest-driven pages can wear it without pulling the pack's full page
 * content into their chunk.
 *
 * The nav is the burger-overlay — the studio's name alone at the top, the
 * links and the Begin CTA in the fullscreen overlay behind the burger.
 * Picked in the nav-variety audit: the review called out Stillwater's old
 * centered masthead ("same note on Stillwater nav") as the inset bar the
 * shelf leaned on, and chrome-free quiet is the atelier register's whole
 * argument — a hushed studio whose page IS the atmosphere, boutique-spa
 * style. Links are the pack's canonical trio (Schedule / Teachers /
 * Pricing) plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/yoga` preview
 * route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Schedule", path: "/schedule" },
    { label: "Teachers", path: "/teachers" },
    { label: "Pricing", path: "/pricing" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/schedule", "/teachers", "/pricing", "/begin"]

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
 * `currentPath` is site-relative ("" for home, "/schedule", "/begin", …).
 */
export function yogaShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "burger-overlay",
            content: {
                logo: { name: studio.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Begin", href: `${basePath}/begin` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${studio.name} · ${studio.tagline} · ${studio.city}`,
                note: `© ${new Date().getFullYear()} ${studio.name}`,
            },
        },
    }
}
