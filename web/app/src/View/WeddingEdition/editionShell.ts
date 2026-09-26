import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { photographer } from "./content"

/**
 * The Late Edition's shared chrome — the staff photographer's byline
 * centered over a ruled band of section links. The paper's name belongs
 * to the front page's red nameplate (and the footer), so the nav never
 * prints it twice. Split from `editionLanding.ts` so manifest-driven pages can wear it
 * without pulling the pack's full page content into their chunk. The
 * catalog's `theme.navigation.variant` pins the same `centered` variant,
 * so the platform's Site navigation control starts from the truth.
 *
 * The nav's link list is the pack's canonical set (Weddings / Prices /
 * About / Inquire) plus any pages added through the platform's Pages
 * panel (`repobot.project.json` `marketing.pages`). Manifest extras only
 * join when the pack owns the site (`basePath === ""`); on the
 * `/wedding-edition` preview route those paths don't exist under the
 * prefix.
 */

const CANONICAL_LINKS = [
    { label: "Weddings", path: "/weddings" },
    { label: "Prices", path: "/prices" },
    { label: "About", path: "/about" },
    { label: "Inquire", path: "/inquire" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the nameplate; "/proof" is the unlisted client proofing room
 * (the rate card's proofing note is its public door). */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/weddings", "/prices", "/about", "/inquire", "/proof"]

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
export function editionShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "centered",
            content: {
                logo: { name: photographer.name, tagline: photographer.role },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Check your date", href: `${basePath}/inquire` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${photographer.paper} · ${photographer.name}, ${photographer.role.toLowerCase()} · ${photographer.location}`,
                note: `© ${new Date().getFullYear()} ${photographer.paper}. Most facts checked.`,
            },
        },
    }
}
