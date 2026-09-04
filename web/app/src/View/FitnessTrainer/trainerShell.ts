import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { trainer } from "./content"

/**
 * The trainer pack's shared chrome, split from `trainerLanding.ts` so
 * manifest-driven pages can wear it without pulling the pack's full page
 * content into their chunk.
 *
 * The nav is the monolith register's default band — the kernel's
 * translucent full-width bar over true black, no variant override: the
 * coach's name as the wordmark, two links, the consult CTA. A personal
 * brand carries almost no chrome. Links are the pack's canonical pair
 * (Programs / Results) plus any pages added through the platform's Pages
 * panel (`repobot.project.json` `marketing.pages`). Manifest extras only
 * join when the pack owns the site (`basePath === ""`); on the `/trainer`
 * preview route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Programs", path: "/programs" },
    { label: "Results", path: "/results" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/programs", "/results", "/apply"]

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
 * `currentPath` is site-relative ("" for home, "/programs", "/apply", …).
 */
export function trainerShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            content: {
                logo: { name: trainer.brand },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Free consult", href: `${basePath}/apply` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${trainer.brand} · ${trainer.tagline} · ${trainer.city}`,
                note: `© ${new Date().getFullYear()} ${trainer.brand}`,
            },
        },
    }
}
