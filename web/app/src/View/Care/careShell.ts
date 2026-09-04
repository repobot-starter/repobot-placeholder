import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { practice } from "./content"

/**
 * The primary-care pack's shared chrome, split from `careLanding.ts` so
 * manifest-driven pages can wear it without pulling the pack's full page
 * content into their chunk.
 *
 * The nav is the full-width bar: wordmark at the true left edge, links
 * at the true right, an edge-to-edge hairline under both — the quiet
 * administrative register a clinic's letterhead has. Picked deliberately
 * apart from the centered/squared/inset treatments the nav-variety audit
 * flagged as overused. Links are the pack's canonical trio (Providers /
 * Services / New patients) plus any pages added through the platform's
 * Pages panel (`repobot.project.json` `marketing.pages`). Manifest
 * extras only join when the pack owns the site (`basePath === ""`); on
 * the `/care` preview route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Providers", path: "/providers" },
    // The services page lives at /what-we-treat: /services is the services
    // pack's preview route, which every checkout keeps.
    { label: "Services", path: "/what-we-treat" },
    { label: "New patients", path: "/new-patients" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/providers", "/what-we-treat", "/new-patients", "/book"]

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
 * `currentPath` is site-relative ("" for home, "/providers", "/book", …).
 */
export function careShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "full-width",
            content: {
                logo: { name: practice.name, tagline: practice.city },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Book an appointment", href: `${basePath}/book` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${practice.name} · ${practice.address} · ${practice.phone}`,
                note: `© ${new Date().getFullYear()} ${practice.name}`,
            },
        },
    }
}
