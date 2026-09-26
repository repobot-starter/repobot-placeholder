import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { agency, landingCopy } from "./content"

/**
 * The estate pack's shared chrome (letterhead split nav + simple footer),
 * split from `estateLanding.ts` so manifest-driven pages can wear it
 * without pulling the pack's full page content into their chunk — the
 * photography pack's pattern.
 *
 * The nav's link list is the pack's canonical trio (Listings /
 * Neighborhoods / About) plus any pages added through the platform's
 * Pages panel (`repobot.project.json` `marketing.pages`). Manifest extras
 * only join when the pack owns the site (`basePath === ""`); on the
 * `/estate` preview route those paths don't exist under the prefix.
 *
 * The nav CTA is the contact ask; the footer carries the license and
 * fair-housing line — trust chrome a brokerage site should never render
 * without.
 */

const CANONICAL_LINKS = [
    { label: "Listings", path: "/listings" },
    { label: "Neighborhoods", path: "/neighborhoods" },
    { label: "About", path: "/about" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/contact" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/listings", "/neighborhoods", "/about", "/contact"]

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
 * `currentPath` is site-relative ("" for home, "/listings", …).
 */
export function estateShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "split",
            content: {
                logo: { name: agency.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${agency.name} · ${agency.location} · ${agency.license}`,
                note: `© ${new Date().getFullYear()} ${agency.name}`,
            },
        },
    }
}
