import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { firm } from "./content"

/**
 * The index pack's shared chrome: the spec-sheet register keeps the nav to
 * a hairline full-width band — the wordmark, four destinations, the deck
 * ask — and the footer to a single ruled row whose only link is the
 * disclosures page (where a real fund keeps its fine print).
 *
 * Links are the pack's canonical four (Portfolio / Team / Log / Contact)
 * plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`) — the same "adding a page
 * rewires every nav" contract the manifest blueprints follow. Manifest
 * extras only join when the pack owns the site (`basePath === ""`); on the
 * `/fund-index` preview route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Portfolio", path: "/portfolio" },
    { label: "Team", path: "/team" },
    { label: "Log", path: "/log" },
    { label: "Contact", path: "/contact" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; /disclosures rides the footer. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/portfolio", "/team", "/log", "/contact", "/disclosures"]

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
 * `currentPath` is site-relative ("" for home, "/portfolio", "/log", …).
 */
export function fundIndexShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "full-width",
            content: {
                logo: { name: firm.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Send your deck", href: `${basePath}/contact` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${firm.name} · ${firm.tagline} · ${firm.location}`,
                links: [{ label: "Disclosures", href: `${basePath}/disclosures` }],
                note: `© ${new Date().getFullYear()} ${firm.name}`,
            },
        },
    }
}
