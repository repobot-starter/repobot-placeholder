import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { band } from "./content"

/**
 * The band pack's shared chrome. The broadside register's nav is `split`
 * (wordmark left, links right, hairline under) — a gig poster's masthead
 * rather than an app bar. Links are the pack's canonical trio (Tour /
 * Music / Press) plus any pages added through the platform's Pages panel;
 * manifest extras only join when the pack owns the site (`basePath === ""`).
 */

const CANONICAL_LINKS = [
    { label: "Tour", path: "/tour" },
    { label: "Music", path: "/music" },
    { label: "Press", path: "/press" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/tour", "/music", "/press"]

function siteLinks(basePath: string): { label: string; path: string }[] {
    if (basePath !== "") {
        return [...CANONICAL_LINKS]
    }
    const extras = projectManifest.marketing.pages
        .filter((page) => !PACK_OWNED_PATHS.includes(page.path))
        .map((page) => ({ label: page.title, path: page.path }))
    return [...CANONICAL_LINKS, ...extras]
}

/** The shell for one page; the current page drops out of its own links. */
export function bandShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "split",
            content: {
                logo: { name: band.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Tour dates", href: `${basePath}/tour` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${band.name} · ${band.tagline} · ${band.location}`,
                note: `© ${new Date().getFullYear()} ${band.name} · ${band.email}`,
            },
        },
    }
}
