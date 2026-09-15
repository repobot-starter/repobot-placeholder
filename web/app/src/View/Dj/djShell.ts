import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { artist } from "./content"

/**
 * The dj pack's shared chrome — the mono-utility register's `minimal` nav
 * (wordmark and links in one quiet mono row) and a simple footer. Links
 * are the pack's canonical trio (Mixes / Dates / Book) plus any pages
 * added through the platform's Pages panel; manifest extras only join
 * when the pack owns the site (`basePath === ""`).
 */

const CANONICAL_LINKS = [
    { label: "Mixes", path: "/mixes" },
    { label: "Dates", path: "/dates" },
    { label: "Book", path: "/book" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/mixes", "/dates", "/book"]

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
export function djShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "inline",
            content: {
                logo: { name: artist.alias },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Book", href: `${basePath}/book` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${artist.alias} · ${artist.tagline} · ${artist.location}`,
                note: `© ${new Date().getFullYear()} ${artist.alias} · ${artist.email}`,
            },
        },
    }
}
