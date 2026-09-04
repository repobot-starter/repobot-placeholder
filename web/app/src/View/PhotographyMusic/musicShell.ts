import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { photographer } from "./content"

/**
 * The music-photography pack's shared chrome (burger-overlay masthead +
 * simple footer), split from `musicLanding.ts` so manifest-driven pages can
 * wear it without pulling the pack's full page content into their chunk.
 *
 * The nav is the marquee register's burger overlay: a wordmark and a burger
 * at every width, links in the fullscreen type-led overlay — maximal quiet,
 * so the full-bleed frames own the viewport. Links are the pack's canonical
 * trio (Work / About / Book) plus any pages added through the platform's
 * Pages panel (`repobot.project.json` `marketing.pages`) — the same "adding
 * a page rewires every nav" contract the manifest blueprints follow.
 * Manifest extras only join when the pack owns the site (`basePath === ""`);
 * on the `/photography-music` preview route those paths don't exist under
 * the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Work", path: "/work" },
    { label: "About", path: "/about" },
    { label: "Book", path: "/book" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/work", "/about", "/book"]

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
 * `currentPath` is site-relative ("" for home, "/work", "/book", …).
 */
export function musicShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "burger-overlay",
            content: {
                logo: { name: photographer.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Book", href: `${basePath}/book` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${photographer.name} · ${photographer.tagline} · ${photographer.location}`,
                note: `© ${new Date().getFullYear()} ${photographer.name}`,
            },
        },
    }
}
