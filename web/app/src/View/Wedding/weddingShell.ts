import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { landingCopy, photographer } from "./content"

/**
 * The wedding pack's shared chrome (the heirloom register's letterhead —
 * split masthead — plus a simple footer), split from `weddingLanding.ts`
 * so manifest-driven pages can wear it without pulling the pack's full
 * page content into their chunk.
 *
 * The nav's link list is the pack's canonical set (Weddings / Galleries /
 * Packages / About / Book / Inquire) plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`) — the same "adding a page
 * rewires every nav" contract the manifest blueprints follow. Manifest
 * extras only join when the pack owns the site (`basePath === ""`); on the
 * `/wedding` preview route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Weddings", path: "/weddings" },
    { label: "Galleries", path: "/galleries" },
    { label: "Packages", path: "/packages" },
    { label: "About", path: "/about" },
    { label: "Book", path: "/book" },
    { label: "Inquire", path: "/inquire" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/proof" is the unlisted client proofing room
 * (/galleries is its public explainer and lives in the nav). */
const PACK_OWNED_PATHS: readonly string[] = [
    "/",
    "/weddings",
    "/galleries",
    "/packages",
    "/about",
    "/book",
    "/inquire",
    "/proof",
]

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
 * `currentPath` is site-relative ("" for home, "/weddings", …).
 */
export function weddingShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            // The heirloom lean by default: wordmark left, links ruled off
            // right — a letterhead, deliberately apart from photography's
            // centered gallery masthead. A remix seed picks its own.
            variant: landingCopy.nav.variant,
            content: {
                logo: { name: photographer.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: landingCopy.nav.cta, href: `${basePath}/inquire` },
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
