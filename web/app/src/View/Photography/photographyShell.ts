import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { photographer } from "./content"

/**
 * The photography pack's shared chrome (centered masthead + simple footer),
 * split from `photographyLanding.ts` so manifest-driven pages can wear it
 * without pulling the pack's full page content into their chunk.
 *
 * The nav's link list is the pack's canonical trio (Work / About / Inquire)
 * plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`) — the same "adding a page
 * rewires every nav" contract the manifest blueprints follow, so a
 * platform-added page shows up here instead of silently existing off-nav.
 * Manifest extras only join when the pack owns the site (`basePath === ""`);
 * on the `/photography` preview route those paths don't exist under the
 * prefix.
 */

const CANONICAL_LINKS = [
    { label: "Work", path: "/work" },
    { label: "About", path: "/about" },
    { label: "Inquire", path: "/inquire" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/proof" is the unlisted client proofing room. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/work", "/about", "/inquire", "/proof"]

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
 * `currentPath` is site-relative ("" for home, "/work", "/test", …).
 */
export function photographyShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "centered",
            content: {
                logo: { name: photographer.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Inquire", href: `${basePath}/inquire` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${photographer.name} · ${photographer.location}`,
                note: `© ${new Date().getFullYear()} ${photographer.name}`,
            },
        },
    }
}
